import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma.js';

// Configuration thresholds
export const SCANNER_CONFIG = {
  minPrice: 1.0,
  maxPrice: 20.0,
  minRvol: 2.0,               // Relative volume threshold (relaxed from 3x to 2x for early alerts)
  minMomentumPct: 4.0,        // Short-term (5-15m) or day surge >= +4% (relaxed for early alerts)
  maxNewsAgeHours: 48,        // News freshness window (covers pre-market and yesterday's after-hours)
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
      'joint venture', 'distribution agreement', 'exclusive licensing', 'master service agreement',
      'to start work on', 'million contract', 'billion contract'
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
      'pt raised', 'reiterates buy', 'top pick', 'doubles target'
    ]
  },
  {
    type: 'Corporate Catalyst',
    badge: 'Catalyst',
    importance: 'MEDIUM',
    keywords: [
      'share buyback', 'stock repurchase', 'special dividend', 'restructuring',
      'strategic pivot', 'unveils new product', 'commercial launch', 'patent award',
      'surges', 'advances', 'strength after', 'rally', 'soars'
    ]
  }
];

// Helper: Determine US Market Session (Pre-Market, Regular, After-Hours, Overnight/Weekend)
export function getMarketSession() {
  const now = new Date();
  const etStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
  const [hours, minutes] = etStr.split(':').map(Number);
  const timeNum = hours + minutes / 60;

  const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
  const dayName = dayFormatter.format(now);
  const isWeekend = dayName === 'Sat' || dayName === 'Sun';

  if (isWeekend) {
    return { name: 'Weekend / Pre-Open Standby', isLive: false, session: 'WEEKEND', badge: 'عطلة نهاية الأسبوع 💤' };
  }

  if (timeNum >= 4.0 && timeNum < 9.5) {
    return { name: 'Pre-Market Session (04:00 - 09:30 ET)', isLive: true, session: 'PRE_MARKET', badge: 'ما قبل الافتتاح (Pre-Market) 🌅' };
  } else if (timeNum >= 9.5 && timeNum < 16.0) {
    return { name: 'Regular Market Session (09:30 - 16:00 ET)', isLive: true, session: 'REGULAR', badge: 'جلسة السوق الرسمية 🟢' };
  } else if (timeNum >= 16.0 && timeNum < 20.0) {
    return { name: 'After-Hours Session (16:00 - 20:00 ET)', isLive: true, session: 'AFTER_HOURS', badge: 'ما بعد الإغلاق (After-Hours) 🌙' };
  } else {
    return { name: 'Overnight Market Closed', isLive: false, session: 'CLOSED', badge: 'إغلاق ليلي (Overnight) 💤' };
  }
}

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
  marketSession: getMarketSession(),
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
 * Fetch candidate moving stocks from live market screeners (Pre-Market, Gainers, Actives, Small Caps, Trending)
 */
