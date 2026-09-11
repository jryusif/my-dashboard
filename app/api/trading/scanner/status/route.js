import { NextResponse } from 'next/server';
import { getScannerStatus } from '@/lib/scanner-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getScannerStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[API Scanner Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scanner status', message: error.message },
      { status: 500 }
    );
  }
}
