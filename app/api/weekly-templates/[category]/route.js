import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req, { params }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  const defaultDays = {
    Saturday: [
      { id: '1', title: `${category} Focus Block A`, segment: 'Primary', priority: 'High', timeBlock: 'Morning' }
    ],
    Sunday: [
      { id: '2', title: `${category} Deep Work Review`, segment: 'Review', priority: 'Medium', timeBlock: 'Morning' }
    ],
    Monday: [
      { id: '3', title: `${category} Execution & Clinic`, segment: 'Execution', priority: 'High', timeBlock: 'Afternoon' }
    ],
    Tuesday: [
      { id: '4', title: `${category} Strategy & Analysis`, segment: 'Strategy', priority: 'Medium', timeBlock: 'Morning' }
    ],
    Wednesday: [
      { id: '5', title: `${category} Mid-Week Sprint`, segment: 'Primary', priority: 'High', timeBlock: 'Morning' }
    ],
    Thursday: [
      { id: '6', title: `${category} Session & Review`, segment: 'Review', priority: 'Medium', timeBlock: 'Evening' }
    ],
    Friday: [
      { id: '7', title: 'Rest & Weekly Recap', segment: 'Recap', priority: 'Low', timeBlock: 'Night', isOff: true }
    ]
  };

  return NextResponse.json({
    category,
    days: defaultDays
  });
}
