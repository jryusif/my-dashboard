import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

export async function PUT(req, context) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated || !auth.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;
    if (!id) return errorResponse('Space ID is required.', 400);

    const body = await req.json();
    const { name, icon, color, colorHex, desc, segments } = body;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, customCategories: true, departmentSegments: true }
    });

    if (!user) return errorResponse('User not found', 404);

    const spaces = Array.isArray(user.customCategories) ? [...user.customCategories] : [];
    const spaceIndex = spaces.findIndex(s => s.id === id || s.name === id);

    if (spaceIndex === -1) {
      return errorResponse('Space not found.', 404);
    }

    const oldName = spaces[spaceIndex].name;
    const newName = name ? name.trim() : oldName;

    // Check duplicate name if renamed
    if (newName !== oldName && spaces.some((s, idx) => idx !== spaceIndex && s.name.toLowerCase() === newName.toLowerCase())) {
      return errorResponse(`A space named "${newName}" already exists.`, 400);
    }

    spaces[spaceIndex] = {
      ...spaces[spaceIndex],
      name: newName,
      icon: (icon && icon.trim()) || spaces[spaceIndex].icon || '🚀',
      color: color || spaces[spaceIndex].color || 'cyan',
      colorHex: colorHex || spaces[spaceIndex].colorHex || '#06b6d4',
      desc: desc !== undefined ? desc.trim() : spaces[spaceIndex].desc,
      updatedAt: new Date().toISOString()
    };

    let updatedSegments = user.departmentSegments || {};
    if (oldName !== newName && updatedSegments[oldName]) {
      updatedSegments[newName] = updatedSegments[oldName];
      delete updatedSegments[oldName];
    }
    if (segments && Array.isArray(segments)) {
      updatedSegments[newName] = segments;
    }

    // Also update any tasks with the old category name if renamed
    if (oldName !== newName) {
      await prisma.task.updateMany({
        where: { userId: auth.userId, category: oldName },
        data: { category: newName }
      }).catch(err => console.warn('Could not rename tasks category:', err));
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        customCategories: spaces,
        departmentSegments: updatedSegments
      },
      select: {
        id: true,
        customCategories: true,
        departmentSegments: true
      }
    });

    return successResponse({
      message: `Space "${newName}" updated successfully!`,
      space: spaces[spaceIndex],
      spaces: updatedUser.customCategories
    });
  } catch (err) {
    console.error('Update custom space error:', err);
    return errorResponse('Failed to update custom space.');
  }
}

export async function DELETE(req, context) {
  try {
    const auth = getAuthUser(req);
    if (!auth || !auth.authenticated || !auth.userId) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;
    if (!id) return errorResponse('Space ID is required.', 400);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, customCategories: true, departmentSegments: true }
    });

    if (!user) return errorResponse('User not found', 404);

    const spaces = Array.isArray(user.customCategories) ? [...user.customCategories] : [];
    const spaceToDelete = spaces.find(s => s.id === id || s.name === id);

    if (!spaceToDelete) {
      return errorResponse('Space not found.', 404);
    }

    const filteredSpaces = spaces.filter(s => s.id !== id && s.name !== id);
    const updatedSegments = { ...(user.departmentSegments || {}) };
    delete updatedSegments[spaceToDelete.name];

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        customCategories: filteredSpaces,
        departmentSegments: updatedSegments
      },
      select: {
        id: true,
        customCategories: true,
        departmentSegments: true
      }
    });

    return successResponse({
      message: `Space "${spaceToDelete.name}" removed successfully.`,
      spaces: updatedUser.customCategories
    });
  } catch (err) {
    console.error('Delete custom space error:', err);
    return errorResponse('Failed to delete custom space.');
  }
}
