import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    await prisma.notificationLog.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true }
    });

    return successResponse({ success: true });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    return errorResponse('Could not mark notifications as read.');
  }
}
