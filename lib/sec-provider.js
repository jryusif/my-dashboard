/**
 * SEC EDGAR Official API Provider
 * Authoritative source for US company filings and XBRL financial disclosures.
 * 
 * Complies with SEC Fair Access policy:
 * - Specific User-Agent header with Application Name and Contact Email.
 * - Concurrency control / rate limiting (< 10 requests per second).
 */

const SEC_USER_AGENT = process.env.SEC_USER_AGENT || 'MyPersonalDashboard/1.0 (contact: admin@mypersonaldashboard.local)';
const SEC_BASE = 'https://data.sec.gov';
const SEC_FILES = 'https://www.sec.gov/files';

// In-memory cache for company tickers mapping (loaded once per server lifecycle)
let tickersMapCache = null;
let tickersMapExpiresAt = 0;

// Rate-limiting delay helper
let lastRequestTime = 0;
async function throttleSecRequest() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  const minInterval = 120; // ~8 requests/sec max to stay well under SEC 10 req/s limit
  if (timeSinceLast < minInterval) {
    await new Promise(r => setTimeout(r, minInterval - timeSinceLast));
  }
  lastRequestTime = Date.now();
}

async function secFetch(url) {
  await throttleSecRequest();
  const res = await fetch(url, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate'
    }
  });

  if (!res.ok) {
    throw new Error(`SEC API error: ${res.status} ${res.statusText} at ${url}`);
  }
  return await res.json();
}

/**
 * Loads SEC company tickers directory.
 * Maps ticker symbol -> { cik: string, name: string, ticker: string }
 */
export async function getSecTickersDirectory() {
  const now = Date.now();
  if (tickersMapCache && tickersMapExpiresAt > now) {
    return tickersMapCache;
  }

  try {
    const raw = await secFetch(`${SEC_FILES}/company_tickers.json`);
    const map = new Map();
    for (const item of Object.values(raw)) {
      if (item && item.ticker) {
        const cik10 = String(item.cik_str).padStart(10, '0');
        map.set(item.ticker.toUpperCase(), {
          ticker: item.ticker.toUpperCase(),
          cik: cik10,
          cikNumber: item.cik_str,
          name: item.title
        });
      }
    }
    tickersMapCache = map;
    tickersMapExpiresAt = now + (24 * 60 * 60 * 1000); // cache for 24 hours
    return map;
  } catch (err) {
    console.error('Failed to load SEC company tickers:', err);
    if (tickersMapCache) return tickersMapCache;
    throw err;
  }
}

/**
 * Resolves a ticker symbol to SEC CIK and basic info.
 */
export async function resolveTickerCik(ticker) {
  const normTicker = ticker.trim().toUpperCase();
  const dir = await getSecTickersDirectory();
  return dir.get(normTicker) || null;
}

/**
 * Fetches recent submissions and filings for a CIK.
 */
