import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveTickerCik, getCompanyFinancialFacts } from '@/lib/sec-provider';
import { screenCompanyShariah } from '@/lib/shariah-engine';
import { getMarketData } from '@/lib/market-provider';
import { SHARIAH_CONFIG } from '@/lib/shariah-config';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const ticker = (body.ticker || '').trim().toUpperCase();

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    let company = await prisma.stockCompany.findUnique({
      where: { ticker },
      include: {
        screenings: { orderBy: { screenedAt: 'desc' }, take: 1 }
      }
    });

    if (!company) {
      const secInfo = await resolveTickerCik(ticker);
      company = await prisma.stockCompany.create({
        data: {
          ticker,
          cik: secInfo?.cik || null,
          name: secInfo?.name || ticker,
          country: 'United States'
        },
        include: {
          screenings: []
        }
      });
    }

    if (!company.cik) {
      const secInfo = await resolveTickerCik(ticker);
      if (secInfo?.cik) {
        company = await prisma.stockCompany.update({
          where: { id: company.id },
          data: { cik: secInfo.cik },
          include: { screenings: { orderBy: { screenedAt: 'desc' }, take: 1 } }
        });
      }
    }

    // Fetch latest market data for market cap
    let marketCap = null;
    try {
      const market = await getMarketData(ticker);
      marketCap = market.marketCap;
    } catch (_) {}

    // Fetch official SEC facts
    const secFacts = await getCompanyFinancialFacts(company.cik);
    const previousScreening = company.screenings?.[0] || null;

    const screening = screenCompanyShariah({
      company,
      financials: secFacts,
      marketCap: marketCap || (secFacts.metrics?.totalAssets || null),
      previousScreening
    });

    // Save fresh screening
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

    const nextRefreshDate = new Date(saved.screenedAt.getTime() + (SHARIAH_CONFIG.screeningValidityDays * 24 * 60 * 60 * 1000));

    return NextResponse.json({
      success: true,
      shariah: {
        status: saved.status,
        methodology: saved.methodology,
        businessActivity: saved.businessActivity,
        businessStatus: saved.businessStatus,
        debtRatioPct: saved.debtRatioPct,
        debtThresholdPct: saved.debtThresholdPct,
        cashRatioPct: saved.cashRatioPct,
        cashThresholdPct: saved.cashThresholdPct,
        impureRatioPct: saved.impureRatioPct,
        impureThresholdPct: saved.impureThresholdPct,
        purificationPct: saved.purificationPct,
        calculationDetails: screening.calculationDetails,
        reviewReasons: screening.reviewReasons,
        screenedAt: saved.screenedAt,
        expiresAt: saved.expiresAt,
        nextRefreshDate: nextRefreshDate.toISOString().split('T')[0],
        lastFilingUsed: saved.lastFilingUsed,
        periodInfo: secFacts.periodInfo,
        statusChangeNote: saved.statusChangeNote,
        isStale: false,
        source: 'SEC EDGAR Official XBRL (Manual Refresh)',
        dataQuality: 'HIGH'
      }
    });
  } catch (error) {
    console.error('Refresh Shariah error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refresh Shariah data' }, { status: 500 });
  }
}
