import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  let transactions = [];
  if (userId) {
    transactions = await prisma.financialTransaction.findMany({
      where: { userId }
    });
  }

  const byCat = {};
  for (const t of transactions) {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }

  return NextResponse.json({
    byCategory: Object.entries(byCat).map(([name, total]) => ({ name, total })),
    byAccount: []
  });
}
