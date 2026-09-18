import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const [goals, exams] = await Promise.all([
      prisma.studyGoal.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.studyExam.findMany({
        where: { userId: auth.userId },
        include: {
          subject: { select: { id: true, name: true, color: true, code: true } }
        },
        orderBy: { date: 'asc' }
      })
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingExams = exams.filter(e => e.date >= todayStr);

    return successResponse({
      goals,
      exams,
      upcomingExams
    });
  } catch (err) {
    console.error('Error in GET /api/study/goals:', err);
    return errorResponse('Failed to fetch study goals and exams');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { isExam, title, timeframe, targetDate, subjectId, date, time, location, weightPct, notes } = body;

    if (!title || !title.trim()) {
      return errorResponse('Title is required', 400);
    }

    if (isExam) {
      if (!date) return errorResponse('Exam date is required', 400);
      const exam = await prisma.studyExam.create({
        data: {
          userId: auth.userId,
          title: title.trim(),
          subjectId: subjectId || null,
          date,
          time: time || null,
          location: location?.trim() || null,
          weightPct: weightPct ? parseFloat(weightPct) : null,
          notes: notes?.trim() || null
        },
        include: {
          subject: { select: { id: true, name: true, color: true } }
        }
      });
      return successResponse({ type: 'exam', data: exam });
    } else {
      const goal = await prisma.studyGoal.create({
        data: {
          userId: auth.userId,
          title: title.trim(),
          timeframe: timeframe || 'WEEKLY',
          targetDate: targetDate || null,
          completed: false
        }
      });
      return successResponse({ type: 'goal', data: goal });
    }
  } catch (err) {
    console.error('Error in POST /api/study/goals:', err);
    return errorResponse('Failed to create goal or exam');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, completed } = body;

    if (!id) {
      return errorResponse('Goal ID is required', 400);
    }

    const updated = await prisma.studyGoal.update({
      where: { id },
      data: { completed: Boolean(completed) }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PATCH /api/study/goals:', err);
    return errorResponse('Failed to toggle goal');
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
    const type = searchParams.get('type'); // 'exam' or 'goal'

    if (!id) {
      return errorResponse('ID is required', 400);
    }

    if (type === 'exam') {
      await prisma.studyExam.delete({ where: { id } });
    } else {
      await prisma.studyGoal.delete({ where: { id } });
    }

    return successResponse({ success: true, message: 'Item deleted' });
  } catch (err) {
    console.error('Error in DELETE /api/study/goals:', err);
    return errorResponse('Failed to delete item');
  }
}
