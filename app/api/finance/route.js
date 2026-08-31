import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const transactions = await prisma.financialTransaction.findMany({
      where: { userId: auth.userId },
      orderBy: { date: 'desc' }
    });

    const goals = await prisma.financialGoal.findMany({
      where: { userId: auth.userId }
    });

    let settings = await prisma.financialSetting.findUnique({
      where: { userId: auth.userId }
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
