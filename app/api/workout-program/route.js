import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayId = dayNames[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];

  let splits = [];
  let exercises = [];
  let weightLogs = [];

  if (userId) {
    splits = await prisma.workoutSplit.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    });
    exercises = await prisma.workoutExercise.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    });
    weightLogs = await prisma.exerciseWeightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
  }

  const defaultSchedule = [
    { id: 'saturday', name: 'Saturday', title: 'Chest & Triceps — Push A', isRestDay: false },
    { id: 'sunday', name: 'Sunday', title: 'Back & Biceps — Pull A', isRestDay: false },
    { id: 'monday', name: 'Monday', title: 'Legs & Core — Legs A', isRestDay: false },
    { id: 'tuesday', name: 'Tuesday', title: 'Rest & Active Recovery', isRestDay: true },
    { id: 'wednesday', name: 'Wednesday', title: 'Shoulders & Arms — Upper Focus', isRestDay: false },
    { id: 'thursday', name: 'Thursday', title: 'Legs & Posterior Chain — Legs B', isRestDay: false },
    { id: 'friday', name: 'Friday', title: 'Full Body Conditioning & Core', isRestDay: false }
  ];

  const days = defaultSchedule.map(d => {
    const splitMatch = splits.find(s => s.dayName.toLowerCase() === d.name.toLowerCase());
    const dayExercises = exercises
      .filter(e => e.dayName.toLowerCase() === d.name.toLowerCase())
      .map(e => {
        const lastLog = weightLogs.find(l => l.exerciseName.toLowerCase() === e.name.toLowerCase());
        return {
          id: e.id,
          name: e.name,
          sets: e.targetSets || 3,
          reps: e.targetReps || '8-12',
          targetSets: e.targetSets || 3,
          targetReps: e.targetReps || '8-12',
          lastWeight: lastLog ? `${lastLog.weightKg} kg` : '--',
          isCompleted: false
        };
      });

    return {
      id: d.id,
      name: d.name,
      title: splitMatch ? `${splitMatch.muscleGroup}` : d.title,
      isRestDay: d.isRestDay,
      exercises: dayExercises
    };
  });

  return NextResponse.json({
    days,
    todayDayId,
    todayDate,
    todayCompleted: []
  });
}
