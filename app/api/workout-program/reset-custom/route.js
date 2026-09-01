import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { WORKOUT_PRESETS } from '@/lib/workout-presets.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const userId = auth.user.id;
  const body = await req.json().catch(() => ({}));
  const { template, splits: customSplits, clearExercises, action } = body;

  try {
    // Action: Clear all exercises only
    if (action === 'clear_exercises') {
      await prisma.workoutExercise.deleteMany({
        where: { userId }
      });
      return NextResponse.json({ success: true, message: 'All exercises cleared.' });
    }

    // Preset Templates
    if (template === 'empty' || template === 'blank') {
      // 1. Delete all exercises
      await prisma.workoutExercise.deleteMany({ where: { userId } });
      // 2. Clear old splits
      await prisma.workoutSplit.deleteMany({ where: { userId } });
      // 3. Create clean slate splits
      const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (let i = 0; i < dayNames.length; i++) {
        await prisma.workoutSplit.create({
          data: {
            userId,
            dayName: dayNames[i],
            muscleGroup: 'Rest & Recovery',
            order: i + 1
          }
        });
      }
      return NextResponse.json({ success: true, message: 'Blank custom routine created.' });
    }

    if (template && (template === 'curated_6day' || template === '5day' || template === '4day' || template === '3day')) {
      const presetKey = template === '5day' ? 'split_5day' : (template === '4day' ? 'split_4day' : (template === '3day' ? 'split_3day' : 'curated_6day'));
      const preset = WORKOUT_PRESETS[presetKey];
      if (preset) {
        // Clear old
        await prisma.workoutExercise.deleteMany({ where: { userId } });
        await prisma.workoutSplit.deleteMany({ where: { userId } });

        // Seed preset
        for (const s of preset.splits) {
          await prisma.workoutSplit.create({
            data: {
              userId,
              dayName: s.dayName,
              muscleGroup: s.muscleGroup,
              order: s.order
            }
          });

          if (s.exercises && s.exercises.length > 0) {
            for (const ex of s.exercises) {
              await prisma.workoutExercise.create({
                data: {
                  userId,
                  dayName: s.dayName,
                  name: ex.name,
                  targetSets: ex.targetSets || 3,
                  targetReps: ex.targetReps || '8-12',
                  order: ex.order || 1
                }
              });
            }
          }
        }

        return NextResponse.json({ success: true, message: `Loaded ${preset.name}.` });
      }
    }

    // Custom 7-day schedule configuration
    if (customSplits && Array.isArray(customSplits)) {
      if (clearExercises) {
        await prisma.workoutExercise.deleteMany({ where: { userId } });
      }

      await prisma.workoutSplit.deleteMany({ where: { userId } });

      for (let i = 0; i < customSplits.length; i++) {
        const s = customSplits[i];
        const dayName = s.dayName || s.name;
        const muscleGroup = s.isRestDay ? 'Rest & Recovery' : (s.muscleGroup || s.title || 'Workout');
        
        await prisma.workoutSplit.create({
          data: {
            userId,
            dayName,
            muscleGroup,
            order: i + 1
          }
        });

        // If explicitly set to rest and clearRestExercises is set, delete exercises for this day
        if (s.isRestDay && s.clearDayExercises) {
          await prisma.workoutExercise.deleteMany({
            where: {
              userId,
              dayName: { equals: dayName, mode: 'insensitive' }
            }
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Custom weekly routine saved.' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error resetting workout program:', err);
    return jsonError('Could not update workout routine configuration.', 500);
  }
}
