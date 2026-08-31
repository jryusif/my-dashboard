import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ count: 0, cases: [] });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const specialty = searchParams.get('specialty');
    const showcase = searchParams.get('showcase');

    const where = { userId };
    if (specialty && specialty !== 'All') where.specialty = specialty;
    if (showcase === 'true') where.showcaseForPatients = true;

    let cases = await prisma.dentalCase.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      cases = cases.filter(c => 
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.patientCode && c.patientCode.toLowerCase().includes(term)) ||
        (c.teeth && c.teeth.toLowerCase().includes(term)) ||
        (c.diagnosis && c.diagnosis.toLowerCase().includes(term))
      );
    }

    return successResponse({ count: cases.length, cases });
  } catch (err) {
    console.error('Error fetching dental cases:', err);
    return errorResponse('Could not fetch dental cases.');
  }
}

export async function POST(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const {
      patientCode,
      title,
      specialty,
      teeth,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      materialsUsed,
      totalCost,
      status,
      showcaseForPatients,
      date,
      photos,
      steps
    } = body;

    if (!title || !title.trim()) {
      return errorResponse('Case title is required.', 400);
    }

    const dentalCase = await prisma.dentalCase.create({
      data: {
        userId,
        patientCode: patientCode ? patientCode.trim() : `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        specialty: specialty || 'Restorative & Aesthetics',
        teeth: teeth || '',
        diagnosis: diagnosis || '',
        treatmentPlan: treatmentPlan || '',
        clinicalNotes: clinicalNotes || '',
        materialsUsed: materialsUsed || '',
        totalCost: totalCost ? parseFloat(totalCost) : null,
        status: status || 'In Progress',
        showcaseForPatients: Boolean(showcaseForPatients),
        date: date || new Date().toISOString().split('T')[0],
        photos: Array.isArray(photos) ? photos : [],
        steps: Array.isArray(steps) ? steps : []
      }
    });

    return successResponse(dentalCase, 201);
  } catch (err) {
    console.error('Error creating dental case:', err);
    return errorResponse('Could not create dental case.');
  }
}
