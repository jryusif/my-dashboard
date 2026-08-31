import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function DELETE(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  await prisma.asset.deleteMany({
    where: { id, userId: auth.user.id }
  });
  await prisma.goldLot.deleteMany({
    where: { id, userId: auth.user.id }
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.asset.updateMany({
    where: { id, userId: auth.user.id },
    data: body
  });

  return NextResponse.json({ success: true, updated });
}
