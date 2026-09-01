import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function POST(req, { params }) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const { keyResultId } = await req.json();
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id, userId }
    });

    if (!milestone) return errorResponse('Milestone not found.', 404);

    let keyResults = Array.isArray(milestone.keyResults) ? [...milestone.keyResults] : [];
    const targetKr = keyResults.find(k => k.id === keyResultId);
    if (targetKr) {
      targetKr.done = !targetKr.done;
      const total = keyResults.length;
      const doneCount = keyResults.filter(k => k.done).length;
      const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      let status = milestone.status;
      if (progressPct === 100) status = 'completed';
      else if (progressPct > 0) status = 'in_progress';

      const updated = await prisma.roadmapMilestone.update({
        where: { id },
        data: {
          keyResults,
          progressPct,
          status
        }
      });
      return successResponse(updated);
    }

    return successResponse(milestone);
  } catch (err) {
    console.error('Error toggling key result:', err);
    return errorResponse('Could not toggle key result.');
  }
}
