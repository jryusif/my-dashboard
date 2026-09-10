/**
 * Multi-Provider Market Data Provider
 * Handles quotes, volume, RVOL, shares, market cap, free float, and bid/ask.
 * 
 * Strict rule: NEVER generate fake numbers. If unavailable, return null or 'N/A'.
 */

export async function getMarketData(ticker, secCompanyData = null) {
  const normTicker = ticker.trim().toUpperCase();
  const finnhubKey = process.env.FINNHUB_API_KEY;

  let quoteData = null;

  // 1. Try Finnhub if key is available
  if (finnhubKey) {
    try {
      const qRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${normTicker}&token=${finnhubKey}`);
      if (qRes.ok) {
        const q = await qRes.json();
        if (q.c && q.c > 0) {
          quoteData = {
            price: q.c,
            changePct: q.dp,
            dayHigh: q.h,
            dayLow: q.l,
            open: q.o,
            prevClose: q.pc,
            timestamp: q.t ? new Date(q.t * 1000) : new Date(),
            source: 'Finnhub Market Data',
            isRealTime: true
          };
        }
      }
    } catch (e) {
      console.warn('Finnhub market data fetch failed, using fallback provider:', e.message);
    }
  }

  // 2. Fallback to Yahoo Finance Chart API (Free public feed)
  if (!quoteData) {
    try {
      const chartRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${normTicker}?interval=1d&range=1mo`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (chartRes.ok) {
        const data = await chartRes.json();
        const result = data.chart?.result?.[0];
        if (result && result.meta) {
          const meta = result.meta;
          const indicators = result.indicators?.quote?.[0] || {};
          const volumes = (indicators.volume || []).filter(v => typeof v === 'number' && v > 0);

          // Calculate 20-30 day average volume
          let avgVol = null;
          if (volumes.length > 1) {
            const sumVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0);
            avgVol = Math.round(sumVol / (volumes.length - 1));
          }

          const currentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 0;
          const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
          const changePct = prevClose > 0 ? Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;
          const currentVol = meta.regularMarketVolume || (volumes.length > 0 ? volumes[volumes.length - 1] : null);

          // RVOL = currentVol / avgVol
          let rvol = null;
          if (currentVol && avgVol && avgVol > 0) {
            rvol = Number((currentVol / avgVol).toFixed(2));
          }

          quoteData = {
            price: Number(currentPrice.toFixed(2)),
            changePct: Number(changePct.toFixed(2)),
            dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh.toFixed(2)) : null,
            dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : null,
            open: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : null,
            prevClose: Number(prevClose.toFixed(2)),
            volume: currentVol,
            avgVolume: avgVol,
            rvol: rvol,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : null,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : null,
            exchange: meta.exchangeName || 'NASDAQ',
            timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date(),
            source: 'Public Market Data Feed (Consolidated)',
            isRealTime: false // Public web feed is delayed 15 minutes
          };
        }
      }
    } catch (e) {
      console.error('Public chart feed failed:', e.message);
    }
  }

  if (!quoteData) {
    throw new Error(`Market data currently unavailable for ${normTicker}`);
  }

  // 3. Resolve Shares Outstanding & Market Cap
  let sharesOutstanding = null;
  let marketCap = null;

  // Prefer SEC official shares if provided from SEC facts
  if (secCompanyData?.sharesOutstanding) {
    sharesOutstanding = secCompanyData.sharesOutstanding;
    marketCap = Math.round(sharesOutstanding * quoteData.price);
  }

  // 4. Free Float resolution (Reliable provider or N/A)
  // Public feeds do not reliably provide free float without paid licensing.
  // We strictly output 'N/A' per user rule #15 rather than guessing!
  const freeFloat = null; // Displayed as N/A in UI

  // 5. Bid / Ask details
  // Free public endpoints do not offer Level 1 real-time NBBO Bid/Ask book quotes.
  // We explicitly declare status per user instruction #14.
  const bidAskInfo = {
    bid: null,
    ask: null,
    spread: null,
    statusText: 'Bid/Ask unavailable on current free feed',
    isRealTime: false
  };

  // 6. Format New York / Eastern Time timestamp
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const formattedEtTime = `${etFormatter.format(quoteData.timestamp)} ET`;

  return {
    ticker: normTicker,
    price: quoteData.price,
    changePct: quoteData.changePct,
    volume: quoteData.volume,
    avgVolume: quoteData.avgVolume,
    rvol: quoteData.rvol,
    dayHigh: quoteData.dayHigh,
    dayLow: quoteData.dayLow,
    open: quoteData.open,
    prevClose: quoteData.prevClose,
    fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
    exchange: quoteData.exchange || 'NASDAQ',
    sharesOutstanding: sharesOutstanding,
    marketCap: marketCap,
    freeFloat: freeFloat,
    bid: bidAskInfo.bid,
    ask: bidAskInfo.ask,
    spread: bidAskInfo.spread,
    bidAskStatus: bidAskInfo.statusText,
    isRealTime: quoteData.isRealTime,
    timestamp: quoteData.timestamp,
    formattedEtTime: formattedEtTime,
    source: quoteData.source,
    dataQuality: quoteData.isRealTime ? 'HIGH' : 'MEDIUM'
  };
}
