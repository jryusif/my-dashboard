import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const logs = await prisma.notificationLog.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notificationLog.count({
      where: { userId: auth.userId, read: false }
    });

    return successResponse({ logs, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return errorResponse('Could not fetch notifications.');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const body = await req.json();
    const { type, title, message, linkCategory } = body;
    if (!title) return errorResponse('Title is required.', 400);

    const notif = await prisma.notificationLog.create({
      data: {
        userId: auth.userId,
        type: type || 'system',
        title: title.trim(),
        message: message || '',
        linkCategory: linkCategory || null
      }
    });

    return successResponse(notif, 201);
  } catch (err) {
    console.error('Error creating notification:', err);
    return errorResponse('Could not create notification.');
  }
}
