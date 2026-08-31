import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function PATCH(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.task.findFirst({
      where: { id, userId: auth.userId }
    });

    if (!existing) return errorResponse('Task not found.', 404);

    const updated = await prisma.task.update({
      where: { id },
      data: body
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error updating task:', err);
    return errorResponse('Could not update task.');
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const existing = await prisma.task.findFirst({
      where: { id, userId: auth.userId }
    });

    if (!existing) return errorResponse('Task not found.', 404);

    await prisma.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting task:', err);
    return errorResponse('Could not delete task.');
  }
}
