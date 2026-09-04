import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const userId = auth.user.id;
  const body = await req.json();
  const { exerciseId, completed, date, completedSets } = body;

  if (!exerciseId || !date) {
    return NextResponse.json({ error: 'Missing exerciseId or date' }, { status: 400 });
  }

  try {
    await prisma.workoutExerciseLog.upsert({
      where: {
        userId_exerciseId_date: {
          userId,
          exerciseId,
          date,
        }
      },
      create: {
        userId,
        exerciseId,
        date,
        completed: Boolean(completed),
        completedSets: Array.isArray(completedSets) ? completedSets : [],
      },
      update: {
        completed: Boolean(completed),
        completedSets: Array.isArray(completedSets) ? completedSets : undefined,
      }
    });

    const dayLogs = await prisma.workoutExerciseLog.findMany({
      where: { userId, date }
    });

    const completedExercises = dayLogs.filter(l => l.completed).map(l => l.exerciseId);
    const completedSetsMap = {};
    dayLogs.forEach(l => {
      if (l.completedSets) {
        completedSetsMap[l.exerciseId] = l.completedSets;
      }
    });

    return NextResponse.json({
      success: true,
      completedExercises,
      completedSetsMap,
      date,
      exerciseId,
      completed: Boolean(completed)
    });
  } catch (err) {
    console.error('Error saving workout exercise log:', err);
    return NextResponse.json({ success: false, error: 'Database save failed' }, { status: 500 });
  }
}
