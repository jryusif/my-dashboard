import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma.js';

// Configuration thresholds
export const SCANNER_CONFIG = {
  minPrice: 1.0,
  maxPrice: 20.0,
  minRvol: 3.0,               // Current volume >= 3x average volume
  minMomentumPct: 5.0,        // Short-term (5-15m) or day surge >= +5%
  maxNewsAgeMinutes: 45,      // Freshness window (allows pre-market / recent breaking news)
  finnhubCallsPerMinute: 55,  // Safe ceiling under the 60 call/min free tier limit
  jsonFilePath: path.join(process.cwd(), 'data', 'scanner_opportunities.json'),
  processedNewsFilePath: path.join(process.cwd(), 'data', 'processed_news.json')
};

// Catalyst keyword dictionaries
export const CATALYST_RULES = [
  {
    type: 'FDA & Biotech',
    badge: 'FDA Approval',
    importance: 'HIGH',
    keywords: [
      'fda approval', 'fda approves', 'fda cleared', 'fda clears', 'fda clearance',
      'fda accepted', 'fda grants', 'fast track', 'orphan drug', 'breakthrough therapy',
      'phase 1', 'phase 2', 'phase 3', 'phase i', 'phase ii', 'phase iii',
      'clinical trial', 'topline results', 'primary endpoint', 'positive trial results',
      'nda approval', 'ind clearance', 'patent granted', 'ce mark'
    ]
  },
  {
    type: 'Earnings & Guidance',
    badge: 'Earnings Beat',
    importance: 'HIGH',
    keywords: [
      'reports q1', 'reports q2', 'reports q3', 'reports q4', 'quarterly results',
      'earnings beat', 'revenue beat', 'eps beat', 'record revenue', 'record sales',
      'beats estimates', 'raises guidance', 'raises outlook', 'boosts outlook',
      'profit surge', 'net income jumps', 'swings to profit', 'record earnings'
    ]
  },
  {
    type: 'Contracts & Deals',
    badge: 'Major Contract',
    importance: 'HIGH',
    keywords: [
      'awarded contract', 'wins contract', 'secures contract', 'multi-year contract',
      'defense contract', 'pentagon contract', 'government contract', 'purchase order',
      'commercial agreement', 'strategic partnership', 'collaboration agreement',
      'joint venture', 'distribution agreement', 'exclusive licensing', 'master service agreement'
    ]
  },
  {
    type: 'Mergers & Acquisitions',
    badge: 'M&A / Buyout',
    importance: 'HIGH',
    keywords: [
      'to be acquired', 'acquisition of', 'merger with', 'definitive agreement',
      'buyout offer', 'takeover proposal', 'all-cash transaction', 'tender offer',
      'merger agreement', 'unsolicited offer', 'strategic alternatives'
    ]
  },
  {
    type: 'Analyst Action',
    badge: 'Analyst Upgrade',
    importance: 'MEDIUM',
    keywords: [
      'upgrades', 'upgraded to buy', 'upgraded to overweight', 'upgraded to outperform',
      'initiates coverage with buy', 'price target raised', 'target lifted',
      'pt raised', 'reiterates buy', 'top pick'
    ]
  },
  {
    type: 'Corporate Catalyst',
    badge: 'Catalyst',
    importance: 'MEDIUM',
    keywords: [
      'share buyback', 'stock repurchase', 'special dividend', 'restructuring',
      'strategic pivot', 'unveils new product', 'commercial launch', 'patent award'
    ]
  }
];

// Leaky Bucket / Token Bucket Rate Limiter for Finnhub
class RateLimiter {
  constructor(callsPerMinute) {
    this.intervalMs = Math.ceil(60000 / callsPerMinute);
    this.queue = [];
    this.isProcessing = false;
  }

  async schedule(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
      if (this.queue.length > 0) {
        await new Promise(r => setTimeout(r, this.intervalMs));
      }
    }