export async function fetchLiveMarketMovers() {
  const currentSession = getMarketSession();
  const screeners = [
    'small_cap_gainers',
    'day_gainers',
    'most_actives',
    'aggressive_small_caps',
    'growth_technology_stocks'
  ];

  if (currentSession.session === 'PRE_MARKET') {
    screeners.unshift('pre_market_gainers');
  }

  const candidateMap = new Map();

  // 1. Fetch screeners in parallel with timeout
  await Promise.all(screeners.map(async (scrId) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=35`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(4000)
        }
      );

      if (res.ok) {
        const data = await res.json();
        const quotes = data.finance?.result?.[0]?.quotes || [];
        for (const q of quotes) {
          const sym = (q.symbol || '').trim().toUpperCase();
          if (!sym || !/^[A-Z]{1,5}$/.test(sym)) continue;

          // Resolve best price across Extended Hours & Regular Session
          let price = 0;
          let changePct = 0;
          let volume = 0;

          if (currentSession.session === 'PRE_MARKET' && q.preMarketPrice) {
            price = q.preMarketPrice;
            changePct = q.preMarketChangePercent || q.regularMarketChangePercent || 0;
            volume = q.preMarketVolume || q.regularMarketVolume || 0;
          } else if (currentSession.session === 'AFTER_HOURS' && q.postMarketPrice) {
            price = q.postMarketPrice;
            changePct = q.postMarketChangePercent || q.regularMarketChangePercent || 0;
            volume = q.postMarketVolume || q.regularMarketVolume || 0;
          } else {
            price = q.postMarketPrice || q.preMarketPrice || q.regularMarketPrice || 0;
            changePct = q.postMarketChangePercent || q.preMarketChangePercent || q.regularMarketChangePercent || 0;
            volume = q.postMarketVolume || q.preMarketVolume || q.regularMarketVolume || 0;
          }

          const avgVolume = q.averageDailyVolume10Day || q.averageDailyVolume3Month || 0;
          const rvol = (volume > 0 && avgVolume > 0) ? Number((volume / avgVolume).toFixed(2)) : 1.0;
          const sharesFloat = q.sharesOutstanding || null;
          const marketCap = q.marketCap || null;

          if (price >= SCANNER_CONFIG.minPrice && price <= SCANNER_CONFIG.maxPrice) {
            if (!candidateMap.has(sym)) {
              candidateMap.set(sym, {
                ticker: sym,
                companyName: q.shortName || q.longName || sym,
                price: Number(price.toFixed(2)),
                changePct: Number(changePct.toFixed(2)),
                volume,
                avgVolume,
                rvol,
                momentum5m: 0,
                sharesFloat,
                marketCap,
                sourceScreener: scrId
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Scanner] Screener fetch for ${scrId} failed:`, err.message);
    }
  }));

  // 2. Fetch US Trending tickers
  try {
    const trendRes = await fetch('https://query1.finance.yahoo.com/v1/finance/trending/US', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3500)
    });
    if (trendRes.ok) {
      const trendData = await trendRes.json();
      const trendQuotes = trendData.finance?.result?.[0]?.quotes || [];
      for (const t of trendQuotes) {
        const sym = (t.symbol || '').toUpperCase();
        if (sym && /^[A-Z]{1,5}$/.test(sym) && !candidateMap.has(sym)) {
          candidateMap.set(sym, {
            ticker: sym,
            companyName: sym,
            price: null,
            changePct: null,
            volume: null,
            avgVolume: null,
            rvol: 1.0,
            momentum5m: 0,
            sharesFloat: null,
            marketCap: null,
            sourceScreener: 'TRENDING_US'
          });
        }
      }
    }
  } catch (_) {}

  // 3. Also include stocks registered in the user's database
  try {
    const dbCompanies = await prisma.stockCompany.findMany({
      take: 40,
      select: { ticker: true, name: true }
    });
    for (const c of dbCompanies) {
      if (!candidateMap.has(c.ticker)) {
        candidateMap.set(c.ticker, {
          ticker: c.ticker,
          companyName: c.name,
          price: null,
          changePct: null,
          volume: null,
          avgVolume: null,
          rvol: 1.0,
          momentum5m: 0,
          sharesFloat: null,
          marketCap: null,
          sourceScreener: 'DB_WATCHLIST'
        });
      }
    }
  } catch (_) {}

  return Array.from(candidateMap.values());
}

/**
 * Fetch quote, extended hours (pre/post market) and 5m candle metrics
 */
