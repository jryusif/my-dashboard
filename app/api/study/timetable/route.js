import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

const DAYS_ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to get dates for current week starting from Saturday (standard academic/regional week) or Monday
function getWeekDates(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  // Saturday offset: (day + 1) % 7
  const diffToSaturday = (day + 1) % 7;
  const saturday = new Date(d);
  saturday.setDate(d.getDate() - diffToSaturday);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(saturday);
    cur.setDate(saturday.getDate() + i);
    const dateStr = cur.toISOString().split('T')[0];
    const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
    week.push({ date: dateStr, dayName });
  }
  return week;
}

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const targetDateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch recurring slots
    const slots = await prisma.studyTimetableSlot.findMany({
      where: { userId: auth.userId, active: true },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true, icon: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Check active semester date boundaries
    const activeSemester = await prisma.studySemester.findFirst({
      where: { userId: auth.userId, isCurrent: true }
    });

    const weekDates = getWeekDates(new Date(targetDateStr));
    const weekStart = weekDates[0].date;
    const weekEnd = weekDates[6].date;

    // Check which dates fall within active semester if dates are set
    const isDateWithinSemester = (dateStr) => {
      if (!activeSemester || !activeSemester.startDate || !activeSemester.endDate) return true;
      return dateStr >= activeSemester.startDate && dateStr <= activeSemester.endDate;
    };

    // Fetch completion records for this week's occurrences
    const weekLectures = await prisma.studyLecture.findMany({
      where: {
        userId: auth.userId,
        date: { gte: weekStart, lte: weekEnd }
      }
    });

    const completionMap = {};
    weekLectures.forEach(l => {
      if (l.timetableSlotId) {
        completionMap[`${l.timetableSlotId}_${l.date}`] = {
          completed: l.completed,
          lectureId: l.id
        };
      }
    });

    // Generate week occurrences
    const scheduleByDay = {};
    DAYS_ORDER.forEach(d => { scheduleByDay[d] = []; });

    weekDates.forEach(({ date, dayName }) => {
      const daySlots = slots.filter(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());
      const inSemester = isDateWithinSemester(date);

      daySlots.forEach(slot => {
        const key = `${slot.id}_${date}`;
        const record = completionMap[key];

        scheduleByDay[dayName].push({
          slotId: slot.id,
          lectureId: record?.lectureId || null,
          date,
          dayOfWeek: dayName,
          title: slot.title || (slot.subject ? `${slot.subject.name} ${slot.type}` : 'Class Session'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: slot.type,
          instructor: slot.instructor,
          location: slot.location,
          subjectId: slot.subjectId,
          subjectName: slot.subject?.name || 'General',
          subjectCode: slot.subject?.code || '',
          color: slot.color || slot.subject?.color || 'amber',
          icon: slot.subject?.icon || 'book',
          completed: Boolean(record?.completed),
          isInSemester: inSemester
        });
      });
    });

    return successResponse({
      slots,
      weekDates,
      scheduleByDay,
      activeSemester
    });
  } catch (err) {
    console.error('Error in GET /api/study/timetable:', err);
    return errorResponse('Failed to fetch timetable');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { subjectId, title, dayOfWeek, startTime, endTime, type, instructor, location, color } = body;

    if (!dayOfWeek || !startTime || !endTime) {
      return errorResponse('Day of week, start time, and end time are required', 400);
    }

    let finalTitle = title?.trim();
    if (!finalTitle && subjectId) {
      const sub = await prisma.studySubject.findUnique({ where: { id: subjectId }, select: { name: true } });
      finalTitle = `${sub?.name || 'Class'} ${type || 'Lecture'}`;
    }

    const slot = await prisma.studyTimetableSlot.create({
      data: {
        userId: auth.userId,
        subjectId: subjectId || null,
        title: finalTitle || 'Weekly Class',
        dayOfWeek,
        startTime,
        endTime,
        type: type || 'Lecture',
        instructor: instructor?.trim() || null,
        location: location?.trim() || null,
        color: color || null
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } }
      }
    });

    return successResponse(slot);
  } catch (err) {
    console.error('Error in POST /api/study/timetable:', err);
    return errorResponse('Failed to create timetable slot');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, subjectId, title, dayOfWeek, startTime, endTime, type, instructor, location, color, active } = body;

    if (!id) {
      return errorResponse('Timetable slot ID is required', 400);
    }

    const updated = await prisma.studyTimetableSlot.update({
      where: { id },
      data: {
        ...(subjectId !== undefined && { subjectId: subjectId || null }),
        ...(title && { title: title.trim() }),
        ...(dayOfWeek && { dayOfWeek }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(type && { type }),
        ...(instructor !== undefined && { instructor: instructor?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(color !== undefined && { color }),
        ...(active !== undefined && { active: Boolean(active) })
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } }
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/timetable:', err);
    return errorResponse('Failed to update timetable slot');
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
      return errorResponse('Timetable slot ID is required', 400);
    }

    await prisma.studyTimetableSlot.delete({ where: { id } });

    return successResponse({ success: true, message: 'Timetable slot removed' });
  } catch (err) {
    console.error('Error in DELETE /api/study/timetable:', err);
    return errorResponse('Failed to delete timetable slot');
  }
}
