import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice } from '@/lib/gold.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    let transactions = [];
    let goals = [];
    let assets = [];
    let goldLots = [];
    let setting = null;

    if (userId) {
      transactions = await prisma.financialTransaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      });
      goals = await prisma.financialGoal.findMany({
        where: { userId }
      });
      assets = await prisma.asset.findMany({
        where: { userId }
      });
      goldLots = await prisma.goldLot.findMany({
        where: { userId }
      });
      setting = await prisma.financialSetting.findUnique({
        where: { userId }
      });
    }

    const liveGold = await getLiveGoldPrice();

    // Map month name (e.g. "September 2026") to date prefix ("2026-09")
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = month.split(' ');
    let monthPrefix = '';
    if (parts.length === 2) {
      const mIdx = monthNames.indexOf(parts[0]);
      if (mIdx !== -1) {
        monthPrefix = `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
      }
    }

    const monthIncomeTx = transactions.filter(t => t.type === 'income' && (!monthPrefix || (t.date && t.date.startsWith(monthPrefix))));
    const monthExpenseTx = transactions.filter(t => t.type === 'expense' && (!monthPrefix || (t.date && t.date.startsWith(monthPrefix))));

    const totalIncome = monthIncomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthExpenseTx.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRatePct = totalIncome > 0 ? Math.max(0, Math.round((netIncome / totalIncome) * 100)) : 0;
    const expenseRatePct = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;

    // Real All-Time Totals
    const allIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const allExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netCashSurplus = allIncome - allExpenses;

    // Real Gold Lots Valuation in EGP
    const goldLotsTotalEgp = goldLots.reduce((sum, g) => {
      const ratio = (g.karat === '21k' ? 21/24 : (g.karat === '18k' ? 18/24 : 1));
      return sum + (g.grams * liveGold.pricePerGramEgp24 * ratio);
    }, 0);

    // Standard Assets Total
    const standardAssetsTotal = assets.reduce((sum, a) => sum + (a.purchasePrice || (a.quantity * 100)), 0);

    const totalAssets = standardAssetsTotal + goldLotsTotalEgp + Math.max(0, netCashSurplus);
    const totalLiabilities = 0;
    const netWorthVal = totalAssets - totalLiabilities;

    const monthlyBudget = setting?.monthlyBudget || 3000;

    const budget = {
      month,
      monthlyBudget,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: netIncome,
      savingsRatePct: savingsRatePct,
      expenseRatePct: expenseRatePct,
      allocations: {
        construction: { amount: Math.round(totalIncome * 0.25), pct: 25 },
        emergency: { amount: Math.round(totalIncome * 0.15), pct: 15 },
        investment: { amount: Math.round(totalIncome * 0.20), pct: 20 },
        otherGoals: { amount: Math.round(totalIncome * 0.10), pct: 10 },
        flexible: { amount: Math.round(totalIncome * 0.30), pct: 30 }
      }
    };

    const formattedGoals = goals.map(g => ({
      id: g.id,
      goal: g.title,
      type: 'Financial Target',
      target: g.targetAmount,
      current: g.currentAmount,
      progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
      deadline: g.deadline,
      remaining: Math.max(0, g.targetAmount - g.currentAmount)
    }));

    const netWorth = {
      totalAssets: Math.round(totalAssets),
      totalLiabilities,
      netWorth: Math.round(netWorthVal),
      liveGoldValue: Math.round(goldLotsTotalEgp),
      goldLotsCount: goldLots.length,
      snapshot: 'Live Synchronized Financial Snapshot',
      date: new Date().toISOString().split('T')[0],
      breakdown: {
        cash: Math.max(0, netCashSurplus),
        gold: Math.round(goldLotsTotalEgp),
        otherAssets: standardAssetsTotal
      }
    };

    return NextResponse.json({
      budget,
      goals: formattedGoals,
      netWorth
    });
  } catch (err) {
    console.error('Error fetching finance overview:', err);
    return NextResponse.json({ error: 'Could not fetch finance overview' }, { status: 500 });
  }
}
