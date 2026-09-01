import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const setting = await prisma.financialSetting.findUnique({
      where: { userId: auth.userId }
    });

    return successResponse({
      setting: setting || {
        currency: 'USD',
        monthlyBudget: 3000,
        savingsTargetPct: 25
      }
    });
  } catch (err) {
    console.error('Fetch finance setting error:', err);
    return errorResponse('Failed to fetch financial setting.');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { monthlyBudget, savingsTargetPct, currency } = body;

    const updated = await prisma.financialSetting.upsert({
      where: { userId: auth.userId },
      update: {
        monthlyBudget: monthlyBudget !== undefined ? parseFloat(monthlyBudget) : undefined,
        savingsTargetPct: savingsTargetPct !== undefined ? parseFloat(savingsTargetPct) : undefined,
        currency: currency || undefined
      },
      create: {
        userId: auth.userId,
        monthlyBudget: parseFloat(monthlyBudget) || 3000,
        savingsTargetPct: parseFloat(savingsTargetPct) || 25,
        currency: currency || 'USD'
      }
    });

    return successResponse({
      message: 'Financial settings saved successfully!',
      setting: updated
    });
  } catch (err) {
    console.error('Update finance setting error:', err);
    return errorResponse('Failed to update financial settings.');
  }
}
