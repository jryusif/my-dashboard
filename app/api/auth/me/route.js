import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        bio: true,
        specialty: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) return unauthorizedResponse('User not found.');

    if (user.status === 'PENDING') {
      return Response.json({
        error: 'Your account is pending administrator approval.',
        status: 'PENDING',
        pending: true,
        user
      }, { status: 403 });
    }

    if (user.status === 'REJECTED') {
      return Response.json({
        error: 'Account access has been deactivated.',
        status: 'REJECTED',
        user
      }, { status: 403 });
    }

    return successResponse({ user });
  } catch (err) {
    console.error('Auth me error:', err);
    return errorResponse('Could not retrieve user session.');
  }
}