export async function getCompanySubmissions(cik) {
  const cik10 = String(cik).padStart(10, '0');
  const data = await secFetch(`${SEC_BASE}/submissions/CIK${cik10}.json`);

  const recent = data.filings?.recent || { accessionNumber: [], form: [], filingDate: [], reportDate: [], primaryDocument: [] };
  const filings = [];

  const count = Math.min(recent.form.length, 30);
  for (let i = 0; i < count; i++) {
    const form = recent.form[i];
    filings.push({
      accessionNumber: recent.accessionNumber[i],
      form: form,
      filingDate: recent.filingDate[i],
      reportDate: recent.reportDate ? recent.reportDate[i] : null,
      primaryDocUrl: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik10, 10)}/${recent.accessionNumber[i].replace(/-/g, '')}/${recent.primaryDocument[i]}`,
      isMaterial: ['10-K', '10-Q', '8-K'].includes(form)
    });
  }

  // Find latest 10-Q or 10-K
  const latestPeriodic = filings.find(f => f.form === '10-Q' || f.form === '10-K') || null;

  return {
    cik: cik10,
    name: data.name,
    sic: data.sic,
    sicDescription: data.sicDescription,
    ein: data.ein,
    fiscalYearEnd: data.fiscalYearEnd,
    filings,
    latestPeriodic,
    latestFiling: filings[0] || null
  };
}

/**
 * Extracts latest balance sheet & income concepts from SEC XBRL Company Facts.
 */
export async function getCompanyFinancialFacts(cik) {
  const cik10 = String(cik).padStart(10, '0');
  const data = await secFetch(`${SEC_BASE}/api/xbrl/companyfacts/CIK${cik10}.json`);
  const gaap = data.facts?.['us-gaap'] || {};

  function extractConceptLatest(conceptNames) {
    if (!Array.isArray(conceptNames)) conceptNames = [conceptNames];
    
    for (const name of conceptNames) {
      const node = gaap[name];
      if (!node || !node.units) continue;
      
      const units = node.units.USD || node.units.pure || Object.values(node.units)[0];
      if (!Array.isArray(units) || units.length === 0) continue;

      // Filter for 10-Q or 10-K filings with valid end date
      const periodicItems = units.filter(u => u.form === '10-Q' || u.form === '10-K');
      const candidates = periodicItems.length > 0 ? periodicItems : units;

      // Sort by filed date descending, then end date descending
      const sorted = [...candidates].sort((a, b) => {
        const filedA = a.filed || a.end || '';
        const filedB = b.filed || b.end || '';
        return filedB.localeCompare(filedA);
      });

      if (sorted.length > 0) {
        return {
          concept: name,
          val: sorted[0].val,
          form: sorted[0].form,
          fp: sorted[0].fp,
          fy: sorted[0].fy,
          end: sorted[0].end,
          filed: sorted[0].filed,
          accn: sorted[0].accn
        };
      }
    }
    return null;
  }

  // Assets
  const assetsFact = extractConceptLatest(['Assets']);

  // Short Term Debt Concepts
  const shortDebtFact = extractConceptLatest([
    'DebtCurrent',
    'LongTermDebtCurrent',
    'ShortTermBorrowings',
    'CommercialPaper'
  ]);

  // Long Term Debt Concepts
  const longDebtFact = extractConceptLatest([
    'LongTermDebtNoncurrent',
    'LongTermDebtAndCapitalLeaseObligations',
    'LongTermDebt'
  ]);

  // Total Debt = shortDebt + longDebt (or TotalLiabilities fallback if needed)
  let totalDebtVal = 0;
  let hasDebtData = false;
  if (shortDebtFact && typeof shortDebtFact.val === 'number') {
    totalDebtVal += shortDebtFact.val;
    hasDebtData = true;
  }
  if (longDebtFact && typeof longDebtFact.val === 'number') {
    totalDebtVal += longDebtFact.val;
    hasDebtData = true;
  }

  // Cash & Marketable Securities
  const cashFact = extractConceptLatest([
    'CashAndCashEquivalentsAtCarryingValue',
    'CashCashEquivalentsAndShortTermInvestments',
    'CashAndCashEquivalents'
  ]);

  const marketableSecFact = extractConceptLatest([
    'MarketableSecuritiesCurrent',
    'AvailableForSaleSecuritiesCurrent',
    'ShortTermInvestments'
  ]);

  let cashSecuritiesVal = 0;
  let hasCashData = false;
  if (cashFact && typeof cashFact.val === 'number') {
    cashSecuritiesVal += cashFact.val;
    hasCashData = true;
  }
  if (marketableSecFact && typeof marketableSecFact.val === 'number') {
    cashSecuritiesVal += marketableSecFact.val;
    hasCashData = true;
  }

  // Revenues
  const revenueFact = extractConceptLatest([
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'SalesRevenueNet'
  ]);

  // Interest Income
  const interestIncomeFact = extractConceptLatest([
    'InvestmentIncomeInterest',
    'InterestAndDividendIncomeOperating',
    'InterestIncomeOperating',
    'NonoperatingIncomeExpense'
  ]);

  // Determine latest reporting period info
  const primaryPeriod = assetsFact || revenueFact || cashFact || shortDebtFact || longDebtFact || null;

  return {
    cik: cik10,
    periodInfo: primaryPeriod ? {
      form: primaryPeriod.form,
      fiscalYear: primaryPeriod.fy,
      fiscalPeriod: primaryPeriod.fp,
      endDate: primaryPeriod.end,
      filingDate: primaryPeriod.filed,
      accessionNumber: primaryPeriod.accn
    } : null,
    metrics: {
      totalAssets: assetsFact ? assetsFact.val : null,
      totalDebt: hasDebtData ? totalDebtVal : (shortDebtFact || longDebtFact ? totalDebtVal : null),
      shortTermDebt: shortDebtFact ? shortDebtFact.val : 0,
      longTermDebt: longDebtFact ? longDebtFact.val : 0,
      cashAndSecurities: hasCashData ? cashSecuritiesVal : (cashFact ? cashFact.val : null),
      cashAndEquivalents: cashFact ? cashFact.val : null,
      marketableSecurities: marketableSecFact ? marketableSecFact.val : 0,
      totalRevenue: revenueFact ? revenueFact.val : null,
      interestIncome: interestIncomeFact ? Math.max(0, interestIncomeFact.val) : null,
      impureIncome: interestIncomeFact ? Math.max(0, interestIncomeFact.val) : null
    },
    factsUsed: {
      assets: assetsFact,
      shortDebt: shortDebtFact,
      longDebt: longDebtFact,
      cash: cashFact,
      marketableSecurities: marketableSecFact,
      revenue: revenueFact,
      interestIncome: interestIncomeFact
    }
  };
}
