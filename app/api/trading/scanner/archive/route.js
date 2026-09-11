import { NextResponse } from 'next/server';
import { toggleArchiveOpportunity } from '@/lib/scanner-service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, isArchived = true } = body;

    if (!id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const updated = await toggleArchiveOpportunity(id, isArchived);
    return NextResponse.json({ success: true, opportunity: updated });
  } catch (error) {
    console.error('[API Scanner Archive] Error:', error);
    return NextResponse.json(
      { error: 'Failed to archive opportunity', message: error.message },
      { status: 500 }
    );
  }
}
