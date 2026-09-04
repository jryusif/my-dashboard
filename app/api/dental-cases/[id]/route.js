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

async function handleUpdate(req, params) {
  try {
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Case not found.', 404);

    const updateData = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.patientCode !== undefined) updateData.patientCode = String(body.patientCode).trim();
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.teeth !== undefined) updateData.teeth = body.teeth;
    if (body.diagnosis !== undefined) updateData.diagnosis = body.diagnosis;
    if (body.treatmentPlan !== undefined) updateData.treatmentPlan = body.treatmentPlan;
    if (body.clinicalNotes !== undefined) updateData.clinicalNotes = body.clinicalNotes;
    if (body.materialsUsed !== undefined) updateData.materialsUsed = body.materialsUsed;
    if (body.totalCost !== undefined) updateData.totalCost = body.totalCost ? parseFloat(body.totalCost) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.showcaseForPatients !== undefined) updateData.showcaseForPatients = Boolean(body.showcaseForPatients);
    if (body.date !== undefined) updateData.date = body.date;
    if (body.steps !== undefined) updateData.steps = Array.isArray(body.steps) ? body.steps : [];

    if (body.beforeAfter !== undefined || body.xrays !== undefined || body.tags !== undefined || body.photos !== undefined) {
      updateData.photos = buildPhotosJson(body);
    }

    const updated = await prisma.dentalCase.update({
      where: { id },
      data: updateData
    });

    return successResponse(formatCaseOutput(updated));
  } catch (err) {
    console.error('Error updating dental case:', err);
    return errorResponse(err.message || 'Could not update dental case.');
  }
}

// Support both PUT and PATCH (frontend submits PATCH)
export async function PUT(req, { params }) {
  return handleUpdate(req, params);
}

export async function PATCH(req, { params }) {
  return handleUpdate(req, params);
}

export async function DELETE(req, { params }) {
  try {
    const authCheck = await resolveAndCheckDentalUser(req);
    if (authCheck.error) return errorResponse(authCheck.error, authCheck.status);
    const userId = authCheck.userId;

    const { id } = await params;
    const existing = await prisma.dentalCase.findFirst({
      where: { id, userId }
    });

    if (!existing) return errorResponse('Case not found.', 404);

    await prisma.dentalCase.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error deleting dental case:', err);
    return errorResponse('Could not delete dental case.');
  }
}
