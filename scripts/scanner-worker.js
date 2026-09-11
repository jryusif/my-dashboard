/**
 * Standalone Stock Market Scanner Worker
 * Continuously polls Finnhub News & Quotes, applies filters ($1-$20, RVOL >= 3x, Momentum >= 5%),
 * looks up Shariah status, and stores results to Prisma DB and JSON.
 * 
 * Run with: node scripts/scanner-worker.js
 */

import { runScannerCycle, getScannerStatus } from '../lib/scanner-service.js';

const POLL_INTERVAL_MS = parseInt(process.env.SCANNER_POLL_INTERVAL_MS || '60000', 10);

console.log('====================================================');
console.log('🚀 US Stock Scanner ($1 - $20) Daemon Started');
console.log(`⏱️ Polling interval: ${POLL_INTERVAL_MS / 1000} seconds`);
console.log('📊 Filters: 1$ <= Price <= 20$ | RVOL >= 3x | Momentum >= 5%');
console.log('⚖️ Shariah Lookup: Active (AAOIFI Standard No. 21)');
console.log('====================================================\n');

async function loop() {
  const timeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
  console.log(`[${timeStr} ET] 🔍 Running scan cycle...`);

  try {
    const result = await runScannerCycle();
    if (result.success) {
      const sessionName = result.marketSession?.badge || 'Live Market';
      console.log(`[${timeStr} ET] ✅ [${sessionName}] Evaluated ${result.evaluatedCandidatesCount || 0} candidates.`);
      if (result.discoveredCount > 0) {
        console.log(`🔥 Discovered ${result.discoveredCount} NEW opportunities:`);
        for (const opp of result.opportunities) {
          console.log(`   - ${opp.ticker} | $${opp.price} | ${opp.changePct >= 0 ? '+' : ''}${opp.changePct}% | RVOL ${opp.rvol}x | [${opp.statusBadge}] | ${opp.headline.slice(0, 60)}...`);
        }
      } else {
        console.log(`ℹ️ No new qualifying stocks found in this cycle.`);
      }
    } else {
      console.warn(`⚠️ Scanner cycle notice: ${result.message || result.error}`);
    }
  } catch (err) {
    console.error(`❌ Scanner cycle error:`, err.message);
  }

  setTimeout(loop, POLL_INTERVAL_MS);
}

// Start first cycle immediately
loop();
