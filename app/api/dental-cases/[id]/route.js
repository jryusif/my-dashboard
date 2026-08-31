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

    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Case not found.', 404);

    const updated = await prisma.dentalCase.update({
      where: { id },
      data: body
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error updating dental case:', err);
    return errorResponse('Could not update dental case.');
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Case not found.', 404);

    await prisma.dentalCase.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting dental case:', err);
    return errorResponse('Could not delete dental case.');
  }
}
