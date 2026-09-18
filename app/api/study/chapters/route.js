import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return errorResponse('Subject ID is required', 400);
    }

    const chapters = await prisma.studyChapter.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' }
    });

    return successResponse(chapters);
  } catch (err) {
    console.error('Error in GET /api/study/chapters:', err);
    return errorResponse('Failed to fetch chapters');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { subjectId, title, chapterNumber, notes, batchTitles } = body;

    if (!subjectId) {
      return errorResponse('Subject ID is required', 400);
    }

    const existingCount = await prisma.studyChapter.count({ where: { subjectId } });

    // Handle batch creation
    if (Array.isArray(batchTitles) && batchTitles.length > 0) {
      const created = [];
      for (let i = 0; i < batchTitles.length; i++) {
        const t = batchTitles[i].trim();
        if (t) {
          const ch = await prisma.studyChapter.create({
            data: {
              subjectId,
              title: t,
              chapterNumber: existingCount + i + 1,
              order: existingCount + i,
              status: 'NOT_STARTED'
            }
          });
          created.push(ch);
        }
      }
      return successResponse(created);
    }

    if (!title || !title.trim()) {
      return errorResponse('Chapter title is required', 400);
    }

    const chapter = await prisma.studyChapter.create({
      data: {
        subjectId,
        title: title.trim(),
        chapterNumber: chapterNumber !== undefined ? Number(chapterNumber) : existingCount + 1,
        order: existingCount,
        status: 'NOT_STARTED',
        notes: notes?.trim() || null
      }
    });

    return successResponse(chapter);
  } catch (err) {
    console.error('Error in POST /api/study/chapters:', err);
    return errorResponse('Failed to create chapter');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse('Invalid status. Must be NOT_STARTED, IN_PROGRESS, or COMPLETED', 400);
    }

    const updated = await prisma.studyChapter.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PATCH /api/study/chapters:', err);
    return errorResponse('Failed to update chapter status');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, title, chapterNumber, notes, order, status } = body;

    if (!id) {
      return errorResponse('Chapter ID is required', 400);
    }

    const updated = await prisma.studyChapter.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(chapterNumber !== undefined && { chapterNumber: Number(chapterNumber) }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(order !== undefined && { order: Number(order) }),
        ...(status && {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null
        })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/chapters:', err);
    return errorResponse('Failed to update chapter');
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
      return errorResponse('Chapter ID is required', 400);
    }

    await prisma.studyChapter.delete({ where: { id } });

    return successResponse({ success: true, message: 'Chapter deleted' });
  } catch (err) {
    console.error('Error in DELETE /api/study/chapters:', err);
    return errorResponse('Failed to delete chapter');
  }
}
