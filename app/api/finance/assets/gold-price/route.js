import { NextResponse } from 'next/server';
import { getLiveGoldPrice } from '@/lib/gold.js';

export async function GET() {
  const goldPrice = await getLiveGoldPrice();
  return NextResponse.json(goldPrice);
}
