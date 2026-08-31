import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');

    const where = { userId: auth.userId };
    if (pillar && pillar !== 'All') where.pillar = pillar;
    if (phase && phase !== 'All') where.phase = phase;
    if (status && status !== 'All') where.status = status;

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
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

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

    if (!title || !title.trim()) {
      return errorResponse('Title is required.', 400);
    }

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        userId: auth.userId,
        pillar: pillar || 'Dental Career',
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
