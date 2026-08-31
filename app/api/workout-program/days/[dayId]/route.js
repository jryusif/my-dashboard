import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function PATCH(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { dayId } = await params;
  const body = await req.json();

  return NextResponse.json({ success: true, dayId, ...body });
}
