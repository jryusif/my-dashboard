import { NextResponse } from 'next/server';

const CATEGORY_SCHEDULES = {
  'Work': {
    Saturday: [{ id: 'w1', task: 'Clinic Morning Shift & Patient Consultations', title: 'Clinic Morning Shift & Patient Consultations', segment: 'Clinic', priority: 'High', time: '09:00 - 14:00' }],
    Sunday: [{ id: 'w2', task: 'Operative Restorative Procedures', title: 'Operative Restorative Procedures', segment: 'Clinic', priority: 'High', time: '10:00 - 15:00' }],
    Monday: [{ id: 'w3', task: 'Endodontics & Complex Root Canal Cases', title: 'Endodontics & Complex Root Canal Cases', segment: 'Clinic', priority: 'High', time: '09:00 - 14:00' }],
    Tuesday: [{ id: 'w4', task: 'Prosthodontics & Crown Prep Sessions', title: 'Prosthodontics & Crown Prep Sessions', segment: 'Clinic', priority: 'Medium', time: '11:00 - 16:00' }],
    Wednesday: [{ id: 'w5', task: 'Clinical Inventory & Sterilization Audit', title: 'Clinical Inventory & Sterilization Audit', segment: 'Admin', priority: 'Low', time: '14:00 - 16:00' }],
    Thursday: [{ id: 'w6', task: 'Weekly Clinical Review & Patient Follow-ups', title: 'Weekly Clinical Review & Patient Follow-ups', segment: 'Clinic', priority: 'Medium', time: '10:00 - 13:00' }],
    Friday: [{ id: 'w7', task: 'Clinic Rest & Prep for Next Week', title: 'Clinic Rest & Prep for Next Week', segment: 'Admin', priority: 'Low', time: 'Rest', isOff: true }]
  },
  'Studies': {
    Saturday: [{ id: 's1', task: 'INBDE Dental Anatomy & Tooth Morphology', title: 'INBDE Dental Anatomy & Tooth Morphology', segment: 'INBDE Prep', priority: 'High', time: '18:00 - 20:00' }],
    Sunday: [{ id: 's2', task: 'Pharmacology & Local Anesthesia MCQs Practice', title: 'Pharmacology & Local Anesthesia MCQs Practice', segment: 'INBDE Prep', priority: 'High', time: '19:00 - 21:00' }],
    Monday: [{ id: 's3', task: 'Oral Pathology Diagnostic Slide Drills', title: 'Oral Pathology Diagnostic Slide Drills', segment: 'Pathology', priority: 'High', time: '18:00 - 20:00' }],
    Tuesday: [{ id: 's4', task: 'Periodontology Classification & Case Scenarios', title: 'Periodontology Classification & Case Scenarios', segment: 'Periodontics', priority: 'Medium', time: '19:00 - 21:00' }],
    Wednesday: [{ id: 's5', task: 'Orthodontics & Pediatric Clinical Guidelines', title: 'Orthodontics & Pediatric Clinical Guidelines', segment: 'Pediatrics', priority: 'Medium', time: '18:00 - 20:00' }],
    Thursday: [{ id: 's6', task: 'Comprehensive INBDE Mock Test (100 Questions)', title: 'Comprehensive INBDE Mock Test (100 Questions)', segment: 'Mock Exam', priority: 'High', time: '16:00 - 19:00' }],
    Friday: [{ id: 's7', task: 'Study Rest & High-Yield Flashcards Review', title: 'Study Rest & High-Yield Flashcards Review', segment: 'Review', priority: 'Low', time: 'Night', isOff: true }]
  },
  'Workouts': {
    Saturday: [{ id: 'k1', task: 'Push Session: Incline DB Press & Lateral Raises', title: 'Push Session: Incline DB Press & Lateral Raises', segment: 'Push Day', priority: 'High', time: '07:00 - 08:30' }],
    Sunday: [{ id: 'k2', task: 'Pull Session: Lat Pulldowns & Barbell Rows', title: 'Pull Session: Lat Pulldowns & Barbell Rows', segment: 'Pull Day', priority: 'High', time: '07:00 - 08:30' }],
    Monday: [{ id: 'k3', task: 'Legs Session: Barbell Squats & Romanian Deadlifts', title: 'Legs Session: Barbell Squats & Romanian Deadlifts', segment: 'Legs Day', priority: 'High', time: '07:00 - 08:30' }],
    Tuesday: [{ id: 'k4', task: 'Active Recovery & Core Stability Session', title: 'Active Recovery & Core Stability Session', segment: 'Recovery', priority: 'Medium', time: '07:30 - 08:30' }],
    Wednesday: [{ id: 'k5', task: 'Upper Hypertrophy & Arms Specialization', title: 'Upper Hypertrophy & Arms Specialization', segment: 'Upper Body', priority: 'High', time: '07:00 - 08:30' }],
    Thursday: [{ id: 'k6', task: 'Full Body Conditioning & 5km Cardio Run', title: 'Full Body Conditioning & 5km Cardio Run', segment: 'Conditioning', priority: 'Medium', time: '07:00 - 08:15' }],
    Friday: [{ id: 'k7', task: 'Complete Rest & Muscle Recovery', title: 'Complete Rest & Muscle Recovery', segment: 'Recovery', priority: 'Low', time: 'Rest', isOff: true }]
  },
  'Us stocks trading': {
    Saturday: [{ id: 't1', task: 'Weekend Market Preparation & Sector Flow Analysis', title: 'Weekend Market Preparation & Sector Flow Analysis', segment: 'Analysis', priority: 'Medium', time: '14:00 - 15:30' }],
    Sunday: [{ id: 't2', task: 'US Watchlist Assembly & Key Pivot Price Levels', title: 'US Watchlist Assembly & Key Pivot Price Levels', segment: 'Watchlist', priority: 'High', time: '18:00 - 19:30' }],
    Monday: [{ id: 't3', task: 'US Market Pre-Market Scan & Watchlist Filtering', title: 'US Market Pre-Market Scan & Watchlist Filtering', segment: 'Pre-Market', priority: 'High', time: '15:30 - 16:30' }],
    Tuesday: [{ id: 't4', task: 'Opening Bell Breakout Executions & Key Level Alerts', title: 'Opening Bell Breakout Executions & Key Level Alerts', segment: 'Active Trading', priority: 'High', time: '16:30 - 18:30' }],
    Wednesday: [{ id: 't5', task: 'Mid-Week PnL Audit & Risk Sizing Adjustment', title: 'Mid-Week PnL Audit & Risk Sizing Adjustment', segment: 'Risk Mgmt', priority: 'Medium', time: '16:30 - 18:00' }],
    Thursday: [{ id: 't6', task: 'Earnings Releases & High-Beta Momentum Trades', title: 'Earnings Releases & High-Beta Momentum Trades', segment: 'Active Trading', priority: 'High', time: '16:30 - 18:30' }],
    Friday: [{ id: 't7', task: 'Weekend Trade Journaling & Execution Review', title: 'Weekend Trade Journaling & Execution Review', segment: 'Journaling', priority: 'Medium', time: '19:00 - 20:30' }]
  },
  'Religion': {
    Saturday: [{ id: 'r1', task: 'Daily Quran Recitation (1 Juz) & Morning Adhkar', title: 'Daily Quran Recitation (1 Juz) & Morning Adhkar', segment: 'Worship', priority: 'High', time: '06:00 - 07:00' }],
    Sunday: [{ id: 'r2', task: 'Daily Quran Recitation & Evening Reflections', title: 'Daily Quran Recitation & Evening Reflections', segment: 'Worship', priority: 'High', time: '06:00 - 07:00' }],
    Monday: [{ id: 'r3', task: 'Sunnah Fasting & Quran Tafseer Study', title: 'Sunnah Fasting & Quran Tafseer Study', segment: 'Fasting', priority: 'High', time: '05:00 - 18:30' }],
    Tuesday: [{ id: 'r4', task: 'Daily Quran Recitation & Hadith Reading', title: 'Daily Quran Recitation & Hadith Reading', segment: 'Worship', priority: 'High', time: '06:00 - 07:00' }],
    Wednesday: [{ id: 'r5', task: 'Daily Quran Recitation & Istighfar Session', title: 'Daily Quran Recitation & Istighfar Session', segment: 'Worship', priority: 'High', time: '06:00 - 07:00' }],
    Thursday: [{ id: 'r6', task: 'Sunnah Fasting & Surah Al-Kahf Preparation', title: 'Sunnah Fasting & Surah Al-Kahf Preparation', segment: 'Fasting', priority: 'High', time: '05:00 - 18:30' }],
    Friday: [{ id: 'r7', task: 'Jumu\'ah Prayer Early Attendance & Surah Al-Kahf', title: 'Jumu\'ah Prayer Early Attendance & Surah Al-Kahf', segment: 'Jumua', priority: 'High', time: '11:30 - 13:30' }]
  }
};

