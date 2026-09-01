import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUser(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, role: true, dentalApproved: true, tradingApproved: true, specialty: true, persona: true, primaryFocus: true }
    });
    return user;
  }
  return null;
}

export async function GET(req) {
  try {
    const user = await resolveUser(req);
    if (!user) return successResponse([]);

    const isMasterAdmin = user.role === 'ADMIN';
    const canAccessDental = isMasterAdmin || Boolean(user?.dentalApproved);
    const canAccessTrading = isMasterAdmin || Boolean(user?.tradingApproved);

    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');

    if (pillar === 'Dental Career' && !canAccessDental) {
      return successResponse([]);
    }
    if ((pillar === 'Trading & Markets' || pillar === 'Trading') && !canAccessTrading) {
      return successResponse([]);
    }

    const where = { userId: user.id };
    if (pillar && pillar !== 'All') where.pillar = pillar;
    if (phase && phase !== 'All') where.phase = phase;
    if (status && status !== 'All') where.status = status;

    const notInPillars = [];
    if (!canAccessDental) notInPillars.push('Dental Career');
    if (!canAccessTrading) notInPillars.push('Trading & Markets', 'Trading');
    if (notInPillars.length > 0) {
      where.pillar = pillar && pillar !== 'All' ? pillar : { notIn: notInPillars };
    }

    const milestones = await prisma.roadmapMilestone.findMany({
      where,
      orderBy: [{ phase: 'asc' }, { createdAt: 'desc' }]
    });

    return successResponse(milestones);
  } catch (err) {
    console.error('Error fetching roadmap:', err);
    return errorResponse('Could not fetch roadmap.');
  }
}

export async function POST(req) {
  try {
    const user = await resolveUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const isMasterAdmin = user.role === 'ADMIN';
    const canAccessDental = isMasterAdmin || Boolean(user?.dentalApproved);
    const canAccessTrading = isMasterAdmin || Boolean(user?.tradingApproved);

    const body = await req.json();
    const {
      pillar,
      phase,
      title,
      targetHorizon,
      status,
      priority,
      progressPct,
      keyResults,
      actionStrategy,
      metricsTarget
    } = body;

    const defaultCareerPillar = user.specialty ? `${user.specialty} Career` : (canAccessDental ? 'Dental Career' : 'Professional Career');
    const chosenPillar = pillar || defaultCareerPillar;

    if (chosenPillar === 'Dental Career' && !canAccessDental) {
      return errorResponse('Dental Career roadmap is locked by your Administrator.', 403);
    }
    if ((chosenPillar === 'Trading & Markets' || chosenPillar === 'Trading') && !canAccessTrading) {
      return errorResponse('Trading & Markets roadmap is locked by your Administrator.', 403);
    }

    if (!title || !title.trim()) {
      return errorResponse('Title is required.', 400);
    }

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        userId: user.id,
        pillar: chosenPillar,
        phase: phase || 'Phase 1: Foundation (Now)',
        title: title.trim(),
        targetHorizon: targetHorizon || '2027',
        status: status || 'in_progress',
        priority: priority || 'High',
        progressPct: typeof progressPct === 'number' ? progressPct : 0,
        keyResults: Array.isArray(keyResults) ? keyResults : [],
        actionStrategy: actionStrategy || '',
        metricsTarget: metricsTarget || ''
      }
    });

    return successResponse(milestone, 201);
  } catch (err) {
    console.error('Error creating milestone:', err);
    return errorResponse('Could not create milestone.');
  }
}
