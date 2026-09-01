import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        bio: true,
        specialty: true,
        phone: true,
        persona: true,
        experienceLevel: true,
        primaryFocus: true,
        currency: true,
        dentalApproved: true,
        tradingApproved: true,
        departmentSegments: true,
        customCategories: true,
        onboardingCompleted: true,
        createdAt: true,
        lastLoginAt: true,
        approvedAt: true
      }
    });

    if (!user) return unauthorizedResponse('User not found.');

    // Fetch user workspace statistics
    const [tasksCount, completedTasksCount, routinesCount, dentalCasesCount, milestonesCount, assetsCount] = await Promise.all([
      prisma.task.count({ where: { userId: auth.userId } }),
      prisma.task.count({ where: { userId: auth.userId, completed: true } }),
      prisma.routine.count({ where: { userId: auth.userId, active: true } }),
      prisma.dentalCase.count({ where: { userId: auth.userId } }),
      prisma.roadmapMilestone.count({ where: { userId: auth.userId } }),
      prisma.asset.count({ where: { userId: auth.userId } })
    ]);

    return successResponse({
      user,
      stats: {
        tasksCount,
        completedTasksCount,
        routinesCount,
        dentalCasesCount,
        milestonesCount,
        assetsCount
      }
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return errorResponse('Failed to load profile details.');
  }
}

export async function PATCH(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated) return unauthorizedResponse();

    const body = await req.json();
    const { name, avatar, bio, specialty, phone, persona, experienceLevel, primaryFocus, currency, departmentSegments, customCategories } = body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (avatar !== undefined) dataToUpdate.avatar = avatar ? avatar.trim() : null;
    if (bio !== undefined) dataToUpdate.bio = bio ? bio.trim() : null;
    if (specialty !== undefined) dataToUpdate.specialty = specialty ? specialty.trim() : null;
    if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
    if (persona !== undefined) dataToUpdate.persona = persona;
    if (experienceLevel !== undefined) dataToUpdate.experienceLevel = experienceLevel;
    if (primaryFocus !== undefined) dataToUpdate.primaryFocus = primaryFocus;
    if (currency !== undefined) dataToUpdate.currency = currency;
    if (departmentSegments !== undefined) dataToUpdate.departmentSegments = departmentSegments;
    if (customCategories !== undefined) dataToUpdate.customCategories = customCategories;

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        bio: true,
        specialty: true,
        phone: true,
        persona: true,
        experienceLevel: true,
        primaryFocus: true,
        currency: true,
        dentalApproved: true,
        tradingApproved: true,
        departmentSegments: true,
        customCategories: true,
        onboardingCompleted: true,
        updatedAt: true
      }
    });

    return successResponse({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return errorResponse('Failed to update profile.');
  }
}
