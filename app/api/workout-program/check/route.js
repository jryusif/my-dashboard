import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const body = await req.json();
  return NextResponse.json({ success: true, ...body });
}
