import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

const DEFAULT_ROADMAP_PHASES = [
  'Phase 1: Foundation (Now)',
  'Phase 2: Acceleration (6-12M)',
  'Phase 3: Mastery & Scale (1-3Y)',
  'Phase 4: Freedom & Legacy (5Y+)'
];

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ phases: DEFAULT_ROADMAP_PHASES });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentSegments: true }
    });

    const segments = user?.departmentSegments || {};
    const phases = Array.isArray(segments.roadmapPhases) && segments.roadmapPhases.length > 0
      ? segments.roadmapPhases
      : DEFAULT_ROADMAP_PHASES;

    return successResponse({ phases });
  } catch (err) {
    console.error('Fetch roadmap phases error:', err);
    return errorResponse('Failed to fetch roadmap phases.');
  }
}

export async function PUT(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { phases, oldPhaseName, newPhaseName } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, departmentSegments: true }
    });

    if (!user) return errorResponse('User not found', 404);

    let updatedPhases = Array.isArray(phases) && phases.length > 0
      ? phases.map(p => String(p).trim()).filter(Boolean)
      : DEFAULT_ROADMAP_PHASES;

    // Remove duplicates
    updatedPhases = [...new Set(updatedPhases)];

    // If renaming a specific phase, also update existing milestones in DB
    if (oldPhaseName && newPhaseName && oldPhaseName !== newPhaseName) {
      await prisma.roadmapMilestone.updateMany({
        where: {
          userId,
          phase: oldPhaseName.trim()
        },
        data: {
          phase: newPhaseName.trim()
        }
      }).catch(err => console.warn('Could not batch update milestones phase:', err));
    }

    const updatedSegments = {
      ...(user.departmentSegments || {}),
      roadmapPhases: updatedPhases
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        departmentSegments: updatedSegments
      }
    });

    return successResponse({
      message: 'Roadmap phases updated successfully!',
      phases: updatedPhases
    });
  } catch (err) {
    console.error('Update roadmap phases error:', err);
    return errorResponse('Failed to update roadmap phases.');
  }
}

export async function POST(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return errorResponse('Phase name is required.', 400);
    }

    const trimmedName = name.trim();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, departmentSegments: true }
    });

    if (!user) return errorResponse('User not found', 404);

    const segments = user.departmentSegments || {};
    let currentPhases = Array.isArray(segments.roadmapPhases) && segments.roadmapPhases.length > 0
      ? [...segments.roadmapPhases]
      : [...DEFAULT_ROADMAP_PHASES];

    if (currentPhases.includes(trimmedName)) {
      return errorResponse(`Phase "${trimmedName}" already exists.`, 400);
    }

    currentPhases.push(trimmedName);

    const updatedSegments = {
      ...segments,
      roadmapPhases: currentPhases
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        departmentSegments: updatedSegments
      }
    });

    return successResponse({
      message: `Phase "${trimmedName}" added to your roadmap!`,
      phases: currentPhases
    }, 201);
  } catch (err) {
    console.error('Create roadmap phase error:', err);
    return errorResponse('Failed to create roadmap phase.');
  }
}
