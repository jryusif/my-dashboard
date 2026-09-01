import prisma from '@/lib/prisma.js';

export const DEFAULT_CATEGORY_SCHEDULES = {
  'Work': {
    Saturday: [{ id: 'w1', task: 'Clinic Morning Shift & Patient Consultations', title: 'Clinic Morning Shift & Patient Consultations', segment: 'Clinic', priority: 'High', time: '09:00 - 14:00', isOff: false }],
    Sunday: [{ id: 'w2', task: 'Operative Restorative Procedures', title: 'Operative Restorative Procedures', segment: 'Clinic', priority: 'High', time: '10:00 - 15:00', isOff: false }],
    Monday: [{ id: 'w3', task: 'Endodontics & Complex Root Canal Cases', title: 'Endodontics & Complex Root Canal Cases', segment: 'Clinic', priority: 'High', time: '09:00 - 14:00', isOff: false }],
    Tuesday: [{ id: 'w4', task: 'Prosthodontics & Crown Prep Sessions', title: 'Prosthodontics & Crown Prep Sessions', segment: 'Clinic', priority: 'Medium', time: '11:00 - 16:00', isOff: false }],
    Wednesday: [{ id: 'w5', task: 'Clinical Inventory & Sterilization Audit', title: 'Clinical Inventory & Sterilization Audit', segment: 'Admin', priority: 'Low', time: '14:00 - 16:00', isOff: false }],
    Thursday: [{ id: 'w6', task: 'Weekly Clinical Review & Patient Follow-ups', title: 'Weekly Clinical Review & Patient Follow-ups', segment: 'Clinic', priority: 'Medium', time: '10:00 - 13:00', isOff: false }],
    Friday: [{ id: 'w7', task: 'Clinic Rest & Prep for Next Week', title: 'Clinic Rest & Prep for Next Week', segment: 'Admin', priority: 'Low', time: 'Rest', isOff: true }]
  },
  'Studies': {
    Saturday: [{ id: 's1', task: 'INBDE Dental Anatomy & Tooth Morphology', title: 'INBDE Dental Anatomy & Tooth Morphology', segment: 'INBDE Prep', priority: 'High', time: '18:00 - 20:00', isOff: false }],
    Sunday: [{ id: 's2', task: 'Pharmacology & Local Anesthesia MCQs Practice', title: 'Pharmacology & Local Anesthesia MCQs Practice', segment: 'INBDE Prep', priority: 'High', time: '19:00 - 21:00', isOff: false }],
    Monday: [{ id: 's3', task: 'Oral Pathology Diagnostic Slide Drills', title: 'Oral Pathology Diagnostic Slide Drills', segment: 'Pathology', priority: 'High', time: '18:00 - 20:00', isOff: false }],
    Tuesday: [{ id: 's4', task: 'Periodontology Classification & Case Scenarios', title: 'Periodontology Classification & Case Scenarios', segment: 'Periodontics', priority: 'Medium', time: '19:00 - 21:00', isOff: false }],
    Wednesday: [{ id: 's5', task: 'Orthodontics & Pediatric Clinical Guidelines', title: 'Orthodontics & Pediatric Clinical Guidelines', segment: 'Pediatrics', priority: 'Medium', time: '18:00 - 20:00', isOff: false }],
    Thursday: [{ id: 's6', task: 'Comprehensive INBDE Mock Test (100 Questions)', title: 'Comprehensive INBDE Mock Test (100 Questions)', segment: 'Mock Exam', priority: 'High', time: '16:00 - 19:00', isOff: false }],
    Friday: [{ id: 's7', task: 'Study Rest & High-Yield Flashcards Review', title: 'Study Rest & High-Yield Flashcards Review', segment: 'Review', priority: 'Low', time: 'Night', isOff: true }]
  },
  'Workouts': {
    Saturday: [{ id: 'k1', task: 'Push Session: Incline DB Press & Lateral Raises', title: 'Push Session: Incline DB Press & Lateral Raises', segment: 'Push Day', priority: 'High', time: '07:00 - 08:30', isOff: false }],
    Sunday: [{ id: 'k2', task: 'Pull Session: Lat Pulldowns & Barbell Rows', title: 'Pull Session: Lat Pulldowns & Barbell Rows', segment: 'Pull Day', priority: 'High', time: '07:00 - 08:30', isOff: false }],
    Monday: [{ id: 'k3', task: 'Legs Session: Barbell Squats & Romanian Deadlifts', title: 'Legs Session: Barbell Squats & Romanian Deadlifts', segment: 'Legs Day', priority: 'High', time: '07:00 - 08:30', isOff: false }],
    Tuesday: [{ id: 'k4', task: 'Active Recovery & Core Stability Session', title: 'Active Recovery & Core Stability Session', segment: 'Recovery', priority: 'Medium', time: '07:30 - 08:30', isOff: false }],
    Wednesday: [{ id: 'k5', task: 'Upper Hypertrophy & Arms Specialization', title: 'Upper Hypertrophy & Arms Specialization', segment: 'Upper Body', priority: 'High', time: '07:00 - 08:30', isOff: false }],
    Thursday: [{ id: 'k6', task: 'Full Body Conditioning & 5km Cardio Run', title: 'Full Body Conditioning & 5km Cardio Run', segment: 'Conditioning', priority: 'Medium', time: '07:00 - 08:15', isOff: false }],
    Friday: [{ id: 'k7', task: 'Complete Rest & Muscle Recovery', title: 'Complete Rest & Muscle Recovery', segment: 'Recovery', priority: 'Low', time: 'Rest', isOff: true }]
  },
  'Us stocks trading': {
    Saturday: [{ id: 't1', task: 'Weekend Market Preparation & Sector Flow Analysis', title: 'Weekend Market Preparation & Sector Flow Analysis', segment: 'Analysis', priority: 'Medium', time: '14:00 - 15:30', isOff: false }],
    Sunday: [{ id: 't2', task: 'US Watchlist Assembly & Key Pivot Price Levels', title: 'US Watchlist Assembly & Key Pivot Price Levels', segment: 'Watchlist', priority: 'High', time: '18:00 - 19:30', isOff: false }],
    Monday: [{ id: 't3', task: 'US Market Pre-Market Scan & Watchlist Filtering', title: 'US Market Pre-Market Scan & Watchlist Filtering', segment: 'Pre-Market', priority: 'High', time: '15:30 - 16:30', isOff: false }],
    Tuesday: [{ id: 't4', task: 'Opening Bell Breakout Executions & Key Level Alerts', title: 'Opening Bell Breakout Executions & Key Level Alerts', segment: 'Active Trading', priority: 'High', time: '16:30 - 18:30', isOff: false }],
    Wednesday: [{ id: 't5', task: 'Mid-Week PnL Audit & Risk Sizing Adjustment', title: 'Mid-Week PnL Audit & Risk Sizing Adjustment', segment: 'Risk Mgmt', priority: 'Medium', time: '16:30 - 18:00', isOff: false }],
    Thursday: [{ id: 't6', task: 'Earnings Releases & High-Beta Momentum Trades', title: 'Earnings Releases & High-Beta Momentum Trades', segment: 'Active Trading', priority: 'High', time: '16:30 - 18:30', isOff: false }],
    Friday: [{ id: 't7', task: 'Weekend Trade Journaling & Execution Review', title: 'Weekend Trade Journaling & Execution Review', segment: 'Journaling', priority: 'Medium', time: '19:00 - 20:30', isOff: false }]
  },
  'Religion': {
    Saturday: [{ id: 'r1', task: 'Daily Quran Recitation (1 Juz) & Morning Adhkar', title: 'Daily Quran Recitation (1 Juz) & Morning Adhkar', segment: 'Worship', priority: 'High', time: '06:00 - 07:00', isOff: false }],
    Sunday: [{ id: 'r2', task: 'Daily Quran Recitation & Evening Reflections', title: 'Daily Quran Recitation & Evening Reflections', segment: 'Worship', priority: 'High', time: '06:00 - 07:00', isOff: false }],
    Monday: [{ id: 'r3', task: 'Sunnah Fasting & Quran Tafseer Study', title: 'Sunnah Fasting & Quran Tafseer Study', segment: 'Fasting', priority: 'High', time: '05:00 - 18:30', isOff: false }],
    Tuesday: [{ id: 'r4', task: 'Daily Quran Recitation & Hadith Reading', title: 'Daily Quran Recitation & Hadith Reading', segment: 'Worship', priority: 'High', time: '06:00 - 07:00', isOff: false }],
    Wednesday: [{ id: 'r5', task: 'Daily Quran Recitation & Istighfar Session', title: 'Daily Quran Recitation & Istighfar Session', segment: 'Worship', priority: 'High', time: '06:00 - 07:00', isOff: false }],
    Thursday: [{ id: 'r6', task: 'Sunnah Fasting & Surah Al-Kahf Preparation', title: 'Sunnah Fasting & Surah Al-Kahf Preparation', segment: 'Fasting', priority: 'High', time: '05:00 - 18:30', isOff: false }],
    Friday: [{ id: 'r7', task: 'Jumu\'ah Prayer Early Attendance & Surah Al-Kahf', title: 'Jumu\'ah Prayer Early Attendance & Surah Al-Kahf', segment: 'Jumua', priority: 'High', time: '11:30 - 13:30', isOff: false }]
  }
};

