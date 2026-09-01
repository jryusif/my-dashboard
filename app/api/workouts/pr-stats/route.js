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
    if (!userId) return successResponse({ prs: [], logs: [] });

    const logs = await prisma.exerciseWeightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const prMap = {};
    for (const log of logs) {
      if (!prMap[log.exerciseName] || log.weightKg > prMap[log.exerciseName].weightKg) {
        prMap[log.exerciseName] = {
          exerciseName: log.exerciseName,
          maxKg: log.weightKg,
          maxLbs: log.weightLbs,
          date: log.date,
          setsReps: log.setsReps
        };
      }
    }

    return successResponse({
      prs: Object.values(prMap),
      logs
    });
  } catch (err) {
    console.error('Error fetching PR stats:', err);
    return errorResponse('Could not fetch PR stats.');
  }
}
