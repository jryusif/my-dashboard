import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveAndCheckDentalUser(req) {
  const auth = getAuthUser(req);
  if (!auth || !auth.authenticated || !auth.userId) return { error: 'Unauthorized', status: 401 };
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, persona: true, dentalApproved: true }
  });
  if (!user) return { error: 'User not found', status: 404 };
  const isMasterAdmin = user.role === 'ADMIN';
  const isApproved = Boolean(user.dentalApproved);
  if (!isMasterAdmin && !isApproved) {
    return { error: 'Dental Cases archive is locked. Administrator approval required.', status: 403 };
  }
  return { userId: user.id };
}

export async function PUT(req, { params }) {
  try {
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

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
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

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
