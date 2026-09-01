import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function POST(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { exerciseName, weightKg, weightLbs, setsReps, notes, date } = body;

    if (!exerciseName || weightKg === undefined) {
      return errorResponse('Exercise name and weight are required.', 400);
    }

    const kg = parseFloat(weightKg);
    const lbs = weightLbs ? parseFloat(weightLbs) : Math.round(kg * 2.20462 * 10) / 10;

    const highestPrevious = await prisma.exerciseWeightLog.findFirst({
      where: { userId, exerciseName: exerciseName.trim() },
      orderBy: { weightKg: 'desc' }
    });

    const isPr = !highestPrevious || kg > highestPrevious.weightKg;

    const log = await prisma.exerciseWeightLog.create({
      data: {
        userId,
        exerciseName: exerciseName.trim(),
        weightKg: kg,
        weightLbs: lbs,
        setsReps: setsReps || null,
        isPr,
        notes: notes || null,
        date: date || new Date().toISOString().split('T')[0]
      }
    });

    return successResponse({ log, isPr }, 201);
  } catch (err) {
    console.error('Error logging exercise weight:', err);
    return errorResponse('Could not log weight.');
  }
}
