import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { getAuthUser } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    let userSegments = null;

    if (auth && auth.authenticated && auth.userId) {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { departmentSegments: true, currency: true }
      });
      userSegments = user?.departmentSegments;
    }

    const defaultIncomeSources = ['Clinical Practice', 'US Stocks Trading', 'Salary', 'Investment Returns', 'Freelance / Consulting', 'Other Income'];
    const defaultExpenseCategories = ['Clinic & Dental Materials', 'Trading Tools / Subscriptions', 'Studies & Books', 'Gym & Nutrition', 'Living & Food', 'Transport', 'Tech & Gear', 'Other Expenses'];
    const defaultAccounts = ['Cash Wallet', 'Bank Checking', 'Trading Account', 'Gold Bullion Vault', 'Savings Account'];

    const incomeSources = userSegments?.incomeSources || userSegments?.finance || defaultIncomeSources;
    const expenseCategories = userSegments?.expenseCategories || defaultExpenseCategories;
    const accounts = userSegments?.accounts || defaultAccounts;

    return NextResponse.json({
      accounts,
      paymentMethods: ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'InstaPay'],
      categories: [...new Set([...incomeSources, ...expenseCategories])],
      incomeSources,
      incomeStatuses: ['Received', 'Pending', 'Expected'],
      expenseCategories,
      expenseStatuses: ['Paid', 'Pending']
    });
  } catch (err) {
    console.error('Error fetching finance meta:', err);
    return NextResponse.json({ error: 'Could not load finance meta' }, { status: 500 });
  }
}
