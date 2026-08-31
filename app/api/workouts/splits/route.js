import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const splits = await prisma.workoutSplit.findMany({
      where: { userId: auth.userId },
      orderBy: { order: 'asc' }
    });

    const exercises = await prisma.workoutExercise.findMany({
      where: { userId: auth.userId },
      orderBy: { order: 'asc' }
    });

    return successResponse({ splits, exercises });
  } catch (err) {
    console.error('Error fetching workout splits:', err);
    return errorResponse('Could not fetch workout splits.');
  }
}
