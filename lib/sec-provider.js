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
const SA_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
 * StockAnalysis.com Fallback — Debt Extraction
 * 
 * Parses the SvelteKit __data.json endpoint from stockanalysis.com/stocks/{ticker}/financials/balance-sheet/
 * to extract the most recent quarterly short-term debt, long-term debt, and total debt figures.
 * 
 * Used ONLY when all XBRL debt concepts return null (company doesn't tag debt in their XBRL filing).
 * Returns null on any network/parse error so the main flow degrades gracefully.
 */
async function getDebtFromStockAnalysis(ticker) {
  if (!ticker) return null;
  try {
    const url = `https://stockanalysis.com/stocks/${ticker.toLowerCase()}/financials/balance-sheet/__data.json?x-sveltekit-invalidated=001`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': SA_BROWSER_UA,
        'Accept': 'application/json, text/html, */*',
      },
      signal: AbortSignal.timeout(8000) // 8s max
    });
    if (!res.ok) return null;
    
    const outer = await res.json();
    const nodes = outer.nodes || [];
    const mainNode = nodes.find(n => n.type === 'data' && Array.isArray(n.data));
    if (!mainNode) return null;
    
    const dataArr = mainNode.data;
    const header = dataArr[0];
    const fdMapIdx = header?.financialData;
    if (typeof fdMapIdx !== 'number') return null;
    
    const fdMap = dataArr[fdMapIdx]; // { fieldName: indexInDataArr }
    if (!fdMap || typeof fdMap !== 'object') return null;
    
    // Resolve most-recent value for a field name
    function getLatestValue(fieldName) {
      const arrIdx = fdMap[fieldName];
      if (typeof arrIdx !== 'number') return undefined; // field absent from this company
      const arr = dataArr[arrIdx];
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const valIdx = arr[0]; // arr[0] = index of most-recent period's value
      if (typeof valIdx !== 'number') return null;
      const val = dataArr[valIdx];
      return typeof val === 'number' ? val : null;
    }
    
    // SA field definitions:
    // debtc             = current portion of borrowings / short-term debt
    // currentPortDebt   = current portion of long-term debt  
    // debtnc            = long-term (non-current) debt
    // debt              = total debt aggregate (may differ slightly from sum)
    const debtc = getLatestValue('debtc');           // undefined if field absent
    const currentPortDebt = getLatestValue('currentPortDebt');
    const debtnc = getLatestValue('debtnc');          // undefined if field absent
    const totalDebtSA = getLatestValue('debt');       // aggregate
    
    let shortTermDebt = 0;
    let longTermDebt = 0;
    let hasAny = false;
    
    if (typeof debtc === 'number') { shortTermDebt += debtc; hasAny = true; }
    if (typeof currentPortDebt === 'number') { shortTermDebt += currentPortDebt; hasAny = true; }
    if (typeof debtnc === 'number') { longTermDebt += debtnc; hasAny = true; }
    
    // Use SA aggregate if we couldn't sum components but it exists
    if (!hasAny && typeof totalDebtSA === 'number') {
      return { shortTermDebt: 0, longTermDebt: totalDebtSA, totalDebt: totalDebtSA, source: 'StockAnalysis.com' };
    }
    
    // If none of the fields exist at all (SA doesn't cover this ticker), return null
    if (debtc === undefined && currentPortDebt === undefined && debtnc === undefined && totalDebtSA === undefined) {
      return null;
    }
    
    const totalDebt = shortTermDebt + longTermDebt;
    return { shortTermDebt, longTermDebt, totalDebt, source: 'StockAnalysis.com' };
  } catch (err) {
    // Silently degrade — SA is a best-effort fallback only
    console.warn('[sec-provider] StockAnalysis debt fallback failed for', ticker, ':', err.message);
    return null;
  }
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

