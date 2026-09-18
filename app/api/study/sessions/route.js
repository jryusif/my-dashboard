import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const sessions = await prisma.studySession.findMany({
      where: { userId: auth.userId },
      include: {
        subject: {
          select: { id: true, name: true, color: true, icon: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    });

    // Compute comprehensive analytics
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate dates for this week and month
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = (day + 1) % 7; // Saturday week start
    startOfWeek.setDate(now.getDate() - diff);
    const weekStartStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = startOfMonth.toISOString().split('T')[0];

    let totalMinutes = 0;
    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    const subjectDistribution = {};

    sessions.forEach(s => {
      const mins = s.durationMinutes || 0;
      totalMinutes += mins;

      if (s.date === todayStr) todayMinutes += mins;
      if (s.date >= weekStartStr) weekMinutes += mins;
      if (s.date >= monthStartStr) monthMinutes += mins;

      const subName = s.subject?.name || 'General Study';
      subjectDistribution[subName] = (subjectDistribution[subName] || 0) + mins;
    });

    // Calculate study streak
    // Distinct study dates sorted descending
    const dateSet = new Set(sessions.map(s => s.date));
    let streak = 0;
    let checkDate = new Date();

    // If no session today, check if streak holds from yesterday
    const todayHasSession = dateSet.has(todayStr);
    if (!todayHasSession) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return successResponse({
      sessions,
      analytics: {
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(1),
        todayMinutes,
        todayHours: (todayMinutes / 60).toFixed(1),
        weekMinutes,
        weekHours: (weekMinutes / 60).toFixed(1),
        monthMinutes,
        monthHours: (monthMinutes / 60).toFixed(1),
        streak,
        subjectDistribution
      }
    });
  } catch (err) {
    console.error('Error in GET /api/study/sessions:', err);
    return errorResponse('Failed to fetch study sessions');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { subjectId, courseId, date, durationMinutes, type, notes } = body;

    if (!durationMinutes || Number(durationMinutes) <= 0) {
      return errorResponse('Valid duration in minutes is required', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const session = await prisma.studySession.create({
      data: {
        userId: auth.userId,
        subjectId: subjectId || null,
        courseId: courseId || null,
        date: date || todayStr,
        durationMinutes: Number(durationMinutes),
        type: type || 'Revision',
        notes: notes?.trim() || null
      },
      include: {
        subject: { select: { id: true, name: true, color: true } }
      }
    });

    return successResponse(session);
  } catch (err) {
    console.error('Error in POST /api/study/sessions:', err);
    return errorResponse('Failed to log study session');
  }
}

export async function DELETE(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Session ID is required', 400);
    }

    await prisma.studySession.delete({ where: { id } });

    return successResponse({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error('Error in DELETE /api/study/sessions:', err);
    return errorResponse('Failed to delete session');
  }
}
