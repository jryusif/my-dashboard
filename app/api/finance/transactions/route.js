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
    if (!userId) return NextResponse.json({ transactions: [], count: 0 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'income' | 'expense' | 'all'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const month = searchParams.get('month'); // e.g. "2026-09" or "September 2026"

    const whereClause = { userId };

    if (type && type !== 'all') {
      whereClause.type = type;
    }
    if (category && category !== 'All') {
      whereClause.category = category;
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let monthPrefix = '';
    if (month) {
      if (month.includes('-')) {
        monthPrefix = month;
      } else {
        const parts = month.split(' ');
        if (parts.length === 2) {
          const mIdx = monthNames.indexOf(parts[0]);
          if (mIdx !== -1) monthPrefix = `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
        }
      }
    }

    if (monthPrefix) {
      whereClause.date = { startsWith: monthPrefix };
    }

    const allTx = await prisma.financialTransaction.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    });

    let filtered = allTx;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = allTx.filter(t => 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.account && t.account.toLowerCase().includes(q))
      );
    }

    const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      transactions: filtered,
      count: filtered.length,
      summary: {
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return NextResponse.json({ error: 'Could not fetch transactions' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, category, amount, date, description, account } = body;

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        userId,
        type: type === 'expense' ? 'expense' : 'income',
        category: category || (type === 'expense' ? 'Clinic & Dental Materials' : 'Clinical Practice'),
        amount: Math.abs(parseFloat(amount)),
        date: date || new Date().toISOString().split('T')[0],
        description: description || (type === 'expense' ? 'General Expense' : 'Income Entry'),
        account: account || 'Cash Wallet'
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return NextResponse.json({ error: 'Could not create transaction.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });

    await prisma.financialTransaction.deleteMany({
      where: { id, userId }
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return NextResponse.json({ error: 'Could not delete transaction' }, { status: 500 });
  }
}
