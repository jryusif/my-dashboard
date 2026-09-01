import { prisma } from '@/lib/prisma.js';
import { requireAdmin, errorResponse, successResponse, forbiddenResponse } from '@/lib/auth.js';
import { sendUserApprovalNotification } from '@/lib/email.js';

export async function PATCH(req, context) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return forbiddenResponse(adminCheck.error);
    }

    const { id } = await context.params;
    if (!id) {
      return errorResponse('User ID is required.', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, status: true }
    });

    if (!targetUser) {
      return errorResponse('User not found.', 404);
    }

    const body = await req.json();
    const { status, role, dentalApproved, tradingApproved } = body;

    // Safety guard: Admin cannot reject or demote themselves
    if (targetUser.id === adminCheck.user.id) {
      if (status && status !== 'APPROVED') {
        return errorResponse('You cannot suspend or reject your own administrator account.', 400);
      }
      if (role && role !== 'ADMIN') {
        return errorResponse('You cannot revoke your own administrator role.', 400);
      }
    }

    const updateData = {};
    const oldStatus = targetUser.status;

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      updateData.status = status;
      if (status === 'APPROVED' && oldStatus !== 'APPROVED') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = adminCheck.user.id;
      }
    }

    if (role && ['ADMIN', 'USER'].includes(role)) {
      updateData.role = role;
    }

    if (dentalApproved !== undefined) {
      updateData.dentalApproved = Boolean(dentalApproved);
    }

    if (tradingApproved !== undefined) {
      updateData.tradingApproved = Boolean(tradingApproved);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        persona: true,
        experienceLevel: true,
        dentalApproved: true,
        tradingApproved: true,
        approvedAt: true,
        approvedBy: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    // If status changed to APPROVED or REJECTED, notify the user via email in background
    if (status && status !== oldStatus) {
      if (status === 'APPROVED') {
        sendUserApprovalNotification({
          user: { email: updatedUser.email, name: updatedUser.name },
          approved: true
        }).catch(err => console.warn('Could not send approval email to user:', err));
      } else if (status === 'REJECTED') {
        sendUserApprovalNotification({
          user: { email: updatedUser.email, name: updatedUser.name },
          approved: false
        }).catch(err => console.warn('Could not send rejection email to user:', err));
      }
    }

    return successResponse({
      message: `User ${updatedUser.name || updatedUser.email} has been updated successfully!`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    return errorResponse('Failed to update user.');
  }
}

export async function DELETE(req, context) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return forbiddenResponse(adminCheck.error);
    }

    const { id } = await context.params;
    if (!id) {
      return errorResponse('User ID is required.', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return errorResponse('User not found.', 404);
    }

    // Safety guard: Admin cannot delete their own account
    if (targetUser.id === adminCheck.user.id) {
      return errorResponse('You cannot delete your own administrator account.', 400);
    }

    // Delete user (cascades all tenant data via prisma onDelete: Cascade)
    await prisma.user.delete({
      where: { id }
    });

    return successResponse({
      message: `User ${targetUser.email} and all associated workspace data have been permanently deleted.`
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return errorResponse('Failed to delete user.');
  }
}
