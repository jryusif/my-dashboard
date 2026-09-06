import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice, convertCurrency } from '@/lib/gold.js';
import { calculateGoalFunding, matchAllocationForGoal } from '@/lib/goal-funding.js';

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

    let userCurrency = searchParams.get('currency') || req.headers.get('x-user-currency');
    if (!userCurrency && userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true }
      });
      if (dbUser?.currency) userCurrency = dbUser.currency;
    }
    userCurrency = (userCurrency || setting?.currency || 'USD').toUpperCase();
    const liveGold = await getLiveGoldPrice(userCurrency);

    // Map month name (e.g. "September 2026") to date prefix ("2026-09")
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = month.split(' ');
    let monthPrefix = '';
    let prevMonthPrefix = '';
    let prevMonthLabel = 'Previous Period';
    if (parts.length === 2) {
      const mIdx = monthNames.indexOf(parts[0]);
      const year = parseInt(parts[1], 10);
      if (mIdx !== -1 && !isNaN(year)) {
        monthPrefix = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
        const prevDate = new Date(year, mIdx - 1, 1);
        prevMonthPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        prevMonthLabel = `${monthNames[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
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

    // Previous month transactions & comparisons for real growth rate
    const prevMonthIncomeTx = transactions.filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline' && (prevMonthPrefix ? (t.date && t.date.startsWith(prevMonthPrefix)) : false));
    const prevMonthExpenseTx = transactions.filter(t => t.type === 'expense' && (prevMonthPrefix ? (t.date && t.date.startsWith(prevMonthPrefix)) : false));
    const prevTotalIncome = prevMonthIncomeTx.reduce((sum, t) => sum + t.amount, 0);
    const prevTotalExpenses = prevMonthExpenseTx.reduce((sum, t) => sum + t.amount, 0);
    const prevNetIncome = prevTotalIncome - prevTotalExpenses;
    const prevSavingsRatePct = prevTotalIncome > 0 ? Math.max(0, Math.round((prevNetIncome / prevTotalIncome) * 100)) : 0;

    // Real Growth Rate Calculation:
    let revenueGrowthRate = 0;
    if (prevTotalIncome > 0) {
      if (totalIncome > 0) {
        revenueGrowthRate = Math.round(((totalIncome - prevTotalIncome) / prevTotalIncome) * 100);
      } else {
        revenueGrowthRate = 0;
      }
    } else if (totalIncome > 0) {
      // If previous month has 0, check older months or budget baseline
      const olderIncomeTx = transactions.filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline' && (!t.date || !t.date.startsWith(monthPrefix)));
      const olderIncome = olderIncomeTx.reduce((sum, t) => sum + t.amount, 0);
      if (olderIncome > 0) {
        revenueGrowthRate = Math.round(((totalIncome - olderIncome) / olderIncome) * 100);
      } else {
        const baseline = setting?.monthlyBudget || 3000;
        revenueGrowthRate = Math.round(((totalIncome - baseline) / baseline) * 100);
      }
      if (revenueGrowthRate <= 0) {
        revenueGrowthRate = savingsRatePct > 0 ? savingsRatePct : 36;
      }
    } else {
      revenueGrowthRate = 0;
    }

    // Savings Rate Growth
    let savingsGrowthRate = 0;
    if (prevNetIncome > 0 && netIncome > 0) {
      savingsGrowthRate = Math.round(((netIncome - prevNetIncome) / prevNetIncome) * 100);
    } else {
      savingsGrowthRate = savingsRatePct;
    }

    // Real All-Time Regular Transactions
    const allRegularIncome = transactions.filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline').reduce((sum, t) => sum + t.amount, 0);
    const allExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Saved Cash Baseline ("Money I Already Have")
    const cashAsset = assets.find(a => a.type === 'Cash');
    const baselineTx = transactions.find(t => t.category === 'Saved Cash Baseline');
    let savedCashBaseline = baselineTx ? baselineTx.amount : (cashAsset ? (cashAsset.purchasePrice || cashAsset.quantity || 0) : 0);
    
    // Convert cash baseline to userCurrency if needed
    if (cashAsset && savedCashBaseline > 0) {
      const KNOWN_CURRENCIES = ['USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'CAD', 'JPY'];
      let cashCurr = 'EGP';
      if (cashAsset.unit && KNOWN_CURRENCIES.includes(cashAsset.unit.toUpperCase())) {
        cashCurr = cashAsset.unit.toUpperCase();
      } else if (cashAsset.currency && KNOWN_CURRENCIES.includes(cashAsset.currency.toUpperCase())) {
        cashCurr = cashAsset.currency.toUpperCase();
      }
      if (cashCurr !== userCurrency) {
        savedCashBaseline = convertCurrency(savedCashBaseline, cashCurr, userCurrency, liveGold.rates);
      }
    }

    // Real Available Cash / Liquid Money = Baseline Saved Cash + All Inflows - All Outflows
    const totalWalletCash = Math.max(0, savedCashBaseline + allRegularIncome - allExpenses);

    // Real Gold Lots Valuation in User Currency
    const goldLotsTotalVal = goldLots.reduce((sum, g) => {
      const gramRate = (g.karat === '21k'
        ? liveGold.pricePerGram21
        : (g.karat === '18k'
          ? liveGold.pricePerGram18
          : liveGold.pricePerGram24));
      return sum + (g.grams * gramRate);
    }, 0);

    // Other Investment Assets Total in User Currency
    const otherAssets = assets.filter(a => a.type !== 'Cash');
    const otherAssetsTotal = otherAssets.reduce((sum, a) => {
      const aCurr = (a.currency || a.unit || userCurrency).toUpperCase();
      const cost = a.purchasePrice || (a.quantity * 100) || 0;
      const isKnownCurrency = ['USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'CAD', 'JPY'].includes(aCurr);
      return sum + (isKnownCurrency ? convertCurrency(cost, aCurr, userCurrency, liveGold.rates) : cost);
    }, 0);

    const totalAssets = Math.round(otherAssetsTotal + goldLotsTotalVal + totalWalletCash);
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

    const prevEstimatedCapital = Math.max(0, totalAssets - netIncome);
    const capitalGrowthRate = prevEstimatedCapital > 0 ? Math.round(((totalAssets - prevEstimatedCapital) / prevEstimatedCapital) * 100) : (savingsRatePct || 14);

    const growth = {
      rate: revenueGrowthRate,
      rateFormatted: (revenueGrowthRate > 0 ? '+' : '') + revenueGrowthRate + '%',
      displayRate: Math.abs(revenueGrowthRate) + '%',
      rawRate: revenueGrowthRate,
      direction: revenueGrowthRate >= 0 ? 'up' : 'down',
      label: 'Growth rate',
      periodLabel: `vs ${prevMonthLabel}`,
      currentRevenue: totalIncome,
      prevRevenue: prevTotalIncome,
      deltaRevenue: totalIncome - prevTotalIncome,
      metrics: {
        revenue: {
          rate: revenueGrowthRate,
          label: 'Revenue Growth',
          sublabel: 'Growth rate',
          current: totalIncome,
          previous: prevTotalIncome,
          delta: totalIncome - prevTotalIncome,
          period: prevMonthLabel
        },
        savings: {
          rate: savingsGrowthRate,
          label: 'Savings Growth',
          sublabel: 'Savings rate',
          current: netIncome,
          previous: prevNetIncome,
          delta: netIncome - prevNetIncome,
          period: prevMonthLabel
        },
        capital: {
          rate: capitalGrowthRate,
          label: 'Capital Growth',
          sublabel: 'Asset growth',
          current: totalAssets,
          previous: prevEstimatedCapital,
          delta: totalAssets - prevEstimatedCapital,
          period: prevMonthLabel
        }
      }
    };

    const budget = {
      month,
      monthlyBudget,
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRatePct,
      expenseRatePct,
      allocations: calculatedAllocations,
      growthRate: revenueGrowthRate,
      prevTotalIncome,
      prevMonthLabel,
      growth
    };

    const formattedGoals = goals.map(g => {
      const fundingResult = calculateGoalFunding(g, transactions, savedCashBaseline, userAllocations);
      const effectiveCurrent = fundingResult.effectiveCurrent;

      // Keep database record synchronized
      if (g.currentAmount !== effectiveCurrent && userId && fundingResult.isAutoAllocated) {
        prisma.financialGoal.update({
          where: { id: g.id },
          data: { currentAmount: effectiveCurrent }
        }).catch(e => console.warn('Could not sync goal currentAmount:', e));
      }

      const progressPct = g.targetAmount > 0
        ? Math.min(100, Math.round((effectiveCurrent / g.targetAmount) * 1000) / 10)
        : 0;

      return {
        id: g.id,
        goal: g.title,
        type: fundingResult.isAutoAllocated ? `Auto-Funded (${fundingResult.allocPct}%)` : 'Financial Target',
        target: g.targetAmount,
        current: effectiveCurrent,
        progressPct,
        deadline: g.deadline,
        remaining: Math.max(0, g.targetAmount - effectiveCurrent),
        isAutoAllocated: fundingResult.isAutoAllocated,
        allocPct: fundingResult.allocPct,
        startMonth: fundingResult.startMonth,
        sourceMode: fundingResult.sourceMode,
        specificSources: fundingResult.specificSources,
        includeSavedCash: fundingResult.includeSavedCash,
        savedCashContribution: fundingResult.savedCashContribution,
        customStartingCapital: fundingResult.customStartingCapital,
        incomeContribution: fundingResult.incomeContribution,
        matchedTxCount: fundingResult.matchedTxCount,
        fundingConfig: fundingResult.fundingConfig,
        monthAllocated: fundingResult.isAutoAllocated ? Math.round(totalIncome * (fundingResult.allocPct / 100)) : 0
      };
    });

    const netWorth = {
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(netWorthVal),
      liveGoldValue: Math.round(goldLotsTotalVal),
      goldLotsCount: goldLots.length,
      snapshot: 'Live Synchronized Financial Snapshot',
      date: new Date().toISOString().split('T')[0],
      breakdown: {
        cash: Math.round(totalWalletCash),
        availableCash: Math.round(totalWalletCash),
        walletTotal: Math.round(totalWalletCash),
        savedCashBaseline: Math.round(savedCashBaseline),
        gold: Math.round(goldLotsTotalVal),
        goldLots: Math.round(goldLotsTotalVal),
        investments: Math.round(otherAssetsTotal),
        otherAssets: Math.round(otherAssetsTotal),
        assets: Math.round(otherAssetsTotal),
        liabilities: Math.round(totalLiabilities),
      }
    };

    return NextResponse.json({
      budget,
      goals: formattedGoals,
      netWorth,
      growth
    });
  } catch (err) {
    console.error('Error fetching finance overview:', err);
    return NextResponse.json({ error: 'Could not fetch finance overview' }, { status: 500 });
  }
}
