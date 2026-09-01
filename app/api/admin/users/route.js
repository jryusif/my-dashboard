import { prisma } from '@/lib/prisma.js';
import { requireAdmin, errorResponse, successResponse, forbiddenResponse } from '@/lib/auth.js';
import { isEmailConfigured, getAdminEmail } from '@/lib/email.js';

export async function GET(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return forbiddenResponse(adminCheck.error);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL';
    const searchQuery = searchParams.get('q') || '';

    const whereClause = {};

    if (statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      whereClause.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { specialty: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [users, totalUsers, pendingUsers, approvedUsers, adminUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
          dentalApproved: true,
          tradingApproved: true,
          approvedAt: true,
          approvedBy: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              tasks: true,
              routines: true,
              dentalCases: true,
              roadmapMilestones: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' }
        ]
      }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    return successResponse({
      users,
      stats: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        adminUsers,
        emailConfigured: isEmailConfigured(),
        adminEmail: getAdminEmail()
      }
    });
  } catch (err) {
    console.error('Admin users fetch error:', err);
    return errorResponse('Failed to fetch user list.');
  }
}
