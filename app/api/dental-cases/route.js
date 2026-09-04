import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';
import { buildPhotosJson, formatCaseOutput } from '@/lib/dental.js';

async function resolveAndCheckDentalUser(req) {
  const auth = await getAuthUser(req);
  if (!auth || !auth.authenticated || !auth.userId) return { error: 'Unauthorized', status: 401 };
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, persona: true, dentalApproved: true, status: true }
  });
  if (!user) return { error: 'User not found', status: 404 };
  if (user.status === 'REJECTED') {
    return { error: 'Account suspended. Please contact administrator.', status: 403 };
  }
  return { userId: user.id };
}

export async function GET(req) {
  try {
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

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

    const formattedCases = cases.map(formatCaseOutput);
    return successResponse({ count: formattedCases.length, cases: formattedCases });
  } catch (err) {
    console.error('Error fetching dental cases:', err);
    return errorResponse('Could not fetch dental cases.');
  }
}

export async function POST(req) {
  try {
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

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
        photos: buildPhotosJson(body),
        steps: Array.isArray(steps) ? steps : []
      }
    });

    return successResponse(formatCaseOutput(dentalCase), 201);
  } catch (err) {
    console.error('Error creating dental case:', err);
    return errorResponse(err.message || 'Could not create dental case.');
  }
}
