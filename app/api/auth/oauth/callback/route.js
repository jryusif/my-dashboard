import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, successResponse, errorResponse } from '@/lib/auth.js';
import { sendAdminSignupNotification } from '@/lib/email.js';

/**
 * Helper to dynamically fetch a setting from process.env or PostgreSQL system_settings
 */
async function resolveSetting(key) {
  if (process.env[key] && !process.env[key].includes('YOUR_')) {
    return process.env[key];
  }
  try {
    const rows = await prisma.$queryRaw`
      SELECT value FROM system_settings WHERE key = ${key} LIMIT 1;
    `;
    if (rows && rows.length > 0 && rows[0].value) {
      return rows[0].value.trim();
    }
  } catch (err) {}
  return process.env[key] || '';
}

/**
 * OAuth Callback Handler — Google & Apple Sign In
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get('code');
  const state    = searchParams.get('state');   // 'google' | 'apple'
  const error    = searchParams.get('error');

  // Dynamically resolve credentials and base URL
  const googleClientId     = await resolveSetting('GOOGLE_CLIENT_ID');
  const googleClientSecret = await resolveSetting('GOOGLE_CLIENT_SECRET');
  const appleClientId      = await resolveSetting('APPLE_CLIENT_ID');
  const appleClientSecret  = await resolveSetting('APPLE_CLIENT_SECRET');
  
  let appUrl = await resolveSetting('NEXT_PUBLIC_APP_URL');
  if (!appUrl || appUrl.includes('localhost')) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    if (host) {
      appUrl = `${proto}://${host}`;
    } else {
      appUrl = 'https://mydashboard-bice.vercel.app';
    }
  }

  if (error) {
    return redirectToHome(appUrl, `OAuth cancelled: ${error}`);
  }

  if (!code || !state) {
    return redirectToHome(appUrl, 'Missing OAuth code or state.');
  }

  try {
    let userProfile = null;

    /* ------------------------------------------------------------------ */
    /*  GOOGLE                                                              */
    /* ------------------------------------------------------------------ */
    if (state === 'google') {
      if (!googleClientSecret) {
        return redirectToHome(appUrl, 'Google Client Secret is missing. Please configure your Client Secret in OAuth settings.');
      }

      // Exchange code → tokens
      const tokenBody = {
        code,
        client_id:     googleClientId,
        client_secret: googleClientSecret,
        redirect_uri:  `${appUrl}/api/auth/oauth/callback`,
        grant_type:    'authorization_code'
      };

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(tokenBody)
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.id_token) {
        console.error('[Google token exchange failed]:', tokenData);
        const errMsg = tokenData.error_description || tokenData.error || 'Google token exchange failed.';
        return redirectToHome(appUrl, errMsg.includes('client_secret') ? 'Google Client Secret is missing or invalid. Please configure it in settings.' : errMsg);
      }

      // Verify id_token → get profile
      const infoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`
      );
      const info = await infoRes.json();
      if (!info.email) {
        return redirectToHome(appUrl, 'Could not retrieve Google email.');
      }

      userProfile = {
        provider: 'google',
        email:    info.email,
        name:     info.name || info.given_name || info.email.split('@')[0],
        avatar:   info.picture || '🌐',
        oauthId:  info.sub
      };
    }

    /* ------------------------------------------------------------------ */
    /*  APPLE                                                               */
    /* ------------------------------------------------------------------ */
    else if (state === 'apple') {
      const clientSecret = appleClientSecret;
      const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     appleClientId,
          client_secret: clientSecret,
          redirect_uri:  `${appUrl}/api/auth/oauth/callback`,
          grant_type:    'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.id_token) {
        return redirectToHome(appUrl, 'Apple token exchange failed.');
      }

      const decoded = jwt.decode(tokenData.id_token);
      if (!decoded?.email) {
        return redirectToHome(appUrl, 'Could not retrieve Apple email.');
      }

      userProfile = {
        provider: 'apple',
        email:    decoded.email,
        name:     decoded.email.split('@')[0],
        avatar:   '🍏',
        oauthId:  decoded.sub
      };
    }

    if (!userProfile) {
      return redirectToHome(appUrl, 'Unknown OAuth provider.');
    }

    /* ------------------------------------------------------------------ */
    /*  Upsert user in Postgres                                             */
    /* ------------------------------------------------------------------ */
    const cleanEmail   = userProfile.email.toLowerCase().trim();
    const adminEmail   = (process.env.ADMIN_EMAIL || 'jryusiif@gmail.com').toLowerCase().trim();
    const isMasterAdmin = cleanEmail === adminEmail || cleanEmail === 'jryusif@dashboard.com';

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      const dummyPassword = await bcrypt.hash(
        `oauth_${userProfile.provider}_${Date.now()}_${Math.random()}`, 10
      );

      user = await prisma.user.create({
        data: {
          email:          cleanEmail,
          password:       dummyPassword,
          name:           userProfile.name,
          avatar:         userProfile.avatar,
          role:           isMasterAdmin ? 'ADMIN' : 'USER',
          status:         isMasterAdmin ? 'APPROVED' : 'PENDING',
          oauthProvider:  userProfile.provider,
          oauthId:        userProfile.oauthId,
          approvedAt:     isMasterAdmin ? new Date() : null,
          departmentSegments: {
            work:    ['General Practice', 'Cases', 'Consultations'],
            studies: ['Clinical Theory', 'Research Papers', 'Certifications'],
            finance: ['Primary Income', 'Clinic Operating', 'Investments'],
            fitness: ['Strength & Hypertrophy', 'Cardio & Conditioning']
          }
        }
      });

      if (!isMasterAdmin) {
        try {
          await sendAdminSignupNotification({
            user,
            requestInfo: { ip: 'OAuth Redirect', userAgent: `${userProfile.provider.toUpperCase()} Sign In` }
          });
        } catch (e) {
          console.warn('[OAuth callback] Signup email warning:', e.message);
        }
        return redirectToHome(appUrl, null, 'pending');
      }
    } else {
      if (user.status === 'PENDING') {
        return redirectToHome(appUrl, null, 'pending');
      }
      if (user.status === 'REJECTED') {
        return redirectToHome(appUrl, 'Your account access has been declined by the administrator.');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt:   new Date(),
          oauthProvider: user.oauthProvider || userProfile.provider,
          oauthId:       user.oauthId       || userProfile.oauthId
        }
      }).catch(() => {});
    }

    /* ------------------------------------------------------------------ */
    /*  Issue JWT and redirect home                                         */
    /* ------------------------------------------------------------------ */
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, status: user.status, currency: user.currency || 'USD' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userPayload = encodeURIComponent(JSON.stringify({
      id:                  user.id,
      email:               user.email,
      name:                user.name,
      avatar:              user.avatar,
      role:                user.role,
      status:              user.status,
      persona:             user.persona,
      experienceLevel:     user.experienceLevel,
      specialty:           user.specialty,
      currency:            user.currency || 'USD',
      departmentSegments:  user.departmentSegments,
      onboardingCompleted: user.onboardingCompleted
    }));

    return Response.redirect(
      `${appUrl}/?oauth_token=${encodeURIComponent(token)}&oauth_user=${userPayload}&onboarding_needed=${!user.onboardingCompleted}`,
      302
    );
  } catch (err) {
    console.error('[OAuth callback] error:', err);
    return redirectToHome(appUrl, 'Authentication failed. Please try again.');
  }
}

export async function POST(req) {
  return GET(req);
}

function redirectToHome(appUrl, errorMsg = null, special = null) {
  let url = (appUrl || 'https://mydashboard-bice.vercel.app') + '/';
  if (special === 'pending') {
    url += '?oauth_pending=1';
  } else if (errorMsg) {
    url += `?oauth_error=${encodeURIComponent(errorMsg)}`;
  }
  return Response.redirect(url, 302);
}
