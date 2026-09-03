import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, successResponse, errorResponse } from '@/lib/auth.js';
import { sendAdminSignupNotification } from '@/lib/email.js';

/**
 * OAuth Callback Handler — Google & Apple Sign In
 *
 * Flow:
 *   1. Google/Apple redirect to this URL with ?code=...&state=...
 *   2. We exchange the code for an access token + user profile
 *   3. We upsert the user in Postgres (auto-approve admin email)
 *   4. We issue a JWT and redirect to / with ?oauth_token=<jwt>
 *      so the SPA can pick it up and boot the dashboard.
 */

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const APPLE_CLIENT_ID      = process.env.APPLE_CLIENT_ID      || '';
const APPLE_CLIENT_SECRET  = process.env.APPLE_CLIENT_SECRET  || '';
const APP_URL              = process.env.NEXT_PUBLIC_APP_URL   || 'http://localhost:3000';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get('code');
  const state    = searchParams.get('state');   // 'google' | 'apple'
  const error    = searchParams.get('error');

  if (error) {
    return redirectToHome(`OAuth cancelled: ${error}`);
  }

  if (!code || !state) {
    return redirectToHome('Missing OAuth code or state.');
  }

  try {
    let userProfile = null;

    /* ------------------------------------------------------------------ */
    /*  GOOGLE                                                              */
    /* ------------------------------------------------------------------ */
    if (state === 'google') {
      // Exchange code → tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri:  `${APP_URL}/api/auth/oauth/callback`,
          grant_type:    'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.id_token) {
        return redirectToHome('Google token exchange failed.');
      }

      // Verify id_token → get profile
      const infoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`
      );
      const info = await infoRes.json();
      if (!info.email) {
        return redirectToHome('Could not retrieve Google email.');
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
      // Exchange code → tokens
      const clientSecret = APPLE_CLIENT_SECRET; // pre-generated JWT from Apple private key
      const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     APPLE_CLIENT_ID,
          client_secret: clientSecret,
          redirect_uri:  `${APP_URL}/api/auth/oauth/callback`,
          grant_type:    'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.id_token) {
        return redirectToHome('Apple token exchange failed.');
      }

      // Decode the id_token (Apple signs it; for full verification use apple-signin npm pkg)
      const decoded = jwt.decode(tokenData.id_token);
      if (!decoded?.email) {
        return redirectToHome('Could not retrieve Apple email.');
      }

      // On first sign-in Apple sends user info in the POST body (handled separately)
      userProfile = {
        provider: 'apple',
        email:    decoded.email,
        name:     decoded.email.split('@')[0],
        avatar:   '🍏',
        oauthId:  decoded.sub
      };
    }

    if (!userProfile) {
      return redirectToHome('Unknown OAuth provider.');
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
        return redirectToHome(null, null, 'pending');
      }
    } else {
      // Check approval status
      if (user.status === 'PENDING') {
        return redirectToHome(null, null, 'pending');
      }
      if (user.status === 'REJECTED') {
        return redirectToHome('Your account access has been declined by the administrator.');
      }

      // Update login timestamp
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
      { userId: user.id, email: user.email, role: user.role, status: user.status },
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
      `${APP_URL}/?oauth_token=${encodeURIComponent(token)}&oauth_user=${userPayload}&onboarding_needed=${!user.onboardingCompleted}`,
      302
    );
  } catch (err) {
    console.error('[OAuth callback] error:', err);
    return redirectToHome('Authentication failed. Please try again.');
  }
}

// Apple sends user data as a POST on first sign-in
export async function POST(req) {
  return GET(req);
}

function redirectToHome(errorMsg = null, token = null, special = null) {
  let url = APP_URL + '/';
  if (special === 'pending') {
    url += '?oauth_pending=1';
  } else if (errorMsg) {
    url += `?oauth_error=${encodeURIComponent(errorMsg)}`;
  } else if (token) {
    url += `?oauth_token=${encodeURIComponent(token)}`;
  }
  return Response.redirect(url, 302);
}
