import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return errorResponse('Unauthorized', 401);

    const goals = await prisma.financialGoal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse({ goals });
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
