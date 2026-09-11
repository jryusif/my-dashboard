import { NextResponse } from 'next/server';
import { getScannerOpportunities } from '@/lib/scanner-service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shariah = searchParams.get('shariah') || 'all';
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = await getScannerOpportunities({
      shariah,
      status,
      search,
      limit,
      page
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Scanner Opportunities] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scanner opportunities', message: error.message },
      { status: 500 }
    );
  }
}