export const COUNTRY_FLAGS = {
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'US': '🇺🇸',
  'Switzerland': '🇨🇭',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'Hong Kong': '🇭🇰',
  'Netherlands': '🇳🇱',
  'Ireland': '🇮🇪',
  'Cayman Islands': '🇰🇾',
  'Israel': '🇮🇱',
  'Singapore': '🇸🇬',
  'Japan': '🇯🇵',
  'France': '🇫🇷',
  'Sweden': '🇸🇪',
  'Taiwan': '🇹🇼',
  'India': '🇮🇳',
  'Bermuda': '🇧🇲',
  'Australia': '🇦🇺',
  'South Korea': '🇰🇷',
  'Brazil': '🇧🇷',
  'Denmark': '🇩🇰',
  'Jersey': '🇯🇪',
  'Cyprus': '🇨🇾'
};

export function getCountryInfoFromSubmissions(data) {
  const b = data?.addresses?.business || {};
  const m = data?.addresses?.mailing || {};

  let country = 'United States';
  let hqAddress = null;
  let incCountry = data?.stateOfIncorporationDescription || data?.stateOfIncorporation || 'Delaware, USA';

  // Format HQ Address
  const street = b.street1 || m.street1 || '';
  const city = b.city || m.city || '';
  const stateOrCountry = b.stateOrCountryDescription || b.stateOrCountry || m.stateOrCountryDescription || m.stateOrCountry || '';
  if (city) {
    hqAddress = `${city}${stateOrCountry ? `, ${stateOrCountry}` : ''}${b.country ? `, ${b.country}` : ''}`;
  }

  // 1. Explicit country field in address
  if (b.country && typeof b.country === 'string' && b.country.trim()) {
    country = b.country.trim();
  } else if (m.country && typeof m.country === 'string' && m.country.trim()) {
    country = m.country.trim();
  } else if (b.isForeignLocation === 1 || m.isForeignLocation === 1) {
    const desc = b.stateOrCountryDescription || m.stateOrCountryDescription;
    if (desc && desc.length > 2) country = desc.trim();
  } else {
    // Check stateOrCountryDescription
    const desc = b.stateOrCountryDescription || m.stateOrCountryDescription;
    if (desc && desc.length > 2 && !/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR)$/i.test(desc.trim())) {
      country = desc.trim();
    } else {
      // Check state of incorporation for foreign entities (e.g., "V8 Switzerland", "2M Germany")
      const inc = data?.stateOfIncorporationDescription;
      if (inc && inc.length > 2 && !/^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i.test(inc)) {
        const words = inc.split(' ');
        if (words.length > 1 && words[words.length - 1].length > 2) {
          country = words.slice(1).join(' ').trim();
        }
      }
    }
  }

  const countryFlag = COUNTRY_FLAGS[country] || '🌐';
  return {
    country,
    countryFlag,
    hqAddress: hqAddress || (country === 'United States' ? 'California, USA' : country),
    incCountry: incCountry || country
  };
}

/**
 * Fetches recent submissions and filings for a CIK.
 */
