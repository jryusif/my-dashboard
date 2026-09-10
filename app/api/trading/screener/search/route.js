import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecTickersDirectory } from '@/lib/sec-provider';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const upperQ = query.toUpperCase();

    // 1. Search existing companies in Database
    const dbCompanies = await prisma.stockCompany.findMany({
      where: {
        OR: [
          { ticker: { contains: upperQ, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 8
    });

    const resultsMap = new Map();
    dbCompanies.forEach(c => {
      resultsMap.set(c.ticker, {
        ticker: c.ticker,
        name: c.name,
        exchange: c.exchange || 'US Market',
        sector: c.sector || null,
        country: c.country || 'United States'
      });
    });

    // 2. Supplement from SEC company tickers directory
    try {
      const secDir = await getSecTickersDirectory();
      let matchedCount = 0;

      // Check exact match first
      if (secDir.has(upperQ) && !resultsMap.has(upperQ)) {
        const item = secDir.get(upperQ);
        resultsMap.set(item.ticker, {
          ticker: item.ticker,
          name: item.name,
          exchange: 'US Market',
          country: 'United States'
        });
      }

      // Check prefix / startsWith matches
      for (const [ticker, item] of secDir.entries()) {
        if (resultsMap.size >= 8) break;
        if (ticker.startsWith(upperQ) && !resultsMap.has(ticker)) {
          resultsMap.set(ticker, {
            ticker: item.ticker,
            name: item.name,
            exchange: 'US Market',
            country: 'United States'
          });
        }
      }

      // Check name contains matches if still under 8
      if (resultsMap.size < 8) {
        for (const [ticker, item] of secDir.entries()) {
          if (resultsMap.size >= 8) break;
          if (item.name.toLowerCase().includes(query.toLowerCase()) && !resultsMap.has(ticker)) {
            resultsMap.set(ticker, {
              ticker: item.ticker,
              name: item.name,
              exchange: 'US Market',
              country: 'United States'
            });
          }
        }
      }
    } catch (secErr) {
      console.warn('SEC directory search fallback warning:', secErr.message);
    }

    return NextResponse.json({
      query,
      results: Array.from(resultsMap.values()).slice(0, 8)
    });
  } catch (error) {
    console.error('Screener search error:', error);
    return NextResponse.json({ error: 'Failed to search stocks', results: [] }, { status: 500 });
  }
}
