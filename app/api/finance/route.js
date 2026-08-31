import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0, monthlyBudget: 3500, currency: 'USD' }, transactions: [], goals: [], settings: { currency: 'USD', monthlyBudget: 3500, savingsTargetPct: 25 } });

    const transactions = await prisma.financialTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const goals = await prisma.financialGoal.findMany({
      where: { userId }
    });

    let settings = await prisma.financialSetting.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = { currency: 'USD', monthlyBudget: 3500, savingsTargetPct: 25 };
    }

    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    return successResponse({
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        monthlyBudget: settings.monthlyBudget,
        currency: settings.currency
      },
      transactions,
      goals,
      settings
    });
  } catch (err) {
    console.error('Error fetching finances:', err);
    return errorResponse('Could not fetch finances.');
  }
}
