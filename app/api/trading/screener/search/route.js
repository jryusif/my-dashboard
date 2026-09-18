import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecTickersDirectory, COUNTRY_FLAGS, COUNTRY_CODES } from '@/lib/sec-provider';
import { KNOWN_ISRAEL_TICKERS } from '@/lib/shariah-config';

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
      const isIsrael = (c.country || '').toLowerCase() === 'israel' || 
        (c.country || '').toLowerCase() === 'il' || 
        (c.incCountry || '').toLowerCase() === 'israel' || 
        (c.incCountry || '').toLowerCase() === 'il' || 
        KNOWN_ISRAEL_TICKERS.has(c.ticker.toUpperCase());
      const country = isIsrael ? 'Israel' : (c.country || 'United States');
      resultsMap.set(c.ticker, {
        ticker: c.ticker,
        name: c.name,
        exchange: c.exchange || 'US Market',
        sector: c.sector || null,
        country,
        countryCode: isIsrael ? 'il' : (COUNTRY_CODES[country] || 'us'),
        countryFlag: isIsrael ? '🇮🇱' : (COUNTRY_FLAGS[country] || '🌐'),
        isExcluded: isIsrael
      });
    });

    // 2. Supplement from SEC company tickers directory
    try {
      const secDir = await getSecTickersDirectory();
      let matchedCount = 0;

      // Check exact match first
      if (secDir.has(upperQ) && !resultsMap.has(upperQ)) {
        const item = secDir.get(upperQ);
        const isIsrael = KNOWN_ISRAEL_TICKERS.has(item.ticker.toUpperCase());
        resultsMap.set(item.ticker, {
          ticker: item.ticker,
          name: item.name,
          exchange: 'US Market',
          country: isIsrael ? 'Israel' : 'United States',
          countryCode: isIsrael ? 'il' : 'us',
          countryFlag: isIsrael ? '🇮🇱' : '🇺🇸',
          isExcluded: isIsrael
        });
      }

      // Check prefix / startsWith matches
      for (const [ticker, item] of secDir.entries()) {
        if (resultsMap.size >= 8) break;
        if (ticker.startsWith(upperQ) && !resultsMap.has(ticker)) {
          const isIsrael = KNOWN_ISRAEL_TICKERS.has(item.ticker.toUpperCase());
          resultsMap.set(ticker, {
            ticker: item.ticker,
            name: item.name,
            exchange: 'US Market',
            country: isIsrael ? 'Israel' : 'United States',
            countryCode: isIsrael ? 'il' : 'us',
            countryFlag: isIsrael ? '🇮🇱' : '🇺🇸',
            isExcluded: isIsrael
          });
        }
      }

      // Check name contains matches if still under 8
      if (resultsMap.size < 8) {
        for (const [ticker, item] of secDir.entries()) {
          if (resultsMap.size >= 8) break;
          if (item.name.toLowerCase().includes(query.toLowerCase()) && !resultsMap.has(ticker)) {
            const isIsrael = KNOWN_ISRAEL_TICKERS.has(item.ticker.toUpperCase());
            resultsMap.set(ticker, {
              ticker: item.ticker,
              name: item.name,
              exchange: 'US Market',
              country: isIsrael ? 'Israel' : 'United States',
              countryCode: isIsrael ? 'il' : 'us',
              countryFlag: isIsrael ? '🇮🇱' : '🇺🇸',
              isExcluded: isIsrael
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
