import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

function normalizeGoalName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji})\s*/u, '')
    .trim()
    .toLowerCase();
}

function matchAllocationForGoal(goalTitle, allocations) {
  if (!allocations || !Array.isArray(allocations)) return null;
  const normTitle = normalizeGoalName(goalTitle);
  if (!normTitle) return null;

  // Exact match
  let match = allocations.find(a => normalizeGoalName(a.name) === normTitle);
  if (match) return match;

  // Partial match
  match = allocations.find(a => {
    const normAlloc = normalizeGoalName(a.name);
    if (!normAlloc || normAlloc.length < 3) return false;
    return normTitle.includes(normAlloc) || normAlloc.includes(normTitle);
  });
  return match || null;
}

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
      select: { amount: true }
    });
    const allRegularIncome = regularIncomeTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    const enrichedGoals = goals.map(g => {
      const match = matchAllocationForGoal(g.title, userAllocations);
      let allocPct = 0;
      let isAutoAllocated = false;
      let effectiveCurrent = g.currentAmount || 0;

      if (match && parseFloat(match.pct) > 0) {
        allocPct = parseFloat(match.pct);
        isAutoAllocated = true;
        const autoAmount = Math.round(allRegularIncome * (allocPct / 100));
        effectiveCurrent = Math.max(effectiveCurrent, autoAmount);

        if (g.currentAmount !== effectiveCurrent) {
          prisma.financialGoal.update({
            where: { id: g.id },
            data: { currentAmount: effectiveCurrent }
          }).catch(() => {});
        }
      }

      return {
        ...g,
        currentAmount: effectiveCurrent,
        isAutoAllocated,
        allocPct
      };
    });

    return successResponse({ goals: enrichedGoals });
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
    const { title, targetAmount, currentAmount, deadline } = body;

    if (!title || !targetAmount) {
      return errorResponse('Title and target amount are required.', 400);
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        targetAmount: parseFloat(targetAmount) || 0,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null
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
    const { id, title, targetAmount, currentAmount, deadline } = body;

    if (!id) return errorResponse('Goal ID is required.', 400);

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (targetAmount !== undefined) dataToUpdate.targetAmount = parseFloat(targetAmount) || 0;
    if (currentAmount !== undefined) dataToUpdate.currentAmount = parseFloat(currentAmount) || 0;
    if (deadline !== undefined) dataToUpdate.deadline = deadline;

    const goal = await prisma.financialGoal.updateMany({
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
