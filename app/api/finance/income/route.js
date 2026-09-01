import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ items: [] });

  const rawItems = await prisma.financialTransaction.findMany({
    where: { userId, type: 'income' },
    orderBy: { date: 'desc' },
    take: 30
  });

  const items = rawItems.map(t => ({
    id: t.id,
    entry: t.description || t.category || 'Income Entry',
    description: t.description,
    source: t.category || 'Clinical Practice',
    status: 'Received',
    amount: t.amount,
    date: t.date,
    account: t.account
  }));

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const entry = body.entry || body.description || body.name || 'Income Entry';
  const amount = parseFloat(body.amount) || 0;
  const source = body.source || body.category || 'Clinical Practice';
  const date = body.date || new Date().toISOString().split('T')[0];

  const tx = await prisma.financialTransaction.create({
    data: {
      userId,
      type: 'income',
      amount: Math.abs(amount),
      category: source,
      description: entry,
      account: body.account || 'Cash Wallet',
      date
    }
  });

  return NextResponse.json({
    id: tx.id,
    entry: tx.description,
    source: tx.category,
    status: 'Received',
    amount: tx.amount,
    date: tx.date
  }, { status: 201 });
}
