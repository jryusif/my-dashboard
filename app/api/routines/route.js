import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ morning: [], evening: [], items: [] });

    const { searchParams } = new URL(req.url);
    const slot = searchParams.get('slot'); // 'Morning' | 'Evening'
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const routines = await prisma.routine.findMany({
      where: { userId, active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    const logs = await prisma.routineLog.findMany({
      where: { userId, date: targetDate }
    });

    const completedIds = new Set(logs.filter(l => l.completed).map(l => l.routineId));

    const formattedRoutines = routines.map(r => ({
      id: r.id,
      name: r.title,
      title: r.title,
      slot: r.type === 'evening' ? 'Evening' : 'Morning',
      type: r.type,
      time: r.time,
      completed: completedIds.has(r.id)
    }));

    if (slot) {
      const slotLower = slot.toLowerCase();
      const filtered = formattedRoutines.filter(r => r.type === slotLower || r.slot.toLowerCase() === slotLower);
      return successResponse({ items: filtered, count: filtered.length });
    }

    const morning = formattedRoutines.filter(r => r.type === 'morning');
    const evening = formattedRoutines.filter(r => r.type === 'evening');

    return successResponse({ morning, evening, items: formattedRoutines });
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
    const title = body.name || body.title;
    const slot = (body.slot || body.type || 'morning').toLowerCase();
    const type = slot.includes('evening') || slot.includes('night') ? 'evening' : 'morning';

    if (!title || !title.trim()) return errorResponse('Title is required.', 400);

    const routine = await prisma.routine.create({
      data: {
        userId,
        title: title.trim(),
        type,
        time: body.time || null
      }
    });

    return successResponse({
      id: routine.id,
      name: routine.title,
      title: routine.title,
      slot: routine.type === 'evening' ? 'Evening' : 'Morning',
      type: routine.type,
      completed: false
    }, 201);
  } catch (err) {
    console.error('Error creating routine:', err);
    return errorResponse('Could not create routine.');
  }
}
