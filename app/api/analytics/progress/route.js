import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const tasks = await prisma.task.findMany({
      where: { userId: auth.userId }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const catMap = {};
    for (const t of tasks) {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, completed: 0 };
      catMap[t.category].total++;
      if (t.completed) catMap[t.category].completed++;
    }

    const categoryBreakdown = Object.entries(catMap).map(([category, stats]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));

    return successResponse({
      overall: {
        totalTasks,
        completedTasks,
        completionRate: overallRate
      },
      categoryBreakdown
    });
  } catch (err) {
    console.error('Error computing analytics progress:', err);
    return errorResponse('Could not compute progress analytics.');
  }
}
