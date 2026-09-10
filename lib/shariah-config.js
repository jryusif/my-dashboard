/**
 * Central Shariah Screening Configuration (AAOIFI Standard)
 * 
 * Based on Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI)
 * Shariah Standard No. 21 (Financial Papers - Shares and Bonds).
 * 
 * All thresholds, formulas, definitions, and prohibited sectors are managed centrally here.
 */

export const SHARIAH_CONFIG = {
  methodologyName: 'AAOIFI Standard No. 21',
  version: '2026.1',
  standardBody: 'Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI)',
  description: 'Deterministic rule-based Shariah equity screening focusing on business activity permissibility and core financial balance-sheet/income ratios.',
  
  // Cache & Validity
  screeningValidityDays: 7,
  recheckFilingForms: ['10-K', '10-Q', '8-K'],

  // Core Financial Thresholds (Ratios expressed in percentage)
  thresholds: {
    // 1. Debt Ratio: (Short Term Debt + Long Term Debt) / Denominator <= 33%
    debtRatioLimitPct: 33.0,

    // 2. Cash & Interest-Bearing Securities: (Cash & Cash Eq + Short Term Investments) / Denominator <= 33%
    cashSecuritiesRatioLimitPct: 33.0,

    // 3. Impure & Interest Income: (Interest Income + Non-Operating Prohibited Revenue) / Total Revenue <= 5%
    impureIncomeLimitPct: 5.0,
  },

  // Denominator selection:
  // AAOIFI permits using Market Capitalization (30-day or 12-month average or current)
  // or Total Assets if reliable market cap is unavailable.
  denominators: {
    primary: 'MARKET_CAP',
    secondary: 'TOTAL_ASSETS',
    label: 'Market Capitalization (AAOIFI Standard)'
  },

  // Purification Formula:
  // Purification % = (Total Impure / Interest Income / Total Revenue) * 100
  purificationFormulaDescription: 'Impure Income divided by Total Revenue (expressed as % of dividend/returns to be purified)',

  // Prohibited Business Activities & Sectors (Deterministic Screening with Official SEC SIC Code Mappings)
  prohibitedActivities: [
    {
      code: 'CONV_BANKING',
      name: 'Conventional Banking & Financial Services',
      sicRanges: [[6000, 6199], [6200, 6299], [6710, 6712]],
      keywords: ['bank', 'banks', 'banking', 'commercial bank', 'national commercial bank', 'investment banking', 'consumer lending', 'credit services', 'mortgage', 'usury', 'depository', 'brokerage', 'securities broker'],
      sectors: ['Financials', 'Banking', 'Banks', 'Consumer Finance', 'Diversified Financial Services', 'National Commercial Banks', 'State Commercial Banks', 'Commercial Banks', 'Savings Institutions']
    },
    {
      code: 'CONV_INSURANCE',
      name: 'Conventional Insurance & Reinsurance',
      sicRanges: [[6300, 6411]],
      keywords: ['life insurance', 'property insurance', 'casualty insurance', 'reinsurance', 'insurance agent', 'title insurance'],
      sectors: ['Insurance', 'Insurance Carriers', 'Life Insurance', 'Hospital & Medical Service Plans', 'Fire, Marine & Casualty Insurance']
    },
    {
      code: 'ALCOHOL',
      name: 'Alcohol Production & Distribution',
      sicRanges: [[2080, 2085]],
      keywords: ['alcoholic beverages', 'brewery', 'distillery', 'wine', 'beer', 'liquor', 'malt beverages', 'distilled spirits'],
      sectors: ['Beverages - Brewers', 'Beverages - Wineries & Distilleries', 'Malt Beverages', 'Wines, Brandy & Brandy Spirits', 'Distilled & Blended Liquors']
    },
    {
      code: 'GAMBLING',
      name: 'Gambling & Casinos',
      sicRanges: [[7990, 7993], [7999, 7999]],
      keywords: ['casino', 'gambling', 'sports betting', 'lottery', 'wagering', 'slot machines', 'gaming tables'],
      sectors: ['Casinos & Gaming', 'Hotels & Motels - Casino', 'Gaming', 'Amusement and Recreation Services']
    },
    {
      code: 'TOBACCO',
      name: 'Tobacco & Cannabis (Recreational)',
      sicRanges: [[2100, 2199]],
      keywords: ['tobacco', 'cigarettes', 'cigars', 'vaping', 'chewing tobacco', 'snuff'],
      sectors: ['Tobacco', 'Cigarettes', 'Tobacco Products']
    },
    {
      code: 'ADULT_ENT',
      name: 'Adult Entertainment',
      sicRanges: [],
      keywords: ['adult entertainment', 'pornography', 'adult media', 'erotic'],
      sectors: ['Entertainment - Adult']
    },
    {
      code: 'WEAPONS_DEFENSE',
      name: 'Conventional Weapons & Armaments',
      sicRanges: [[3480, 3489], [3760, 3769], [3795, 3795]],
      keywords: ['firearms manufacturer', 'cluster munitions', 'nuclear weapons', 'weapons systems', 'small arms ammunition', 'ordnance'],
      sectors: ['Aerospace & Defense - Weapons', 'Ordnance & Accessories', 'Small Arms', 'Ammunition']
    },
    {
      code: 'PORK',
      name: 'Pork Production & Processing',
      sicRanges: [[2011, 2013]],
      keywords: ['pork processing', 'swine', 'pork production', 'hog farming', 'bacon processing'],
      sectors: ['Meat Products - Pork', 'Sausages & Other Prepared Meat Products']
    }
  ],

  // Permissible Sector Guidelines
  permissibleSectors: [
    'Technology',
    'Semiconductors',
    'Software - Infrastructure',
    'Software - Application',
    'Healthcare',
    'Medical Devices',
    'Biotechnology',
    'Consumer Goods',
    'Industrial Manufacturing',
    'Telecommunications',
    'Energy',
    'Utilities',
    'Real Estate (Operational/Leasing conforming)',
    'Materials'
  ],

  // Disclaimers
  disclaimerText: 'Shariah screening is based on the selected AAOIFI methodology and publicly available company disclosures (SEC EDGAR filings). It is an educational and analytical screening tool, not a religious fatwa.',
  limitationsText: 'Screening relies on XBRL filings and standard financial taxonomies. Financial companies and non-disclosed non-operating interest line items are subject to manual audit review.'
};