export async function GET(req, { params }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  const days = CATEGORY_SCHEDULES[category] || {
    Saturday: [{ id: '1', task: `${category} Focus Block`, title: `${category} Focus Block`, segment: 'Primary', priority: 'High', time: 'Morning' }],
    Sunday: [{ id: '2', task: `${category} Review`, title: `${category} Review`, segment: 'Review', priority: 'Medium', time: 'Morning' }],
    Monday: [{ id: '3', task: `${category} Execution`, title: `${category} Execution`, segment: 'Execution', priority: 'High', time: 'Afternoon' }],
    Tuesday: [{ id: '4', task: `${category} Analysis`, title: `${category} Analysis`, segment: 'Strategy', priority: 'Medium', time: 'Morning' }],
    Wednesday: [{ id: '5', task: `${category} Sprint`, title: `${category} Sprint`, segment: 'Primary', priority: 'High', time: 'Morning' }],
    Thursday: [{ id: '6', task: `${category} Session`, title: `${category} Session`, segment: 'Review', priority: 'Medium', time: 'Evening' }],
    Friday: [{ id: '7', task: 'Rest & Weekly Recap', title: 'Rest & Weekly Recap', segment: 'Recap', priority: 'Low', time: 'Night', isOff: true }]
  };

  return NextResponse.json({
    category,
    days
  });
}
