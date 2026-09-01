import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { getUserWeeklyTemplate, saveUserWeeklyTemplate } from '@/lib/weekly-templates.js';

export async function POST(req, { params }) {
  const auth = getAuthUser(req);
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  try {
    const body = await req.json();
    const day = body.day || 'Saturday';
    const task = (body.task || body.title || '').trim();
    const time = (body.time || '').trim() || null;
    const priority = body.priority || 'Medium';
    const segment = (body.segment || '').trim() || null;
    const isOff = Boolean(body.isOff);

    if (!task) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const currentDays = await getUserWeeklyTemplate(auth.userId, category);
    const newItem = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      task,
      title: task,
      segment,
      priority,
      time,
      isOff
    };

    if (!Array.isArray(currentDays[day])) {
      currentDays[day] = [];
    }
    currentDays[day].push(newItem);

    const savedDays = await saveUserWeeklyTemplate(auth.userId, category, currentDays);

    return NextResponse.json({
      success: true,
      item: newItem,
      template: {
        category,
        days: savedDays
      }
    });
  } catch (err) {
    console.error('Error adding weekly template item:', err);
    return NextResponse.json({ error: 'Failed to add weekly template item' }, { status: 500 });
  }
}
