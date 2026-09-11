import { NextResponse } from 'next/server';
import { deleteOpportunity } from '@/lib/scanner-service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const deleted = await deleteOpportunity(id);
    return NextResponse.json({ success: true, opportunity: deleted });
  } catch (error) {
    console.error('[API Scanner Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity', message: error.message },
      { status: 500 }
    );
  }
}
