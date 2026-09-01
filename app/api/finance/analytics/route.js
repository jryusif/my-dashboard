import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);

    let transactions = [];
    if (userId) {
      transactions = await prisma.financialTransaction.findMany({
        where: { userId },
        orderBy: { date: 'asc' }
      });
    }

    const incomeTx = transactions.filter(t => t.type === 'income');
    const expenseTx = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRatePct = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    // Compute Saturday-aligned current week
    const dayOfWeek = now.getDay();
    const diffFromSaturday = (dayOfWeek + 1) % 7;
    const currentSat = new Date(now);
    currentSat.setDate(now.getDate() - diffFromSaturday);
    currentSat.setHours(0, 0, 0, 0);

    const weekDays = [];
    const dayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const fullDayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentSat);
      d.setDate(currentSat.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIncome = incomeTx.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0);
      const dayExpense = expenseTx.filter(t => t.date === dateStr).reduce((s, t) => s + t.amount, 0);

      weekDays.push({
        dayLabel: dayLabels[i],
        dayName: fullDayNames[i],
        date: dateStr,
        income: dayIncome,
        expenses: dayExpense,
        net: dayIncome - dayExpense
      });
    }

    const currentWeekIncome = weekDays.reduce((s, d) => s + d.income, 0);
    const currentWeekExpenses = weekDays.reduce((s, d) => s + d.expenses, 0);
    const currentWeekNet = currentWeekIncome - currentWeekExpenses;
    const currentWeekSavingsRate = currentWeekIncome > 0 ? Math.round((currentWeekNet / currentWeekIncome) * 100) : 0;

    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const mPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mInc = incomeTx.filter(t => t.date && t.date.startsWith(mPrefix)).reduce((s, t) => s + t.amount, 0);
      const mExp = expenseTx.filter(t => t.date && t.date.startsWith(mPrefix)).reduce((s, t) => s + t.amount, 0);
      const mNet = mInc - mExp;
      last6Months.push({
        label: shortMonthNames[d.getMonth()],
        monthName: `${shortMonthNames[d.getMonth()]} ${d.getFullYear()}`,
        income: mInc,
        expenses: mExp,
        net: mNet,
        savingsRatePct: mInc > 0 ? Math.round((mNet / mInc) * 100) : 0
      });
    }

    let runningSavings = 0;
    const currentYearMonths = shortMonthNames.map((shortName, idx) => {
      const mPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const inc = incomeTx.filter(t => t.date && t.date.startsWith(mPrefix)).reduce((s, t) => s + t.amount, 0);
      const exp = expenseTx.filter(t => t.date && t.date.startsWith(mPrefix)).reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      runningSavings += net;
      return {
        shortName,
        name: shortName,
        income: inc,
        expenses: exp,
        net,
        cumulativeSavings: runningSavings
      };
    });

    const last4Weeks = [
      { label: 'Week 1', dateRange: 'Past Week 3', income: 0, expenses: 0, net: 0 },
      { label: 'Week 2', dateRange: 'Past Week 2', income: 0, expenses: 0, net: 0 },
      { label: 'Week 3', dateRange: 'Past Week 1', income: 0, expenses: 0, net: 0 },
      { label: 'Week 4', dateRange: 'Current Week', income: currentWeekIncome, expenses: currentWeekExpenses, net: currentWeekNet }
    ];

    const spendingDayDist = {};
    fullDayNames.forEach((d, idx) => {
      spendingDayDist[d] = {
        income: weekDays[idx].income,
        expenses: weekDays[idx].expenses
      };
    });

    // Real Income by Source / Category
    const incomeCategories = {};
    incomeTx.forEach(t => {
      const cat = t.category || 'General Income';
      incomeCategories[cat] = (incomeCategories[cat] || 0) + t.amount;
    });
    const incomeBySource = Object.keys(incomeCategories).map(cat => ({
      name: cat,
      total: incomeCategories[cat],
      pct: totalIncome > 0 ? Math.round((incomeCategories[cat] / totalIncome) * 100) : 0
    }));

    // Real Expenses by Category
    const expenseCategories = {};
    expenseTx.forEach(t => {
      const cat = t.category || 'General Expense';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + t.amount;
    });
    const expensesByCategory = Object.keys(expenseCategories).map(cat => ({
      name: cat,
      total: expenseCategories[cat],
      pct: totalExpenses > 0 ? Math.round((expenseCategories[cat] / totalExpenses) * 100) : 0
    }));

    return NextResponse.json({
      overview: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRatePct,
        weekly: {
          income: currentWeekIncome,
          expenses: currentWeekExpenses,
          net: currentWeekNet,
          savingsRatePct: currentWeekSavingsRate,
          days: weekDays,
          last4Weeks
        },
        monthly: {
          last6Months
        },
        yearly: {
          year: currentYear,
          months: currentYearMonths
        }
      },
      breakdowns: {
        incomeBySource: incomeBySource.length > 0 ? incomeBySource : [{ name: 'Clinical Revenue', total: totalIncome, pct: 100 }],
        expensesByCategory: expensesByCategory.length > 0 ? expensesByCategory : [{ name: 'Practice & Living', total: totalExpenses, pct: 100 }],
        spendingDayDist
      },
      streamsMatrix: [
        { key: 'Clinic', title: 'Clinical Practice', icon: '🦷', color: '#00f2fe', income: incomeCategories['Clinical Practice'] || totalIncome, expenses: expenseCategories['Dental Materials'] || 0, net: (incomeCategories['Clinical Practice'] || totalIncome) - (expenseCategories['Dental Materials'] || 0), savingsRatePct: 90 },
        { key: 'Trading', title: 'US Stocks Trading', icon: '📈', color: '#eab308', income: incomeCategories['US Stocks Trading'] || 0, expenses: 0, net: incomeCategories['US Stocks Trading'] || 0, savingsRatePct: 100 }
      ],
      transactions
    });
  } catch (err) {
    console.error('Error fetching real finance analytics:', err);
    return NextResponse.json({ error: 'Could not fetch finance analytics' }, { status: 500 });
  }
}
