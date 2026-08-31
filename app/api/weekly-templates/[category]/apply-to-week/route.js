import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

const DEFAULT_CATEGORY_TEMPLATES = {
  'Work': [
    { day: 'Saturday', title: 'Clinic Morning Shift & Patient Consultations', segment: 'Clinic', timeBlock: '09:00 - 14:00' },
    { day: 'Sunday', title: 'Operative Restorative Procedures', segment: 'Clinic', timeBlock: '10:00 - 15:00' },
    { day: 'Monday', title: 'Endodontics & Complex Cases', segment: 'Clinic', timeBlock: '09:00 - 14:00' },
    { day: 'Tuesday', title: 'Prosthodontics & Crown Prep Sessions', segment: 'Clinic', timeBlock: '11:00 - 16:00' },
    { day: 'Wednesday', title: 'Clinical Inventory & Instrument Sterilization Audit', segment: 'Admin', timeBlock: '14:00 - 16:00' },
    { day: 'Thursday', title: 'Weekly Clinical Review & Patient Follow-ups', segment: 'Clinic', timeBlock: '10:00 - 13:00' }
  ],
  'Studies': [
    { day: 'Saturday', title: 'American Board Dental Anatomy Review (Chapter 3)', segment: 'INBDE Prep', timeBlock: '18:00 - 20:00' },
    { day: 'Sunday', title: 'Pharmacology & Local Anesthesia MCQs Practice', segment: 'INBDE Prep', timeBlock: '19:00 - 21:00' },
    { day: 'Monday', title: 'Oral Pathology Diagnostic Slide Drills', segment: 'Pathology', timeBlock: '18:00 - 20:00' },
    { day: 'Tuesday', title: 'Periodontology Classification & Case Scenarios', segment: 'Periodontics', timeBlock: '19:00 - 21:00' },
    { day: 'Wednesday', title: 'Orthodontics & Pediatric Clinical Guidelines', segment: 'Pediatrics', timeBlock: '18:00 - 20:00' },
    { day: 'Thursday', title: 'Comprehensive INBDE Mock Test (100 Questions)', segment: 'Mock Exam', timeBlock: '16:00 - 19:00' }
  ],
  'Workouts': [
    { day: 'Saturday', title: 'Push Session: Incline DB Press & Lateral Raises', segment: 'Push Day', timeBlock: '07:00 - 08:30' },
    { day: 'Sunday', title: 'Pull Session: Lat Pulldowns & Barbell Rows', segment: 'Pull Day', timeBlock: '07:00 - 08:30' },
    { day: 'Monday', title: 'Legs Session: Barbell Squats & Romanian Deadlifts', segment: 'Legs Day', timeBlock: '07:00 - 08:30' },
    { day: 'Tuesday', title: 'Active Recovery & Core Stability Session', segment: 'Recovery', timeBlock: '07:30 - 08:30' },
    { day: 'Wednesday', title: 'Upper Hypertrophy & Arms Specialization', segment: 'Upper Body', timeBlock: '07:00 - 08:30' },
    { day: 'Thursday', title: 'Full Body Conditioning & 5km Cardio Run', segment: 'Conditioning', timeBlock: '07:00 - 08:15' }
  ],
  'Us stocks trading': [
    { day: 'Monday', title: 'US Market Pre-Market Scan & Watchlist Filtering', segment: 'Pre-Market', timeBlock: '15:30 - 16:30' },
    { day: 'Tuesday', title: 'Opening Bell Breakout Executions & Key Level Alerts', segment: 'Active Trading', timeBlock: '16:30 - 18:30' },
    { day: 'Wednesday', title: 'Mid-Week PnL Audit & Risk Sizing Adjustment', segment: 'Risk Mgmt', timeBlock: '16:30 - 18:00' },
    { day: 'Thursday', title: 'Earnings Releases & High-Beta Momentum Trades', segment: 'Active Trading', timeBlock: '16:30 - 18:30' },
    { day: 'Friday', title: 'Weekend Trade Journaling & Execution Review', segment: 'Journaling', timeBlock: '19:00 - 20:30' }
  ],
  'Religion': [
    { day: 'Saturday', title: 'Daily Quran Recitation (1 Juz) & Morning Adhkar', segment: 'Worship', timeBlock: '06:00 - 07:00' },
    { day: 'Sunday', title: 'Daily Quran Recitation & Evening Reflections', segment: 'Worship', timeBlock: '06:00 - 07:00' },
    { day: 'Monday', title: 'Sunnah Fasting & Quran Tafseer Study', segment: 'Fasting', timeBlock: '05:00 - 18:30' },
    { day: 'Tuesday', title: 'Daily Quran Recitation & Hadith Reading', segment: 'Worship', timeBlock: '06:00 - 07:00' },
    { day: 'Wednesday', title: 'Daily Quran Recitation & Istighfar Session', segment: 'Worship', timeBlock: '06:00 - 07:00' },
    { day: 'Thursday', title: 'Sunnah Fasting & Surah Al-Kahf Preparation', segment: 'Fasting', timeBlock: '05:00 - 18:30' },
    { day: 'Friday', title: 'Jumu\'ah Prayer Early Attendance & Surah Al-Kahf', segment: 'Jumua', timeBlock: '11:30 - 13:30' }
  ]
};

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
    const userId = await resolveUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const templateItems = DEFAULT_CATEGORY_TEMPLATES[category] || [
      { day: 'Saturday', title: `${category} Focus Block A`, segment: 'Primary' },
      { day: 'Monday', title: `${category} Focus Block B`, segment: 'Primary' },
      { day: 'Wednesday', title: `${category} Deep Work Session`, segment: 'Execution' }
    ];

    let createdCount = 0;
    for (const item of templateItems) {
      const dayIdx = DAY_NAME_TO_INDEX[item.day] ?? 0;
      const targetDate = weekDateStrings[dayIdx];

      // Check if task already exists on that date
      const existing = await prisma.task.findFirst({
        where: {
          userId,
          title: item.title,
          date: targetDate
        }
      });

      if (!existing) {
        await prisma.task.create({
          data: {
            userId,
            title: item.title,
            category,
            segment: item.segment || null,
            timeBlock: item.timeBlock || null,
            date: targetDate,
            completed: false
          }
        });
        createdCount++;
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
