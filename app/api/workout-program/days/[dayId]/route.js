import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function PATCH(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { dayId } = await params;
  if (!dayId) return jsonError('Day ID is required', 400);

  const body = await req.json().catch(() => ({}));
  const { title, isRestDay, targetMuscles } = body;

  const dayMap = {
    saturday: { name: 'Saturday', order: 1 },
    sunday: { name: 'Sunday', order: 2 },
    monday: { name: 'Monday', order: 3 },
    tuesday: { name: 'Tuesday', order: 4 },
    wednesday: { name: 'Wednesday', order: 5 },
    thursday: { name: 'Thursday', order: 6 },
    friday: { name: 'Friday', order: 7 }
  };

  const dayInfo = dayMap[dayId.toLowerCase()] || { name: dayId.charAt(0).toUpperCase() + dayId.slice(1), order: 1 };
  const muscleGroup = isRestDay ? 'Rest & Recovery' : (title || (targetMuscles ? targetMuscles.join(', ') : 'Workout'));

  try {
    const existing = await prisma.workoutSplit.findFirst({
      where: {
        userId: auth.user.id,
        dayName: { equals: dayInfo.name, mode: 'insensitive' }
      }
    });

    let split;
    if (existing) {
      split = await prisma.workoutSplit.update({
        where: { id: existing.id },
        data: {
          muscleGroup,
          dayName: dayInfo.name
        }
      });
    } else {
      split = await prisma.workoutSplit.create({
        data: {
          userId: auth.user.id,
          dayName: dayInfo.name,
          muscleGroup,
          order: dayInfo.order
        }
      });
    }

    return NextResponse.json({ success: true, dayId, split });
  } catch (err) {
    console.error('Error updating workout day split:', err);
    return jsonError('Could not update workout day focus.', 500);
  }
}
