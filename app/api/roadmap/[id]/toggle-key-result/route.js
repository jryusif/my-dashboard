import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const { keyResultId } = await req.json();
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id, userId: auth.userId }
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
