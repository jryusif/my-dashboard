import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return errorResponse('Unauthorized', 401);

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        persona: true,
        experienceLevel: true,
        specialty: true,
        primaryFocus: true,
        currency: true,
        departmentSegments: true,
        customCategories: true,
        onboardingCompleted: true
      }
    });

    if (!user) return errorResponse('User not found', 404);

    return successResponse({ segments: user.departmentSegments || {}, user });
  } catch (err) {
    console.error('Fetch segments error:', err);
    return errorResponse('Failed to fetch department segments.');
  }
}

export async function PATCH(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { departmentSegments, persona, experienceLevel, specialty, primaryFocus, currency, customCategories } = body;

    const dataToUpdate = {};
    if (departmentSegments !== undefined) dataToUpdate.departmentSegments = departmentSegments;
    if (persona !== undefined) dataToUpdate.persona = persona;
    if (experienceLevel !== undefined) dataToUpdate.experienceLevel = experienceLevel;
    if (specialty !== undefined) dataToUpdate.specialty = specialty;
    if (primaryFocus !== undefined) dataToUpdate.primaryFocus = primaryFocus;
    if (currency !== undefined) dataToUpdate.currency = currency;
    if (customCategories !== undefined) dataToUpdate.customCategories = customCategories;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        persona: true,
        experienceLevel: true,
        specialty: true,
        primaryFocus: true,
        currency: true,
        departmentSegments: true,
        customCategories: true,
        onboardingCompleted: true
      }
    });

    return successResponse({
      message: 'Department segments and dropdown options updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update segments error:', err);
    return errorResponse('Failed to update department segments.');
  }
}
