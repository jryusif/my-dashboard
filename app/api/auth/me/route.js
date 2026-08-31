import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    if (!user) return unauthorizedResponse('User not found.');
    return successResponse({ user });
  } catch (err) {
    console.error('Auth me error:', err);
    return errorResponse('Could not retrieve user session.');
  }
}
