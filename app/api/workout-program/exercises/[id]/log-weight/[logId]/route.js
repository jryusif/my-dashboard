import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function DELETE(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { logId } = await params;
  await prisma.exerciseWeightLog.deleteMany({
    where: { id: logId, userId: auth.user.id }
  });

  return NextResponse.json({ success: true });
}
