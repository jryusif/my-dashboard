import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { getUserWeeklyTemplate, saveUserWeeklyTemplate } from '@/lib/weekly-templates.js';

export async function DELETE(req, { params }) {
  const auth = getAuthUser(req);
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { category: rawCategory, itemId: rawItemId } = await params;
  const category = decodeURIComponent(rawCategory);
  const itemId = decodeURIComponent(rawItemId);

  try {
    const currentDays = await getUserWeeklyTemplate(auth.userId, category);
    
    // Remove item from all days
    Object.keys(currentDays).forEach(day => {
      if (Array.isArray(currentDays[day])) {
        currentDays[day] = currentDays[day].filter(it => it.id !== itemId);
      }
    });

    const savedDays = await saveUserWeeklyTemplate(auth.userId, category, currentDays);

    return NextResponse.json({
      success: true,
      template: {
        category,
        days: savedDays
      }
    });
  } catch (err) {
    console.error('Error deleting weekly template item:', err);
    return NextResponse.json({ error: 'Failed to delete weekly template item' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = getAuthUser(req);
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { category: rawCategory, itemId: rawItemId } = await params;
  const category = decodeURIComponent(rawCategory);
  const itemId = decodeURIComponent(rawItemId);

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

    // Remove old item instance
    Object.keys(currentDays).forEach(d => {
      if (Array.isArray(currentDays[d])) {
        currentDays[d] = currentDays[d].filter(it => it.id !== itemId);
      }
    });

    let targetDays = [];
    if (Array.isArray(body.days) && body.days.length > 0) {
      targetDays = body.days;
    } else if (body.day) {
      targetDays = [body.day];
    } else {
      targetDays = ['Saturday'];
    }

    let updatedItem = null;
    targetDays.forEach((targetDay, idx) => {
      const itemToSave = {
        id: idx === 0 ? itemId : `tpl_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        task,
        title: task,
        segment,
        priority,
        time,
        isOff
      };
      if (idx === 0) updatedItem = itemToSave;

      if (!Array.isArray(currentDays[targetDay])) {
        currentDays[targetDay] = [];
      }
      currentDays[targetDay].push(itemToSave);
    });

    const savedDays = await saveUserWeeklyTemplate(auth.userId, category, currentDays);

    return NextResponse.json({
      success: true,
      item: updatedItem,
      template: {
        category,
        days: savedDays
      }
    });
  } catch (err) {
    console.error('Error updating weekly template item:', err);
    return NextResponse.json({ error: 'Failed to update weekly template item' }, { status: 500 });
  }
}
