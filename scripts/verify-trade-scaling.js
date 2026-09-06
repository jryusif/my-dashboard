// scripts/verify-trade-scaling.js
import assert from 'assert';

// Test tranche calculation logic
function calculateTrancheStats(shares, exitPrice, entryPrice, direction = 'Long') {
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
    pnl = (safeEntryPrice - safeExitPrice) * safeShares;
    pnlPct = ((safeEntryPrice - safeExitPrice) / safeEntryPrice) * 100;
  }

  return {
    pnl: Number(pnl.toFixed(4)),
    pnlPct: Number(pnlPct.toFixed(2)),
    revenue: Number(revenue.toFixed(4))
  };
}

function calculateAggregatePerformance(initialShares, entryPrice, tranches, direction = 'Long') {
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

  const soldCostBasis = totalSharesSold * safeEntryPrice;
  const totalRealizedReturnPct = soldCostBasis > 0 ? (totalRealizedPnL / soldCostBasis) * 100 : 0;
  const weightedAvgExitPrice = totalSharesSold > 0 ? totalExitRevenue / totalSharesSold : 0;

  let positionStatus = 'OPEN';
  if (safeInitialShares > 0 && remainingShares <= 0.0001) {
    positionStatus = 'CLOSED';
  }

  let outcome = 'Break-even';
  if (totalRealizedPnL > 0.005) outcome = 'Win';
  else if (totalRealizedPnL < -0.005) outcome = 'Loss';

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
    outcome,
    isOverAllocated
  };
}

console.log('--- Test 1: User Scenario (100 shares @ $1.01, multi-tranche exit) ---');
const entryPrice = 1.0100;
const initialShares = 100;

// Tranche 1: 50 shares @ $1.20
const t1Stats = calculateTrancheStats(50, 1.2000, entryPrice, 'Long');
console.log('Tranche 1 stats:', t1Stats);
assert.strictEqual(t1Stats.revenue, 60);
assert.strictEqual(t1Stats.pnl, 9.5); // (1.20 - 1.01) * 50 = 9.50
assert.strictEqual(t1Stats.pnlPct, 18.81); // (0.19 / 1.01) * 100 = 18.81%

// Tranche 2: 50 shares @ $1.35
const t2Stats = calculateTrancheStats(50, 1.3500, entryPrice, 'Long');
console.log('Tranche 2 stats:', t2Stats);
assert.strictEqual(t2Stats.revenue, 67.5);
assert.strictEqual(t2Stats.pnl, 17); // (1.35 - 1.01) * 50 = 17.00
assert.strictEqual(t2Stats.pnlPct, 33.66); // (0.34 / 1.01) * 100 = 33.66%

const agg = calculateAggregatePerformance(initialShares, entryPrice, [
  { shares: 50, exitPrice: 1.2000 },
  { shares: 50, exitPrice: 1.3500 }
], 'Long');

console.log('Aggregate performance:', agg);
assert.strictEqual(agg.totalEntryCapital, 101);
assert.strictEqual(agg.totalSharesSold, 100);
assert.strictEqual(agg.totalExitRevenue, 127.5);
assert.strictEqual(agg.totalRealizedPnL, 26.5);
assert.strictEqual(agg.weightedAvgExitPrice, 1.275);
assert.strictEqual(agg.remainingShares, 0);
assert.strictEqual(agg.remainingCapital, 0);
assert.strictEqual(agg.positionStatus, 'CLOSED');
assert.strictEqual(agg.outcome, 'Win');
assert.strictEqual(agg.isOverAllocated, false);

console.log('--- Test 2: Partial Fill (OPEN position, 100 shares, only 25 shares sold) ---');
const partialAgg = calculateAggregatePerformance(100, 2.00, [
  { shares: 25, exitPrice: 2.50 }
], 'Long');

console.log('Partial aggregate:', partialAgg);
assert.strictEqual(partialAgg.remainingShares, 75);
assert.strictEqual(partialAgg.remainingCapital, 150);
assert.strictEqual(partialAgg.positionStatus, 'OPEN');
assert.strictEqual(partialAgg.totalRealizedPnL, 12.5); // (2.50 - 2.00) * 25 = 12.50

console.log('--- Test 3: Short Trade Scenario (Sell Short 200 shares @ $5.00, Cover 100 @ $4.50, Cover 100 @ $4.00) ---');
const shortAgg = calculateAggregatePerformance(200, 5.00, [
  { shares: 100, exitPrice: 4.50 },
  { shares: 100, exitPrice: 4.00 }
], 'Short');

console.log('Short aggregate:', shortAgg);
assert.strictEqual(shortAgg.totalRealizedPnL, 150); // (5 - 4.5)*100 + (5 - 4)*100 = 50 + 100 = 150
assert.strictEqual(shortAgg.outcome, 'Win');
assert.strictEqual(shortAgg.positionStatus, 'CLOSED');

console.log('--- Test 4: Safeguard: Over-allocation detection ---');
const overAllocated = calculateAggregatePerformance(100, 1.00, [
  { shares: 60, exitPrice: 1.10 },
  { shares: 50, exitPrice: 1.20 }
], 'Long');
console.log('Over-allocated check:', overAllocated.isOverAllocated);
assert.strictEqual(overAllocated.isOverAllocated, true);

console.log('\n✅ All unit and logic tests passed successfully!');
