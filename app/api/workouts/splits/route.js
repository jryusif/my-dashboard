import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ splits: [], exercises: [] });

    const splits = await prisma.workoutSplit.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    });

    const exercises = await prisma.workoutExercise.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    });

    return successResponse({ splits, exercises });
  } catch (err) {
    console.error('Error fetching workout splits:', err);
    return errorResponse('Could not fetch workout splits.');
  }
}
