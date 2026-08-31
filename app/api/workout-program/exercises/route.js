import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { name, dayName, targetSets, targetReps } = await req.json();
  if (!name) return jsonError('Exercise name is required', 400);

  const ex = await prisma.workoutExercise.create({
    data: {
      userId: auth.user.id,
      name: name.trim(),
      dayName: dayName || 'Saturday',
      targetSets: parseInt(targetSets, 10) || 3,
      targetReps: targetReps || '8-12',
      order: 99
    }
  });

  return NextResponse.json(ex, { status: 201 });
}
