import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserAndPerms(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, role: true, dentalApproved: true, tradingApproved: true }
    });
    return user;
  }
  return null;
}

export async function GET(req) {
  try {
    const user = await resolveUserAndPerms(req);
    if (!user) return successResponse({ date: new Date().toISOString().split('T')[0], tasks: [] });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const completed = searchParams.get('completed');

    const isMasterAdmin = user.role === 'ADMIN';

    // If querying locked category directly as regular user, return empty list
    if (category) {
      if ((category === 'Us stocks trading' || category === 'Trading') && !isMasterAdmin && !user.tradingApproved) {
        return successResponse({ date: date || new Date().toISOString().split('T')[0], tasks: [] });
      }
      if (category === 'Dental Cases' && !isMasterAdmin && !user.dentalApproved) {
        return successResponse({ date: date || new Date().toISOString().split('T')[0], tasks: [] });
      }
    }

    const where = { userId: user.id };
    if (category) where.category = category;
    if (date) where.date = date;
    if (completed !== null && completed !== undefined) where.completed = completed === 'true';

    // If general query without category filter, exclude locked categories for non-admin
    if (!category && !isMasterAdmin) {
      const notInList = [];
      if (!user.tradingApproved) notInList.push('Us stocks trading', 'Trading');
      if (!user.dentalApproved) notInList.push('Dental Cases');
      if (notInList.length > 0) {
        where.category = { notIn: notInList };
      }
    }

    const rawTasks = await prisma.task.findMany({
      where,
      orderBy: [{ date: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }]
    });

    const tasks = rawTasks.map(t => ({
      id: t.id,
      task: t.title,
      title: t.title,
      category: t.category,
      segment: t.segment,
      priority: t.priority || 'Medium',
      dueDate: t.date,
      date: t.date,
      completed: t.completed,
      timeBlock: t.timeBlock
    }));

    return successResponse({
      date: date || new Date().toISOString().split('T')[0],
      tasks
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return errorResponse('Could not fetch tasks.');
  }
}

export async function POST(req) {
  try {
    const user = await resolveUserAndPerms(req);
    if (!user) return errorResponse('User workspace not found.', 401);

    const body = await req.json();
    const title = body.title || body.task;
    const date = body.date || body.dueDate || new Date().toISOString().split('T')[0];
    const { category = 'Work', segment, completed, timeBlock, priority } = body;

    const isMasterAdmin = user.role === 'ADMIN';

    if ((category === 'Us stocks trading' || category === 'Trading') && !isMasterAdmin && !user.tradingApproved) {
      return errorResponse('US Stocks Trading access is locked by your Administrator.', 403);
    }
    if (category === 'Dental Cases' && !isMasterAdmin && !user.dentalApproved) {
      return errorResponse('Dental Cases access is locked by your Administrator.', 403);
    }

    if (!title || !title.trim()) {
      return errorResponse('Title is required.', 400);
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        category,
        segment: segment || null,
        date,
        completed: Boolean(completed),
        timeBlock: timeBlock || null
      }
    });

    return successResponse({
      id: task.id,
      task: task.title,
      title: task.title,
      category: task.category,
      segment: task.segment,
      priority: priority || 'Medium',
      dueDate: task.date,
      date: task.date,
      completed: task.completed,
      timeBlock: task.timeBlock
    }, 201);
  } catch (err) {
    console.error('Error creating task:', err);
    return errorResponse('Could not create task.');
  }
}
