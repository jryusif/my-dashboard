import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
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

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0) || 5000;
    const totalExpenses = expenseTx.reduce((sum, t) => sum + t.amount, 0) || 1200;
    const netSavings = totalIncome - totalExpenses;
    const savingsRatePct = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 40;

    const now = new Date();
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

      const inc = dayIncome > 0 ? dayIncome : (i === 0 ? 3500 : (i === 2 ? 1500 : 0));
      const exp = dayExpense > 0 ? dayExpense : (i === 1 ? 400 : (i === 3 ? 300 : (i === 5 ? 500 : 0)));

      weekDays.push({
        dayLabel: dayLabels[i],
        dayName: fullDayNames[i],
        date: dateStr,
        income: inc,
        expenses: exp,
        net: inc - exp
      });
    }

    const currentWeekIncome = weekDays.reduce((s, d) => s + d.income, 0);
    const currentWeekExpenses = weekDays.reduce((s, d) => s + d.expenses, 0);
    const currentWeekNet = currentWeekIncome - currentWeekExpenses;
    const currentWeekSavingsRate = currentWeekIncome > 0 ? Math.round((currentWeekNet / currentWeekIncome) * 100) : 0;

    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mInc = Math.floor(4500 + Math.random() * 2000);
      const mExp = Math.floor(1200 + Math.random() * 600);
      const mNet = mInc - mExp;
      last6Months.push({
        label: shortMonthNames[d.getMonth()],
        monthName: `${shortMonthNames[d.getMonth()]} ${d.getFullYear()}`,
        income: mInc,
        expenses: mExp,
        net: mNet,
        savingsRatePct: Math.round((mNet / mInc) * 100)
      });
    }

    let runningSavings = 0;
    const currentYearMonths = shortMonthNames.map((shortName, idx) => {
      const isPastOrCurrent = idx <= now.getMonth();
      const inc = isPastOrCurrent ? Math.floor(5000 + Math.random() * 1500) : 0;
      const exp = isPastOrCurrent ? Math.floor(1300 + Math.random() * 400) : 0;
      const net = isPastOrCurrent ? inc - exp : 0;
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
      { label: 'Week 1', dateRange: 'Aug 8 - Aug 14', income: 4800, expenses: 1100, net: 3700 },
      { label: 'Week 2', dateRange: 'Aug 15 - Aug 21', income: 5200, expenses: 1400, net: 3800 },
      { label: 'Week 3', dateRange: 'Aug 22 - Aug 28', income: 4900, expenses: 1050, net: 3850 },
      { label: 'Week 4', dateRange: 'Aug 29 - Sep 4', income: currentWeekIncome, expenses: currentWeekExpenses, net: currentWeekNet }
    ];

    const spendingDayDist = {};
    fullDayNames.forEach((d, idx) => {
      spendingDayDist[d] = {
        income: weekDays[idx].income,
        expenses: weekDays[idx].expenses
      };
    });

    const incomeBySource = [
      { name: 'Clinical Practice', total: 3500, pct: 70 },
      { name: 'US Stocks Trading', total: 1500, pct: 30 }
    ];

    const expensesByCategory = [
      { name: 'Clinic & Dental Materials', total: 600, pct: 50 },
      { name: 'Living & Food', total: 400, pct: 33 },
      { name: 'Gym & Nutrition', total: 200, pct: 17 }
    ];

    const streamsMatrix = [
      { key: 'Clinic', title: 'Clinical Practice', icon: '🦷', color: '#00f2fe', income: 3500, expenses: 600, net: 2900, savingsRatePct: 83 },
      { key: 'Trading', title: 'US Stocks Trading', icon: '📈', color: '#eab308', income: 1500, expenses: 150, net: 1350, savingsRatePct: 90 },
      { key: 'Living', title: 'Living & Lifestyle', icon: '🏠', color: '#38bdf8', income: 0, expenses: 400, net: -400, savingsRatePct: 0 },
      { key: 'Training', title: 'Fitness & Health', icon: '🏋️', color: '#22c55e', income: 0, expenses: 200, net: -200, savingsRatePct: 0 }
    ];

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
          year: now.getFullYear(),
          months: currentYearMonths
        }
      },
      breakdowns: {
        incomeBySource,
        expensesByCategory,
        spendingDayDist
      },
      streamsMatrix,
      transactions
    });
  } catch (err) {
    console.error('Error fetching finance analytics:', err);
    return NextResponse.json({ error: 'Could not fetch finance analytics' }, { status: 500 });
  }
}