export async function getCompanySubmissions(cik) {
  const cik10 = String(cik).padStart(10, '0');
  // Official SEC Submissions API endpoint per SEC specifications
  const data = await secFetch(`${SEC_BASE}/submissions/CIK${cik10}.json`);

  const recent = data.filings?.recent || { accessionNumber: [], form: [], filingDate: [], reportDate: [], primaryDocument: [] };
  const totalCount = recent.form ? recent.form.length : 0;
  const filings = [];
  const periodicFilings = [];

  for (let i = 0; i < totalCount; i++) {
    const form = recent.form[i];
    const filingDate = recent.filingDate[i];
    const reportDate = recent.reportDate ? recent.reportDate[i] : null;
    const accessionNumber = recent.accessionNumber[i];
    const primaryDoc = recent.primaryDocument ? recent.primaryDocument[i] : null;

    let filingLagDays = null;
    if (reportDate && filingDate) {
      const rTime = new Date(reportDate).getTime();
      const fTime = new Date(filingDate).getTime();
      if (!isNaN(rTime) && !isNaN(fTime)) {
        filingLagDays = Math.max(0, Math.floor((fTime - rTime) / (1000 * 60 * 60 * 24)));
      }
    }

    const item = {
      accessionNumber,
      form,
      filingDate,
      reportDate,
      filingLagDays,
      primaryDocument: primaryDoc,
      primaryDocUrl: primaryDoc
        ? `https://www.sec.gov/Archives/edgar/data/${parseInt(cik10, 10)}/${accessionNumber.replace(/-/g, '')}/${primaryDoc}`
        : `https://www.sec.gov/edgar/browse/?CIK=${parseInt(cik10, 10)}`,
      isMaterial: ['10-K', '10-Q', '8-K'].includes(form)
    };

    filings.push(item);

    if (form === '10-Q' || form === '10-K' || form === '10-Q/A' || form === '10-K/A') {
      periodicFilings.push(item);
    }
  }

  // Sort periodic filings strictly by filingDate descending to guarantee newest SEC filing
  periodicFilings.sort((a, b) => (b.filingDate || '').localeCompare(a.filingDate || ''));
  const latestPeriodic = periodicFilings[0] || null;
  const countryInfo = getCountryInfoFromSubmissions(data);

  return {
    cik: cik10,
    name: data.name,
    sic: data.sic,
    sicDescription: data.sicDescription,
    ein: data.ein,
    fiscalYearEnd: data.fiscalYearEnd,
    country: countryInfo.country,
    countryFlag: countryInfo.countryFlag,
    hqAddress: countryInfo.hqAddress,
    incCountry: countryInfo.incCountry,
    filings: filings.slice(0, 50),
    periodicFilings,
    latestPeriodic,
    latestFiling: filings[0] || null
  };
}

/**
 * Extracts latest balance sheet & income concepts from SEC XBRL Company Facts.
 * @param {string} cik - 10-digit CIK
 * @param {string|null} targetAccn - Optional: target specific accession number
 * @param {string|null} ticker - Optional: stock ticker for StockAnalysis.com fallback
 */
