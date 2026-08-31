import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse } from '@/lib/auth.js';

export async function DELETE(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const log = await prisma.exerciseWeightLog.findFirst({
      where: { id, userId: auth.userId }
    });

    if (!log) return errorResponse('Log not found.', 404);

    await prisma.exerciseWeightLog.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting workout log:', err);
    return errorResponse('Could not delete workout log.');
  }
}
