import { NextResponse } from 'next/server';
import { getLiveGoldPrice } from '@/lib/gold.js';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const { searchParams } = new URL(req.url);
  let currency = searchParams.get('currency') || req.headers.get('x-user-currency');

  if (!currency && auth?.authenticated && auth.userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { currency: true }
    });
    if (dbUser?.currency) currency = dbUser.currency;
  }

  const goldPrice = await getLiveGoldPrice(currency || 'USD');
  return NextResponse.json(goldPrice);
}

