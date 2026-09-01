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
    where: { userId, type: 'expense' },
    orderBy: { date: 'desc' },
    take: 30
  });

  const items = rawItems.map(t => ({
    id: t.id,
    expense: t.description || t.category || 'Expense Entry',
    description: t.description,
    category: t.category || 'Clinic & Dental Materials',
    paymentMethod: t.account || 'Cash',
    amount: t.amount,
    date: t.date
  }));

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const expense = body.expense || body.description || body.name || 'Expense Entry';
  const amount = parseFloat(body.amount) || 0;
  const category = body.category || 'Clinic & Dental Materials';
  const paymentMethod = body.paymentMethod || body.account || 'Cash';
  const date = body.date || new Date().toISOString().split('T')[0];

  const tx = await prisma.financialTransaction.create({
    data: {
      userId,
      type: 'expense',
      amount: Math.abs(amount),
      category,
      description: expense,
      account: paymentMethod,
      date
    }
  });

  return NextResponse.json({
    id: tx.id,
    expense: tx.description,
    category: tx.category,
    paymentMethod: tx.account,
    amount: tx.amount,
    date: tx.date
  }, { status: 201 });
}
