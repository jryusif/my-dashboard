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
    { id: 'saturday', name: 'Saturday', dayName: 'Saturday', title: 'Chest & Triceps — Push A', isRestDay: false },
    { id: 'sunday', name: 'Sunday', dayName: 'Sunday', title: 'Back & Biceps — Pull A', isRestDay: false },
    { id: 'monday', name: 'Monday', dayName: 'Monday', title: 'Legs & Core — Legs A', isRestDay: false },
    { id: 'tuesday', name: 'Tuesday', dayName: 'Tuesday', title: 'Rest & Active Recovery', isRestDay: true },
    { id: 'wednesday', name: 'Wednesday', dayName: 'Wednesday', title: 'Shoulders & Arms — Upper Focus', isRestDay: false },
    { id: 'thursday', name: 'Thursday', dayName: 'Thursday', title: 'Legs & Posterior Chain — Legs B', isRestDay: false },
    { id: 'friday', name: 'Friday', dayName: 'Friday', title: 'Full Body Conditioning & Core', isRestDay: false }
  ];

  const days = defaultSchedule.map(d => {
    const splitMatch = splits.find(s => (s.dayName || '').toLowerCase() === d.name.toLowerCase());
    const dayExercises = exercises
      .filter(e => (e.dayName || '').toLowerCase() === d.name.toLowerCase())
      .map(e => {
        const lastLog = weightLogs.find(l => (l.exerciseName || '').toLowerCase() === (e.name || '').toLowerCase());
        return {
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup || 'General',
          sets: e.targetSets || 3,
          reps: e.targetReps || '8-12',
          targetSets: e.targetSets || 3,
          targetReps: e.targetReps || '8-12',
          weight: e.weight || (lastLog ? `${lastLog.weightKg} kg` : ''),
          restTime: e.restTime || '90s',
          notes: e.notes || '',
          imageUrl: e.imageUrl || '',
          videoUrl: e.videoUrl || '',
          lastWeight: lastLog ? `${lastLog.weightKg} kg` : '--',
          isCompleted: false
        };
      });

    return {
      id: d.id,
      name: d.name,
      dayName: d.name,
      title: splitMatch ? `${splitMatch.muscleGroup}` : d.title,
      targetMuscles: splitMatch?.muscleGroup ? [splitMatch.muscleGroup] : (d.title.split('—')[0]?.split('&').map(s => s.trim()) || []),
      isRestDay: splitMatch ? splitMatch.isRestDay : d.isRestDay,
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
