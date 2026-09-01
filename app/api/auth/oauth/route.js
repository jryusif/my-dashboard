import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';
import { sendAdminSignupNotification } from '@/lib/email.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { provider, email, name, avatar, oauthId } = body;

    if (!email || !provider) {
      return errorResponse('Email and OAuth provider are required.', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'jryusiif@gmail.com').toLowerCase().trim();
    const isMasterAdmin = cleanEmail === adminEmail || cleanEmail === 'jryusif@dashboard.com';

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      // Create new user via OAuth
      const dummyPassword = await bcrypt.hash(`oauth_${provider}_${Date.now()}_${Math.random()}`, 10);
      const userRole = isMasterAdmin ? 'ADMIN' : 'USER';
      const userStatus = isMasterAdmin ? 'APPROVED' : 'PENDING';

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: dummyPassword,
          name: name || cleanEmail.split('@')[0],
          avatar: avatar || (provider === 'apple' ? '🍏' : '🌐'),
          role: userRole,
          status: userStatus,
          oauthProvider: provider,
          oauthId: oauthId || null,
          approvedAt: isMasterAdmin ? new Date() : null,
          departmentSegments: {
            work: ['General Practice', 'Cases', 'Consultations'],
            studies: ['Clinical Theory', 'Research Papers', 'Certifications'],
            finance: ['Primary Income', 'Clinic Operating', 'Investments'],
            fitness: ['Strength & Hypertrophy', 'Cardio & Conditioning']
          }
        }
      });

      // Dispatch Gmail notification & in-app alert to admin if non-admin
      if (!isMasterAdmin) {
        try {
          const clientIp = req.headers.get('x-forwarded-for') || 'OAuth Client';
          await sendAdminSignupNotification({
            user,
            requestInfo: { ip: clientIp, userAgent: `${provider.toUpperCase()} Single Sign-On` }
          });
        } catch (emailErr) {
          console.warn('[OAuth] Signup email notification warning:', emailErr.message);
        }

        return successResponse({
          pending: true,
          status: 'PENDING',
          message: 'Your OAuth registration request has been submitted. Awaiting administrator approval.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status
          }
        }, 201);
      }
    } else {
      // Existing user: check gatekeeper
      if (user.status === 'PENDING') {
        return Response.json({
          error: 'Your account is currently awaiting administrator approval. You will receive access once approved.',
          status: 'PENDING',
          pending: true
        }, { status: 403 });
      }

      if (user.status === 'REJECTED') {
        return Response.json({
          error: 'Your account access has been declined or deactivated by the administrator.',
          status: 'REJECTED'
        }, { status: 403 });
      }

      // Update provider if not set
      if (!user.oauthProvider) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: provider,
            oauthId: oauthId || user.oauthId,
            lastLoginAt: new Date()
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }
    }

    // Issue JWT token
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }, JWT_SECRET, { expiresIn: '30d' });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        persona: user.persona,
        experienceLevel: user.experienceLevel,
        specialty: user.specialty,
        currency: user.currency || 'USD',
        departmentSegments: user.departmentSegments,
        onboardingCompleted: user.onboardingCompleted
      },
      onboardingNeeded: !user.onboardingCompleted
    });
  } catch (err) {
    console.error('OAuth sign-in error:', err);
    return errorResponse('Failed to authenticate with OAuth provider.', 500);
  }
}
