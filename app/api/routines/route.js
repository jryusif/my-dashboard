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
    if (!userId) return successResponse({ morning: [], evening: [] });

    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const routines = await prisma.routine.findMany({
      where: { userId, active: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }]
    });

    const logs = await prisma.routineLog.findMany({
      where: { userId, date: targetDate }
    });

    const completedIds = new Set(logs.filter(l => l.completed).map(l => l.routineId));

    const morning = routines
      .filter(r => r.type === 'morning')
      .map(r => ({ ...r, completed: completedIds.has(r.id) }));

    const evening = routines
      .filter(r => r.type === 'evening')
      .map(r => ({ ...r, completed: completedIds.has(r.id) }));

    return successResponse({ morning, evening });
  } catch (err) {
    console.error('Error fetching routines:', err);
    return errorResponse('Could not fetch routines.');
  }
}

export async function POST(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { title, type, time } = body;
    if (!title || !title.trim()) return errorResponse('Title is required.', 400);

    const routine = await prisma.routine.create({
      data: {
        userId,
        title: title.trim(),
        type: type === 'evening' ? 'evening' : 'morning',
        time: time || null
      }
    });

    return successResponse(routine, 201);
  } catch (err) {
    console.error('Error creating routine:', err);
    return errorResponse('Could not create routine.');
  }
}
