import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ date: new Date().toISOString().split('T')[0], tasks: [] });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const completed = searchParams.get('completed');

    const where = { userId };
    if (category) where.category = category;
    if (date) where.date = date;
    if (completed !== null && completed !== undefined) where.completed = completed === 'true';

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
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('User workspace not found.', 401);

    const body = await req.json();
    const title = body.title || body.task;
    const date = body.date || body.dueDate || new Date().toISOString().split('T')[0];
    const { category, segment, completed, timeBlock, priority } = body;

    if (!title || !title.trim()) {
      return errorResponse('Title is required.', 400);
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        category: category || 'Work',
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
