import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return unauthorizedResponse();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters long.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!user) return unauthorizedResponse('User not found.');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return errorResponse('The current password you entered is incorrect.', 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: auth.userId },
      data: { password: hashedNewPassword }
    });

    return successResponse({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return errorResponse('Failed to change password. Please try again.');
  }
}