    this.isProcessing = false;
  }
}

const finnhubLimiter = new RateLimiter(SCANNER_CONFIG.finnhubCallsPerMinute);

// In-Memory processed cache to speed up lookups
const inMemoryProcessedNews = new Set();
let scannerStatusState = {
  isRunning: false,
  lastScanAt: null,
  lastOpportunitiesCount: 0,
  totalProcessedCount: 0,
  lastError: null
};

/**
 * Initialize processed news cache from DB and JSON backup
 */
async function initProcessedCache() {
  if (inMemoryProcessedNews.size > 0) return;

  try {
    const recent = await prisma.stockProcessedNews.findMany({
      take: 2000,
      orderBy: { processedAt: 'desc' }
    });
    for (const item of recent) {
      inMemoryProcessedNews.add(item.newsId);
    }
  } catch (err) {
    console.warn('[Scanner] DB processed cache read failed, trying JSON backup:', err.message);
  }

  try {
    if (fs.existsSync(SCANNER_CONFIG.processedNewsFilePath)) {
      const raw = fs.readFileSync(SCANNER_CONFIG.processedNewsFilePath, 'utf8');
      const list = JSON.parse(raw);
      for (const id of list) inMemoryProcessedNews.add(id);
    }
  } catch (_) {}
}

/**
 * Classify news article into catalyst categories
 */
export function classifyNewsArticle(headline, summary = '') {
  const fullText = `${headline} ${summary}`.toLowerCase();

  for (const rule of CATALYST_RULES) {
    for (const kw of rule.keywords) {
      // Regex boundary check for words
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullText)) {
        return {
          matched: true,
          catalystType: rule.type,
          catalystBadge: rule.badge,
          importance: rule.importance,
          matchedKeyword: kw
        };
      }
    }
  }

  return { matched: false };
}

/**
 * Extract ticker candidates from article
 */
export function extractTickerCandidates(article) {
  const candidates = new Set();

  // 1. Finnhub 'related' field: "AAPL,TSLA" or "AAPL"
  if (article.related && typeof article.related === 'string') {
    const symbols = article.related.split(',').map(s => s.trim().toUpperCase());
    for (const s of symbols) {
      if (/^[A-Z]{1,5}$/.test(s)) candidates.add(s);
    }
  }

  // 2. Look for patterns in headline like "$TICKER" or "(NASDAQ: TICKER)" or "(NYSE: TICKER)"
  const text = `${article.headline || ''} ${article.summary || ''}`;
  const cashtagMatches = text.match(/\$([A-Z]{1,5})\b/g);
  if (cashtagMatches) {
    for (const m of cashtagMatches) {
      candidates.add(m.replace('$', '').toUpperCase());
    }
  }

  const exchangeMatches = text.match(/\b(NASDAQ|NYSE|AMEX):\s*([A-Z]{1,5})\b/gi);
  if (exchangeMatches) {
    for (const m of exchangeMatches) {
      const parts = m.split(':');
      if (parts[1]) candidates.add(parts[1].trim().toUpperCase());
    }
  }

  // 3. Parentheses ticker format: "VBI Vaccines (VBIV)"
  const parenMatches = text.match(/\(([A-Z]{1,5})\)/g);
  if (parenMatches) {
    for (const m of parenMatches) {
      const sym = m.replace(/[()]/g, '').toUpperCase();
      // Filter out non-ticker acronyms (FDA, SEC, CEO, CFO, AI, USD, EV, US)
      if (!['FDA', 'SEC', 'CEO', 'CFO', 'CTO', 'COO', 'AI', 'USD', 'EUR', 'GBP', 'EV', 'USA', 'EPA', 'CDC', 'NIH', 'DOD', 'NASA', 'DOE', 'LLC', 'INC'].includes(sym)) {
        candidates.add(sym);
      }
    }
  }

  // Ignore market indices or broad ETFs
  candidates.delete('SPY');
  candidates.delete('QQQ');
  candidates.delete('IWM');
  candidates.delete('DIA');
  candidates.delete('VIX');

  return Array.from(candidates);
}

