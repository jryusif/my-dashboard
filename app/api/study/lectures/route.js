import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const today = searchParams.get('today');
    const subjectId = searchParams.get('subjectId');

    const todayStr = new Date().toISOString().split('T')[0];
    const where = { userId: auth.userId };

    if (today === 'true') {
      where.date = todayStr;
    } else if (date) {
      where.date = date;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const lectures = await prisma.studyLecture.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true, icon: true }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    return successResponse(lectures);
  } catch (err) {
    console.error('Error in GET /api/study/lectures:', err);
    return errorResponse('Failed to fetch lectures');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { subjectId, timetableSlotId, title, type, date, startTime, endTime, instructor, location, notes, completed } = body;

    if (!title || !date) {
      return errorResponse('Title and date are required', 400);
    }

    const lecture = await prisma.studyLecture.create({
      data: {
        userId: auth.userId,
        subjectId: subjectId || null,
        timetableSlotId: timetableSlotId || null,
        title: title.trim(),
        type: type || 'Lecture',
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        instructor: instructor?.trim() || null,
        location: location?.trim() || null,
        notes: notes?.trim() || null,
        completed: Boolean(completed)
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } }
      }
    });

    return successResponse(lecture);
  } catch (err) {
    console.error('Error in POST /api/study/lectures:', err);
    return errorResponse('Failed to create lecture');
  }
}

// 1-Click completion toggle (handles both explicit StudyLecture entries and recurring timetable occurrences)
export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { lectureId, slotId, date, completed, title, subjectId, type, startTime, endTime } = body;

    // Case 1: Existing lecture record ID provided
    if (lectureId) {
      const updated = await prisma.studyLecture.update({
        where: { id: lectureId },
        data: { completed: Boolean(completed) }
      });
      return successResponse(updated);
    }

    // Case 2: Recurring slot occurrence toggled for a specific date
    if (slotId && date) {
      // Find or create the occurrence record
      let lecture = await prisma.studyLecture.findFirst({
        where: {
          userId: auth.userId,
          timetableSlotId: slotId,
          date
        }
      });

      if (lecture) {
        lecture = await prisma.studyLecture.update({
          where: { id: lecture.id },
          data: { completed: Boolean(completed) }
        });
      } else {
        lecture = await prisma.studyLecture.create({
          data: {
            userId: auth.userId,
            timetableSlotId: slotId,
            subjectId: subjectId || null,
            title: title || 'Class Session',
            type: type || 'Lecture',
            date,
            startTime: startTime || null,
            endTime: endTime || null,
            completed: Boolean(completed)
          }
        });
      }

      return successResponse(lecture);
    }

    return errorResponse('Either lectureId or slotId + date must be provided', 400);
  } catch (err) {
    console.error('Error in PATCH /api/study/lectures:', err);
    return errorResponse('Failed to update lecture status');
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
      return errorResponse('Lecture ID is required', 400);
    }

    await prisma.studyLecture.delete({ where: { id } });

    return successResponse({ success: true, message: 'Lecture deleted' });
  } catch (err) {
    console.error('Error in DELETE /api/study/lectures:', err);
    return errorResponse('Failed to delete lecture');
  }
}
