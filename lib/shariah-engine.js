/**
 * Deterministic Shariah Rules Engine (AAOIFI Standard No. 21)
 * 
 * Computes Shariah compliance using mathematical proofs and official SEC disclosures.
 * Zero hallucination, strict deterministic logic.
 */

import { SHARIAH_CONFIG } from './shariah-config.js';

export function screenCompanyShariah({ company, financials, marketCap, previousScreening = null }) {
  const reviewReasons = [];
  const calculationDetails = [];
  let businessStatus = 'PASS';
  let businessFailReason = null;

  // 1. Business Activity Screening (AAOIFI Standard No. 21 — Rule 1)
  const sector = (company.sector || '').trim();
  const industry = (company.industry || '').trim();
  const companyName = (company.name || '').toLowerCase();
  const desc = (company.description || '').toLowerCase();
  const sic = (company.sic || company.sicCode || '').toString().trim();
  const sicNum = parseInt(sic, 10);
  const sicDescription = (company.sicDescription || '').trim();

  const combinedProfileText = `${company.sector || ''} ${company.industry || ''} ${company.name || ''} ${company.description || ''} ${sicDescription}`.toLowerCase();

  for (const prohibited of SHARIAH_CONFIG.prohibitedActivities) {
    // Check official SEC SIC code ranges
    let sicMatch = false;
    if (!isNaN(sicNum) && Array.isArray(prohibited.sicRanges) && prohibited.sicRanges.length > 0) {
      sicMatch = prohibited.sicRanges.some(([min, max]) => sicNum >= min && sicNum <= max);
      // For pork, only match if meat/pork keywords also exist in classification
      if (sicMatch && prohibited.code === 'PORK') {
        const hasPorkKeyword = prohibited.keywords.some(kw => combinedProfileText.includes(kw.toLowerCase()));
        if (!hasPorkKeyword) sicMatch = false;
      }
    }

    // Check prohibited sectors and SIC descriptions
    const sectorMatch = prohibited.sectors.some(s => 
      sector.toLowerCase().includes(s.toLowerCase()) || 
      industry.toLowerCase().includes(s.toLowerCase()) ||
      sicDescription.toLowerCase().includes(s.toLowerCase())
    );

    // Check prohibited keywords across all company classification texts
    const keywordMatch = prohibited.keywords.some(kw => 
      combinedProfileText.includes(kw.toLowerCase())
    );

    if (sicMatch || sectorMatch || keywordMatch) {
      businessStatus = 'FAIL';
      businessFailReason = prohibited.name;
      reviewReasons.push(`Prohibited primary business activity: ${prohibited.name}`);
      break;
    }
  }

  // If no sector, industry, or SIC could be found at all, flag for review
  if (!sector && !industry && !sic && !sicDescription) {
    businessStatus = 'REVIEW_REQUIRED';
    reviewReasons.push('Company industry and SEC business activity classification could not be verified.');
  }

  const primaryActivity = sicDescription || industry || sector || 'General Commercial Operations';

  // Push Rule 1: Business Activity & Revenue Permissibility to calculation details
  calculationDetails.push({
    key: 'business_activity',
    type: 'BUSINESS_ACTIVITY',
    title: 'Business Activity & Revenue Permissibility',
    ruleReference: 'AAOIFI Standard No. 21 — Rule 1 (Core Activity Permissibility)',
    status: businessStatus,
    businessActivity: primaryActivity,
    sicCode: sic || null,
    sicDescription: sicDescription || null,
    sector: sector || null,
    industry: industry || null,
    prohibitedCategoriesTested: SHARIAH_CONFIG.prohibitedActivities.map(p => p.name),
    prohibitedMatch: businessFailReason || null,
    resultFormatted: businessStatus === 'PASS' ? 'Compliant (Permissible Activity)' : (businessStatus === 'FAIL' ? `Prohibited (${businessFailReason})` : 'Under Review'),
    thresholdFormatted: '100% Core Business Permissible',
    complianceNote: businessStatus === 'PASS' 
      ? `Core commercial business (${primaryActivity}) is permissible under AAOIFI equity governance standards. Evaluated against all 8 prohibited industry sectors (Conventional Finance, Insurance, Alcohol, Gambling, Tobacco, Adult Entertainment, Weapons, Pork).`
      : (businessStatus === 'FAIL'
        ? `Primary business activity violates Shariah criteria: ${businessFailReason}. Core business exclusion applies unconditionally.`
        : 'Company industry classification is pending official SEC verification.'),
    source: sic ? `SEC EDGAR Submissions (SIC ${sic}: ${sicDescription || primaryActivity})` : (company.sector ? `SEC Profile (${company.sector})` : 'SEC EDGAR Submissions')
  });

  // 2. Determine Denominator for Balance Sheet Ratios (Market Cap preferred, Total Assets fallback)
  let denominatorValue = null;
  let denominatorName = 'Market Capitalization';
  let denominatorSource = 'Current Market Data';

  if (typeof marketCap === 'number' && marketCap > 0) {
    denominatorValue = marketCap;
    denominatorName = 'Market Capitalization';
    denominatorSource = 'Market Quote';
  } else if (financials && typeof financials.metrics?.totalAssets === 'number' && financials.metrics.totalAssets > 0) {
    denominatorValue = financials.metrics.totalAssets;
    denominatorName = 'Total Assets (Fallback)';
    denominatorSource = `SEC ${financials.periodInfo?.form || '10-Q'}`;
  }

  const filingSource = financials?.periodInfo ? 
    `SEC ${financials.periodInfo.form} (${financials.periodInfo.fiscalPeriod || ''} ${financials.periodInfo.fiscalYear || ''}) Filed: ${financials.periodInfo.filingDate || 'N/A'}` :
    'SEC EDGAR XBRL';
  const debtDataSource = financials?.factsUsed?.debtFallbackSource
    ? financials.factsUsed.debtFallbackSource
    : filingSource;

  // 3. Ratio 1: Debt Ratio
  let debtRatioPct = null;
  let debtStatus = 'REVIEW_REQUIRED';
  const totalDebt = financials?.metrics?.totalDebt;

  if (totalDebt === null || totalDebt === undefined) {
    reviewReasons.push('Total debt could not be reliably determined from the latest SEC filing.');
  } else if (!denominatorValue) {
    reviewReasons.push('Market capitalization or Total Assets is unavailable as a denominator for the Debt Ratio.');
  } else {
    debtRatioPct = Number(((totalDebt / denominatorValue) * 100).toFixed(2));
    if (debtRatioPct > 100) {
      // Mathematically possible but extremely rare (distressed micro-caps).
      // If denominator is market cap and ratio >100% it may also indicate a bad
      // market cap feed value (e.g. using shares in millions vs actual share count).
      debtStatus = 'REVIEW_REQUIRED';
      reviewReasons.push(`Debt Ratio calculated at ${debtRatioPct}% — exceeds 100%, which may indicate a denominator data error (market cap feed mismatch). Manual verification required.`);
    } else {
      debtStatus = debtRatioPct <= SHARIAH_CONFIG.thresholds.debtRatioLimitPct ? 'PASS' : 'FAIL';
    }
  }

  calculationDetails.push({
    key: 'debt_ratio',
    title: 'Debt to Market Cap Ratio',
    numerator: totalDebt !== null && totalDebt !== undefined ? totalDebt : null,
    numeratorLabel: 'Total Debt (Short-Term + Long-Term Borrowings)',
    denominator: denominatorValue,
    denominatorLabel: denominatorName,
    formula: '(Total Debt / Denominator) × 100',
    result: debtRatioPct,
    resultFormatted: debtRatioPct !== null 
      ? (debtRatioPct > 100 ? `${debtRatioPct}% — Calculation Error (>100%)` : `${debtRatioPct}%`)
      : 'N/A (Debt data not found in XBRL filing)',
    threshold: SHARIAH_CONFIG.thresholds.debtRatioLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.debtRatioLimitPct}%`,
    status: debtStatus,
    source: debtDataSource
  });

  // 4. Ratio 2: Cash & Interest-bearing Securities Ratio
  let cashRatioPct = null;
  let cashStatus = 'REVIEW_REQUIRED';
  const cashAndSecurities = financials?.metrics?.cashAndSecurities;

  if (cashAndSecurities === null || cashAndSecurities === undefined) {
    reviewReasons.push('Cash and interest-bearing securities could not be reliably determined from the latest filing.');
  } else if (!denominatorValue) {
    reviewReasons.push('Denominator unavailable for Cash & Marketable Securities ratio.');
  } else {
    cashRatioPct = Number(((cashAndSecurities / denominatorValue) * 100).toFixed(2));
    if (cashRatioPct > 100) {
      cashStatus = 'REVIEW_REQUIRED';
      reviewReasons.push(`Cash Ratio calculated at ${cashRatioPct}% — exceeds 100%, indicating a likely denominator mismatch (market cap feed error). Manual verification required.`);
    } else {
      cashStatus = cashRatioPct <= SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct ? 'PASS' : 'FAIL';
    }
  }

  calculationDetails.push({
    key: 'cash_ratio',
    title: 'Cash & Interest-bearing Securities Ratio',
    numerator: cashAndSecurities !== null && cashAndSecurities !== undefined ? cashAndSecurities : null,
    numeratorLabel: 'Cash, Equivalents & Marketable Securities',
    denominator: denominatorValue,
    denominatorLabel: denominatorName,
    formula: '(Liquid Securities / Denominator) × 100',
    result: cashRatioPct,
    resultFormatted: cashRatioPct !== null ? `${cashRatioPct}%` : 'N/A',
    threshold: SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct}%`,
    status: cashStatus,
    source: filingSource
  });

  // 5. Ratio 3: Impure & Interest Income Ratio
  let impureRatioPct = null;
  let impureStatus = 'REVIEW_REQUIRED';
  const interestIncome = financials?.metrics?.interestIncome;
  const totalRevenue = financials?.metrics?.totalRevenue;

  if (interestIncome === null || interestIncome === undefined) {
    // If revenue exists but interest income is not broken out separately, flag review
    reviewReasons.push('Interest income was not explicitly itemized in the reported XBRL taxonomy facts.');
  } else if (!totalRevenue || totalRevenue <= 0) {
    reviewReasons.push('Total Revenue is zero or not reported in the current filing period.');
  } else {
    impureRatioPct = Number(((interestIncome / totalRevenue) * 100).toFixed(2));
    // Sanity guard: ratio > 100% is impossible for income-as-% -of-revenue
    if (impureRatioPct > 100) {
      impureStatus = 'REVIEW_REQUIRED';
      reviewReasons.push(`Impure Income Ratio calculated at ${impureRatioPct}% — mathematically impossible (>100% of revenue). XBRL concept mismatch detected; manual review of SEC filing required.`);
      impureRatioPct = null; // reset so UI shows REVIEW not the bad number
    } else {
      impureStatus = impureRatioPct <= SHARIAH_CONFIG.thresholds.impureIncomeLimitPct ? 'PASS' : 'FAIL';
    }
  }

  calculationDetails.push({
    key: 'impure_income_ratio',
    title: 'Impure & Interest Income Ratio',
    numerator: interestIncome !== null && interestIncome !== undefined ? interestIncome : null,
    numeratorLabel: 'Interest & Impure Non-Operating Income',
    denominator: totalRevenue,
    denominatorLabel: 'Total Revenue',
    formula: '(Interest Income / Total Revenue) × 100',
    result: impureRatioPct,
    resultFormatted: impureRatioPct !== null 
      ? `${impureRatioPct}%`
      : (interestIncome !== null ? 'Calculation Error — XBRL concept mismatch (ratio >100%)' : 'N/A'),
    threshold: SHARIAH_CONFIG.thresholds.impureIncomeLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.impureIncomeLimitPct}%`,
    status: impureStatus,
    source: filingSource
  });

  // 6. Purification Ratio
  // Only apply purification when impureRatioPct is a valid, sane number
  const purificationPct = (impureRatioPct !== null && impureRatioPct >= 0 && impureRatioPct <= 100) 
    ? impureRatioPct 
    : 0;

  // 7. Overall Verdict Determination
  let status = 'PASS';
  let statusChangeNote = null;

  if (businessStatus === 'FAIL') {
    status = 'FAIL';
  } else if (debtStatus === 'FAIL' || cashStatus === 'FAIL' || impureStatus === 'FAIL') {
    status = 'FAIL';
  } else if (debtStatus === 'REVIEW_REQUIRED' || cashStatus === 'REVIEW_REQUIRED' || impureStatus === 'REVIEW_REQUIRED') {
    status = 'REVIEW_REQUIRED';
  } else {
    status = 'PASS';
  }

  // Detect status change if previous screening exists
  if (previousScreening && previousScreening.status && previousScreening.status !== status) {
    let reason = 'Financial ratios or disclosures updated in new screening cycle.';
    if (status === 'FAIL') {
      if (businessStatus === 'FAIL') reason = `Business activity non-compliant: ${businessFailReason}`;
      else if (debtStatus === 'FAIL') reason = `Debt ratio (${debtRatioPct}%) exceeded threshold (${SHARIAH_CONFIG.thresholds.debtRatioLimitPct}%).`;
      else if (cashStatus === 'FAIL') reason = `Cash ratio (${cashRatioPct}%) exceeded threshold (${SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct}%).`;
      else if (impureStatus === 'FAIL') reason = `Impure income (${impureRatioPct}%) exceeded threshold (${SHARIAH_CONFIG.thresholds.impureIncomeLimitPct}%).`;
    } else if (status === 'PASS') {
      reason = 'All financial ratios and business activity verified compliant under latest SEC disclosures.';
    }
    statusChangeNote = `Status changed from ${previousScreening.status} to ${status}: ${reason}`;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (SHARIAH_CONFIG.screeningValidityDays * 24 * 60 * 60 * 1000));

  return {
    status,
    methodology: SHARIAH_CONFIG.methodologyName,
    businessActivity: industry || sector || 'General Commercial',
    businessStatus,
    debtRatioPct,
    debtThresholdPct: SHARIAH_CONFIG.thresholds.debtRatioLimitPct,
    cashRatioPct,
    cashThresholdPct: SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct,
    impureRatioPct,
    impureThresholdPct: SHARIAH_CONFIG.thresholds.impureIncomeLimitPct,
    purificationPct,
    calculationDetails,
    reviewReasons,
    screenedAt: now,
    expiresAt,
    lastFilingUsed: financials?.periodInfo?.accessionNumber || null,
    periodInfo: financials?.periodInfo || null,
    previousStatus: previousScreening?.status || null,
    statusChangeNote
  };
}
