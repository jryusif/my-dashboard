import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return NextResponse.json({ items: [] });

  const items = await prisma.financialTransaction.findMany({
    where: { userId: auth.user.id, type: 'expense' },
    orderBy: { date: 'desc' },
    take: 20
  });

  return NextResponse.json({ items });
}

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, category, description, account, date } = await req.json();
  const tx = await prisma.financialTransaction.create({
    data: {
      userId: auth.user.id,
      type: 'expense',
      amount: Math.abs(parseFloat(amount)),
      category: category || 'General',
      description: description || null,
      account: account || 'Cash Wallet',
      date: date || new Date().toISOString().split('T')[0]
    }
  });

  return NextResponse.json(tx, { status: 201 });
}
