import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function POST(req, { params }) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();
    const { date, completed } = body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existingLog = await prisma.routineLog.findUnique({
      where: {
        userId_routineId_date: {
          userId: auth.userId,
          routineId: id,
          date: targetDate
        }
      }
    });

    let result;
    if (existingLog) {
      result = await prisma.routineLog.update({
        where: { id: existingLog.id },
        data: { completed: completed !== undefined ? Boolean(completed) : !existingLog.completed }
      });
    } else {
      result = await prisma.routineLog.create({
        data: {
          userId: auth.userId,
          routineId: id,
          date: targetDate,
          completed: completed !== undefined ? Boolean(completed) : true
        }
      });
    }

    return successResponse(result);
  } catch (err) {
    console.error('Error logging routine:', err);
    return errorResponse('Could not log routine.');
  }
}
