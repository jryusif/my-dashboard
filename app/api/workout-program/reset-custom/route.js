import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  return NextResponse.json({ success: true });
}
