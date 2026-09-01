import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getUserWeeklyTemplate } from '@/lib/weekly-templates.js';

const DAY_NAME_TO_INDEX = {
  'Saturday': 0, 'Sat': 0,
  'Sunday': 1, 'Sun': 1,
  'Monday': 2, 'Mon': 2,
  'Tuesday': 3, 'Tue': 3,
  'Wednesday': 4, 'Wed': 4,
  'Thursday': 5, 'Thu': 5,
  'Friday': 6, 'Fri': 6
};

export async function POST(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category: rawCategory } = await params;
    const category = decodeURIComponent(rawCategory);

    // Compute current week's dates (Saturday to Friday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffFromSaturday = (dayOfWeek + 1) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() - diffFromSaturday);
    saturday.setHours(0, 0, 0, 0);

    const weekDateStrings = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      weekDateStrings.push(d.toISOString().split('T')[0]);
    }

    // Load user's actual template
    const userDays = await getUserWeeklyTemplate(auth.userId, category);

    let createdCount = 0;

    for (const [dayName, items] of Object.entries(userDays)) {
      const dayIdx = DAY_NAME_TO_INDEX[dayName];
      if (dayIdx === undefined || !Array.isArray(items)) continue;
      const targetDate = weekDateStrings[dayIdx];

      for (const item of items) {
        if (item.isOff) continue; // Skip rest/off day placeholders

        const title = item.task || item.title;
        if (!title) continue;

        // Check if task already exists on that date
        const existing = await prisma.task.findFirst({
          where: {
            userId: auth.userId,
            title,
            date: targetDate
          }
        });

        if (!existing) {
          await prisma.task.create({
            data: {
              userId: auth.userId,
              title,
              category,
              segment: item.segment || null,
              timeBlock: item.time || null,
              date: targetDate,
              completed: false
            }
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      message: `Generated ${createdCount} weekly tasks for ${category} successfully!`
    });
  } catch (err) {
    console.error('Error applying weekly template:', err);
    return NextResponse.json({ error: 'Could not apply weekly template' }, { status: 500 });
  }
}
