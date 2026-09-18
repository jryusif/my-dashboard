import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    let profile = await prisma.studyProfile.findUnique({
      where: { userId: auth.userId }
    });

    if (!profile) {
      // Find if user already has a persona (e.g. STUDENT, DOCTOR) to set sensible defaults
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { persona: true, specialty: true }
      });

      const defaultMode = user?.persona === 'DOCTOR' ? 'PROFESSIONAL' : 'STUDENT';
      profile = await prisma.studyProfile.create({
        data: {
          userId: auth.userId,
          mode: defaultMode,
          program: user?.specialty || (defaultMode === 'STUDENT' ? 'Faculty of Dentistry' : 'Clinical Practice'),
          academicYear: '2026-2027',
          yearLevel: defaultMode === 'STUDENT' ? 'Year 4' : 'Specialist',
          targetWeeklyHours: 15
        }
      });
    }

    // Also get active semester if any
    const activeSemester = await prisma.studySemester.findFirst({
      where: {
        userId: auth.userId,
        isCurrent: true
      }
    });

    return successResponse({
      profile,
      activeSemester
    });
  } catch (err) {
    console.error('Error in GET /api/study/profile:', err);
    return errorResponse('Failed to fetch study profile');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return errorResponse('Authentication required', 401);
    }

    const body = await req.json();
    const { mode, institution, program, academicYear, yearLevel, activeSemesterId, targetWeeklyHours, settings } = body;

    const profile = await prisma.studyProfile.upsert({
      where: { userId: auth.userId },
      update: {
        ...(mode !== undefined && { mode }),
        ...(institution !== undefined && { institution }),
        ...(program !== undefined && { program }),
        ...(academicYear !== undefined && { academicYear }),
        ...(yearLevel !== undefined && { yearLevel }),
        ...(activeSemesterId !== undefined && { activeSemesterId }),
        ...(targetWeeklyHours !== undefined && { targetWeeklyHours: Number(targetWeeklyHours) }),
        ...(settings !== undefined && { settings })
      },
      create: {
        userId: auth.userId,
        mode: mode || 'STUDENT',
        institution,
        program,
        academicYear: academicYear || '2026-2027',
        yearLevel: yearLevel || 'Year 4',
        activeSemesterId,
        targetWeeklyHours: Number(targetWeeklyHours) || 15,
        settings
      }
    });

    return successResponse(profile);
  } catch (err) {
    console.error('Error in POST /api/study/profile:', err);
    return errorResponse('Failed to update study profile');
  }
}