/**
 * Fetch market quote and volume for ticker with fallbacks
 */
export async function fetchQuoteAndVolume(ticker) {
  const normTicker = ticker.toUpperCase();
  const finnhubKey = process.env.FINNHUB_API_KEY;

  let quote = null;

  // 1. Try Finnhub quote if API key is present
  if (finnhubKey) {
    try {
      quote = await finnhubLimiter.schedule(async () => {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${normTicker}&token=${finnhubKey}`);
        if (!res.ok) return null;
        const q = await res.json();
        if (q && q.c > 0) {
          return {
            price: Number(q.c.toFixed(2)),
            changePct: Number(q.dp ? q.dp.toFixed(2) : 0),
            high: q.h,
            low: q.l,
            open: q.o,
            prevClose: q.pc,
            source: 'Finnhub'
          };
        }
        return null;
      });
    } catch (err) {
      console.warn(`[Scanner] Finnhub quote for ${normTicker} error:`, err.message);
    }
  }

  // 2. Fetch Chart (5m intervals) from Yahoo Finance free consolidated feed for momentum & volume
  let chartMetrics = null;
  try {
    const chartRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normTicker}?interval=5m&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (chartRes.ok) {
      const data = await chartRes.json();
      const result = data.chart?.result?.[0];
      if (result && result.meta) {
        const meta = result.meta;
        const indicators = result.indicators?.quote?.[0] || {};
        const closes = (indicators.close || []).filter(c => typeof c === 'number' && c > 0);
        const volumes = (indicators.volume || []).filter(v => typeof v === 'number' && v >= 0);

        const currentPrice = meta.regularMarketPrice || (closes.length > 0 ? closes[closes.length - 1] : 0);
        const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
        const changePct = prevClose > 0 ? Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2)) : 0;
        const totalVolume = meta.regularMarketVolume || (volumes.reduce((a, b) => a + b, 0));

        // Calculate Momentum: price change in last 5m - 15m
        let momentum5m = 0;
        if (closes.length >= 2) {
          const lastClose = closes[closes.length - 1];
          const prev5m = closes[closes.length - 2];
          if (prev5m > 0) {
            momentum5m = Number((((lastClose - prev5m) / prev5m) * 100).toFixed(2));
          }
        }
        // If 15m is available, use maximum short-term surge
        if (closes.length >= 4) {
          const lastClose = closes[closes.length - 1];
          const prev15m = closes[closes.length - 4];
          if (prev15m > 0) {
            const m15 = Number((((lastClose - prev15m) / prev15m) * 100).toFixed(2));
            if (Math.abs(m15) > Math.abs(momentum5m)) momentum5m = m15;
          }
        }

        // Relative Volume (RVOL) calculation:
        // Compare with 10-day average volume or estimate
        let avgVolume = null;
        let rvol = 1.0;

        // Fetch 1mo chart for 10-day volume baseline if needed
        try {
          const histRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${normTicker}?interval=1d&range=1mo`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
          );
          if (histRes.ok) {
            const histData = await histRes.json();
            const dailyVols = (histData.chart?.result?.[0]?.indicators?.quote?.[0]?.volume || [])
              .filter(v => typeof v === 'number' && v > 0);
            if (dailyVols.length > 1) {
              const last10 = dailyVols.slice(-11, -1);
              if (last10.length > 0) {
                avgVolume = Math.round(last10.reduce((a, b) => a + b, 0) / last10.length);
                if (avgVolume > 0 && totalVolume > 0) {
                  rvol = Number((totalVolume / avgVolume).toFixed(2));
                }
              }
            }
          }
        } catch (_) {}

        // Fallback for rvol if daily history failed: check recent volume spike in 5m bars
        if (rvol === 1.0 && volumes.length >= 3) {
          const recentBar = volumes[volumes.length - 1];
          const avgBar = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
          if (avgBar > 0) {
            rvol = Number((recentBar / avgBar).toFixed(2));
          }
        }

        chartMetrics = {
          price: Number(currentPrice.toFixed(2)),
          changePct: Number(changePct.toFixed(2)),
          volume: totalVolume,
          avgVolume: avgVolume || (totalVolume > 0 ? Math.round(totalVolume / (rvol || 1)) : null),
          rvol: rvol,
          momentum5m: momentum5m,
          companyName: meta.shortName || meta.longName || normTicker
        };
      }
    }
  } catch (err) {
    console.warn(`[Scanner] Chart metrics for ${normTicker} error:`, err.message);
  }

  // Merge quote & chart metrics
  const finalPrice = quote?.price || chartMetrics?.price || 0;
  const finalChangePct = quote?.changePct !== undefined ? quote.changePct : (chartMetrics?.changePct || 0);

  if (finalPrice <= 0) return null;

  return {
    ticker: normTicker,
    price: finalPrice,
    changePct: finalChangePct,
    volume: chartMetrics?.volume || null,
    avgVolume: chartMetrics?.avgVolume || null,
    rvol: chartMetrics?.rvol || 1.0,
    momentum5m: chartMetrics?.momentum5m || 0,
    companyName: chartMetrics?.companyName || normTicker
  };
}

