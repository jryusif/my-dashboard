import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma.js';
import { JWT_SECRET, errorResponse, successResponse } from '@/lib/auth.js';
import { seedNewUserWorkspace } from '@/lib/seed.js';
import { sendAdminSignupNotification, getAdminEmail } from '@/lib/email.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, bio, specialty, phone } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required.', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return errorResponse('An account with this email already exists.', 409);
    }

    // Check if this is the first user ever or matches ADMIN_EMAIL
    const configuredAdminEmail = (getAdminEmail() || 'jryusif@dashboard.com').toLowerCase().trim();
    const isMasterAdmin = normalizedEmail === configuredAdminEmail;

    const role = isMasterAdmin ? 'ADMIN' : 'USER';
    const status = isMasterAdmin ? 'APPROVED' : 'PENDING';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name ? name.trim() : normalizedEmail.split('@')[0],
        bio: bio ? bio.trim() : null,
        specialty: specialty ? specialty.trim() : null,
        phone: phone ? phone.trim() : null,
        role,
        status,
        approvedAt: isMasterAdmin ? new Date() : null
      }
    });

    // Seed workspace defaults
    await seedNewUserWorkspace(user.id);

    // Extract request meta for notification
    const headers = req.headers;
    const ip = headers.get ? (headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'Direct') : 'Direct';
    const userAgent = headers.get ? headers.get('user-agent') : '';

    // If non-admin user (status is PENDING), notify Admin via Gmail & In-App Notification
    if (status === 'PENDING') {
      // 1. Send Gmail notification to admin asynchronously
      sendAdminSignupNotification({
        user: { id: user.id, email: user.email, name: user.name },
        requestInfo: { ip, userAgent }
      }).catch(err => console.error('Gmail alert background error:', err));

      // 2. Add in-app NotificationLog for all admins
      try {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        for (const admin of admins) {
          await prisma.notificationLog.create({
            data: {
              userId: admin.id,
              type: 'system',
              title: '🚨 New Access Request',
              message: `${user.name || user.email} registered and is awaiting your approval to access the workspace.`,
              linkCategory: 'admin'
            }
          });
        }
      } catch (notifErr) {
        console.warn('Could not create in-app admin notification log:', notifErr);
      }

      // Return pending status message
      return successResponse({
        pending: true,
        status: 'PENDING',
        message: 'Registration request submitted! Your account is currently awaiting administrator approval. You will be granted access once approved.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status
        }
      }, 201);
    }

    // If master admin, generate token immediately
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }, JWT_SECRET, { expiresIn: '30d' });

    return successResponse({
      token,
      pending: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return errorResponse('Could not process registration request. Please try again.', 500);
  }
}
