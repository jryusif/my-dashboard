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

  // 1. Business Activity Screening
  const sector = (company.sector || '').trim();
  const industry = (company.industry || '').trim();
  const companyName = (company.name || '').toLowerCase();
  const desc = (company.description || '').toLowerCase();

  const combinedProfileText = `${company.sector || ''} ${company.industry || ''} ${company.name || ''} ${company.description || ''}`.toLowerCase();

  for (const prohibited of SHARIAH_CONFIG.prohibitedActivities) {
    // Check prohibited sectors
    const sectorMatch = prohibited.sectors.some(s => 
      sector.toLowerCase().includes(s.toLowerCase()) || 
      industry.toLowerCase().includes(s.toLowerCase())
    );

    // Check prohibited keywords across all company classification texts
    const keywordMatch = prohibited.keywords.some(kw => 
      combinedProfileText.includes(kw.toLowerCase())
    );

    if (sectorMatch || keywordMatch) {
      businessStatus = 'FAIL';
      businessFailReason = prohibited.name;
      reviewReasons.push(`Prohibited primary business activity: ${prohibited.name}`);
      break;
    }
  }

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
    debtStatus = debtRatioPct <= SHARIAH_CONFIG.thresholds.debtRatioLimitPct ? 'PASS' : 'FAIL';
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
    resultFormatted: debtRatioPct !== null ? `${debtRatioPct}%` : 'N/A',
    threshold: SHARIAH_CONFIG.thresholds.debtRatioLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.debtRatioLimitPct}%`,
    status: debtStatus,
    source: filingSource
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
    cashStatus = cashRatioPct <= SHARIAH_CONFIG.thresholds.cashSecuritiesRatioLimitPct ? 'PASS' : 'FAIL';
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
    impureStatus = impureRatioPct <= SHARIAH_CONFIG.thresholds.impureIncomeLimitPct ? 'PASS' : 'FAIL';
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
    resultFormatted: impureRatioPct !== null ? `${impureRatioPct}%` : 'N/A',
    threshold: SHARIAH_CONFIG.thresholds.impureIncomeLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.impureIncomeLimitPct}%`,
    status: impureStatus,
    source: filingSource
  });

  // 6. Purification Ratio
  const purificationPct = impureRatioPct !== null ? impureRatioPct : (
    (interestIncome && totalRevenue && totalRevenue > 0) ? 
      Number(((interestIncome / totalRevenue) * 100).toFixed(2)) : 0
  );

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
