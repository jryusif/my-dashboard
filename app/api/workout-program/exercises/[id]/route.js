import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function DELETE(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  if (!id) return jsonError('Exercise ID is required', 400);

  try {
    await prisma.workoutExercise.deleteMany({
      where: { id, userId: auth.user.id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting exercise:', err);
    return jsonError('Could not delete exercise.', 500);
  }
}

export async function PATCH(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  if (!id) return jsonError('Exercise ID is required', 400);

  const body = await req.json().catch(() => ({}));
  const { name, targetSets, sets, targetReps, reps, dayId, dayName: rawDayName } = body;

  const dayMap = {
    saturday: 'Saturday',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday'
  };

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (targetSets !== undefined || sets !== undefined) updateData.targetSets = parseInt(targetSets || sets, 10) || 3;
  if (targetReps !== undefined || reps !== undefined) updateData.targetReps = (targetReps || reps || '8-12').toString();
  if (dayId || rawDayName) {
    updateData.dayName = rawDayName || (dayId ? (dayMap[dayId.toLowerCase()] || dayId) : undefined);
  }

  try {
    const updated = await prisma.workoutExercise.updateMany({
      where: { id, userId: auth.user.id },
      data: updateData
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error('Error updating exercise:', err);
    return jsonError('Could not update exercise.', 500);
  }
}
