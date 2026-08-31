import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function POST(req) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const rawAmount = body.amount !== undefined ? body.amount : (body.cash !== undefined ? body.cash : 0);
  const amount = Math.max(0, parseFloat(rawAmount) || 0);

  // Find or create user's Liquid Cash Asset in database
  const existingCashAsset = await prisma.asset.findFirst({
    where: { userId, type: 'Cash' }
  });

  let asset;
  if (existingCashAsset) {
    asset = await prisma.asset.update({
      where: { id: existingCashAsset.id },
      data: {
        quantity: amount,
        purchasePrice: amount,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: 'Money I Already Have (Liquid Cash Savings)'
      }
    });
  } else {
    asset = await prisma.asset.create({
      data: {
        userId,
        name: 'Liquid Cash Savings',
        type: 'Cash',
        status: 'Owned',
        quantity: amount,
        unit: 'EGP',
        purchasePrice: amount,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: 'Money I Already Have (Liquid Cash Savings)'
      }
    });
  }

  return NextResponse.json({ success: true, cash: amount, asset });
}
