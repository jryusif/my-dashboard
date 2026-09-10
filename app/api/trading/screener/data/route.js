import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveTickerCik, getCompanySubmissions, getCompanyFinancialFacts } from '@/lib/sec-provider';
import { screenCompanyShariah } from '@/lib/shariah-engine';
import { getMarketData } from '@/lib/market-provider';
import { getCompanyNews } from '@/lib/news-provider';
import { SHARIAH_CONFIG } from '@/lib/shariah-config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickerParam = (searchParams.get('ticker') || '').trim().toUpperCase();
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!tickerParam) {
      return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
    }

    const now = new Date();

    // 1. Find or create company record in database
    let company = await prisma.stockCompany.findUnique({
      where: { ticker: tickerParam },
      include: {
        screenings: { orderBy: { screenedAt: 'desc' }, take: 2 },
        marketSnapshots: { orderBy: { updatedAt: 'desc' }, take: 1 },
        financials: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    // If company not in DB, resolve from SEC
    if (!company) {
      const secInfo = await resolveTickerCik(tickerParam);
      company = await prisma.stockCompany.create({
        data: {
          ticker: tickerParam,
          cik: secInfo?.cik || null,
          name: secInfo?.name || tickerParam,
          country: 'United States'
        },
        include: {
          screenings: { orderBy: { screenedAt: 'desc' }, take: 2 },
          marketSnapshots: { orderBy: { updatedAt: 'desc' }, take: 1 },
          financials: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
    }

    // 2. Fetch or update SEC Profile & Submissions if CIK missing or older
    let secSubmissions = null;
    if (company.cik) {
      try {
        secSubmissions = await getCompanySubmissions(company.cik);
        // Enrich company metadata with official SEC SIC classification
        const updateData = {};
        if (secSubmissions.sicDescription) {
          if (!company.sector) updateData.sector = secSubmissions.sicDescription;
          if (!company.industry) updateData.industry = secSubmissions.sicDescription;
        }
        if (secSubmissions.name && company.name === company.ticker) updateData.name = secSubmissions.name;
        if (Object.keys(updateData).length > 0) {
          company = await prisma.stockCompany.update({
            where: { id: company.id },
            data: updateData,
            include: {
              screenings: { orderBy: { screenedAt: 'desc' }, take: 2 },
              marketSnapshots: { orderBy: { updatedAt: 'desc' }, take: 1 },
              financials: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          });
        }
      } catch (secSubErr) {
        console.warn(`Could not load SEC submissions for ${tickerParam}:`, secSubErr.message);
      }
    }

    // 3. Evaluate Market Data (1-2 min cache)
    let marketResult = null;
    let marketError = null;
    const latestMarket = company.marketSnapshots?.[0];
    const marketCacheValid = latestMarket && (now.getTime() - new Date(latestMarket.updatedAt).getTime() < 90 * 1000) && !forceRefresh;

    if (marketCacheValid) {
      marketResult = {
        ticker: company.ticker,
        price: latestMarket.price,
        changePct: latestMarket.changePct,
        volume: latestMarket.volume,
        avgVolume: latestMarket.avgVolume,
        rvol: latestMarket.rvol,
        dayHigh: latestMarket.dayHigh,
        dayLow: latestMarket.dayLow,
        open: latestMarket.open,
        prevClose: latestMarket.prevClose,
        fiftyTwoWeekHigh: latestMarket.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: latestMarket.fiftyTwoWeekLow,
        exchange: company.exchange || 'NASDAQ',
        sharesOutstanding: latestMarket.sharesOutstanding,
        marketCap: latestMarket.marketCap,
        freeFloat: latestMarket.freeFloat,
        bid: latestMarket.bid,
        ask: latestMarket.ask,
        spread: latestMarket.spread,
        bidAskStatus: latestMarket.bidAskStatus,
        isRealTime: latestMarket.isRealTime,
        timestamp: latestMarket.quoteTimestamp,
        formattedEtTime: new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(new Date(latestMarket.quoteTimestamp)) + ' ET',
        source: latestMarket.source,
        dataQuality: latestMarket.isRealTime ? 'HIGH' : 'MEDIUM'
      };
    } else {
      try {
        // We will enrich with shares outstanding if available from SEC facts
        let secShares = null;
        if (company.cik) {
          try {
            const facts = await getCompanyFinancialFacts(company.cik);
            // check facts for common shares
            secShares = facts?.metrics?.sharesOutstanding || null;
          } catch (_) {}
        }

        const freshMarket = await getMarketData(company.ticker, { sharesOutstanding: secShares });
        marketResult = freshMarket;

        // Upsert into DB
        await prisma.stockMarketSnapshot.create({
          data: {
            companyId: company.id,
            price: freshMarket.price,
            changePct: freshMarket.changePct,
            volume: freshMarket.volume,
            avgVolume: freshMarket.avgVolume,
            rvol: freshMarket.rvol,
            freeFloat: freshMarket.freeFloat,
            sharesOutstanding: freshMarket.sharesOutstanding,
            marketCap: freshMarket.marketCap,
            bid: freshMarket.bid,
            ask: freshMarket.ask,
            spread: freshMarket.spread,
            dayHigh: freshMarket.dayHigh,
            dayLow: freshMarket.dayLow,
            open: freshMarket.open,
            prevClose: freshMarket.prevClose,
            fiftyTwoWeekHigh: freshMarket.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: freshMarket.fiftyTwoWeekLow,
            source: freshMarket.source,
            isRealTime: freshMarket.isRealTime,
            bidAskStatus: freshMarket.bidAskStatus,
            quoteTimestamp: freshMarket.timestamp
          }
        });
      } catch (err) {
        console.error(`Market data error for ${tickerParam}:`, err.message);
        marketError = 'Market feed temporarily unavailable';
      }
    }

    // 4. Evaluate Shariah Screening (7-day cache + material filing check)
    let shariahResult = null;
    let shariahError = null;
    const currentScreening = company.screenings?.[0];
    const previousScreening = company.screenings?.[1];

    // Check for latest periodic filing (10-Q or 10-K) from official SEC EDGAR:
    let newMaterialFilingDetected = false;
    const periodicFilings = (secSubmissions?.filings || []).filter(f => f.form === '10-Q' || f.form === '10-K');
    periodicFilings.sort((a, b) => (b.filingDate || '').localeCompare(a.filingDate || ''));
    const latestSecFiling = periodicFilings[0] || null;

    if (latestSecFiling) {
      if (!currentScreening?.lastFilingUsed) {
        newMaterialFilingDetected = true;
      } else if (latestSecFiling.accessionNumber !== currentScreening.lastFilingUsed) {
        newMaterialFilingDetected = true;
      }
    }

    const screeningAgeMs = currentScreening ? (now.getTime() - new Date(currentScreening.screenedAt).getTime()) : Infinity;
    const isScreeningStale = screeningAgeMs > (SHARIAH_CONFIG.screeningValidityDays * 24 * 60 * 60 * 1000);
    const requiresRecalculation = !currentScreening || isScreeningStale || newMaterialFilingDetected || forceRefresh;

    if (!requiresRecalculation && currentScreening) {
      // Return cached Shariah screening
      const nextRefreshDate = new Date(new Date(currentScreening.screenedAt).getTime() + (SHARIAH_CONFIG.screeningValidityDays * 24 * 60 * 60 * 1000));
      const rawCalcDetails = typeof currentScreening.calculationDetails === 'string' ? 
        JSON.parse(currentScreening.calculationDetails) : (currentScreening.calculationDetails || []);
      const calculationDetails = Array.isArray(rawCalcDetails) ? [...rawCalcDetails] : [];
      const reviewReasons = typeof currentScreening.reviewReasons === 'string' ? 
        JSON.parse(currentScreening.reviewReasons) : currentScreening.reviewReasons;

      // Ensure Rule 1 Business Activity check is present in calculation details even for older cached screenings
      const hasBusinessActivity = calculationDetails.some(d => d.key === 'business_activity' || d.type === 'BUSINESS_ACTIVITY');
      if (!hasBusinessActivity) {
        const bStatus = currentScreening.businessStatus || 'PASS';
        const bActivity = currentScreening.businessActivity || company.industry || company.sector || 'Commercial Operations';
        calculationDetails.unshift({
          key: 'business_activity',
          type: 'BUSINESS_ACTIVITY',
          title: 'Business Activity & Revenue Permissibility',
          ruleReference: 'AAOIFI Standard No. 21 — Rule 1 (Core Activity Permissibility)',
          status: bStatus,
          businessActivity: bActivity,
          sicCode: secSubmissions?.sic || null,
          sicDescription: secSubmissions?.sicDescription || bActivity,
          sector: company.sector || bActivity,
          industry: company.industry || bActivity,
          prohibitedCategoriesTested: SHARIAH_CONFIG.prohibitedActivities.map(p => p.name),
          prohibitedMatch: bStatus === 'FAIL' ? 'Non-compliant core business activity' : null,
          resultFormatted: bStatus === 'PASS' ? 'Compliant (Permissible Activity)' : (bStatus === 'FAIL' ? 'Prohibited Activity' : 'Under Review'),
          thresholdFormatted: '100% Core Business Permissible',
          complianceNote: bStatus === 'PASS'
            ? `Core commercial business (${bActivity}) is permissible under AAOIFI equity governance standards. Evaluated against all 8 prohibited industry sectors.`
            : 'Primary business activity violates Shariah criteria.',
          source: secSubmissions?.sic ? `SEC EDGAR Submissions (SIC ${secSubmissions.sic}: ${secSubmissions.sicDescription || bActivity})` : 'SEC EDGAR Submissions'
        });
      }

      const latestFin = company.financials?.[0];
      const cachedPeriodInfo = {
        form: latestSecFiling?.form || latestFin?.form || '10-Q',
        fiscalYear: latestFin?.fiscalYear || null,
        fiscalPeriod: latestFin?.fiscalPeriod || null,
        reportDate: latestSecFiling?.reportDate || latestFin?.rawXbrlData?.periodInfo?.reportDate || latestFin?.rawXbrlData?.periodInfo?.endDate || latestFin?.rawXbrlData?.assets?.end || null,
        endDate: latestSecFiling?.reportDate || latestFin?.rawXbrlData?.periodInfo?.endDate || latestFin?.rawXbrlData?.assets?.end || null,
        filingDate: latestSecFiling?.filingDate || latestFin?.filingDate || null,
        accessionNumber: latestSecFiling?.accessionNumber || currentScreening.lastFilingUsed || null,
        primaryDocUrl: latestSecFiling?.primaryDocUrl || null
      };

      shariahResult = {
        status: currentScreening.status,
        methodology: currentScreening.methodology,
        businessActivity: currentScreening.businessActivity || company.sector || 'General Commercial',
        businessStatus: currentScreening.businessStatus,
        debtRatioPct: currentScreening.debtRatioPct,
        debtThresholdPct: currentScreening.debtThresholdPct,
        cashRatioPct: currentScreening.cashRatioPct,
        cashThresholdPct: currentScreening.cashThresholdPct,
        impureRatioPct: currentScreening.impureRatioPct,
        impureThresholdPct: currentScreening.impureThresholdPct,
        purificationPct: currentScreening.purificationPct,
        calculationDetails: calculationDetails || [],
        reviewReasons: reviewReasons || [],
        screenedAt: currentScreening.screenedAt,
        expiresAt: currentScreening.expiresAt,
        nextRefreshDate: nextRefreshDate.toISOString().split('T')[0],
        lastFilingUsed: currentScreening.lastFilingUsed,
        periodInfo: cachedPeriodInfo,
        financialDataAsOf: cachedPeriodInfo.reportDate || cachedPeriodInfo.endDate || null,
        statusChangeNote: currentScreening.statusChangeNote,
        isStale: false,
        source: 'SEC EDGAR XBRL (Cached 7-Day Cycle)',
        dataQuality: 'HIGH'
      };
    } else {
      // Recalculate Shariah Screening using SEC EDGAR facts from the latest periodic filing
      try {
        if (!company.cik) {
          const sec = await resolveTickerCik(company.ticker);
          if (sec) company.cik = sec.cik;
        }

        if (!company.cik) {
          throw new Error('SEC CIK could not be resolved for ticker');
        }

        const secFacts = await getCompanyFinancialFacts(company.cik, latestSecFiling?.accessionNumber);

        // Compute market cap for denominator
        const effectiveMarketCap = marketResult?.marketCap || (marketResult?.price && secFacts.metrics?.totalAssets ? secFacts.metrics.totalAssets : null);

        const freshPeriodInfo = {
          form: latestSecFiling?.form || secFacts.periodInfo?.form || '10-Q',
          fiscalYear: secFacts.periodInfo?.fiscalYear || null,
          fiscalPeriod: secFacts.periodInfo?.fiscalPeriod || null,
          reportDate: latestSecFiling?.reportDate || secFacts.periodInfo?.reportDate || secFacts.periodInfo?.endDate || null,
          endDate: latestSecFiling?.reportDate || secFacts.periodInfo?.endDate || null,
          filingDate: latestSecFiling?.filingDate || secFacts.periodInfo?.filingDate || null,
          accessionNumber: latestSecFiling?.accessionNumber || secFacts.periodInfo?.accessionNumber || null,
          primaryDocUrl: latestSecFiling?.primaryDocUrl || null
        };

        const screening = screenCompanyShariah({
          company: {
            ...company,
            sic: secSubmissions?.sic || null,
            sicDescription: secSubmissions?.sicDescription || company.sector || null
          },
          financials: {
            ...secFacts,
            periodInfo: freshPeriodInfo
          },
          marketCap: effectiveMarketCap,
          previousScreening
        });

        // Save Financial Snapshot to DB
        await prisma.stockFinancialSnapshot.create({
          data: {
            companyId: company.id,
            fiscalYear: freshPeriodInfo.fiscalYear,
            fiscalPeriod: freshPeriodInfo.fiscalPeriod,
            form: freshPeriodInfo.form,
            filingDate: freshPeriodInfo.filingDate,
            totalAssets: secFacts.metrics?.totalAssets || null,
            totalDebt: secFacts.metrics?.totalDebt || null,
            cashAndSecurities: secFacts.metrics?.cashAndSecurities || null,
            totalRevenue: secFacts.metrics?.totalRevenue || null,
            interestIncome: secFacts.metrics?.interestIncome || null,
            impureIncome: secFacts.metrics?.impureIncome || null,
            marketCapAtReport: effectiveMarketCap || null,
            rawXbrlData: {
              ...(secFacts.factsUsed || {}),
              periodInfo: freshPeriodInfo
            }
          }
        });

        // Save Shariah Screening to DB
        const savedScreening = await prisma.stockShariahScreening.create({
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
            lastFilingUsed: freshPeriodInfo.accessionNumber || screening.lastFilingUsed,
            previousStatus: screening.previousStatus,
            statusChangeNote: screening.statusChangeNote
          }
        });

        const nextRefreshDate = new Date(screening.screenedAt.getTime() + (SHARIAH_CONFIG.screeningValidityDays * 24 * 60 * 60 * 1000));

        shariahResult = {
          status: savedScreening.status,
          methodology: savedScreening.methodology,
          businessActivity: savedScreening.businessActivity,
          businessStatus: savedScreening.businessStatus,
          debtRatioPct: savedScreening.debtRatioPct,
          debtThresholdPct: savedScreening.debtThresholdPct,
          cashRatioPct: savedScreening.cashRatioPct,
          cashThresholdPct: savedScreening.cashThresholdPct,
          impureRatioPct: savedScreening.impureRatioPct,
          impureThresholdPct: savedScreening.impureThresholdPct,
          purificationPct: savedScreening.purificationPct,
          calculationDetails: screening.calculationDetails,
          reviewReasons: screening.reviewReasons,
          screenedAt: savedScreening.screenedAt,
          expiresAt: savedScreening.expiresAt,
          nextRefreshDate: nextRefreshDate.toISOString().split('T')[0],
          lastFilingUsed: savedScreening.lastFilingUsed,
          periodInfo: freshPeriodInfo,
          financialDataAsOf: freshPeriodInfo.reportDate || freshPeriodInfo.endDate || null,
          statusChangeNote: savedScreening.statusChangeNote,
          isStale: false,
          source: 'SEC EDGAR Official XBRL',
          dataQuality: 'HIGH'
        };
      } catch (shariahErr) {
        console.error(`Shariah calculation error for ${tickerParam}:`, shariahErr.message);
        if (currentScreening) {
          // Fallback to previous screening with STALE mark
          shariahResult = {
            status: 'DATA_STALE',
            methodology: currentScreening.methodology,
            debtRatioPct: currentScreening.debtRatioPct,
            cashRatioPct: currentScreening.cashRatioPct,
            impureRatioPct: currentScreening.impureRatioPct,
            purificationPct: currentScreening.purificationPct,
            calculationDetails: currentScreening.calculationDetails || [],
            reviewReasons: ['SEC EDGAR service temporarily unreachable; showing last stored screening.'],
            screenedAt: currentScreening.screenedAt,
            expiresAt: currentScreening.expiresAt,
            isStale: true,
            source: 'SEC EDGAR (Stale Fallback)',
            dataQuality: 'LOW'
          };
        } else {
          shariahError = 'SEC Financial disclosures temporarily unavailable';
        }
      }
    }

    // 5. Evaluate Company News (5-15 min cache)
    let newsResult = null;
    let newsError = null;
    try {
      newsResult = await getCompanyNews(company.ticker);
    } catch (newsErr) {
      console.error(`News fetch error for ${tickerParam}:`, newsErr.message);
      newsError = 'News feed temporarily unavailable';
    }

    // 6. Return combined payload
    return NextResponse.json({
      ticker: company.ticker,
      company: {
        name: company.name,
        ticker: company.ticker,
        exchange: marketResult?.exchange || company.exchange || 'NASDAQ',
        sector: company.sector || marketResult?.sector || 'Technology',
        industry: company.industry || marketResult?.industry || 'Semiconductors',
        country: company.country || 'United States',
        hqAddress: company.hqAddress || 'California, USA',
        incCountry: company.incCountry || 'Delaware, USA'
      },
      shariah: shariahResult || { error: shariahError, status: 'REVIEW_REQUIRED', reviewReasons: [shariahError || 'Data unavailable'] },
      market: marketResult || { error: marketError, price: null, dataQuality: 'LOW' },
      news: newsResult || { error: newsError, articles: { today: [], threeDays: [], sevenDays: [] } }
    });

  } catch (err) {
    console.error('Fatal error in /api/trading/screener/data:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
