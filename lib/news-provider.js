/**
 * News and Catalyst Intelligence Provider
 * Handles company news retrieval, catalyst detection, sentiment tagging,
 * and time-based filtering (Today, 3 Days, 7 Days).
 * 
 * Strict rule: Unbiased algorithmic sentiment; displays both positive and negative news.
 */

function formatRelativeAge(date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function analyzeHeadline(title, summary = '') {
  const text = `${title} ${summary}`.toLowerCase();

  const positiveKeywords = [
    'beats', 'record', 'partnership', 'collaborates', 'expand', 'growth', 'surge',
    'upgrade', 'approval', 'raises', 'bullish', 'outperform', 'profit jump', 'breakthrough',
    'rally', 'positive', 'strong demand', 'accelerate', 'wins', 'soars'
  ];

  const negativeKeywords = [
    'misses', 'plunges', 'downgrade', 'lawsuit', 'investigation', 'drop', 'slump',
    'falls', 'loss', 'warning', 'cuts', 'fine', 'antitrust', 'bearish', 'weak',
    'declines', 'subpoena', 'delay', 'recalls', 'cautions', 'tumbles'
  ];

  let posScore = 0;
  let negScore = 0;

  for (const kw of positiveKeywords) {
    if (text.includes(kw)) posScore++;
  }
  for (const kw of negativeKeywords) {
    if (text.includes(kw)) negScore++;
  }

  let sentiment = 'Neutral';
  let tradingImpact = 'Neutral';

  if (posScore > 0 && negScore > 0) {
    sentiment = 'Mixed';
    tradingImpact = 'Unclear';
  } else if (posScore > negScore) {
    sentiment = 'Positive';
    tradingImpact = 'Potentially bullish';
  } else if (negScore > posScore) {
    sentiment = 'Negative';
    tradingImpact = 'Potentially bearish';
  }

  // Detect Catalyst Type
  let catalyst = 'Market Update';
  let importance = 'MEDIUM';

  if (/\b(earnings|revenue|eps|quarterly results|q[1-4] results)\b/.test(text)) {
    catalyst = 'Earnings';
    importance = 'HIGH';
  } else if (/\b(guidance|forecast|outlook|targets)\b/.test(text)) {
    catalyst = 'Guidance';
    importance = 'HIGH';
  } else if (/\b(partnership|partner|collaborat|joint venture|alliance|deal)\b/.test(text)) {
    catalyst = 'Partnership';
    importance = 'MEDIUM';
  } else if (/\b(antitrust|investigation|sec|probe|lawsuit|sued|regulatory|doj)\b/.test(text)) {
    catalyst = 'Regulatory & Legal';
    importance = 'HIGH';
  } else if (/\b(launch|unveils|announces|new chip|architecture|product|infrastructure)\b/.test(text)) {
    catalyst = 'Product & Innovation';
    importance = 'MEDIUM';
  } else if (/\b(upgrade|downgrade|analyst|price target|pt raised|pt lowered)\b/.test(text)) {
    catalyst = 'Analyst Action';
    importance = 'MEDIUM';
  } else if (/\b(acquisition|merger|buyout|takeover)\b/.test(text)) {
    catalyst = 'M&A';
    importance = 'HIGH';
  }

  return { sentiment, tradingImpact, catalyst, importance };
}

export async function getCompanyNews(ticker) {
  const normTicker = ticker.trim().toUpperCase();
  const finnhubKey = process.env.FINNHUB_API_KEY;

  let rawArticles = [];
  let providerSource = 'Consolidated Financial News Feed';

  // 1. Finnhub Company News if key is provided
  if (finnhubKey) {
    try {
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${normTicker}&from=${fromDate}&to=${toDate}&token=${finnhubKey}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          providerSource = 'Finnhub Company News';
          rawArticles = list.map(item => ({
            headline: item.headline,
            summary: item.summary,
            source: item.source,
            url: item.url,
            publishedAt: new Date(item.datetime * 1000)
          }));
        }
      }
    } catch (e) {
      console.warn('Finnhub news fetch failed, falling back:', e.message);
    }
  }

  // 2. Fallback to public news feed via search
  if (rawArticles.length === 0) {
    try {
      const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${normTicker}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const newsItems = data.news || [];
        rawArticles = newsItems.map(item => ({
          headline: item.title,
          summary: item.summary || item.title,
          source: item.publisher || 'Financial Media',
          url: item.link,
          publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000) : new Date()
        }));
      }
    } catch (e) {
      console.error('Public news feed error:', e.message);
    }
  }

  // Process and categorize articles
  const processedArticles = rawArticles.map(article => {
    const analysis = analyzeHeadline(article.headline, article.summary);
    return {
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      url: article.url,
      publishedAt: article.publishedAt,
      age: formatRelativeAge(article.publishedAt),
      sentiment: analysis.sentiment,
      tradingImpact: analysis.tradingImpact,
      catalyst: analysis.catalyst,
      importance: analysis.importance
    };
  });

  // Sort by publishedAt descending
  processedArticles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Filter buckets: Today, 3 Days, 7 Days
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const threeDaysMs = 3 * oneDayMs;
  const sevenDaysMs = 7 * oneDayMs;

  const todayList = processedArticles.filter(a => now - a.publishedAt.getTime() <= oneDayMs);
  const threeDaysList = processedArticles.filter(a => now - a.publishedAt.getTime() <= threeDaysMs);
  const sevenDaysList = processedArticles.filter(a => now - a.publishedAt.getTime() <= sevenDaysMs);

  // Derive Top Summary
  let latestCatalyst = 'General Market';
  let overallSentiment = 'Neutral';
  let catalystStrength = 'MEDIUM';

  if (processedArticles.length > 0) {
    const topItem = processedArticles[0];
    latestCatalyst = topItem.catalyst;
    overallSentiment = topItem.sentiment;
    catalystStrength = topItem.importance;

    // Aggregate sentiment over recent items
    const recent = processedArticles.slice(0, 5);
    const pos = recent.filter(r => r.sentiment === 'Positive').length;
    const neg = recent.filter(r => r.sentiment === 'Negative').length;
    if (pos > neg && pos >= 2) overallSentiment = 'Positive';
    else if (neg > pos && neg >= 2) overallSentiment = 'Negative';
    else if (pos > 0 && neg > 0) overallSentiment = 'Mixed';
  }

  // Eastern Time timestamp
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const formattedEt = `${etFormatter.format(new Date())} ET`;

  return {
    ticker: normTicker,
    latestCatalyst,
    overallSentiment,
    catalystStrength,
    lastUpdatedEt: formattedEt,
    source: providerSource,
    dataQuality: 'HIGH',
    counts: {
      today: todayList.length,
      threeDays: threeDaysList.length,
      sevenDays: sevenDaysList.length
    },
    articles: {
      today: todayList,
      threeDays: threeDaysList,
      sevenDays: sevenDaysList.length > 0 ? sevenDaysList : processedArticles
    }
  };
}
