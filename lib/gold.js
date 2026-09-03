// Centralized Live Gold Pricing Service with 6-Hour Cache and Multi-Currency Conversion

let cachedData = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours

const DEFAULT_RATES = {
  USD: 1.0,
  EGP: 50.90,  // CBE rate Sep 2026 — updated from live API when available
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  KWD: 0.31,
  QAR: 3.64,
  CAD: 1.38,
  AUD: 1.52,
  CHF: 0.88,
  JPY: 154.50
};

export async function getLiveGoldPrice(targetCurrency = 'USD') {
  const now = Date.now();
  const currCode = (targetCurrency || 'USD').toUpperCase();

  if (!cachedData || (now - lastFetchedAt >= CACHE_TTL_MS)) {
    let pricePerOunceUsd = 4444.50; // Current Live Gold Spot
    let rates = { ...DEFAULT_RATES };

    try {
      const [goldRes, fxRes] = await Promise.allSettled([
        fetch('https://api.gold-api.com/price/XAU', { next: { revalidate: 21600 } }),
        fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 21600 } })
      ]);

      if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
        const goldData = await goldRes.value.json();
        if (goldData && typeof goldData.price === 'number' && goldData.price > 1000) {
          pricePerOunceUsd = Math.round(goldData.price * 100) / 100;
        }
      }

      if (fxRes.status === 'fulfilled' && fxRes.value.ok) {
        const fxData = await fxRes.value.json();
        if (fxData && fxData.rates && typeof fxData.rates === 'object') {
          rates = { ...rates, ...fxData.rates };
        }
      }
    } catch (err) {
      console.warn('Live gold price fetch warning, using baseline:', err);
    }

    cachedData = {
      pricePerOunceUsd,
      rates,
      updatedAt: new Date().toISOString(),
      stale: false,
      refreshIntervalHours: 6
    };
    lastFetchedAt = now;
  }

  const { pricePerOunceUsd, rates, updatedAt, stale, refreshIntervalHours } = cachedData;
  const gramsPerOunce = 31.1034768;
  const pricePerGramUsd24 = Math.round((pricePerOunceUsd / gramsPerOunce) * 100) / 100;

  const fxRate = rates[currCode] || rates.USD || 1.0;
  const egpRate = rates.EGP || 50.35;

  const pricePerGram24 = Math.round(pricePerGramUsd24 * fxRate * 100) / 100;
  const pricePerGram21 = Math.round(pricePerGram24 * (21 / 24) * 100) / 100;
  const pricePerGram18 = Math.round(pricePerGram24 * (18 / 24) * 100) / 100;

  // EGP specific calculations for backwards compatibility
  const pricePerGramEgp24 = Math.round(pricePerGramUsd24 * egpRate);
  const pricePerGramEgp21 = Math.round(pricePerGramEgp24 * (21 / 24));
  const pricePerGramEgp18 = Math.round(pricePerGramEgp24 * (18 / 24));

  return {
    currency: currCode,
    fxRate,
    pricePerOunceUsd, // Always in USD for Troy Ounce
    pricePerOunce: pricePerOunceUsd,
    pricePerGramUsd24,
    pricePerGram24,   // In user's selected currency
    pricePerGram21,
    pricePerGram18,
    pricePerGram24k: pricePerGram24,
    pricePerGram21k: pricePerGram21,
    pricePerGram18k: pricePerGram18,
    pricePerGramEgp24,
    pricePerGramEgp21,
    pricePerGramEgp18,
    priceEgp: Math.round(pricePerOunceUsd * egpRate),
    usdToEgp: egpRate,
    rates,
    updatedAt,
    stale,
    refreshIntervalHours
  };
}
