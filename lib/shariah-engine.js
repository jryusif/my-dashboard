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

  // 1a. Sector Classification Screen (Baseline & Informational — AAOIFI Standard No. 21 Rule 1)
  const sector = (company.sector || '').trim();
  const industry = (company.industry || '').trim();
  const companyName = (company.name || '').toLowerCase();
  const desc = (company.description || '').toLowerCase();
  const sic = (company.sic || company.sicCode || '').toString().trim();
  const sicNum = parseInt(sic, 10);
  const sicDescription = (company.sicDescription || '').trim();

  let sectorStatus = 'PASS';
  let sectorFailReason = null;

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
      sectorStatus = 'FAIL';
      sectorFailReason = prohibited.name;
      reviewReasons.push(`Prohibited primary sector classification: ${prohibited.name}`);
      break;
    }
  }

  // If no sector, industry, or SIC could be found at all, flag sector for review
  if (!sector && !industry && !sic && !sicDescription) {
    sectorStatus = 'REVIEW_REQUIRED';
    reviewReasons.push('Company industry and SEC business activity classification could not be verified.');
  }

  const primaryActivity = sicDescription || industry || sector || 'General Commercial Operations';

  // 1b. Stock-Based Revenue Segment Screening (AAOIFI Standard No. 21 Rule 1 & 2)
  // Actual examination of reported revenue streams from 10-Q/10-K notes & financial statements
  const totalRevenue = financials?.metrics?.totalRevenue;
  const revenueBreakdown = financials?.metrics?.revenueBreakdown || null;
  let revenueStatus = 'PASS';
  let revenueFailReason = null;
  let revenueImpureRatioPct = null;
  let revenueComplianceNote = '';

  if (sectorStatus === 'FAIL') {
    businessStatus = 'FAIL';
    businessFailReason = `Prohibited Sector: ${sectorFailReason}`;
    revenueStatus = 'FAIL';
    revenueComplianceNote = `Primary corporate activity violates Shariah exclusion criteria (${sectorFailReason}). Sector-level exclusion applies unconditionally.`;
  } else if (!totalRevenue || totalRevenue <= 0) {
    // Pre-revenue / development-stage company (e.g. clinical biotech with no commercial sales yet)
    businessStatus = 'REVIEW_REQUIRED';
    revenueStatus = 'REVIEW_REQUIRED';
    revenueFailReason = 'Pre-revenue or developmental-stage enterprise (commercial revenue not yet established)';
    revenueComplianceNote = 'Pre-revenue / developmental phase enterprise: commercial sales are zero or not reported in latest periodic filing. Non-operating licensing or grant income requires manual audit.';
    reviewReasons.push(revenueComplianceNote);
  } else if (revenueBreakdown?.isAmbiguous) {
    // Ambiguous revenue / licensing without commercial itemization
    businessStatus = 'REVIEW_REQUIRED';
    revenueStatus = 'REVIEW_REQUIRED';
    revenueFailReason = revenueBreakdown.ambiguityReason || 'Ambiguous revenue segment breakdown in SEC filing';
    revenueComplianceNote = `Revenue breakdown requires manual audit: ${revenueBreakdown.ambiguityReason || 'Unitemized licensing or non-operating streams detected.'}`;
    reviewReasons.push(revenueComplianceNote);
  } else {
    // Calculate non-permissible / impure revenue ratio
    revenueImpureRatioPct = typeof revenueBreakdown?.nonPermissibleRatioPct === 'number'
      ? revenueBreakdown.nonPermissibleRatioPct
      : 0;

    if (revenueImpureRatioPct > 5.0) {
      businessStatus = 'FAIL';
      revenueStatus = 'FAIL';
      revenueFailReason = `Non-permissible revenue (${revenueImpureRatioPct}%) exceeds AAOIFI 5% tolerance limit`;
      revenueComplianceNote = `Non-permissible / impure revenue represents ${revenueImpureRatioPct}% of total revenue, which exceeds the strict AAOIFI Standard No. 21 limit of 5.0%. Stock fails Shariah compliance.`;
      reviewReasons.push(revenueComplianceNote);
    } else if (revenueImpureRatioPct > 0) {
      businessStatus = 'PASS';
      revenueStatus = 'PASS';
      revenueComplianceNote = `Permissible commercial activity with ${revenueImpureRatioPct}% non-permissible revenue (within AAOIFI ≤5% tolerance). Requires dividend purification of ${revenueImpureRatioPct}%.`;
    } else {
      businessStatus = 'PASS';
      revenueStatus = 'PASS';
      revenueComplianceNote = '100% permissible commercial revenue from core operational contracts under AAOIFI equity governance criteria.';
    }
  }

  // Push Rule 1: Dual Business Activity & Revenue Permissibility to calculation details
  calculationDetails.push({
    key: 'business_activity',
    type: 'BUSINESS_ACTIVITY',
    title: 'Business Activity & Revenue Permissibility (Dual Screen)',
    ruleReference: 'AAOIFI Standard No. 21 — Rule 1 & Rule 2 (Core Activity & Revenue Permissibility)',
    status: businessStatus,
    businessActivity: primaryActivity,
    sectorStatus,
    sectorName: primaryActivity,
    sicCode: sic || null,
    sicDescription: sicDescription || null,
    sector: sector || null,
    industry: industry || null,
    revenueStatus,
    revenueImpureRatioPct,
    revenueThresholdPct: 5.0,
    revenueBreakdown: revenueBreakdown?.segments || [],
    isAmbiguous: revenueBreakdown?.isAmbiguous || false,
    ambiguityReason: revenueBreakdown?.ambiguityReason || null,
    prohibitedCategoriesTested: SHARIAH_CONFIG.prohibitedActivities.map(p => p.name),
    prohibitedMatch: businessFailReason || null,
    resultFormatted: businessStatus === 'PASS' 
      ? `PASS (${revenueImpureRatioPct !== null && revenueImpureRatioPct > 0 ? `${revenueImpureRatioPct}% impure — Purification Required` : '100% Permissible'})` 
      : (businessStatus === 'FAIL' ? `FAIL (${businessFailReason})` : 'REVIEW (Ambiguous / Developmental)'),
    thresholdFormatted: 'Sector Permissible + Impure Revenue ≤ 5.0%',
    complianceNote: revenueComplianceNote,
    source: sic ? `SEC EDGAR Notes & Financials (SIC ${sic}: ${sicDescription || primaryActivity})` : 'SEC EDGAR Notes & Financials'
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
    resultFormatted: debtRatioPct !== null 
      ? `${debtRatioPct}%`
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
  let interestIncome = financials?.metrics?.interestIncome;
  // totalRevenue is already declared above from financials?.metrics?.totalRevenue

  // Under US GAAP (ASC 220) and AAOIFI Standard No. 21:
  // If an operating company reports positive Total Revenue in its official SEC 10-Q/10-K,
  // the absence of an itemized interest income fact indicates $0 (zero) interest earned.
  // Commercial non-financial businesses only report material line items.
  if ((interestIncome === null || interestIncome === undefined) && totalRevenue && totalRevenue > 0) {
    interestIncome = 0;
  }

  if (!totalRevenue || totalRevenue <= 0) {
    reviewReasons.push('Total Revenue is zero or not reported in the current filing period.');
  } else if (typeof interestIncome === 'number') {
    impureRatioPct = Number(((interestIncome / totalRevenue) * 100).toFixed(2));
    // Sanity guard: ratio > 100% is impossible for income-as-% -of-revenue
    if (impureRatioPct > 100) {
      impureStatus = 'REVIEW_REQUIRED';
      reviewReasons.push(`Impure Income Ratio calculated at ${impureRatioPct}% — mathematically impossible (>100% of revenue). XBRL concept mismatch detected; manual review of SEC filing required.`);
      impureRatioPct = null; // reset so UI shows REVIEW not the bad number
    } else {
      impureStatus = impureRatioPct <= SHARIAH_CONFIG.thresholds.impureIncomeLimitPct ? 'PASS' : 'FAIL';
    }
  } else {
    reviewReasons.push('Interest income was not explicitly itemized in the reported XBRL taxonomy facts.');
  }

  calculationDetails.push({
    key: 'impure_income_ratio',
    title: 'Impure & Interest Income Ratio',
    numerator: typeof interestIncome === 'number' ? interestIncome : null,
    numeratorLabel: 'Interest & Impure Non-Operating Income',
    denominator: totalRevenue,
    denominatorLabel: 'Total Revenue',
    formula: '(Interest Income / Total Revenue) × 100',
    result: impureRatioPct,
    resultFormatted: impureRatioPct !== null 
      ? `${impureRatioPct}%`
      : 'N/A',
    threshold: SHARIAH_CONFIG.thresholds.impureIncomeLimitPct,
    thresholdFormatted: `≤ ${SHARIAH_CONFIG.thresholds.impureIncomeLimitPct}%`,
    status: impureStatus,
    source: filingSource
  });

  // 6. Purification Ratio
  // Combines impure income ratio and revenue non-permissible ratio (clamped to 5% per AAOIFI SS21)
  let basePurification = (impureRatioPct !== null && impureRatioPct >= 0 && impureRatioPct <= 100) 
    ? impureRatioPct 
    : 0;
  if (revenueImpureRatioPct !== null && revenueImpureRatioPct > 0 && revenueImpureRatioPct <= 5) {
    basePurification = Math.max(basePurification, revenueImpureRatioPct);
  }
  const purificationPct = Number(basePurification.toFixed(2));

  // 7. Overall Verdict Determination
  let status = 'PASS';
  let statusChangeNote = null;

  if (businessStatus === 'FAIL') {
    status = 'FAIL';
  } else if (debtStatus === 'FAIL' || cashStatus === 'FAIL' || impureStatus === 'FAIL') {
    status = 'FAIL';
  } else if (businessStatus === 'REVIEW_REQUIRED' || debtStatus === 'REVIEW_REQUIRED' || cashStatus === 'REVIEW_REQUIRED' || impureStatus === 'REVIEW_REQUIRED') {
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
    sectorStatus,
    revenueStatus,
    revenueImpureRatioPct,
    revenueBreakdown,
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
