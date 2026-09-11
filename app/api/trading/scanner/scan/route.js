import { NextResponse } from 'next/server';
import { runScannerCycle } from '@/lib/scanner-service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const result = await runScannerCycle();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Scanner Scan] Error:', error);
    return NextResponse.json(
      { error: 'Scan cycle execution failed', message: error.message },
      { status: 500 }
    );
  }
}
