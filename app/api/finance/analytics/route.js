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

  return NextResponse.json({
    monthlyTrends: [],
    savingsRateHistory: [],
    transactions
  });
}