export async function fetchQuoteAndVolume(ticker, existingCandidate = null) {
  const normTicker = ticker.toUpperCase();

  // If screener already provided valid price and volume, return it directly
  if (existingCandidate && existingCandidate.price && existingCandidate.price > 0) {
    return {
      ticker: normTicker,
      price: existingCandidate.price,
      changePct: existingCandidate.changePct,
      volume: existingCandidate.volume,
      avgVolume: existingCandidate.avgVolume,
      rvol: existingCandidate.rvol,
      momentum5m: existingCandidate.momentum5m || 0,
      sharesFloat: existingCandidate.sharesFloat || null,
      marketCap: existingCandidate.marketCap || null,
      companyName: existingCandidate.companyName || normTicker
    };
  }

  // 1. Try Finnhub quote if API key is present
  const finnhubKey = process.env.FINNHUB_API_KEY;
  let quote = null;
  if (finnhubKey) {
    try {
      quote = await finnhubLimiter.schedule(async () => {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${normTicker}&token=${finnhubKey}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (!res.ok) return null;
        const q = await res.json();
        if (q && q.c > 0) {
          return {
            price: Number(q.c.toFixed(2)),
            changePct: Number(q.dp ? q.dp.toFixed(2) : 0),
            source: 'Finnhub'
          };
        }
        return null;
      });
    } catch (_) {}
  }

  // 2. Fetch Extended Hours Chart from Yahoo Finance free feed
  let chartMetrics = null;
  try {
    const chartRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normTicker}?interval=5m&range=1d&includePrePost=true`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(3000)
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

        // Extended hours pricing
        const prevClose = meta.chartPreviousClose || meta.previousClose || 0;
        let activePrice = meta.regularMarketPrice || 0;
        let activeVolume = meta.regularMarketVolume || 0;

        if (closes.length > 0) {
          const lastBarClose = closes[closes.length - 1];
          if (lastBarClose > 0) activePrice = lastBarClose;
        }

        let changePct = 0;
        if (prevClose > 0 && activePrice > 0) {
          changePct = Number((((activePrice - prevClose) / prevClose) * 100).toFixed(2));
        }

        const totalVolume = activeVolume || (volumes.reduce((a, b) => a + b, 0));

        let momentum5m = 0;
        if (closes.length >= 2) {
          const lastClose = closes[closes.length - 1];
          const prev5m = closes[closes.length - 2];
          if (prev5m > 0) {
            momentum5m = Number((((lastClose - prev5m) / prev5m) * 100).toFixed(2));
          }
        }

        let rvol = 1.0;
        if (volumes.length >= 3) {
          const recentBar = volumes[volumes.length - 1];
          const avgBar = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
          if (avgBar > 0) {
            rvol = Number((recentBar / avgBar).toFixed(2));
          }
        }

        chartMetrics = {
          price: Number(activePrice.toFixed(2)),
          changePct: Number(changePct.toFixed(2)),
          volume: totalVolume,
          avgVolume: Math.round(totalVolume / (rvol || 1)),
          rvol,
          momentum5m,
          companyName: meta.shortName || meta.longName || normTicker
        };
      }
    }
  } catch (err) {
    console.warn(`[Scanner] Chart metrics for ${normTicker} error:`, err.message);
  }

  const finalPrice = chartMetrics?.price || quote?.price || 0;
  const finalChangePct = chartMetrics?.changePct !== undefined ? chartMetrics.changePct : (quote?.changePct || 0);

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
 * Fetch latest company news for ticker from Yahoo Search or Finnhub
 */
export async function fetchCompanyLatestNews(ticker) {
  const normTicker = ticker.toUpperCase();
  const finnhubKey = process.env.FINNHUB_API_KEY;

  // 1. Try Finnhub company news if key configured
  if (finnhubKey) {
    try {
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await finnhubLimiter.schedule(async () => {
        return fetch(`https://finnhub.io/api/v1/company-news?symbol=${normTicker}&from=${fromDate}&to=${toDate}&token=${finnhubKey}`, {
          signal: AbortSignal.timeout(3000)
        });
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const top = list[0];
          return {
            headline: top.headline,
            summary: top.summary,
            source: top.source || 'Finnhub News',
            url: top.url,
            publishedAt: new Date(top.datetime * 1000)
          };
        }
      }
    } catch (_) {}
  }

  // 2. Fallback to Yahoo Financial Search News (Completely free, real-time)
  try {
    const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${normTicker}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      const newsItems = data.news || [];
      if (newsItems.length > 0) {
        const item = newsItems[0];
        return {
          headline: item.title,
          summary: item.summary || item.title,
          source: item.publisher || 'Financial Media',
          url: item.link,
          publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date()
        };
      }
    }
  } catch (_) {}

  return null;
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
 * Run one complete scanner cycle
 * Evaluates Pre-Market, Regular Market & After-Hours
 * Trigger rule: Matching News OR Volume/Momentum (not strictly both!)
 */
