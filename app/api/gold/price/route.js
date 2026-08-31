import { NextResponse } from 'next/server';

export async function GET() {
  const pricePerOunceUsd = 2750.50;
  const pricePerGramUsd24 = 88.43;
  const usdToEgp = 49.30;
  const pricePerGramEgp24 = Math.round(pricePerGramUsd24 * usdToEgp);
  const pricePerGramEgp21 = Math.round(pricePerGramEgp24 * (21 / 24));
  const pricePerGramEgp18 = Math.round(pricePerGramEgp24 * (18 / 24));

  return NextResponse.json({
    pricePerOunceUsd,
    pricePerGramUsd24,
    pricePerGramEgp24,
    pricePerGramEgp21,
    pricePerGramEgp18,
    pricePerGram24k: pricePerGramUsd24,
    pricePerGram21k: Math.round(pricePerGramUsd24 * (21 / 24) * 100) / 100,
    pricePerGram18k: Math.round(pricePerGramUsd24 * (18 / 24) * 100) / 100,
    pricePerOunce: pricePerOunceUsd,
    updatedAt: new Date().toISOString(),
    stale: false
  });
}
