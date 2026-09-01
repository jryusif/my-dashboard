import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function DELETE(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const log = await prisma.exerciseWeightLog.findFirst({
      where: { id, userId }
    });

    if (!log) return errorResponse('Log not found.', 404);

    await prisma.exerciseWeightLog.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting workout log:', err);
    return errorResponse('Could not delete workout log.');
  }
}
