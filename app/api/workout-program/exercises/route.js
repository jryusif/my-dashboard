import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const body = await req.json().catch(() => ({}));
  const { name, dayId, dayName: rawDayName, targetSets, sets, targetReps, reps, muscleGroup, weight } = body;
  if (!name || !name.trim()) return jsonError('Exercise name is required', 400);

  const dayMap = {
    saturday: 'Saturday',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday'
  };

  const dayName = rawDayName || (dayId ? (dayMap[dayId.toLowerCase()] || dayId) : 'Saturday');

  try {
    // Count existing exercises for ordering
    const count = await prisma.workoutExercise.count({
      where: { userId: auth.user.id, dayName }
    });

    const ex = await prisma.workoutExercise.create({
      data: {
        userId: auth.user.id,
        name: name.trim(),
        dayName,
        targetSets: parseInt(targetSets || sets, 10) || 3,
        targetReps: (targetReps || reps || '8-12').toString(),
        order: count + 1
      }
    });

    // If day was marked as Rest & Recovery in splits, update it to active Workout focus
    const existingSplit = await prisma.workoutSplit.findFirst({
      where: {
        userId: auth.user.id,
        dayName: { equals: dayName, mode: 'insensitive' }
      }
    });

    if (existingSplit) {
      if (existingSplit.muscleGroup && existingSplit.muscleGroup.toLowerCase().includes('rest')) {
        await prisma.workoutSplit.update({
          where: { id: existingSplit.id },
          data: {
            muscleGroup: muscleGroup ? `${muscleGroup}` : `${dayName} Workout`
          }
        });
      }
    } else {
      // Create active split entry if none exists yet
      const dayOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(dayName) + 1;
      await prisma.workoutSplit.create({
        data: {
          userId: auth.user.id,
          dayName,
          muscleGroup: muscleGroup ? `${muscleGroup}` : `${dayName} Workout`,
          order: dayOrder > 0 ? dayOrder : count + 1
        }
      });
    }

    // If weight provided, log baseline record
    if (weight) {
      const weightNum = parseFloat(weight);
      if (!isNaN(weightNum) && weightNum > 0) {
        const todayDate = new Date().toISOString().split('T')[0];
        await prisma.exerciseWeightLog.create({
          data: {
            userId: auth.user.id,
            exerciseName: name.trim(),
            weightKg: weightNum,
            weightLbs: Math.round(weightNum * 2.20462 * 10) / 10,
            setsReps: `${parseInt(targetSets || sets, 10) || 3}x${targetReps || reps || '10'}`,
            date: todayDate
          }
        });
      }
    }

    return NextResponse.json(ex, { status: 201 });
  } catch (err) {
    console.error('Error creating workout exercise:', err);
    return jsonError('Could not save exercise.', 500);
  }
}
