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
  const userId = await resolveUserId(req);
  let transactions = [];
  if (userId) {
    transactions = await prisma.financialTransaction.findMany({
      where: { userId }
    });
  }

  const incomeTx = transactions.filter(t => t.type === 'income');
  const expenseTx = transactions.filter(t => t.type === 'expense');

  const incomeSum = incomeTx.reduce((acc, t) => acc + t.amount, 0) || 5000;
  const expenseSum = expenseTx.reduce((acc, t) => acc + t.amount, 0) || 1200;

  const incomeMap = {};
  for (const t of incomeTx) {
    incomeMap[t.category] = (incomeMap[t.category] || 0) + t.amount;
  }
  if (Object.keys(incomeMap).length === 0) {
    incomeMap['Clinical Practice'] = 3500;
    incomeMap['US Stocks Trading'] = 1500;
  }

  const expenseMap = {};
  for (const t of expenseTx) {
    expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
  }
  if (Object.keys(expenseMap).length === 0) {
    expenseMap['Clinic & Dental Materials'] = 600;
    expenseMap['Living & Food'] = 400;
    expenseMap['Gym & Nutrition'] = 200;
  }

  const incomeBySource = Object.entries(incomeMap).map(([label, amount]) => ({
    label,
    amount,
    pct: incomeSum > 0 ? Math.round((amount / incomeSum) * 100) : 0
  }));

  const expensesByCategory = Object.entries(expenseMap).map(([label, amount]) => ({
    label,
    amount,
    pct: expenseSum > 0 ? Math.round((amount / expenseSum) * 100) : 0
  }));

  return NextResponse.json({
    incomeBySource,
    expensesByCategory,
    totalIncome: incomeSum,
    totalExpenses: expenseSum
  });
}
