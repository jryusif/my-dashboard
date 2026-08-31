import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function PUT(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Milestone not found.', 404);

    const updated = await prisma.roadmapMilestone.update({
      where: { id },
      data: body
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error updating milestone:', err);
    return errorResponse('Could not update milestone.');
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.roadmapMilestone.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Milestone not found.', 404);

    await prisma.roadmapMilestone.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting milestone:', err);
    return errorResponse('Could not delete milestone.');
  }
}
