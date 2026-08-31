import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { next: { revalidate: 21600 } });
    let pricePerOunceUsd = 2750.00;
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.price === 'number') pricePerOunceUsd = data.price;
    }
    const pricePerGramUsd = Math.round((pricePerOunceUsd / 31.1034768) * 100) / 100;
    const usdToEgp = 50.35;
    const pricePerGramEgp = Math.round(pricePerGramUsd * usdToEgp);

    return NextResponse.json({
      pricePerOunceUsd,
      pricePerGramUsd,
      pricePerGramEgp,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      pricePerOunceUsd: 2750.00,
      pricePerGramUsd: 88.42,
      pricePerGramEgp: 4452,
      updatedAt: new Date().toISOString()
    });
  }
}