export async function runScannerCycle() {
  if (scannerStatusState.isRunning) {
    return {
      success: false,
      message: 'Scanner is already running. Please wait for current cycle to complete.',
      status: scannerStatusState
    };
  }

  scannerStatusState.isRunning = true;
  await initProcessedCache();

  const cycleStartTime = new Date();
  const currentSession = getMarketSession();
  scannerStatusState.marketSession = currentSession;

  const discoveredOpportunities = [];
  let evaluatedCandidatesCount = 0;

  try {
    // 1. Fetch live market movers ($1-$20 range in Pre-Market, Regular, and After-Hours)
    const candidates = await fetchLiveMarketMovers();
    evaluatedCandidatesCount = candidates.length;

    // Process candidates in concurrent batches of 6 for rapid cycle execution
    const BATCH_SIZE = 6;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const chunk = candidates.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (item) => {
        const ticker = item.ticker;

        try {
          // Step A: Fetch Live Extended-Hours Quote & Volume
          const metrics = await fetchQuoteAndVolume(ticker, item);
          if (!metrics) return;

          // Price filter: $1 <= price <= $20
          if (metrics.price < SCANNER_CONFIG.minPrice || metrics.price > SCANNER_CONFIG.maxPrice) {
            return;
          }

          // Step B: Fetch Latest Company News
          const news = await fetchCompanyLatestNews(ticker);
          let catalystResult = { matched: false };
          let hasFreshNews = false;

          if (news && news.headline) {
            catalystResult = classifyNewsArticle(news.headline, news.summary);
            const newsAgeHours = (Date.now() - news.publishedAt.getTime()) / (1000 * 60 * 60);
            if (newsAgeHours <= SCANNER_CONFIG.maxNewsAgeHours) {
              hasFreshNews = true;
              if (!catalystResult.matched) {
                catalystResult = {
                  matched: true,
                  catalystType: 'Press / Company Update',
                  catalystBadge: 'Breaking News',
                  importance: 'MEDIUM'
                };
              }
            }
          }

          // Step C: Check Volume and Momentum thresholds (Positive Breakouts)
          const isHighRvol = metrics.rvol >= SCANNER_CONFIG.minRvol;
          const isHighMomentum = Math.abs(metrics.momentum5m || 0) >= SCANNER_CONFIG.minMomentumPct || metrics.changePct >= SCANNER_CONFIG.minMomentumPct;
          const hasVolumeOrMomentum = isHighRvol || isHighMomentum;

          // USER RULE: Show stock if it has News OR (Volume/Momentum), not strictly both!
          if (!hasFreshNews && !hasVolumeOrMomentum) {
            return;
          }

          // Step D: Classify Opportunity Archetype
          let opportunityType = 'MOMENTUM_VOLUME';
          let matchedRule = '';
          let catalystBadge = 'Volume Surge';

          if (hasFreshNews && hasVolumeOrMomentum) {
            opportunityType = 'BREAKOUT_NEWS';
            catalystBadge = catalystResult.catalystBadge || 'Breakout Catalyst';
            matchedRule = `🔥 ${catalystBadge} + RVOL ${metrics.rvol}x (${metrics.changePct >= 0 ? '+' : ''}${metrics.changePct}%)`;
          } else if (hasFreshNews) {
            opportunityType = 'NEWS_CATALYST';
            catalystBadge = catalystResult.catalystBadge || 'Fresh News';
            matchedRule = `⚡ محفز إخباري جديد: ${catalystBadge} (${metrics.changePct >= 0 ? '+' : ''}${metrics.changePct}%)`;
          } else {
            opportunityType = 'MOMENTUM_VOLUME';
            catalystBadge = isHighRvol ? 'RVOL Spike' : 'Momentum Surge';
            const details = [];
            if (isHighRvol) details.push(`RVOL ${metrics.rvol}x`);
            if (isHighMomentum) details.push(`زخم ${metrics.changePct >= 0 ? '+' : ''}${metrics.changePct}%`);
            matchedRule = `🚀 اختراق فني: ${details.join(' & ')}`;
          }

          // Step E: Shariah Compliance Lookup
          const shariah = await checkShariahCompliance(ticker);

          const opportunity = {
            ticker,
            companyName: shariah.companyName || metrics.companyName || item.companyName || ticker,
            price: metrics.price,
            changePct: metrics.changePct,
            volume: metrics.volume,
            avgVolume: metrics.avgVolume,
            rvol: metrics.rvol,
            momentum5m: metrics.momentum5m,
            sharesFloat: metrics.sharesFloat || item.sharesFloat || null,
            marketCap: metrics.marketCap || item.marketCap || null,
            headline: news?.headline || `تداول مكثف وزخم سعري نشط على سهم ${ticker} خلال جلسة ${currentSession.badge}`,
            summary: news?.summary || `ارتفاع الفوليوم إلى ${metrics.rvol}x مع تغير سعري بنسبة ${metrics.changePct}%.`,
            newsUrl: news?.url || `https://finance.yahoo.com/quote/${ticker}`,
            newsSource: news?.source || 'Live Market Flow',
            newsPublishedAt: news?.publishedAt || new Date(),
            catalyst: catalystBadge,
            shariahStatus: shariah.status,
            statusBadge: shariah.badge,
            isArchived: false,
            matchedRule,
            rawMetrics: {
              opportunityType,
              marketSession: currentSession.session,
              catalystType: catalystResult.catalystType || 'Technical Flow',
              matchedKeyword: catalystResult.matchedKeyword || null,
              sharesFloat: metrics.sharesFloat || item.sharesFloat || null,
              isLowFloat: (metrics.sharesFloat && metrics.sharesFloat <= 20000000) || (item.sharesFloat && item.sharesFloat <= 20000000),
              isGainerMomentum: metrics.changePct >= 3.0,
              sector: shariah.sector,
              debtRatio: shariah.debtRatio || null,
              cashRatio: shariah.cashRatio || null
            },
            discoveredAt: new Date()
          };

          // Save / Update to Database (Upsert by Ticker to keep live opportunities fresh)
          try {
            const existing = await prisma.stockScannerOpportunity.findFirst({
              where: { ticker, isArchived: false }
            });

            if (existing) {
              const updated = await prisma.stockScannerOpportunity.update({
                where: { id: existing.id },
                data: {
                  price: opportunity.price,
                  changePct: opportunity.changePct,
                  volume: opportunity.volume,
                  rvol: opportunity.rvol,
                  momentum5m: opportunity.momentum5m,
                  sharesFloat: opportunity.sharesFloat,
                  marketCap: opportunity.marketCap,
                  headline: opportunity.headline,
                  catalyst: opportunity.catalyst,
                  matchedRule: opportunity.matchedRule,
                  discoveredAt: new Date()
                }
              });
              opportunity.id = updated.id;
            } else {
              const saved = await prisma.stockScannerOpportunity.create({
                data: opportunity
              });
              opportunity.id = saved.id;
            }
          } catch (dbErr) {
            console.error('[Scanner] DB write opportunity error:', dbErr.message);
            opportunity.id = `opp_${Date.now()}_${ticker}`;
          }

          discoveredOpportunities.push(opportunity);
        } catch (itemErr) {
          console.warn(`[Scanner] Error checking ${ticker}:`, itemErr.message);
        }
      }));
    }

    // Sync to JSON backup file
    await syncOpportunitiesToJson();

    scannerStatusState.lastScanAt = cycleStartTime;
    scannerStatusState.lastOpportunitiesCount = discoveredOpportunities.length;
    scannerStatusState.totalProcessedCount += evaluatedCandidatesCount;
    scannerStatusState.lastError = null;

    return {
      success: true,
      timestamp: cycleStartTime.toISOString(),
      marketSession: currentSession,
      evaluatedCandidatesCount,
      discoveredCount: discoveredOpportunities.length,
      opportunities: discoveredOpportunities
    };
  } catch (err) {
    console.error('[Scanner] Cycle execution failed:', err);
    scannerStatusState.lastError = err.message;
    return {
      success: false,
      error: err.message,
      evaluatedCandidatesCount,
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
 * Get active opportunities with filtering & pagination
 */
export async function getScannerOpportunities(options = {}) {
  const {
    shariah = 'all', // 'all' | 'pass' | 'fail' | 'review' | 'unclassified'
    status = 'active', // 'active' | 'archived' | 'all'
    type = 'all', // 'all' | 'news' | 'momentum' | 'low_float' | 'gainer_momentum'
    floatMax = null, // e.g. 20000000
    search = '',
    limit = 50,
    page = 1
  } = options;

  const andClauses = [];

  if (status === 'active') andClauses.push({ isArchived: false });
  else if (status === 'archived') andClauses.push({ isArchived: true });

  if (shariah === 'pass') andClauses.push({ shariahStatus: 'PASS' });
  else if (shariah === 'fail') andClauses.push({ shariahStatus: 'FAIL' });
  else if (shariah === 'review') andClauses.push({ shariahStatus: 'REVIEW_REQUIRED' });
  else if (shariah === 'unclassified') andClauses.push({ shariahStatus: 'UNCLASSIFIED' });

  if (type === 'news') {
    andClauses.push({
      NOT: {
        catalyst: { in: ['RVOL Spike', 'Momentum Surge', 'Volume Surge'] }
      }
    });
  } else if (type === 'momentum') {
    andClauses.push({
      OR: [
        { catalyst: { in: ['RVOL Spike', 'Momentum Surge', 'Volume Surge'] } },
        { matchedRule: { contains: 'اختراق فني' } },
        { matchedRule: { contains: 'RVOL' } }
      ]
    });
  } else if (type === 'low_float' || floatMax) {
    const maxVal = floatMax ? Number(floatMax) : 20000000;
    andClauses.push({
      sharesFloat: {
        gt: 0,
        lte: maxVal
      }
    });
  } else if (type === 'gainer_momentum') {
    andClauses.push({
      changePct: {
        gte: 3.0
      }
    });
  }

  if (search) {
    andClauses.push({
      OR: [
        { ticker: { contains: search.toUpperCase() } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
        { catalyst: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  const where = andClauses.length > 0 ? { AND: andClauses } : {};
  const orderBy = (type === 'gainer_momentum')
    ? [{ changePct: 'desc' }, { discoveredAt: 'desc' }]
    : [{ discoveredAt: 'desc' }];

  try {
    const total = await prisma.stockScannerOpportunity.count({ where });
    const opportunities = await prisma.stockScannerOpportunity.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit
    });

    // Compute Shariah and Market Stats
    const passCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, shariahStatus: 'PASS' } });
    const failCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, shariahStatus: 'FAIL' } });
    const totalActive = await prisma.stockScannerOpportunity.count({ where: { isArchived: false } });
    const lowFloatCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, sharesFloat: { gt: 0, lte: 20000000 } } });
    const gainerCount = await prisma.stockScannerOpportunity.count({ where: { isArchived: false, changePct: { gte: 3.0 } } });

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
        unclassifiedCount: Math.max(0, totalActive - passCount - failCount),
        lowFloatCount,
        gainerCount,
        marketSession: getMarketSession()
      }
    };
  } catch (err) {
    console.warn('[Scanner] DB query failed, falling back to JSON file:', err.message);

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
          stats: { totalActive: list.length, passCount: 0, failCount: 0, unclassifiedCount: 0, marketSession: getMarketSession() }
        };
      } catch (_) {}
    }

    return {
      opportunities: [],
      pagination: { total: 0, page: 1, limit, totalPages: 0 },
      stats: { totalActive: 0, passCount: 0, failCount: 0, unclassifiedCount: 0, marketSession: getMarketSession() }
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
    marketSession: getMarketSession(),
    config: {
      minPrice: SCANNER_CONFIG.minPrice,
      maxPrice: SCANNER_CONFIG.maxPrice,
      minRvol: SCANNER_CONFIG.minRvol,
      minMomentumPct: SCANNER_CONFIG.minMomentumPct,
      finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY)
    }
  };
}
