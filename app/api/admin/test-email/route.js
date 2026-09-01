import { requireAdmin, errorResponse, successResponse, forbiddenResponse } from '@/lib/auth.js';
import { testSmtpConnection } from '@/lib/email.js';

export async function POST(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return forbiddenResponse(adminCheck.error);
    }

    const testResult = await testSmtpConnection();

    if (!testResult.ok) {
      return errorResponse(testResult.error, 400);
    }

    return successResponse({
      message: testResult.message,
      messageId: testResult.messageId
    });
  } catch (err) {
    console.error('Test email route error:', err);
    return errorResponse('Internal error running SMTP test.');
  }
}
