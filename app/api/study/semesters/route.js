import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const semesters = await prisma.studySemester.findMany({
      where: { userId: auth.userId },
      include: {
        subjects: {
          include: {
            chapters: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Auto-detect active semester based on dates if none explicitly marked
    const enriched = semesters.map(s => {
      let totalChapters = 0;
      let completedChapters = 0;

      s.subjects.forEach(sub => {
        totalChapters += sub.chapters.length;
        completedChapters += sub.chapters.filter(c => c.status === 'COMPLETED').length;
      });

      const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
      const isDateActive = s.startDate && s.endDate && todayStr >= s.startDate && todayStr <= s.endDate;

      return {
        id: s.id,
        name: s.name,
        academicYear: s.academicYear,
        startDate: s.startDate,
        endDate: s.endDate,
        examStartDate: s.examStartDate,
        examEndDate: s.examEndDate,
        isCurrent: s.isCurrent || Boolean(isDateActive),
        subjectCount: s.subjects.length,
        totalChapters,
        completedChapters,
        progressPct,
        createdAt: s.createdAt
      };
    });

    return successResponse(enriched);
  } catch (err) {
    console.error('Error in GET /api/study/semesters:', err);
    return errorResponse('Failed to fetch semesters');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { name, academicYear, startDate, endDate, examStartDate, examEndDate, isCurrent } = body;

    if (!name) {
      return errorResponse('Semester name is required (e.g. Semester 1, Semester 2)', 400);
    }

    if (isCurrent) {
      await prisma.studySemester.updateMany({
        where: { userId: auth.userId },
        data: { isCurrent: false }
      });
    }

    const semester = await prisma.studySemester.create({
      data: {
        userId: auth.userId,
        name,
        academicYear: academicYear || '2026-2027',
        startDate,
        endDate,
        examStartDate,
        examEndDate,
        isCurrent: Boolean(isCurrent)
      }
    });

    // Also update activeSemesterId in StudyProfile if marked current
    if (isCurrent) {
      await prisma.studyProfile.upsert({
        where: { userId: auth.userId },
        update: { activeSemesterId: semester.id },
        create: { userId: auth.userId, activeSemesterId: semester.id }
      });
    }

    return successResponse(semester);
  } catch (err) {
    console.error('Error in POST /api/study/semesters:', err);
    return errorResponse('Failed to create semester');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, name, academicYear, startDate, endDate, examStartDate, examEndDate, isCurrent } = body;

    if (!id) {
      return errorResponse('Semester ID is required', 400);
    }

    if (isCurrent) {
      await prisma.studySemester.updateMany({
        where: { userId: auth.userId },
        data: { isCurrent: false }
      });
    }

    const updated = await prisma.studySemester.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(academicYear !== undefined && { academicYear }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(examStartDate !== undefined && { examStartDate }),
        ...(examEndDate !== undefined && { examEndDate }),
        ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/semesters:', err);
    return errorResponse('Failed to update semester');
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
      return errorResponse('Semester ID is required', 400);
    }

    await prisma.studySemester.delete({
      where: { id }
    });

    return successResponse({ success: true, message: 'Semester deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/study/semesters:', err);
    return errorResponse('Failed to delete semester');
  }
}
