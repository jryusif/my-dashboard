import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = getAuthUser(req);
  const userId = auth.authenticated ? (auth.userId || (auth.user && auth.user.id)) : null;

  let tasks = [];
  if (userId) {
    tasks = await prisma.task.findMany({ where: { userId } });
  }

  const { searchParams } = new URL(req.url);
  let startDate = searchParams.get('startDate');
  let endDate = searchParams.get('endDate');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!startDate || !endDate) {
    const dayOfWeek = now.getDay();
    const diffFromSaturday = (dayOfWeek + 1) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() - diffFromSaturday);
    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);
    startDate = saturday.toISOString().split('T')[0];
    endDate = friday.toISOString().split('T')[0];
  }

  const activeTasks = tasks.filter(t => t.category !== 'Routine');
  const total = activeTasks.length;
  const completed = activeTasks.filter(t => t.completed).length;

  const weekTasks = activeTasks.filter(t => t.date && t.date >= startDate && t.date <= endDate);
  const weekTotal = weekTasks.length;
  const weekDone = weekTasks.filter(t => t.completed).length;
  const weekPct = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

  const todayTasks = activeTasks.filter(t => t.date === todayStr);
  const todayTotal = todayTasks.length;
  const todayDone = todayTasks.filter(t => t.completed).length;
  const todayPct = todayTotal === 0 ? 0 : Math.round((todayDone / todayTotal) * 100);

  return NextResponse.json({
    totalTasks: total,
    completedTasks: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    dailyVelocity: Math.round(completed / 7),
    week: {
      done: weekDone,
      total: weekTotal,
      pct: weekPct,
    },
    today: {
      done: todayDone,
      total: todayTotal,
      pct: todayPct,
    }
  });
}
