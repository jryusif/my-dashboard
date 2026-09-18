import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where = { userId: auth.userId };
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;

    const resources = await prisma.studyResource.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    const enriched = resources.map(r => {
      let progressPct = 0;
      if (r.totalPages && r.totalPages > 0) {
        progressPct = Math.min(100, Math.round(((r.currentPage || 0) / r.totalPages) * 100));
      } else if (r.status === 'COMPLETED') {
        progressPct = 100;
      }

      return {
        ...r,
        progressPct
      };
    });

    return successResponse(enriched);
  } catch (err) {
    console.error('Error in GET /api/study/resources:', err);
    return errorResponse('Failed to fetch study resources');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { title, author, type, category, color, totalPages, currentPage, status, linkUrl, notes, subjectId } = body;

    if (!title || !title.trim()) {
      return errorResponse('Resource title is required', 400);
    }

    const resource = await prisma.studyResource.create({
      data: {
        userId: auth.userId,
        title: title.trim(),
        author: author?.trim() || null,
        type: type || 'BOOK',
        category: category || 'General',
        color: color || 'mint',
        totalPages: totalPages ? Number(totalPages) : null,
        currentPage: currentPage !== undefined ? Number(currentPage) : 0,
        status: status || 'READING',
        linkUrl: linkUrl?.trim() || null,
        notes: notes?.trim() || null,
        subjectId: subjectId || null
      }
    });

    return successResponse(resource);
  } catch (err) {
    console.error('Error in POST /api/study/resources:', err);
    return errorResponse('Failed to create resource');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, currentPage, status, deltaPages } = body;

    if (!id) {
      return errorResponse('Resource ID is required', 400);
    }

    const existing = await prisma.studyResource.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Resource not found', 404);
    }

    let newPage = existing.currentPage || 0;
    if (deltaPages !== undefined) {
      newPage = Math.max(0, newPage + Number(deltaPages));
      if (existing.totalPages && newPage > existing.totalPages) {
        newPage = existing.totalPages;
      }
    } else if (currentPage !== undefined) {
      newPage = Math.max(0, Number(currentPage));
    }

    let newStatus = status || existing.status;
    if (existing.totalPages && newPage >= existing.totalPages) {
      newStatus = 'COMPLETED';
    }

    const updated = await prisma.studyResource.update({
      where: { id },
      data: {
        currentPage: newPage,
        status: newStatus
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PATCH /api/study/resources:', err);
    return errorResponse('Failed to update reading progress');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, title, author, type, category, color, totalPages, currentPage, status, linkUrl, notes, subjectId } = body;

    if (!id) {
      return errorResponse('Resource ID is required', 400);
    }

    const updated = await prisma.studyResource.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(author !== undefined && { author: author?.trim() || null }),
        ...(type && { type }),
        ...(category !== undefined && { category }),
        ...(color && { color }),
        ...(totalPages !== undefined && { totalPages: totalPages ? Number(totalPages) : null }),
        ...(currentPage !== undefined && { currentPage: Number(currentPage) }),
        ...(status && { status }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(subjectId !== undefined && { subjectId: subjectId || null })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/resources:', err);
    return errorResponse('Failed to update resource');
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
      return errorResponse('Resource ID is required', 400);
    }

    await prisma.studyResource.delete({ where: { id } });

    return successResponse({ success: true, message: 'Resource deleted' });
  } catch (err) {
    console.error('Error in DELETE /api/study/resources:', err);
    return errorResponse('Failed to delete resource');
  }
}
