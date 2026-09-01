import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated || !auth.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, customCategories: true }
    });

    if (!user) return errorResponse('User not found', 404);

    const spaces = Array.isArray(user.customCategories) ? user.customCategories : [];
    return successResponse({ spaces });
  } catch (err) {
    console.error('Fetch custom spaces error:', err);
    return errorResponse('Failed to fetch custom spaces.');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated || !auth.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { name, icon, color, colorHex, desc, templateType, segments } = body;

    if (!name || !name.trim()) {
      return errorResponse('Space name is required.', 400);
    }

    const trimmedName = name.trim();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, customCategories: true, departmentSegments: true }
    });

    if (!user) return errorResponse('User not found', 404);

    const currentSpaces = Array.isArray(user.customCategories) ? [...user.customCategories] : [];

    // Check for duplicate name
    if (currentSpaces.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      return errorResponse(`A space named "${trimmedName}" already exists. Please choose a different name.`, 400);
    }

    const newSpace = {
      id: `space_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      icon: (icon && icon.trim()) || '🚀',
      color: color || 'cyan',
      colorHex: colorHex || '#06b6d4',
      desc: desc ? desc.trim() : 'Custom focus workspace',
      templateType: templateType || 'all_in_one',
      createdAt: new Date().toISOString()
    };

    currentSpaces.push(newSpace);

    // Also update departmentSegments if custom segments provided
    let updatedSegments = user.departmentSegments || {};
    if (segments && Array.isArray(segments) && segments.length > 0) {
      updatedSegments = {
        ...updatedSegments,
        [trimmedName]: segments
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        customCategories: currentSpaces,
        departmentSegments: updatedSegments
      },
      select: {
        id: true,
        customCategories: true,
        departmentSegments: true
      }
    });

    return successResponse({
      message: `Space "${trimmedName}" created successfully!`,
      space: newSpace,
      spaces: updatedUser.customCategories
    });
  } catch (err) {
    console.error('Create custom space error:', err);
    return errorResponse('Failed to create custom space.');
  }
}
