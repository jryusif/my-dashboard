import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';

export async function DELETE(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  return NextResponse.json({ success: true });
}

export async function PATCH(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const body = await req.json();
  return NextResponse.json({ success: true, ...body });
}
