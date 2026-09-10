import { resolveTickerCik, getSecSharesAndFloat, getStockAnalysisOverview } from './sec-provider.js';

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

  // 3. Resolve Shares Outstanding, Market Cap & Free Float with Automatic Fallback
  let sharesOutstanding = null;
  let marketCap = null;
  let freeFloat = null;
  const fallbackSources = [];

  // Use pre-resolved SEC values from caller if provided
  if (secCompanyData?.sharesOutstanding) {
    sharesOutstanding = secCompanyData.sharesOutstanding;
    if (quoteData.price > 0) {
      marketCap = Math.round(sharesOutstanding * quoteData.price);
    }
    fallbackSources.push('SEC EDGAR');
  }
  if (secCompanyData?.publicFloatUsd && quoteData.price > 0) {
    freeFloat = Math.round(secCompanyData.publicFloatUsd / quoteData.price);
    if (!fallbackSources.includes('SEC EDGAR')) fallbackSources.push('SEC EDGAR');
  }

  // Fallback 1: SEC EDGAR Company Facts API (Official DEI / US-GAAP disclosures)
  if (!sharesOutstanding || !freeFloat || !marketCap) {
    try {
      let cik = secCompanyData?.cik;
      if (!cik) {
        const secInfo = await resolveTickerCik(normTicker);
        cik = secInfo?.cik;
      }
      if (cik) {
        const secData = await getSecSharesAndFloat(cik);
        if (secData) {
          if (!sharesOutstanding && secData.sharesOutstanding) {
            sharesOutstanding = secData.sharesOutstanding;
            if (!marketCap && quoteData.price > 0) {
              marketCap = Math.round(sharesOutstanding * quoteData.price);
            }
            if (!fallbackSources.includes('SEC EDGAR')) fallbackSources.push('SEC EDGAR');
          }
          if (!freeFloat && secData.publicFloatUsd && quoteData.price > 0) {
            freeFloat = Math.round(secData.publicFloatUsd / quoteData.price);
            if (!fallbackSources.includes('SEC EDGAR')) fallbackSources.push('SEC EDGAR');
          }
        }
      }
    } catch (secErr) {
      console.warn(`SEC EDGAR fallback for ${normTicker} shares/float failed:`, secErr.message);
    }
  }

  // Fallback 2: Financial Modeling Prep (FMP free tier if key configured)
  const fmpKey = process.env.FMP_API_KEY;
  if (fmpKey && (!sharesOutstanding || !freeFloat || !marketCap)) {
    try {
      if (!marketCap || !sharesOutstanding) {
        const profileRes = await fetch(`https://financialmodelingprep.com/api/v3/profile/${normTicker}?apikey=${fmpKey}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = Array.isArray(profileData) ? profileData[0] : profileData;
          if (p) {
            if (!marketCap && p.mktCap) marketCap = p.mktCap;
            if (!sharesOutstanding && p.sharesOutstanding) sharesOutstanding = p.sharesOutstanding;
            if (!marketCap && sharesOutstanding && quoteData.price > 0) {
              marketCap = Math.round(sharesOutstanding * quoteData.price);
            }
            if (!fallbackSources.includes('Financial Modeling Prep')) fallbackSources.push('Financial Modeling Prep');
          }
        }
      }
      if (!freeFloat) {
        const floatRes = await fetch(`https://financialmodelingprep.com/api/v4/shares_float?symbol=${normTicker}&apikey=${fmpKey}`);
        if (floatRes.ok) {
          const floatData = await floatRes.json();
          const f = Array.isArray(floatData) ? floatData[0] : floatData;
          if (f?.floatShares) {
            freeFloat = f.floatShares;
            if (!fallbackSources.includes('Financial Modeling Prep')) fallbackSources.push('Financial Modeling Prep');
          }
        }
      }
    } catch (fmpErr) {
      console.warn(`FMP fallback for ${normTicker} failed:`, fmpErr.message);
    }
  }

  // Fallback 3: Alpha Vantage OVERVIEW (if key configured)
  const alphaKey = process.env.ALPHAVANTAGE_API_KEY;
  if (alphaKey && (!sharesOutstanding || !freeFloat || !marketCap)) {
    try {
      const alphaRes = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${normTicker}&apikey=${alphaKey}`);
      if (alphaRes.ok) {
        const overview = await alphaRes.json();
        if (overview && overview.Symbol) {
          if (!marketCap && overview.MarketCapitalization && overview.MarketCapitalization !== 'None') {
            marketCap = Number(overview.MarketCapitalization);
          }
          if (!sharesOutstanding && overview.SharesOutstanding && overview.SharesOutstanding !== 'None') {
            sharesOutstanding = Number(overview.SharesOutstanding);
            if (!marketCap && quoteData.price > 0) {
              marketCap = Math.round(sharesOutstanding * quoteData.price);
            }
          }
          if (!freeFloat && overview.SharesFloat && overview.SharesFloat !== 'None') {
            freeFloat = Number(overview.SharesFloat);
          }
          if (!fallbackSources.includes('Alpha Vantage')) fallbackSources.push('Alpha Vantage');
        }
      }
    } catch (alphaErr) {
      console.warn(`Alpha Vantage fallback for ${normTicker} failed:`, alphaErr.message);
    }
  }

  // Fallback 4: Finnhub Company Profile2 (if key configured and values still missing)
  if (finnhubKey && (!sharesOutstanding || !marketCap)) {
    try {
      const pRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${normTicker}&token=${finnhubKey}`);
      if (pRes.ok) {
        const p = await pRes.json();
        if (p) {
          if (!sharesOutstanding && p.shareOutstanding) {
            sharesOutstanding = Math.round(p.shareOutstanding * 1_000_000);
            if (!marketCap && quoteData.price > 0) {
              marketCap = Math.round(sharesOutstanding * quoteData.price);
            }
            if (!fallbackSources.includes('Finnhub')) fallbackSources.push('Finnhub');
          } else if (!marketCap && p.marketCapitalization) {
            marketCap = Math.round(p.marketCapitalization * 1_000_000);
            if (!fallbackSources.includes('Finnhub')) fallbackSources.push('Finnhub');
          }
        }
      }
    } catch (_) {}
  }

  // Fallback 5: StockAnalysis.com (automatic cross-check if market cap/shares missing or underreported)
  if (!marketCap || !sharesOutstanding || (freeFloat && sharesOutstanding < freeFloat)) {
    try {
      const sa = await getStockAnalysisOverview(normTicker);
      if (sa) {
        if (sa.sharesOut && (!sharesOutstanding || sa.sharesOut > sharesOutstanding)) {
          sharesOutstanding = sa.sharesOut;
          if (quoteData.price > 0) {
            marketCap = Math.round(sharesOutstanding * quoteData.price);
          }
          if (!fallbackSources.includes('StockAnalysis.com')) fallbackSources.push('StockAnalysis.com');
        }
        if (sa.marketCap && (!marketCap || (sharesOutstanding && marketCap * 2 < sa.marketCap))) {
          marketCap = sa.marketCap;
          if (!fallbackSources.includes('StockAnalysis.com')) fallbackSources.push('StockAnalysis.com');
        }
      }
    } catch (_) {}
  }

  // Logical sanity check: Free float cannot physically exceed total shares outstanding
  if (sharesOutstanding && freeFloat && freeFloat > sharesOutstanding) {
    sharesOutstanding = freeFloat;
    if (quoteData.price > 0 && (!marketCap || marketCap < sharesOutstanding * quoteData.price)) {
      marketCap = Math.round(sharesOutstanding * quoteData.price);
    }
  }

  // Determine final Source label with explicit fallback indication
  let finalSource = quoteData.source;
  const isFallbackUsed = fallbackSources.length > 0;
  if (isFallbackUsed) {
    const fallbackDesc = fallbackSources.join(' & ');
    if (quoteData.source.includes('Consolidated')) {
      finalSource = `Public Market Feed (Fallback: ${fallbackDesc})`;
    } else {
      finalSource = `${quoteData.source} (Fallback: ${fallbackDesc})`;
    }
  }

  // 4. Bid / Ask details
  const bidAskInfo = {
    bid: null,
    ask: null,
    spread: null,
    statusText: 'Bid/Ask unavailable on current free feed',
    isRealTime: false
  };

  // 5. Format New York / Eastern Time timestamp
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
    source: finalSource,
    isFallbackUsed: isFallbackUsed,
    fallbackSource: isFallbackUsed ? fallbackSources.join(' & ') : null,
    dataQuality: quoteData.isRealTime ? 'HIGH' : (isFallbackUsed ? 'MEDIUM-HIGH' : 'MEDIUM')
  };
}
