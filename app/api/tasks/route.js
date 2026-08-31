import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const date = searchParams.get('date');
    const completed = searchParams.get('completed');

    const where = { userId: auth.userId };
    if (category) where.category = category;
    if (date) where.date = date;
    if (completed !== null && completed !== undefined) where.completed = completed === 'true';

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ date: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }]
    });

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
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const body = await req.json();
    const { title, category, segment, date, completed, timeBlock } = body;

    if (!title || !title.trim()) {
      return errorResponse('Title is required.', 400);
    }

    const task = await prisma.task.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        category: category || 'Work',
        segment: segment || null,
        date: date || new Date().toISOString().split('T')[0],
        completed: Boolean(completed),
        timeBlock: timeBlock || null
      }
    });

    return successResponse(task, 201);
  } catch (err) {
    console.error('Error creating task:', err);
    return errorResponse('Could not create task.');
  }
}
