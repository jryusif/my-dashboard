import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get('semesterId');

    const where = { userId: auth.userId };
    if (semesterId && semesterId !== 'all') {
      where.semesterId = semesterId;
    }

    const subjects = await prisma.studySubject.findMany({
      where,
      include: {
        semester: {
          select: { id: true, name: true, isCurrent: true }
        },
        chapters: {
          orderBy: { order: 'asc' }
        },
        timetableSlots: {
          where: { active: true }
        },
        lectures: {
          where: { completed: false },
          orderBy: { date: 'asc' },
          take: 3
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { order: 'asc' }
    });

    // Enrich subjects with calculated progress, next chapter, upcoming lecture
    const enriched = subjects.map(s => {
      const totalChapters = s.chapters.length;
      const completedChapters = s.chapters.filter(c => c.status === 'COMPLETED').length;
      const inProgressChapters = s.chapters.filter(c => c.status === 'IN_PROGRESS').length;
      const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

      // Find next chapter: first IN_PROGRESS or first NOT_STARTED
      const nextChapterObj = s.chapters.find(c => c.status === 'IN_PROGRESS') ||
                             s.chapters.find(c => c.status === 'NOT_STARTED') || null;

      // Find next class/lecture
      const nextLecture = s.lectures[0] || null;
      const recurringSlot = s.timetableSlots[0] || null;

      const lastActivity = s.sessions[0]
        ? `${s.sessions[0].date} (${s.sessions[0].durationMinutes}m ${s.sessions[0].type})`
        : null;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color || 'purple',
        icon: s.icon || 'book',
        category: s.category || 'Clinical',
        creditHours: s.creditHours,
        instructor: s.instructor,
        order: s.order,
        semesterId: s.semesterId,
        semesterName: s.semester?.name || 'Unassigned',
        isCurrentSemester: Boolean(s.semester?.isCurrent),
        totalChapters,
        completedChapters,
        inProgressChapters,
        progressPct,
        nextChapter: nextChapterObj ? nextChapterObj.title : (totalChapters > 0 ? 'All Completed 🎉' : 'No chapters added'),
        nextChapterId: nextChapterObj?.id || null,
        upcomingLecture: nextLecture ? `${nextLecture.title} (${nextLecture.date})` : (recurringSlot ? `Every ${recurringSlot.dayOfWeek} ${recurringSlot.startTime}` : null),
        lastActivity,
        chapters: s.chapters
      };
    });

    return successResponse(enriched);
  } catch (err) {
    console.error('Error in GET /api/study/subjects:', err);
    return errorResponse('Failed to fetch subjects');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { name, code, color, icon, category, semesterId, creditHours, instructor, order, defaultChapters } = body;

    if (!name || !name.trim()) {
      return errorResponse('Subject name is required', 400);
    }

    const count = await prisma.studySubject.count({ where: { userId: auth.userId } });

    const subject = await prisma.studySubject.create({
      data: {
        userId: auth.userId,
        name: name.trim(),
        code: code?.trim() || null,
        color: color || 'purple',
        icon: icon || 'book',
        category: category || 'General',
        semesterId: semesterId || null,
        creditHours: creditHours ? parseFloat(creditHours) : null,
        instructor: instructor?.trim() || null,
        order: order !== undefined ? Number(order) : count
      }
    });

    // Optionally create initial chapters if passed as list of titles or default number
    if (Array.isArray(defaultChapters) && defaultChapters.length > 0) {
      await prisma.studyChapter.createMany({
        data: defaultChapters.map((title, idx) => ({
          subjectId: subject.id,
          title: typeof title === 'string' ? title : `Chapter ${idx + 1}`,
          chapterNumber: idx + 1,
          order: idx,
          status: 'NOT_STARTED'
        }))
      });
    }

    return successResponse(subject);
  } catch (err) {
    console.error('Error in POST /api/study/subjects:', err);
    return errorResponse('Failed to create subject');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, name, code, color, icon, category, semesterId, creditHours, instructor, order } = body;

    if (!id) {
      return errorResponse('Subject ID is required', 400);
    }

    const updated = await prisma.studySubject.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code !== undefined && { code: code?.trim() || null }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(category !== undefined && { category }),
        ...(semesterId !== undefined && { semesterId: semesterId || null }),
        ...(creditHours !== undefined && { creditHours: creditHours ? parseFloat(creditHours) : null }),
        ...(instructor !== undefined && { instructor: instructor?.trim() || null }),
        ...(order !== undefined && { order: Number(order) })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/subjects:', err);
    return errorResponse('Failed to update subject');
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
      return errorResponse('Subject ID is required', 400);
    }

    await prisma.studySubject.delete({
      where: { id }
    });

    return successResponse({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/study/subjects:', err);
    return errorResponse('Failed to delete subject');
  }
}
