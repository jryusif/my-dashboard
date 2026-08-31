import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const body = await req.json();
    const { exerciseName, weightKg, weightLbs, setsReps, notes, date } = body;

    if (!exerciseName || weightKg === undefined) {
      return errorResponse('Exercise name and weight are required.', 400);
    }

    const kg = parseFloat(weightKg);
    const lbs = weightLbs ? parseFloat(weightLbs) : Math.round(kg * 2.20462 * 10) / 10;

    const highestPrevious = await prisma.exerciseWeightLog.findFirst({
      where: { userId: auth.userId, exerciseName: exerciseName.trim() },
      orderBy: { weightKg: 'desc' }
    });

    const isPr = !highestPrevious || kg > highestPrevious.weightKg;

    const log = await prisma.exerciseWeightLog.create({
      data: {
        userId: auth.userId,
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
