import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import { getUserWeeklyTemplate, saveUserWeeklyTemplate } from '@/lib/weekly-templates.js';

export async function GET(req, { params }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const auth = getAuthUser(req);

  const days = await getUserWeeklyTemplate(auth.userId, category);

  return NextResponse.json({
    category,
    days
  });
}

export async function PUT(req, { params }) {
  const auth = getAuthUser(req);
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const body = await req.json();
  const days = body.days || {};

  const updated = await saveUserWeeklyTemplate(auth.userId, category, days);

  return NextResponse.json({
    success: true,
    template: {
      category,
      days: updated
    }
  });
}