const WEEK_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function getDefaultSchedule(category) {
  if (DEFAULT_CATEGORY_SCHEDULES[category]) {
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORY_SCHEDULES[category]));
  }

  // Generic fallback for custom categories
  const days = {};
  WEEK_DAYS.forEach((day, idx) => {
    if (day === 'Friday') {
      days[day] = [{
        id: `tpl_gen_${idx}`,
        task: `Rest & Weekly Recap (${category})`,
        title: `Rest & Weekly Recap (${category})`,
        segment: 'Recap',
        priority: 'Low',
        time: 'Night',
        isOff: true
      }];
    } else {
      days[day] = [{
        id: `tpl_gen_${idx}`,
        task: `${category} Focus Block`,
        title: `${category} Focus Block`,
        segment: 'Primary',
        priority: 'Medium',
        time: 'Morning',
        isOff: false
      }];
    }
  });
  return days;
}

export function sanitizeSchedule(daysObj, category) {
  const result = {};
  const defaults = getDefaultSchedule(category);

  WEEK_DAYS.forEach(day => {
    if (Array.isArray(daysObj?.[day])) {
      result[day] = daysObj[day].map(it => ({
        id: String(it.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`),
        task: String(it.task || it.title || ''),
        title: String(it.title || it.task || ''),
        segment: it.segment ? String(it.segment) : null,
        priority: it.priority || 'Medium',
        time: it.time ? String(it.time) : null,
        isOff: Boolean(it.isOff)
      }));
    } else if (Array.isArray(defaults[day])) {
      result[day] = JSON.parse(JSON.stringify(defaults[day]));
    } else {
      result[day] = [];
    }
  });

  return result;
}

export async function getUserWeeklyTemplate(userId, category) {
  if (!userId) {
    return getDefaultSchedule(category);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentSegments: true }
    });

    const segments = user?.departmentSegments;
    const weeklyTemplates = (segments && typeof segments === 'object') ? segments.weeklyTemplates : null;

    if (weeklyTemplates && weeklyTemplates[category]) {
      return sanitizeSchedule(weeklyTemplates[category], category);
    }
  } catch (err) {
    console.error('Error fetching user weekly template:', err);
  }

  return getDefaultSchedule(category);
}

export async function saveUserWeeklyTemplate(userId, category, days) {
  if (!userId) throw new Error('Unauthorized');

  const sanitized = sanitizeSchedule(days, category);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentSegments: true }
  });

  const existingSegments = (user?.departmentSegments && typeof user.departmentSegments === 'object')
    ? { ...user.departmentSegments }
    : {};

  const weeklyTemplates = (existingSegments.weeklyTemplates && typeof existingSegments.weeklyTemplates === 'object')
    ? { ...existingSegments.weeklyTemplates }
    : {};

  weeklyTemplates[category] = sanitized;
  existingSegments.weeklyTemplates = weeklyTemplates;

  await prisma.user.update({
    where: { id: userId },
    data: {
      departmentSegments: existingSegments
    }
  });

  return sanitized;
}
