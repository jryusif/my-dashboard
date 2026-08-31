import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  let transactions = [];
  let assets = [];
  let goldLots = [];

  if (userId) {
    transactions = await prisma.financialTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    assets = await prisma.asset.findMany({
      where: { userId }
    });
    goldLots = await prisma.goldLot.findMany({
      where: { userId }
    });
  }

  const incomeTx = transactions.filter(t => t.type === 'income');
  const expenseTx = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const standardAssetsTotal = assets.reduce((sum, a) => sum + (a.purchasePrice || (a.quantity * 88.5)), 0);
  const goldLotsTotal = goldLots.reduce((sum, g) => sum + (g.grams24kEquivalent * 88.5), 0);
  const liveGoldValue = goldLotsTotal;
  const totalAssets = standardAssetsTotal + goldLotsTotal + Math.max(0, netSavings);
  const totalLiabilities = 0;
  const netWorth = totalAssets - totalLiabilities;

  return NextResponse.json({
    netWorth: {
      totalAssets,
      totalLiabilities,
      netWorth,
      liveGoldValue
    },
    budget: {
      month: currentMonthName,
      totalIncome: totalIncome > 0 ? totalIncome : 5000,
      totalExpenses,
      savingsRate: savingsRate > 0 ? savingsRate : 35,
      remainingBudget: Math.max(0, 3500 - totalExpenses)
    }
  });
}
