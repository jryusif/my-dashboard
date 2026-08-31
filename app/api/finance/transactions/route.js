import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const body = await req.json();
    const { type, category, amount, date, description, account } = body;

    if (!amount || isNaN(amount)) {
      return errorResponse('Valid amount is required.', 400);
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        userId: auth.userId,
        type: type === 'expense' ? 'expense' : 'income',
        category: category || 'General',
        amount: Math.abs(parseFloat(amount)),
        date: date || new Date().toISOString().split('T')[0],
        description: description || null,
        account: account || null
      }
    });

    return successResponse(transaction, 201);
  } catch (err) {
    console.error('Error creating transaction:', err);
    return errorResponse('Could not create transaction.');
  }
}
