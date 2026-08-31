import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    categories: ['Work', 'Studies', 'Workouts', 'Religion', 'Us stocks trading'],
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    segmentsByCategory: {
      'Work': ['Clinical Practice', 'Documentation', 'Admin', 'Patient Consultation'],
      'Studies': ['Dental Board Prep', 'Lectures & Revisions', 'Research Papers', 'Clinical Notes'],
      'Workouts': ['Push (Chest/Tri)', 'Pull (Back/Bi)', 'Legs & Core', 'Recovery & Mobility'],
      'Religion': ['Quran Recitation', 'Prayer & Adhkar', 'Islamic Studies', 'Charity'],
      'Us stocks trading': ['Pre-Market NY Analysis', 'London Session Prep', 'Live Trade Execution', 'Daily Trade Journal']
    }
  });
}
