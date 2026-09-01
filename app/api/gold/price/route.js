import { NextResponse } from 'next/server';
import { getLiveGoldPrice } from '@/lib/gold.js';
import { getAuthUser } from '@/lib/auth.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') || (auth?.authenticated ? auth.user?.currency : null) || 'USD';
  const goldPrice = await getLiveGoldPrice(currency);
  return NextResponse.json(goldPrice);
}
