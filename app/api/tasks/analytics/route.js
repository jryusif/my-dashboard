import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

  let tasks = [];
  if (userId) {
    tasks = await prisma.task.findMany({ where: { userId } });
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  return NextResponse.json({
    totalTasks: total,
    completedTasks: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    dailyVelocity: Math.round(completed / 7)
  });
}
