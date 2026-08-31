import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const { weightKg, weightLbs, setsReps, notes, date, exerciseName } = await req.json();

  const kg = parseFloat(weightKg);
  const lbs = weightLbs ? parseFloat(weightLbs) : Math.round(kg * 2.20462 * 10) / 10;

  const highestPrevious = await prisma.exerciseWeightLog.findFirst({
    where: { userId: auth.user.id, exerciseName: exerciseName ? exerciseName.trim() : 'Bench Press' },
    orderBy: { weightKg: 'desc' }
  });

  const isPr = !highestPrevious || kg > highestPrevious.weightKg;

  const log = await prisma.exerciseWeightLog.create({
    data: {
      userId: auth.user.id,
      exerciseName: exerciseName ? exerciseName.trim() : 'Bench Press',
      weightKg: kg,
      weightLbs: lbs,
      setsReps: setsReps || null,
      isPr,
      notes: notes || null,
      date: date || new Date().toISOString().split('T')[0]
    }
  });

  return NextResponse.json({ log, isPr }, { status: 201 });
}