export async function getCompanyFinancialFacts(cik, targetAccn = null, ticker = null) {
  const cik10 = String(cik).padStart(10, '0');
  const data = await secFetch(`${SEC_BASE}/api/xbrl/companyfacts/CIK${cik10}.json`);
  const gaap = data.facts?.['us-gaap'] || {};
  const dei = data.facts?.dei || {};

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

      // If targetAccn is specified, prioritize the exact matching filing accession number
      if (targetAccn) {
        const matchingAccn = candidates.filter(u => u.accn === targetAccn);
        if (matchingAccn.length > 0) {
          matchingAccn.sort((a, b) => {
            const endA = a.end || '';
            const endB = b.end || '';
            return endB.localeCompare(endA);
          });
          return {
            concept: name,
            val: matchingAccn[0].val,
            form: matchingAccn[0].form,
            fp: matchingAccn[0].fp,
            fy: matchingAccn[0].fy,
            end: matchingAccn[0].end,
            filed: matchingAccn[0].filed,
            accn: matchingAccn[0].accn
          };
        }
      }

      // Sort by filed date descending, then end date descending
      const sorted = [...candidates].sort((a, b) => {
        const filedA = a.filed || a.end || '';
        const filedB = b.filed || b.end || '';
        if (filedB !== filedA) return filedB.localeCompare(filedA);
        return (b.end || '').localeCompare(a.end || '');
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

  // Short Term Debt Concepts (in priority order — most specific first)
  const shortDebtFact = extractConceptLatest([
    'DebtCurrent',
    'LongTermDebtCurrent',
    'ShortTermBorrowings',
    'NotesPayableCurrent',
    'CommercialPaper',
    'FinanceLeaseLiabilityCurrent',
    'ShortTermBankLoansAndNotesPayable'
  ]);

  // Long Term Debt Concepts (in priority order)
  const longDebtFact = extractConceptLatest([
    'LongTermDebtNoncurrent',
    'LongTermDebtAndCapitalLeaseObligations',
    'LongTermDebt',
    'LongTermNotesPayable',
    'LongTermLineOfCredit',
    'FinanceLeaseLiabilityNoncurrent',
    'ConvertibleNotesPayable'
  ]);

  // Combined debt fallback — some companies report one aggregate concept
  const combinedDebtFact = (!shortDebtFact && !longDebtFact)
    ? extractConceptLatest([
        'DebtLongtermAndShorttermCombinedAmount',
        'NotesPayable',
        'LongTermDebtAndCapitalLeaseObligations',
        'LiabilitiesOtherThanLongtermDebtNoncurrent'
      ])
    : null;

  // Total Debt = shortDebt + longDebt, or combined fallback
  // IMPORTANT: treat zero-valued tags as valid data (debt = 0 is a real result, not missing)
  let totalDebtVal = 0;
  let hasDebtData = false;

  if (combinedDebtFact && typeof combinedDebtFact.val === 'number') {
    // Use the combined concept directly
    totalDebtVal = combinedDebtFact.val;
    hasDebtData = true;
  } else {
    if (shortDebtFact && typeof shortDebtFact.val === 'number') {
      totalDebtVal += shortDebtFact.val;
      hasDebtData = true;
    }
    if (longDebtFact && typeof longDebtFact.val === 'number') {
      totalDebtVal += longDebtFact.val;
      hasDebtData = true;
    }
  }

  // —— StockAnalysis.com Fallback ——
  // When XBRL debt tags ALL returned null (company doesn't tag debt), try SA as cross-check.
  // If SA also reports 0, we trust that: debt = 0 is valid (not N/A).
  let debtFallbackSource = null;
  if (!hasDebtData && ticker) {
    try {
      const saDebt = await getDebtFromStockAnalysis(ticker);
      if (saDebt !== null) {
        totalDebtVal = saDebt.totalDebt;
        hasDebtData = true;
        debtFallbackSource = saDebt.source;
        console.log('[sec-provider] Using SA fallback debt for', ticker, ':', saDebt.totalDebt, 'from', saDebt.source);
      }
    } catch (_) { /* fallback failed silently */ }
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

  // Revenues — try aggregate concepts first, then net-sales variants
  const revenueFact = extractConceptLatest([
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueGoodsNet',
    'RevenueNotFromContractWithCustomer'
  ]);

  // Impure / Interest Income — ONLY genuine interest/investment income concepts.
  // CRITICAL: Do NOT include NonoperatingIncomeExpense — it represents total
  // non-operating P&L (can be negative or orders-of-magnitude larger than revenue)
  // and would produce ratios >100%, which is mathematically impossible for this screen.
  const interestIncomeFact = extractConceptLatest([
    'InvestmentIncomeInterest',
    'InterestIncomeOperatingPaid',
    'InterestAndDividendIncomeOperating',
    'InterestIncomeOperating',
    'InvestmentIncomeInterestAndDividend',
    'InterestAndFeeIncomeLoansAndLeases'
  ]);

  // Extract Shares Outstanding from DEI or GAAP (authoritative official source)
  function extractSharesOutstanding() {
    // 1. DEI EntityCommonStockSharesOutstanding (cover page disclosure)
    const deiShares = dei.EntityCommonStockSharesOutstanding;
    if (deiShares && deiShares.units) {
      const units = deiShares.units.shares || Object.values(deiShares.units)[0];
      if (Array.isArray(units) && units.length > 0) {
        if (targetAccn) {
          const match = units.filter(u => u.accn === targetAccn);
          if (match.length > 0) {
            match.sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
            if (typeof match[0].val === 'number' && match[0].val > 0) return match[0].val;
          }
        }
        const sorted = [...units].sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
        if (typeof sorted[0].val === 'number' && sorted[0].val > 0) return sorted[0].val;
      }
    }

    // 2. GAAP CommonStockSharesOutstanding
    const gaapShares = gaap.CommonStockSharesOutstanding;
    if (gaapShares && gaapShares.units) {
      const units = gaapShares.units.shares || Object.values(gaapShares.units)[0];
      if (Array.isArray(units) && units.length > 0) {
        if (targetAccn) {
          const match = units.filter(u => u.accn === targetAccn);
          if (match.length > 0) {
            match.sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
            if (typeof match[0].val === 'number' && match[0].val > 0) return match[0].val;
          }
        }
        const sorted = [...units].sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
        if (typeof sorted[0].val === 'number' && sorted[0].val > 0) return sorted[0].val;
      }
    }

    // 3. GAAP WeightedAverageNumberOfSharesOutstandingBasic
    const basicShares = gaap.WeightedAverageNumberOfSharesOutstandingBasic;
    if (basicShares && basicShares.units) {
      const units = basicShares.units.shares || Object.values(basicShares.units)[0];
      if (Array.isArray(units) && units.length > 0) {
        const sorted = [...units].sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
        if (typeof sorted[0].val === 'number' && sorted[0].val > 0) return sorted[0].val;
      }
    }

    return null;
  }

  // Extract Entity Public Float in USD from DEI
  function extractPublicFloat() {
    const floatNode = dei.EntityPublicFloat;
    if (floatNode && floatNode.units) {
      const units = floatNode.units.USD || Object.values(floatNode.units)[0];
      if (Array.isArray(units) && units.length > 0) {
        const sorted = [...units].sort((a, b) => (b.filed || b.end || '').localeCompare(a.filed || a.end || ''));
        if (typeof sorted[0].val === 'number' && sorted[0].val > 0) return sorted[0].val;
      }
    }
    return null;
  }

  const sharesOutstandingVal = extractSharesOutstanding();
  const publicFloatUsdVal = extractPublicFloat();

  // Determine latest reporting period info
  const primaryPeriod = assetsFact || revenueFact || cashFact || shortDebtFact || longDebtFact || null;

  // Compute Revenue Segment Breakdown (AAOIFI Standard No. 21 Rule 1 & 2)
  const revenueBreakdown = extractRevenueSegmentBreakdown(gaap, targetAccn, revenueFact, extractConceptLatest);

  return {
    cik: cik10,
    periodInfo: primaryPeriod ? {
      form: primaryPeriod.form,
      fiscalYear: primaryPeriod.fy,
      fiscalPeriod: primaryPeriod.fp,
      endDate: primaryPeriod.end,
      reportDate: primaryPeriod.end,
      filingDate: primaryPeriod.filed,
      accessionNumber: primaryPeriod.accn
    } : null,
    metrics: {
      totalAssets: assetsFact ? assetsFact.val : null,
      // hasDebtData is true when XBRL tags found OR SA fallback succeeded.
      // If neither found anything, return null (genuine REVIEW needed).
      totalDebt: hasDebtData ? totalDebtVal : null,
      shortTermDebt: shortDebtFact ? shortDebtFact.val : (combinedDebtFact ? null : 0),
      longTermDebt: longDebtFact ? longDebtFact.val : (combinedDebtFact ? null : 0),
      cashAndSecurities: hasCashData ? cashSecuritiesVal : (cashFact ? cashFact.val : null),
      cashAndEquivalents: cashFact ? cashFact.val : null,
      marketableSecurities: marketableSecFact ? marketableSecFact.val : 0,
      totalRevenue: revenueFact ? revenueFact.val : null,
      // Interest income: clamp to [0, totalRevenue] to prevent impossible ratios.
      // If interestIncomeFact > totalRevenue, it's likely a wrong concept — treat as null (REVIEW).
      interestIncome: (() => {
        if (!interestIncomeFact) return null;
        const raw = interestIncomeFact.val;
        if (typeof raw !== 'number') return null;
        const clamped = Math.max(0, raw);
        // Sanity check: if interest income exceeds total revenue, the concept is wrong
        const rev = revenueFact?.val;
        if (typeof rev === 'number' && rev > 0 && clamped > rev) {
          console.warn('[sec-provider] Impure income concept', interestIncomeFact.concept, '=', clamped, 'exceeds total revenue', rev, '— treating as null (REVIEW_REQUIRED)');
          return null;
        }
        return clamped;
      })(),
      impureIncome: (() => {
        if (!interestIncomeFact) return null;
        const raw = interestIncomeFact.val;
        if (typeof raw !== 'number') return null;
        const clamped = Math.max(0, raw);
        const rev = revenueFact?.val;
        if (typeof rev === 'number' && rev > 0 && clamped > rev) return null;
        return clamped;
      })(),
      revenueBreakdown,
      sharesOutstanding: sharesOutstandingVal,
      publicFloatUsd: publicFloatUsdVal
    },
    factsUsed: {
      assets: assetsFact,
      shortDebt: shortDebtFact,
      longDebt: longDebtFact,
      combinedDebt: combinedDebtFact,
      debtFallbackSource: debtFallbackSource, // non-null when SA was used instead of XBRL
      cash: cashFact,
      marketableSecurities: marketableSecFact,
      revenue: revenueFact,
      revenueBreakdown,
      interestIncome: interestIncomeFact,
      sharesOutstanding: sharesOutstandingVal,
      publicFloatUsd: publicFloatUsdVal
    }
  };
}

/**
 * Extracts Revenue Segment Breakdown and classifies income streams per AAOIFI Standard No. 21.
 */
export function extractRevenueSegmentBreakdown(gaap, targetAccn, revenueFact, extractConceptLatestFn) {
  const totalRevenue = revenueFact?.val || null;
  const segments = [];
  let impureRevenue = 0;
  let ambiguousRevenue = 0;
  let isAmbiguous = false;
  let ambiguityReason = null;

  // 1. Interest & Investment Income (Riba / Conventional financial returns)
  const interestFact = extractConceptLatestFn([
    'InvestmentIncomeInterest',
    'InterestIncomeOperating',
    'InterestAndFeeIncomeLoansAndLeases',
    'InterestAndDividendIncomeOperating',
    'InvestmentIncomeInterestAndDividend'
  ]);

  if (interestFact && typeof interestFact.val === 'number' && interestFact.val > 0) {
    const rawVal = interestFact.val;
    impureRevenue += rawVal;
    const pct = (typeof totalRevenue === 'number' && totalRevenue > 0)
      ? Number(((rawVal / totalRevenue) * 100).toFixed(2))
      : 100;
    segments.push({
      name: 'Interest & Investment Income',
      concept: interestFact.concept,
      category: 'INTEREST_FINANCIAL',
      amount: rawVal,
      percentageOfRevenue: pct,
      isPermissible: false,
      note: 'Non-permissible under AAOIFI SS21 (Riba / Conventional Interest Income)'
    });
  }

  // 2. Licensing, Royalties & Collaboration Revenue
  const licensingFact = extractConceptLatestFn([
    'LicenseAndRoyaltyRevenue',
    'RoyaltyRevenue',
    'LicenseRevenue',
    'CollaborationRevenue',
    'TechnologyLicenseRevenue',
    'LicenseAgreementsRevenue'
  ]);

  if (licensingFact && typeof licensingFact.val === 'number' && licensingFact.val > 0) {
    const rawVal = licensingFact.val;
    const pct = (typeof totalRevenue === 'number' && totalRevenue > 0)
      ? Number(((rawVal / totalRevenue) * 100).toFixed(2))
      : 100;
    // In clinical/development-stage biotechs or where licensing is the primary revenue (>20%),
    // terms of licensing agreements and milestone payments require manual audit
    const isDominant = pct > 20 || !totalRevenue || totalRevenue <= 0;
    if (isDominant) {
      ambiguousRevenue += rawVal;
      isAmbiguous = true;
      ambiguityReason = 'Developmental licensing / collaboration deal revenue without commercial product sales itemization requires manual audit.';
    }
    segments.push({
      name: 'Licensing, Royalties & Collaboration',
      concept: licensingFact.concept,
      category: 'LICENSING_ROYALTY',
      amount: rawVal,
      percentageOfRevenue: pct,
      isPermissible: isDominant ? null : true,
      note: isDominant
        ? 'Ambiguous: Developmental licensing/collaboration agreement requires manual audit'
        : 'Permissible commercial technology / patent licensing'
    });
  }

  // 3. Services Revenue
  const serviceFact = extractConceptLatestFn([
    'ServiceRevenue',
    'SalesRevenueServicesNet',
    'SalesRevenueServicesGross'
  ]);

  if (serviceFact && typeof serviceFact.val === 'number' && serviceFact.val > 0) {
    const rawVal = serviceFact.val;
    const pct = (typeof totalRevenue === 'number' && totalRevenue > 0)
      ? Number(((rawVal / totalRevenue) * 100).toFixed(2))
      : null;
    segments.push({
      name: 'Services & Operations',
      concept: serviceFact.concept,
      category: 'SERVICE',
      amount: rawVal,
      percentageOfRevenue: pct,
      isPermissible: true,
      note: 'Permissible commercial service operations'
    });
  }

  // 4. Products / Commercial Goods Sales
  const productFact = extractConceptLatestFn([
    'ProductRevenueNet',
    'SalesRevenueGoodsNet'
  ]);

  if (productFact && typeof productFact.val === 'number' && productFact.val > 0) {
    const rawVal = productFact.val;
    const pct = (typeof totalRevenue === 'number' && totalRevenue > 0)
      ? Number(((rawVal / totalRevenue) * 100).toFixed(2))
      : null;
    segments.push({
      name: 'Product & Commercial Sales',
      concept: productFact.concept,
      category: 'COMMERCIAL_PRODUCT',
      amount: rawVal,
      percentageOfRevenue: pct,
      isPermissible: true,
      note: 'Permissible core physical/digital product sales'
    });
  }

  // 5. Pre-revenue / Zero Revenue or missing breakdown
  if (!totalRevenue || totalRevenue <= 0) {
    isAmbiguous = true;
    ambiguityReason = 'Pre-revenue / developmental phase enterprise: commercial sales not yet established in reported period.';
  } else if (segments.length === 0) {
    segments.push({
      name: 'Consolidated Commercial Operations',
      concept: revenueFact?.concept || 'RevenueFromContractWithCustomerExcludingAssessedTax',
      category: 'COMMERCIAL_PRODUCT',
      amount: totalRevenue,
      percentageOfRevenue: 100,
      isPermissible: true,
      note: 'Consolidated revenue from commercial customer contracts'
    });
  }

  // Check if interest income exceeds total revenue (clinical biotech pattern)
  if (interestFact && typeof interestFact.val === 'number' && totalRevenue > 0 && interestFact.val > totalRevenue) {
    isAmbiguous = true;
    ambiguityReason = `Interest & investment returns ($${(interestFact.val / 1e6).toFixed(1)}M) exceed commercial revenues ($${(totalRevenue / 1e6).toFixed(1)}M). Development stage company with high treasury returns requires manual audit.`;
  }

  const nonPermissibleRatioPct = (typeof totalRevenue === 'number' && totalRevenue > 0)
    ? Number((((impureRevenue + ambiguousRevenue) / totalRevenue) * 100).toFixed(2))
    : (impureRevenue > 0 || ambiguousRevenue > 0 ? 100 : null);

  return {
    totalRevenue,
    isDisclosed: segments.length > 0,
    isAmbiguous,
    ambiguityReason,
    segments,
    impureRevenueAmount: impureRevenue,
    ambiguousRevenueAmount: ambiguousRevenue,
    nonPermissibleRatioPct
  };
}

/**
 * Fast helper to resolve shares outstanding and public float from SEC EDGAR company facts.
 */
export async function getSecSharesAndFloat(cik) {
  try {
    const facts = await getCompanyFinancialFacts(cik);
    return {
      sharesOutstanding: facts.metrics?.sharesOutstanding || null,
      publicFloatUsd: facts.metrics?.publicFloatUsd || null,
      source: 'SEC EDGAR DEI Disclosures'
    };
  } catch (err) {
    console.warn(`Could not get SEC shares for CIK ${cik}:`, err.message);
    return null;
  }
}
