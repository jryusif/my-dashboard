/**
 * Trading Calculations & Types for Scalping and Partial Scaling Out (تخفيف الكميات)
 * Supports penny stocks and high-precision scalping (up to 4 decimal places).
 */

export type TradeDirection = 'Long' | 'Short';
export type TradeOutcome = 'Win' | 'Loss' | 'Break-even';
export type PositionStatus = 'OPEN' | 'CLOSED';

export interface PartialExitTranche {
  id: string;
  shares: number;
  exitPrice: number;
  pnl?: number;
  pnlPct?: number;
  revenue?: number;
  date?: string;
  notes?: string;
}

export interface TradeExecution {
  id: string;
  ticker: string;
  date: string;
  direction: TradeDirection;
  outcome: TradeOutcome;
  shares: number;
  entryPrice: number;
  entryAmount: number; // shares * entryPrice
  partialExits: PartialExitTranche[];
  exitAmount: number; // Total exit revenue across all tranches
  pnlAmount: number; // Total realized PnL in USD
  pnlPct: number; // (pnlAmount / entryAmount) * 100
  avgExitPrice: number; // Total revenue / total shares sold
  remainingShares: number;
  remainingCapital: number;
  status: PositionStatus;
  setupTag?: string;
  mindset?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrancheCalculationResult {
  pnl: number;
  pnlPct: number;
  revenue: number;
}

export interface AggregateTradePerformance {
  totalEntryCapital: number;
  totalSharesSold: number;
  totalExitRevenue: number;
  totalRealizedPnL: number;
  totalRealizedReturnPct: number;
  weightedAvgExitPrice: number;
  remainingShares: number;
  remainingCapital: number;
  positionStatus: PositionStatus;
  suggestedOutcome: TradeOutcome;
  isOverAllocated: boolean;
  overAllocatedShares: number;
}

/**
 * Calculates metrics for an individual exit tranche.
 * 
 * Long:
 *   PnL ($) = (Exit Price - Entry Price) * Shares
 *   PnL (%) = ((Exit Price - Entry Price) / Entry Price) * 100%
 * Short:
 *   PnL ($) = (Entry Price - Exit Price) * Shares
 *   PnL (%) = ((Entry Price - Exit Price) / Entry Price) * 100%
 */
export function calculateTrancheStats(
  shares: number,
  exitPrice: number,
  entryPrice: number,
  direction: TradeDirection = 'Long'
): TrancheCalculationResult {
  const safeShares = Math.max(0, Number(shares) || 0);
  const safeExitPrice = Math.max(0, Number(exitPrice) || 0);
  const safeEntryPrice = Math.max(0, Number(entryPrice) || 0);

  const revenue = safeShares * safeExitPrice;

  if (safeShares === 0 || safeEntryPrice === 0) {
    return { pnl: 0, pnlPct: 0, revenue };
  }

  let pnl = 0;
  let pnlPct = 0;

  if (direction === 'Long') {
    pnl = (safeExitPrice - safeEntryPrice) * safeShares;
    pnlPct = ((safeExitPrice - safeEntryPrice) / safeEntryPrice) * 100;
  } else {
    // Short position: profit when exit price is lower than entry price
    pnl = (safeEntryPrice - safeExitPrice) * safeShares;
    pnlPct = ((safeEntryPrice - safeExitPrice) / safeEntryPrice) * 100;
  }

  return {
    pnl: Number(pnl.toFixed(4)),
    pnlPct: Number(pnlPct.toFixed(2)),
    revenue: Number(revenue.toFixed(4))
  };
}

/**
 * Calculates aggregate performance across all partial exit tranches.
 */
export function calculateAggregatePerformance(
  initialShares: number,
  entryPrice: number,
  tranches: PartialExitTranche[],
  direction: TradeDirection = 'Long'
): AggregateTradePerformance {
  const safeInitialShares = Math.max(0, Number(initialShares) || 0);
  const safeEntryPrice = Math.max(0, Number(entryPrice) || 0);
  const totalEntryCapital = safeInitialShares * safeEntryPrice;

  let totalSharesSold = 0;
  let totalExitRevenue = 0;
  let totalRealizedPnL = 0;

  for (const tranche of tranches) {
    const tShares = Math.max(0, Number(tranche.shares) || 0);
    const tPrice = Math.max(0, Number(tranche.exitPrice) || 0);

    totalSharesSold += tShares;
    totalExitRevenue += tShares * tPrice;

    const stats = calculateTrancheStats(tShares, tPrice, safeEntryPrice, direction);
    totalRealizedPnL += stats.pnl;
  }

  const remainingShares = Math.max(0, safeInitialShares - totalSharesSold);
  const remainingCapital = remainingShares * safeEntryPrice;
  const isOverAllocated = totalSharesSold > safeInitialShares && safeInitialShares > 0;
  const overAllocatedShares = isOverAllocated ? totalSharesSold - safeInitialShares : 0;

  // Realized return percentage based on entry capital of sold shares (or total capital)
  let totalRealizedReturnPct = 0;
  if (totalSharesSold > 0 && safeEntryPrice > 0) {
    const soldEntryCapital = totalSharesSold * safeEntryPrice;
    totalRealizedReturnPct = soldEntryCapital > 0 ? (totalRealizedPnL / soldEntryCapital) * 100 : 0;
  }

  const weightedAvgExitPrice = totalSharesSold > 0 ? totalExitRevenue / totalSharesSold : 0;

  let positionStatus: PositionStatus = 'OPEN';
  if (safeInitialShares > 0 && remainingShares <= 0.00001) {
    positionStatus = 'CLOSED';
  }

  let suggestedOutcome: TradeOutcome = 'Break-even';
  if (totalRealizedPnL > 0.005) {
    suggestedOutcome = 'Win';
  } else if (totalRealizedPnL < -0.005) {
    suggestedOutcome = 'Loss';
  }

  return {
    totalEntryCapital: Number(totalEntryCapital.toFixed(4)),
    totalSharesSold: Number(totalSharesSold.toFixed(4)),
    totalExitRevenue: Number(totalExitRevenue.toFixed(4)),
    totalRealizedPnL: Number(totalRealizedPnL.toFixed(4)),
    totalRealizedReturnPct: Number(totalRealizedReturnPct.toFixed(2)),
    weightedAvgExitPrice: Number(weightedAvgExitPrice.toFixed(4)),
    remainingShares: Number(remainingShares.toFixed(4)),
    remainingCapital: Number(remainingCapital.toFixed(2)),
    positionStatus,
    suggestedOutcome,
    isOverAllocated,
    overAllocatedShares: Number(overAllocatedShares.toFixed(4))
  };
}

/**
 * Calculates share count for quick percentage chips:
 * [10%], [20%], [25% (1/4)], [50% (1/2)], [100% (All Remaining)]
 * 
 * - 100% always allocates all currently remaining shares.
 * - 10%, 20%, 25%, 50% allocate percentage of total shares (capped at remaining shares),
 *   rounded to 2 decimal places (or integer if initial shares are integer).
 */
export function calculateQuickChipShares(
  pct: number,
  initialShares: number,
  alreadySoldExcludingCurrent: number
): number {
  const safeInitial = Math.max(0, Number(initialShares) || 0);
  const remaining = Math.max(0, safeInitial - (Number(alreadySoldExcludingCurrent) || 0));

  if (safeInitial <= 0 || remaining <= 0) return 0;

  if (pct >= 100) {
    return Number(remaining.toFixed(4));
  }

  const isIntegerShares = Number.isInteger(safeInitial);
  const targetShares = safeInitial * (pct / 100);

  let calculatedShares = isIntegerShares ? Math.round(targetShares) : Number(targetShares.toFixed(4));
  if (calculatedShares <= 0 && targetShares > 0) {
    calculatedShares = isIntegerShares ? 1 : Number(targetShares.toFixed(4));
  }

  // Ensure not exceeding available remaining shares
  return Math.min(remaining, calculatedShares);
}
