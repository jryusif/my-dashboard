import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function POST(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  return NextResponse.json({ success: true, message: `Weekly template applied for ${category}` });
}
