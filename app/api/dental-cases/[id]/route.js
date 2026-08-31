import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function PUT(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId: auth.userId }
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
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId: auth.userId }
    });

    if (!existing) return errorResponse('Case not found.', 404);

    await prisma.dentalCase.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting dental case:', err);
    return errorResponse('Could not delete dental case.');
  }
}
