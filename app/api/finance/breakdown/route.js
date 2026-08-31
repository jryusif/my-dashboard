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
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');

  let transactions = [];
  if (userId) {
    transactions = await prisma.financialTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
  }

  // Filter by month if provided
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let monthPrefix = '';
  if (month) {
    const parts = month.split(' ');
    if (parts.length === 2) {
      const mIdx = monthNames.indexOf(parts[0]);
      if (mIdx !== -1) monthPrefix = `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
    }
  }

  const filteredTx = monthPrefix
    ? transactions.filter(t => t.date && t.date.startsWith(monthPrefix))
    : transactions;

  const incomeTx = filteredTx.filter(t => t.type === 'income');
  const expenseTx = filteredTx.filter(t => t.type === 'expense');

  const incomeSum = incomeTx.reduce((acc, t) => acc + t.amount, 0);
  const expenseSum = expenseTx.reduce((acc, t) => acc + t.amount, 0);

  const incomeMap = {};
  for (const t of incomeTx) {
    const cat = t.category || 'General Income';
    incomeMap[cat] = (incomeMap[cat] || 0) + t.amount;
  }

  const expenseMap = {};
  for (const t of expenseTx) {
    const cat = t.category || 'General Expense';
    expenseMap[cat] = (expenseMap[cat] || 0) + t.amount;
  }

  const incomeBySource = Object.entries(incomeMap).map(([catName, amount]) => ({
    name: catName,
    label: catName,
    total: amount,
    amount,
    pct: incomeSum > 0 ? Math.round((amount / incomeSum) * 100) : 0
  }));

  const expensesByCategory = Object.entries(expenseMap).map(([catName, amount]) => ({
    name: catName,
    label: catName,
    total: amount,
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
