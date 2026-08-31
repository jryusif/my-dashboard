import { NextResponse } from 'next/server';

let cachedGoldPrice = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours cache

export async function GET() {
  const now = Date.now();

  if (cachedGoldPrice && (now - lastFetchedAt < CACHE_TTL_MS)) {
    return NextResponse.json(cachedGoldPrice);
  }

  let pricePerOunceUsd = 2750.00;
  let usdToEgp = 50.35;

  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU', { next: { revalidate: 21600 } }),
      fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } })
    ]);

    if (goldRes.ok) {
      const goldData = await goldRes.json();
      if (goldData && typeof goldData.price === 'number') {
        pricePerOunceUsd = Math.round(goldData.price * 100) / 100;
      }
    }

    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (fxData && fxData.rates && typeof fxData.rates.EGP === 'number') {
        usdToEgp = Math.round(fxData.rates.EGP * 100) / 100;
      }
    }
  } catch (err) {
    console.warn('Live gold price fetch warning, using reference rate:', err);
  }

  const gramsPerOunce = 31.1034768;
  const pricePerGramUsd24 = Math.round((pricePerOunceUsd / gramsPerOunce) * 100) / 100;
  const pricePerGramEgp24 = Math.round(pricePerGramUsd24 * usdToEgp);
  const pricePerGramEgp21 = Math.round(pricePerGramEgp24 * (21 / 24));
  const pricePerGramEgp18 = Math.round(pricePerGramEgp24 * (18 / 24));
  const priceEgp = Math.round(pricePerOunceUsd * usdToEgp);

  cachedGoldPrice = {
    pricePerOunceUsd,
    pricePerGramUsd24,
    pricePerGramEgp24,
    pricePerGramEgp21,
    pricePerGramEgp18,
    pricePerGram24k: pricePerGramUsd24,
    pricePerGram21k: Math.round(pricePerGramUsd24 * (21 / 24) * 100) / 100,
    pricePerGram18k: Math.round(pricePerGramUsd24 * (18 / 24) * 100) / 100,
    pricePerOunce: pricePerOunceUsd,
    priceEgp,
    usdToEgp,
    updatedAt: new Date().toISOString(),
    stale: false,
    refreshIntervalHours: 6
  };

  lastFetchedAt = now;
  return NextResponse.json(cachedGoldPrice);
}
