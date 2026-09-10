import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySubmissions, getCompanyFinancialFacts } from '@/lib/sec-provider';
import { screenCompanyShariah } from '@/lib/shariah-engine';
import { getMarketData } from '@/lib/market-provider';
import { SHARIAH_CONFIG } from '@/lib/shariah-config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const now = new Date();

    // 1. Fetch companies stored in screening database
    const companies = await prisma.stockCompany.findMany({
      include: {
        screenings: { orderBy: { screenedAt: 'desc' }, take: 1 }
      },
      take: 20
    });

    const refreshedList = [];

    for (const company of companies) {
      const latestScreening = company.screenings?.[0];
      const isExpired = !latestScreening || (now.getTime() > new Date(latestScreening.expiresAt).getTime());

      let hasNewFiling = false;
      if (company.cik) {
        try {
          const subs = await getCompanySubmissions(company.cik);
          const latest10 = subs.filings?.find(f => f.form === '10-Q' || f.form === '10-K');
          if (latest10 && latestScreening && latest10.accessionNumber !== latestScreening.lastFilingUsed) {
            hasNewFiling = true;
          }
        } catch (_) {}
      }

      if (isExpired || hasNewFiling) {
        try {
          let marketCap = null;
          try {
            const m = await getMarketData(company.ticker);
            marketCap = m.marketCap;
          } catch (_) {}

          const secFacts = await getCompanyFinancialFacts(company.cik);
          const screening = screenCompanyShariah({
            company,
            financials: secFacts,
            marketCap: marketCap || (secFacts.metrics?.totalAssets || null),
            previousScreening: latestScreening
          });

          const saved = await prisma.stockShariahScreening.create({
            data: {
              companyId: company.id,
              status: screening.status,
              methodology: screening.methodology,
              debtRatioPct: screening.debtRatioPct,
              debtThresholdPct: screening.debtThresholdPct,
              cashRatioPct: screening.cashRatioPct,
              cashThresholdPct: screening.cashThresholdPct,
              impureRatioPct: screening.impureRatioPct,
              impureThresholdPct: screening.impureThresholdPct,
              purificationPct: screening.purificationPct,
              businessActivity: screening.businessActivity,
              businessStatus: screening.businessStatus,
              calculationDetails: screening.calculationDetails,
              reviewReasons: screening.reviewReasons,
              screenedAt: screening.screenedAt,
              expiresAt: screening.expiresAt,
              lastFilingUsed: screening.lastFilingUsed,
              previousStatus: screening.previousStatus,
              statusChangeNote: screening.statusChangeNote
            }
          });

          refreshedList.push({
            ticker: company.ticker,
            reason: hasNewFiling ? 'New SEC filing detected' : '7-day cycle expired',
            status: saved.status,
            previousStatus: latestScreening?.status || 'N/A'
          });
        } catch (err) {
          console.error(`Scheduler refresh failed for ${company.ticker}:`, err.message);
        }
      }
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      evaluatedCount: companies.length,
      refreshedCount: refreshedList.length,
      refreshed: refreshedList
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json({ error: 'Scheduler run failed' }, { status: 500 });
  }
}
