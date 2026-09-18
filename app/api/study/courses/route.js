import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = { userId: auth.userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const courses = await prisma.studyCourse.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const enriched = courses.map(c => {
      const total = c.totalLessons || c.totalModules || 0;
      const completed = c.completedLessons || c.completedModules || 0;
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : (c.status === 'COMPLETED' ? 100 : 0);

      return {
        ...c,
        progressPct
      };
    });

    return successResponse(enriched);
  } catch (err) {
    console.error('Error in GET /api/study/courses:', err);
    return errorResponse('Failed to fetch courses');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { name, provider, instructor, category, color, icon, startDate, endDate, status, totalModules, totalLessons, modules, notes, linkUrl } = body;

    if (!name || !name.trim()) {
      return errorResponse('Course name is required', 400);
    }

    const course = await prisma.studyCourse.create({
      data: {
        userId: auth.userId,
        name: name.trim(),
        provider: provider?.trim() || null,
        instructor: instructor?.trim() || null,
        category: category || 'General',
        color: color || 'peach',
        icon: icon || 'laptop',
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'IN_PROGRESS',
        totalModules: totalModules ? Number(totalModules) : 0,
        completedModules: 0,
        totalLessons: totalLessons ? Number(totalLessons) : (totalModules ? Number(totalModules) : 0),
        completedLessons: 0,
        modules: modules || null,
        notes: notes?.trim() || null,
        linkUrl: linkUrl?.trim() || null
      }
    });

    return successResponse(course);
  } catch (err) {
    console.error('Error in POST /api/study/courses:', err);
    return errorResponse('Failed to create course');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, completedLessons, completedModules, status, modules } = body;

    if (!id) {
      return errorResponse('Course ID is required', 400);
    }

    const updated = await prisma.studyCourse.update({
      where: { id },
      data: {
        ...(completedLessons !== undefined && { completedLessons: Number(completedLessons) }),
        ...(completedModules !== undefined && { completedModules: Number(completedModules) }),
        ...(status && { status }),
        ...(modules !== undefined && { modules })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PATCH /api/study/courses:', err);
    return errorResponse('Failed to update course progress');
  }
}

export async function PUT(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { id, name, provider, instructor, category, color, icon, startDate, endDate, status, totalModules, completedModules, totalLessons, completedLessons, modules, notes, linkUrl } = body;

    if (!id) {
      return errorResponse('Course ID is required', 400);
    }

    const updated = await prisma.studyCourse.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(provider !== undefined && { provider: provider?.trim() || null }),
        ...(instructor !== undefined && { instructor: instructor?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(startDate !== undefined && { startDate: startDate || null }),
        ...(endDate !== undefined && { endDate: endDate || null }),
        ...(status && { status }),
        ...(totalModules !== undefined && { totalModules: Number(totalModules) }),
        ...(completedModules !== undefined && { completedModules: Number(completedModules) }),
        ...(totalLessons !== undefined && { totalLessons: Number(totalLessons) }),
        ...(completedLessons !== undefined && { completedLessons: Number(completedLessons) }),
        ...(modules !== undefined && { modules }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl?.trim() || null })
      }
    });

    return successResponse(updated);
  } catch (err) {
    console.error('Error in PUT /api/study/courses:', err);
    return errorResponse('Failed to update course');
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
      return errorResponse('Course ID is required', 400);
    }

    await prisma.studyCourse.delete({ where: { id } });

    return successResponse({ success: true, message: 'Course removed' });
  } catch (err) {
    console.error('Error in DELETE /api/study/courses:', err);
    return errorResponse('Failed to delete course');
  }
}
