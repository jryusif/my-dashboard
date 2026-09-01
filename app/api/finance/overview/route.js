import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice } from '@/lib/gold.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
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

    // Regular month income (excluding pre-existing baseline savings)
    const monthIncomeTx = transactions.filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline' && (!monthPrefix || (t.date && t.date.startsWith(monthPrefix))));
    const monthExpenseTx = transactions.filter(t => t.type === 'expense' && (!monthPrefix || (t.date && t.date.startsWith(monthPrefix))));

    const totalIncome = monthIncomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthExpenseTx.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRatePct = totalIncome > 0 ? Math.max(0, Math.round((netIncome / totalIncome) * 100)) : 0;
    const expenseRatePct = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;

    // Real All-Time Regular Transactions
    const allRegularIncome = transactions.filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline').reduce((sum, t) => sum + t.amount, 0);
    const allExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Saved Cash Baseline ("Money I Already Have")
    const cashAsset = assets.find(a => a.type === 'Cash');
    const baselineTx = transactions.find(t => t.category === 'Saved Cash Baseline');
    const savedCashBaseline = baselineTx ? baselineTx.amount : (cashAsset ? (cashAsset.purchasePrice || cashAsset.quantity || 0) : 0);
    const totalWalletCash = Math.max(0, savedCashBaseline + allRegularIncome - allExpenses);

    // Real Gold Lots Valuation in EGP
    const goldLotsTotalEgp = goldLots.reduce((sum, g) => {
      const ratio = (g.karat === '21k' ? 21/24 : (g.karat === '18k' ? 18/24 : 1));
      return sum + (g.grams * liveGold.pricePerGramEgp24 * ratio);
    }, 0);

    // Other Investment Assets Total
    const otherAssets = assets.filter(a => a.type !== 'Cash');
    const otherAssetsTotal = otherAssets.reduce((sum, a) => sum + (a.purchasePrice || (a.quantity * 100)), 0);

    const totalAssets = otherAssetsTotal + goldLotsTotalEgp + totalWalletCash;
    const totalLiabilities = 0;
    const netWorthVal = totalAssets - totalLiabilities;

    const monthlyBudget = setting?.monthlyBudget || 3000;

    // Dynamic User-Customizable Allocation Buckets & Percentages
    const defaultAllocations = [
      { name: 'Construction', pct: 25 },
      { name: 'Emergency', pct: 15 },
      { name: 'Investment', pct: 20 },
      { name: 'Other Goals', pct: 10 },
      { name: 'Flexible Cash', pct: 30 }
    ];

    let userAllocations = setting?.allocations;
    if (typeof userAllocations === 'string') {
      try { userAllocations = JSON.parse(userAllocations); } catch {}
    }
    if (!Array.isArray(userAllocations) || userAllocations.length === 0) {
      userAllocations = defaultAllocations;
    }

    const calculatedAllocations = userAllocations.map(a => {
      const pct = parseFloat(a.pct) || 0;
      const amount = Math.round(totalIncome * (pct / 100));
      return {
        name: a.name,
        pct: pct,
        amount: amount
      };
    });

    const budget = {
      month,
      monthlyBudget,
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRatePct,
      expenseRatePct,
      allocations: calculatedAllocations
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
        cash: savedCashBaseline,
        walletTotal: totalWalletCash,
        gold: Math.round(goldLotsTotalEgp),
        otherAssets: otherAssetsTotal
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
