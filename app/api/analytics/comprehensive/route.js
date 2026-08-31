import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  let tasks = [];
  let routines = [];
  let cases = [];
  let milestones = [];

  if (userId) {
    tasks = await prisma.task.findMany({ where: { userId } });
    routines = await prisma.routine.findMany({ where: { userId } });
    cases = await prisma.dentalCase.findMany({ where: { userId } });
    milestones = await prisma.roadmapMilestone.findMany({ where: { userId } });
  }

  return NextResponse.json({
    tasks: { total: tasks.length, completed: tasks.filter(t => t.completed).length },
    routines: { total: routines.length },
    dentalCases: { total: cases.length, completed: cases.filter(c => c.status === 'Completed').length },
    milestones: { total: milestones.length, completed: milestones.filter(m => m.status === 'completed').length }
  });
}
