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
  const updated = await prisma.routine.updateMany({
    where: { id, userId },
    data: body
  });

  return successResponse({ success: true, updated });
}
