import { NextResponse } from 'next/server';

export async function GET() {
  const pricePerGram24k = 88.50;
  return NextResponse.json({
    pricePerGram24k,
    pricePerGram21k: Math.round(pricePerGram24k * (21 / 24) * 100) / 100,
    pricePerGram18k: Math.round(pricePerGram24k * (18 / 24) * 100) / 100,
    pricePerOunce: Math.round(pricePerGram24k * 31.1035 * 100) / 100,
    updatedAt: new Date().toISOString()
  });
}
