import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';
import { calculateGoalFunding, matchAllocationForGoal } from '@/lib/goal-funding.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const goals = await prisma.financialGoal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    });

    const setting = await prisma.financialSetting.findUnique({
      where: { userId: auth.userId }
    });

    let userAllocations = setting?.allocations;
    if (typeof userAllocations === 'string') {
      try { userAllocations = JSON.parse(userAllocations); } catch {}
    }

    const regularIncomeTx = await prisma.financialTransaction.findMany({
      where: {
        userId: auth.userId,
        type: 'income',
        NOT: { category: 'Saved Cash Baseline' }
      },
      select: {
        id: true,
        amount: true,
        date: true,
        category: true,
        description: true,
        account: true,
        type: true
      },
      orderBy: { date: 'desc' }
    });

    // Detect user's baseline saved cash / starting wealth
    const cashAsset = await prisma.asset.findFirst({
      where: { userId: auth.userId, type: 'Cash' }
    });
    let savedCashBaseline = cashAsset?.purchasePrice || 0;
    if (savedCashBaseline === 0) {
      const baselineTx = await prisma.financialTransaction.findFirst({
        where: {
          userId: auth.userId,
          OR: [
            { category: 'Saved Cash Baseline' },
            { description: { contains: 'Saved Cash Reserve' } }
          ]
        }
      });
      if (baselineTx) savedCashBaseline = baselineTx.amount || 0;
    }

    // Collect available distinct sources for quick frontend filter chips
    const sourceSet = new Set();
    regularIncomeTx.forEach(t => {
      if (t.category && t.category.trim()) sourceSet.add(t.category.trim());
      if (t.description && t.description.trim()) sourceSet.add(t.description.trim());
    });
    const availableSources = Array.from(sourceSet);

    // Collect available months from transactions
    const monthSet = new Set();
    regularIncomeTx.forEach(t => {
      if (t.date) {
        const dStr = typeof t.date === 'string' ? t.date : t.date.toISOString();
        monthSet.add(dStr.slice(0, 7));
      }
    });
    const availableMonths = Array.from(monthSet).sort().reverse();

    const enrichedGoals = goals.map(g => {
      const fundingResult = calculateGoalFunding(g, regularIncomeTx, savedCashBaseline, userAllocations);

      if (g.currentAmount !== fundingResult.effectiveCurrent && fundingResult.isAutoAllocated) {
        prisma.financialGoal.update({
          where: { id: g.id },
          data: { currentAmount: fundingResult.effectiveCurrent }
        }).catch(() => {});
      }

      return {
        ...g,
        currentAmount: fundingResult.effectiveCurrent,
        isAutoAllocated: fundingResult.isAutoAllocated,
        allocPct: fundingResult.allocPct,
        startMonth: fundingResult.startMonth,
        sourceMode: fundingResult.sourceMode,
        specificSources: fundingResult.specificSources,
        includeSavedCash: fundingResult.includeSavedCash,
        savedCashContribution: fundingResult.savedCashContribution,
        customStartingCapital: fundingResult.customStartingCapital,
        incomeContribution: fundingResult.incomeContribution,
        autoTotal: fundingResult.autoTotal,
        matchedTxCount: fundingResult.matchedTxCount,
        fundingConfig: fundingResult.fundingConfig
      };
    });

    return successResponse({
      goals: enrichedGoals,
      availableSources,
      availableMonths,
      savedCashBaseline
    });
  } catch (err) {
    console.error('Fetch goals error:', err);
    return errorResponse('Failed to fetch financial goals.');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { title, targetAmount, currentAmount, deadline, fundingConfig } = body;

    if (!title || !targetAmount) {
      return errorResponse('Title and target amount are required.', 400);
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        targetAmount: parseFloat(targetAmount) || 0,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        fundingConfig: fundingConfig || null
      }
    });

    return successResponse({ goal, message: 'Financial goal created successfully!' }, 201);
  } catch (err) {
    console.error('Create goal error:', err);
    return errorResponse('Failed to create financial goal.');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { id, title, targetAmount, currentAmount, deadline, fundingConfig } = body;

    if (!id) return errorResponse('Goal ID is required.', 400);

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (targetAmount !== undefined) dataToUpdate.targetAmount = parseFloat(targetAmount) || 0;
    if (currentAmount !== undefined) dataToUpdate.currentAmount = parseFloat(currentAmount) || 0;
    if (deadline !== undefined) dataToUpdate.deadline = deadline;
    if (fundingConfig !== undefined) dataToUpdate.fundingConfig = fundingConfig;

    await prisma.financialGoal.updateMany({
      where: { id, userId: auth.userId },
      data: dataToUpdate
    });

    return successResponse({ message: 'Financial goal updated successfully!' });
  } catch (err) {
    console.error('Update goal error:', err);
    return errorResponse('Failed to update financial goal.');
  }
}

export async function DELETE(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('Goal ID is required.', 400);

    await prisma.financialGoal.deleteMany({
      where: { id, userId: auth.userId }
    });

    return successResponse({ message: 'Financial goal deleted successfully.' });
  } catch (err) {
    console.error('Delete goal error:', err);
    return errorResponse('Failed to delete financial goal.');
  }
}
