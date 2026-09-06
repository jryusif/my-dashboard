/**
 * 🎯 Goal Auto-Funding Engine & Allocation Resolver
 * 
 * Supports:
 * - Specific starting month ("all" or "YYYY-MM")
 * - Specific income stream matching ("all" or "specific" with keyword/source list)
 * - Pre-existing net worth / saved cash baseline allocation
 * - Explicit custom starting seed capital (money saved before website)
 * - Seamless fallback to FinancialSettings percentage allocations
 */

export function normalizeGoalName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji})\s*/u, '')
    .trim()
    .toLowerCase();
}

export function matchAllocationForGoal(goalTitle, allocations) {
  if (!allocations || !Array.isArray(allocations)) return null;
  const normTitle = normalizeGoalName(goalTitle);
  if (!normTitle) return null;

  // Exact match
  let match = allocations.find(a => normalizeGoalName(a.name) === normTitle);
  if (match) return match;

  // Partial match: title contains allocation name or vice versa
  match = allocations.find(a => {
    const normAlloc = normalizeGoalName(a.name);
    if (!normAlloc || normAlloc.length < 3) return false;
    return normTitle.includes(normAlloc) || normAlloc.includes(normTitle);
  });
  return match || null;
}

export function calculateGoalFunding(goal, regularIncomes = [], savedCashBaseline = 0, userAllocations = []) {
  let cfg = goal.fundingConfig;
  if (typeof cfg === 'string') {
    try { cfg = JSON.parse(cfg); } catch { cfg = {}; }
  }
  cfg = cfg && typeof cfg === 'object' ? cfg : {};

  const hasExplicitConfig = Boolean(
    cfg.allocPct !== undefined ||
    cfg.startMonth !== undefined ||
    cfg.sourceMode !== undefined ||
    cfg.customStartingCapital !== undefined ||
    cfg.includeSavedCash !== undefined
  );

  let allocPct = 0;
  let isAutoAllocated = false;
  let startMonth = 'all';
  let sourceMode = 'all';
  let specificSources = [];
  let includeSavedCash = false;
  let savedCashAllocationPct = 100;
  let customStartingCapital = 0;

  if (hasExplicitConfig) {
    allocPct = parseFloat(cfg.allocPct) || 0;
    startMonth = cfg.startMonth || 'all';
    sourceMode = cfg.sourceMode || 'all';
    specificSources = Array.isArray(cfg.specificSources)
      ? cfg.specificSources.filter(Boolean)
      : (typeof cfg.specificSources === 'string' ? cfg.specificSources.split(',').map(s => s.trim()).filter(Boolean) : []);
    includeSavedCash = Boolean(cfg.includeSavedCash);
    savedCashAllocationPct = cfg.savedCashAllocationPct != null ? parseFloat(cfg.savedCashAllocationPct) : (allocPct || 100);
    customStartingCapital = Math.max(0, parseFloat(cfg.customStartingCapital) || 0);
    isAutoAllocated = (cfg.enabled !== false) && (allocPct > 0 || customStartingCapital > 0 || includeSavedCash);
  } else {
    // Fallback to allocation rule in financialSettings matching title
    const match = matchAllocationForGoal(goal.title, userAllocations);
    if (match && parseFloat(match.pct) > 0) {
      allocPct = parseFloat(match.pct);
      isAutoAllocated = true;
    }
  }

  if (!isAutoAllocated && allocPct === 0 && customStartingCapital === 0 && !includeSavedCash) {
    return {
      isAutoAllocated: false,
      allocPct: 0,
      startMonth: 'all',
      sourceMode: 'all',
      specificSources: [],
      includeSavedCash: false,
      savedCashContribution: 0,
      customStartingCapital: 0,
      incomeContribution: 0,
      eligibleIncomeTotal: 0,
      matchedTxCount: 0,
      autoTotal: 0,
      effectiveCurrent: goal.currentAmount || 0,
      fundingConfig: cfg
    };
  }

  // Filter eligible regular income transactions
  let eligibleIncomes = (regularIncomes || []).filter(t => t.type === 'income' && t.category !== 'Saved Cash Baseline');

  // 1. Filter by startMonth (format: YYYY-MM)
  if (startMonth && startMonth !== 'all') {
    eligibleIncomes = eligibleIncomes.filter(t => {
      if (!t.date) return false;
      const dStr = typeof t.date === 'string' ? t.date : t.date.toISOString();
      return dStr.slice(0, 7) >= startMonth;
    });
  }

  // 2. Filter by specific sources / categories / descriptions
  if (sourceMode === 'specific' && specificSources.length > 0) {
    const searchTerms = specificSources.map(s => s.trim().toLowerCase()).filter(Boolean);
    if (searchTerms.length > 0) {
      eligibleIncomes = eligibleIncomes.filter(t => {
        const cat = (t.category || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const acc = (t.account || '').toLowerCase();
        return searchTerms.some(term => cat.includes(term) || desc.includes(term) || acc.includes(term));
      });
    }
  }

  const eligibleIncomeTotal = eligibleIncomes.reduce((sum, t) => sum + (t.amount || 0), 0);
  const incomeContribution = Math.round(eligibleIncomeTotal * (allocPct / 100));

  let savedCashContribution = 0;
  if (includeSavedCash && savedCashBaseline > 0) {
    savedCashContribution = Math.round(savedCashBaseline * (savedCashAllocationPct / 100));
  }

  const autoTotal = Math.round(incomeContribution + savedCashContribution + customStartingCapital);
  const effectiveCurrent = Math.max(goal.currentAmount || 0, autoTotal);

  return {
    isAutoAllocated,
    allocPct,
    startMonth,
    sourceMode,
    specificSources,
    includeSavedCash,
    savedCashAllocationPct,
    savedCashContribution,
    customStartingCapital,
    incomeContribution,
    eligibleIncomeTotal,
    matchedTxCount: eligibleIncomes.length,
    autoTotal,
    effectiveCurrent,
    fundingConfig: {
      enabled: isAutoAllocated,
      allocPct,
      startMonth,
      sourceMode,
      specificSources,
      includeSavedCash,
      savedCashAllocationPct,
      customStartingCapital
    }
  };
}
