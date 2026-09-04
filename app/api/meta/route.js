import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = getAuthUser(req);
  let user = null;
  if (auth && auth.authenticated && auth.userId) {
    user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, role: true, dentalApproved: true, tradingApproved: true }
    });
  }

  const isMasterAdmin = user && user.role === 'ADMIN';
  const canAccessTrading = isMasterAdmin || Boolean(user?.tradingApproved);
  const canAccessDental = isMasterAdmin || Boolean(user?.dentalApproved);

  const categories = ['Work', 'Studies', 'Workouts', 'Religion', 'Finance'];
  if (canAccessTrading) categories.push('Us stocks trading');
  if (canAccessDental) categories.push('Dental Cases');

  const segmentsByCategory = {
    'Work': ['Clinical Practice', 'Documentation', 'Admin', 'Patient Consultation'],
    'Studies': ['Dental Board Prep', 'Lectures & Revisions', 'Research Papers', 'Clinical Notes'],
    'Workouts': ['Push (Chest/Tri)', 'Pull (Back/Bi)', 'Legs & Core', 'Recovery & Mobility'],
    'Religion': ['Quran Recitation', 'Prayer & Adhkar', 'Islamic Studies', 'Charity'],
    'Finance': ['Budget & Cash Review', 'Investments & Gold', 'Expenses Tracking', 'Financial Goals'],
  };

  if (canAccessTrading) {
    segmentsByCategory['Us stocks trading'] = ['Pre-Market NY Analysis', 'London Session Prep', 'Live Trade Execution', 'Daily Trade Journal'];
  }
  if (canAccessDental) {
    segmentsByCategory['Dental Cases'] = ['Composite Restoration', 'Endodontics', 'Crown & Bridge', 'Extraction & Surgery'];
  }

  return NextResponse.json({
    categories,
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    segmentsByCategory
  });
}