/**
 * Check Shariah compliance from database
 */
export async function checkShariahCompliance(ticker) {
  const normTicker = ticker.toUpperCase();

  try {
    const company = await prisma.stockCompany.findUnique({
      where: { ticker: normTicker },
      include: {
        screenings: {
          orderBy: { screenedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!company) {
      return {
        status: 'UNCLASSIFIED',
        badge: 'غير مصنّف ⚪',
        companyName: null,
        sector: null,
        methodology: 'AAOIFI'
      };
    }

    const latest = company.screenings?.[0];
    if (!latest) {
      return {
        status: 'UNCLASSIFIED',
        badge: 'غير مصنّف ⚪',
        companyName: company.name,
        sector: company.sector,
        methodology: 'AAOIFI'
      };
    }

    if (latest.status === 'PASS') {
      return {
        status: 'PASS',
        badge: 'متوافق ✅',
        companyName: company.name,
        sector: company.sector,
        methodology: latest.methodology,
        debtRatio: latest.debtRatioPct,
        cashRatio: latest.cashRatioPct
      };
    } else if (latest.status === 'FAIL') {
      return {
        status: 'FAIL',
        badge: 'غير متوافق ❌',
        companyName: company.name,
        sector: company.sector,
        methodology: latest.methodology,
        debtRatio: latest.debtRatioPct,
        cashRatio: latest.cashRatioPct
      };
    } else {
      return {
        status: 'REVIEW_REQUIRED',
        badge: 'قيد المراجعة ⚠️',
        companyName: company.name,
        sector: company.sector,
        methodology: latest.methodology
      };
    }
  } catch (err) {
    console.error(`[Scanner] Shariah lookup error for ${normTicker}:`, err.message);
    return {
      status: 'UNCLASSIFIED',
      badge: 'غير مصنّف ⚪',
      companyName: null,
      sector: null,
      methodology: 'AAOIFI'
    };
  }
}

/**
 * Fetch fresh news articles from Finnhub & fallback feeds
 */
export async function fetchFreshNews() {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  const articles = [];

  // 1. Finnhub General Market News
  if (finnhubKey) {
    try {
      const res = await finnhubLimiter.schedule(async () => {
        return fetch(`https://finnhub.io/api/v1/news?category=general&minId=0&token=${finnhubKey}`);
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          for (const item of list) {
            articles.push({
              id: `finnhub_${item.id || item.datetime}`,
              headline: item.headline,
              summary: item.summary,
              url: item.url,
              source: item.source || 'Finnhub News',
              publishedAt: new Date(item.datetime * 1000),
              related: item.related
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Scanner] Finnhub general news fetch error:', err.message);
    }
  }

  // 2. Fetch from Yahoo Finance news feed
  try {
    const rssRes = await fetch('https://finance.yahoo.com/news/rssindex', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
        const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemContent.match(/<description>(.*?)<\/description>/);
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

        const headline = titleMatch ? titleMatch[1] : '';
        const summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, '') : '';
        const url = linkMatch ? linkMatch[1] : '';
        const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

        if (headline) {
          const hash = crypto.createHash('md5').update(`${headline}_${url}`).digest('hex');
          articles.push({
            id: `yahoo_${hash}`,
            headline,
            summary,
            url,
            source: 'Yahoo Financial Media',
            publishedAt,
            related: null
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Scanner] Yahoo RSS news fetch error:', err.message);
  }

  // Deduplicate and filter by freshness
  const now = Date.now();
  const maxAgeMs = SCANNER_CONFIG.maxNewsAgeMinutes * 60 * 1000;

  const freshArticles = articles.filter(a => {
    const ageMs = now - a.publishedAt.getTime();
    return ageMs >= 0 && ageMs <= maxAgeMs;
  });

  return freshArticles;
}

/**
 * Run one complete scanner cycle
 */
export async function runScannerCycle() {
  if (scannerStatusState.isRunning) {
    return {
      success: false,
      message: 'Scanner is already running. Please wait for the current cycle to complete.',
      status: scannerStatusState
    };
  }

  scannerStatusState.isRunning = true;
  await initProcessedCache();

  const cycleStartTime = new Date();
  const discoveredOpportunities = [];
  let evaluatedNewsCount = 0;
  let matchingNewsCount = 0;

  try {
    const freshArticles = await fetchFreshNews();
    evaluatedNewsCount = freshArticles.length;

    for (const article of freshArticles) {
      const newsUniqueId = article.id;

      // Skip already processed news
      if (inMemoryProcessedNews.has(newsUniqueId)) {
        continue;
      }

      // Step 1: Catalyst Keyword matching
      const catalystResult = classifyNewsArticle(article.headline, article.summary);
      if (!catalystResult.matched) {
        // Mark as processed so we don't re-evaluate non-catalyst articles
        inMemoryProcessedNews.add(newsUniqueId);
        continue;
      }

      matchingNewsCount++;

      // Step 2: Extract Tickers
      const tickers = extractTickerCandidates(article);
      if (tickers.length === 0) {
        inMemoryProcessedNews.add(newsUniqueId);
        continue;
      }

      // Step 3: Evaluate each ticker against Price, Volume (RVOL) & Momentum
      for (const ticker of tickers) {
        try {
          const metrics = await fetchQuoteAndVolume(ticker);
          if (!metrics) continue;

          // Price filter: $1 <= price <= $20
          if (metrics.price < SCANNER_CONFIG.minPrice || metrics.price > SCANNER_CONFIG.maxPrice) {
            continue;
          }

          // Volume / Momentum Condition: RVOL >= 3x OR Momentum >= +5% OR changePct >= +5%
          const isRvolMatched = metrics.rvol >= SCANNER_CONFIG.minRvol;
          const isMomentumMatched = metrics.momentum5m >= SCANNER_CONFIG.minMomentumPct || metrics.changePct >= SCANNER_CONFIG.minMomentumPct;

          if (!isRvolMatched && !isMomentumMatched) {
            continue;
          }

          // Step 4: Shariah Compliance Lookup
          const shariah = await checkShariahCompliance(ticker);

          // Matched Rule summary
          const matchedReasons = [];
          if (isRvolMatched) matchedReasons.push(`RVOL ${metrics.rvol}x (>= 3x)`);
          if (isMomentumMatched) matchedReasons.push(`Momentum +${metrics.momentum5m || metrics.changePct}%`);
          const matchedRule = `${catalystResult.catalystBadge} + ${matchedReasons.join(' & ')}`;

          const opportunity = {
            ticker,
            companyName: shariah.companyName || metrics.companyName || ticker,
            price: metrics.price,
            changePct: metrics.changePct,
            volume: metrics.volume,
            avgVolume: metrics.avgVolume,
            rvol: metrics.rvol,
            momentum5m: metrics.momentum5m,
            headline: article.headline,
            summary: article.summary || article.headline,
            newsUrl: article.url || null,
            newsSource: article.source,
            newsPublishedAt: article.publishedAt,
            catalyst: catalystResult.catalystBadge,
            shariahStatus: shariah.status,
            statusBadge: shariah.badge,
            isArchived: false,
            matchedRule,
            rawMetrics: {
              catalystType: catalystResult.catalystType,
              matchedKeyword: catalystResult.matchedKeyword,
              sector: shariah.sector,
              debtRatio: shariah.debtRatio || null,
              cashRatio: shariah.cashRatio || null
            },
            discoveredAt: new Date()
          };

          // Save to Neon PostgreSQL via Prisma
          try {
            const saved = await prisma.stockScannerOpportunity.create({
              data: opportunity
            });
            opportunity.id = saved.id;
          } catch (dbErr) {
            console.error('[Scanner] DB write opportunity error:', dbErr.message);
            opportunity.id = `opp_${Date.now()}_${ticker}`;
          }

          discoveredOpportunities.push(opportunity);
        } catch (tickerErr) {
          console.warn(`[Scanner] Error checking ticker ${ticker}:`, tickerErr.message);
        }
      }

      // Mark news as processed in DB and memory
      inMemoryProcessedNews.add(newsUniqueId);
      try {
        await prisma.stockProcessedNews.create({
          data: {
            newsId: newsUniqueId,
            ticker: tickers.join(','),
            headline: article.headline,
            publishedAt: article.publishedAt
          }
        });
      } catch (_) {}
    }

    // Update JSON file backup
    await syncOpportunitiesToJson();
    await syncProcessedNewsToJson();

    scannerStatusState.lastScanAt = cycleStartTime;
    scannerStatusState.lastOpportunitiesCount = discoveredOpportunities.length;
    scannerStatusState.totalProcessedCount += evaluatedNewsCount;
    scannerStatusState.lastError = null;

    return {
      success: true,
      timestamp: cycleStartTime.toISOString(),
      evaluatedNewsCount,
      matchingNewsCount,
      discoveredCount: discoveredOpportunities.length,
      opportunities: discoveredOpportunities
    };
  } catch (err) {
    console.error('[Scanner] Cycle execution failed:', err);
    scannerStatusState.lastError = err.message;
    return {
      success: false,
      error: err.message,
      evaluatedNewsCount,
      matchingNewsCount,
      discoveredCount: discoveredOpportunities.length
    };
  } finally {
    scannerStatusState.isRunning = false;
  }
}

/**
 * Backup opportunities to JSON file for offline / fallback access
 */
async function syncOpportunitiesToJson() {
  try {
    const opps = await prisma.stockScannerOpportunity.findMany({
      where: { isArchived: false },
      orderBy: { discoveredAt: 'desc' },
      take: 100
    });
    fs.writeFileSync(SCANNER_CONFIG.jsonFilePath, JSON.stringify(opps, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Scanner] Failed syncing opportunities to JSON:', err.message);
  }
}

/**
 * Backup processed news list to JSON
 */
async function syncProcessedNewsToJson() {
  try {
    const ids = Array.from(inMemoryProcessedNews).slice(-2000);
    fs.writeFileSync(SCANNER_CONFIG.processedNewsFilePath, JSON.stringify(ids), 'utf8');
  } catch (_) {}
}

/**
 * Get active opportunities with filtering & pagination
 */
export async function getScannerOpportunities(options = {}) {
  const {
    shariah = 'all', // 'all' | 'pass' | 'fail' | 'review' | 'unclassified'
    status = 'active', // 'active' | 'archived' | 'all'
    search = '',
    limit = 50,
    page = 1
  } = options;

  const where = {};

  if (status === 'active') where.isArchived = false;
  else if (status === 'archived') where.isArchived = true;

  if (shariah === 'pass') where.shariahStatus = 'PASS';
  else if (shariah === 'fail') where.shariahStatus = 'FAIL';
  else if (shariah === 'review') where.shariahStatus = 'REVIEW_REQUIRED';
  else if (shariah === 'unclassified') where.shariahStatus = 'UNCLASSIFIED';

  if (search) {
    where.OR = [
      { ticker: { contains: search.toUpperCase() } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { headline: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    const total = await prisma.stockScannerOpportunity.count({ where });
    const opportunities = await prisma.stockScannerOpportunity.findMany({
      where,
      orderBy: { discoveredAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    });

    // Compute Shariah Stats
    const passCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, shariahStatus: 'PASS' } });
    const failCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, shariahStatus: 'FAIL' } });
    const totalActive = await prisma.stockScannerOpportunity.count({ where: { isArchived: false } });

    return {
      opportunities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalActive,
        passCount,
        failCount,
        unclassifiedCount: totalActive - passCount - failCount
      }
    };
  } catch (err) {
    console.warn('[Scanner] DB query failed, falling back to JSON file:', err.message);

    // Fallback to JSON file
    if (fs.existsSync(SCANNER_CONFIG.jsonFilePath)) {
      try {
        const raw = fs.readFileSync(SCANNER_CONFIG.jsonFilePath, 'utf8');
        let list = JSON.parse(raw);
        if (status === 'active') list = list.filter(o => !o.isArchived);
        if (status === 'archived') list = list.filter(o => o.isArchived);
        if (shariah === 'pass') list = list.filter(o => o.shariahStatus === 'PASS');
        if (shariah === 'fail') list = list.filter(o => o.shariahStatus === 'FAIL');

        return {
          opportunities: list.slice(0, limit),
          pagination: { total: list.length, page: 1, limit, totalPages: 1 },
          stats: { totalActive: list.length, passCount: 0, failCount: 0, unclassifiedCount: 0 }
        };
      } catch (_) {}
    }

    return {
      opportunities: [],
      pagination: { total: 0, page: 1, limit, totalPages: 0 },
      stats: { totalActive: 0, passCount: 0, failCount: 0, unclassifiedCount: 0 }
    };
  }
}

/**
 * Archive / Unarchive opportunity
 */
export async function toggleArchiveOpportunity(id, archiveState = true) {
  try {
    const updated = await prisma.stockScannerOpportunity.update({
      where: { id },
      data: { isArchived: archiveState }
    });
    await syncOpportunitiesToJson();
    return updated;
  } catch (err) {
    throw new Error(`Failed to update opportunity archive state: ${err.message}`);
  }
}

/**
 * Delete opportunity
 */
export async function deleteOpportunity(id) {
  try {
    const deleted = await prisma.stockScannerOpportunity.delete({
      where: { id }
    });
    await syncOpportunitiesToJson();
    return deleted;
  } catch (err) {
    throw new Error(`Failed to delete opportunity: ${err.message}`);
  }
}

/**
 * Get current scanner status
 */
export function getScannerStatus() {
  return {
    ...scannerStatusState,
    config: {
      minPrice: SCANNER_CONFIG.minPrice,
      maxPrice: SCANNER_CONFIG.maxPrice,
      minRvol: SCANNER_CONFIG.minRvol,
      minMomentumPct: SCANNER_CONFIG.minMomentumPct,
      maxNewsAgeMinutes: SCANNER_CONFIG.maxNewsAgeMinutes,
      finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY)
    }
  };
}
