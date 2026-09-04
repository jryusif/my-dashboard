import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { WORKOUT_PRESETS } from '@/lib/workout-presets.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayId = dayNames[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];

  let splits = [];
  let exercises = [];
  let weightLogs = [];
  let todayExerciseLogs = [];

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
    todayExerciseLogs = await prisma.workoutExerciseLog.findMany({
      where: { userId, date: todayDate }
    });
  }

  const defaultSchedule = WORKOUT_PRESETS.curated_6day.splits.map(s => ({
    id: s.dayName.toLowerCase(),
    name: s.dayName,
    dayName: s.dayName,
    title: s.muscleGroup,
    isRestDay: s.isRestDay
  }));

  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(dayName => {
    const dayId = dayName.toLowerCase();
    const defaultDay = defaultSchedule.find(d => d.id === dayId) || {
      id: dayId,
      name: dayName,
      dayName: dayName,
      title: 'Rest & Recovery',
      isRestDay: true
    };

    const splitMatch = splits.find(s => (s.dayName || '').toLowerCase() === dayId);
    
    const dayExercises = exercises
      .filter(e => (e.dayName || '').toLowerCase() === dayId)
      .map(e => {
        const lastLog = weightLogs.find(l => (l.exerciseName || '').toLowerCase() === (e.name || '').toLowerCase());
        return {
          id: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup || (splitMatch?.muscleGroup || 'General'),
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

    const hasExercises = dayExercises.length > 0;
    
    // Automated Active vs Rest determination
    let isRestDay = false;
    let title = '';

    if (splitMatch) {
      title = splitMatch.muscleGroup || 'Rest & Recovery';
      const isRestNamed = title.toLowerCase().includes('rest') || title.toLowerCase().includes('off');
      if (hasExercises) {
        // If exercises are set, it is automatically an active training day
        isRestDay = false;
        if (isRestNamed) {
          title = dayExercises[0]?.muscleGroup || `${dayName} Workout`;
        }
      } else {
        // No exercises set: if marked as rest or blank split
        isRestDay = isRestNamed || splits.every(s => (s.muscleGroup || '').toLowerCase().includes('rest'));
      }
    } else {
      // No custom split record in DB
      if (hasExercises) {
        isRestDay = false;
        title = defaultDay.title;
      } else {
        isRestDay = defaultDay.isRestDay;
        title = defaultDay.title;
      }
    }

    if (isRestDay && !title) {
      title = 'Rest & Active Recovery';
    }

    const targetMuscles = isRestDay
      ? []
      : (title.split('—')[0]?.split('&').map(s => s.trim()).filter(Boolean) || [title]);

    return {
      id: dayId,
      name: dayName,
      dayName: dayName,
      title: title || 'Workout',
      targetMuscles,
      isRestDay,
      hasExercises,
      exerciseCount: dayExercises.length,
      exercises: dayExercises
    };
  });

  const activeDaysCount = days.filter(d => !d.isRestDay).length;
  const restDaysCount = days.filter(d => d.isRestDay).length;

  const todayCompleted = todayExerciseLogs.filter(l => l.completed).map(l => l.exerciseId);
  const todaySets = {};
  todayExerciseLogs.forEach(l => {
    if (l.completedSets) todaySets[l.exerciseId] = l.completedSets;
  });

  return NextResponse.json({
    days,
    todayDayId,
    todayDate,
    todayCompleted,
    todaySets,
    activeDaysCount,
    restDaysCount
  });
}
