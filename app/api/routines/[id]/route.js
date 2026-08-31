import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function DELETE(req, { params }) {
  const userId = await resolveUserId(req);
  if (!userId) return errorResponse('Unauthorized', 401);

  const { id } = await params;
  await prisma.routine.deleteMany({
    where: { id, userId }
  });

  return new Response(null, { status: 204 });
}

export async function PATCH(req, { params }) {
  const userId = await resolveUserId(req);
  if (!userId) return errorResponse('Unauthorized', 401);

  const { id } = await params;
  const body = await req.json();
  const targetDate = body.date || new Date().toISOString().split('T')[0];

  if (body.completed !== undefined) {
    const existingLog = await prisma.routineLog.findUnique({
      where: {
        userId_routineId_date: {
          userId,
          routineId: id,
          date: targetDate
        }
      }
    });

    if (existingLog) {
      await prisma.routineLog.update({
        where: { id: existingLog.id },
        data: { completed: Boolean(body.completed) }
      });
    } else {
      await prisma.routineLog.create({
        data: {
          userId,
          routineId: id,
          date: targetDate,
          completed: Boolean(body.completed)
        }
      });
    }
  }

  const routineUpdate = {};
  if (body.name !== undefined) routineUpdate.title = body.name;
  if (body.title !== undefined) routineUpdate.title = body.title;

  if (Object.keys(routineUpdate).length > 0) {
    await prisma.routine.updateMany({
      where: { id, userId },
      data: routineUpdate
    });
  }

  return successResponse({ success: true });
}
