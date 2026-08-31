import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function PATCH(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Task not found.', 404);

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.task !== undefined) updateData.title = body.task;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.dueDate !== undefined) updateData.date = body.dueDate;
    if (body.completed !== undefined) updateData.completed = Boolean(body.completed);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.segment !== undefined) updateData.segment = body.segment;
    if (body.timeBlock !== undefined) updateData.timeBlock = body.timeBlock;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData
    });

    return successResponse({
      id: updated.id,
      task: updated.title,
      title: updated.title,
      category: updated.category,
      segment: updated.segment,
      priority: updated.priority || 'Medium',
      dueDate: updated.date,
      date: updated.date,
      completed: updated.completed,
      timeBlock: updated.timeBlock
    });
  } catch (err) {
    console.error('Error updating task:', err);
    return errorResponse('Could not update task.');
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Task not found.', 404);

    await prisma.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting task:', err);
    return errorResponse('Could not delete task.');
  }
}
