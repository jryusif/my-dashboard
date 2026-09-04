import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice, convertCurrency } from '@/lib/gold.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  return null;
}

export async function GET(req) {
  const auth = getAuthUser(req);
  const userId = auth && auth.authenticated ? auth.userId : null;

  let assets = [];
  let goldLots = [];
  let dbUser = null;

  if (userId) {
    [assets, goldLots, dbUser] = await Promise.all([
      prisma.asset.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.goldLot.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true }
      })
    ]);
  }

  const { searchParams } = new URL(req.url);
  const userCurrency = (
    searchParams.get('currency') ||
    req.headers.get('x-user-currency') ||
    auth?.user?.currency ||
    dbUser?.currency ||
    'USD'
  ).toUpperCase();

  const liveGoldPrice = await getLiveGoldPrice(userCurrency);

  const holdings = [
    ...assets.map(a => {
      const KNOWN_CURRENCIES = ['USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'CAD', 'JPY'];
      let fromCurr = userCurrency;
      if (a.unit && KNOWN_CURRENCIES.includes(a.unit.toUpperCase())) {
        fromCurr = a.unit.toUpperCase();
      } else if (a.currency && KNOWN_CURRENCIES.includes(a.currency.toUpperCase())) {
        fromCurr = a.currency.toUpperCase();
      }
      const costInOriginalCurr = a.purchasePrice || 0;
      const costInUserCurr = convertCurrency(costInOriginalCurr, fromCurr, userCurrency, liveGoldPrice.rates);
      const liveValInUserCurr = a.purchasePrice != null ? costInUserCurr : (a.quantity * 100);
      const diff = liveValInUserCurr - costInUserCurr;
      const pct = costInUserCurr > 0 ? (diff / costInUserCurr) * 100 : 0;

      return {
        id: a.id,
        name: a.name,
        assetType: a.type || 'Other Assets',
        status: a.status || 'Owned',
        quantity: a.quantity,
        unit: a.unit || 'units',
        currency: fromCurr,
        displayCurrency: userCurrency,
        originalPurchasePrice: costInOriginalCurr,
        purchasePrice: Math.round(costInUserCurr),
        liveValue: Math.round(liveValInUserCurr),
        date: a.purchaseDate,
        notes: a.notes,
        pnl: {
          isGain: diff >= 0,
          diff: Math.abs(Math.round(diff)),
          pct: Math.abs(Math.round(pct * 10) / 10)
        }
      };
    }),
    ...goldLots.map(g => {
      const lotCurrency = (g.currency || userCurrency || 'USD').toUpperCase();
      const costInLotCurr = g.pricePaid || 0;
      const costInUserCurr = convertCurrency(costInLotCurr, lotCurrency, userCurrency, liveGoldPrice.rates);

      // Karat-specific live gram rate in user's active currency
      const gramRate = (g.karat === '21k'
        ? liveGoldPrice.pricePerGram21
        : (g.karat === '18k'
          ? liveGoldPrice.pricePerGram18
          : liveGoldPrice.pricePerGram24));

      const liveValInUserCurr = g.grams * gramRate;
      const diff = costInUserCurr > 0 ? (liveValInUserCurr - costInUserCurr) : 0;
      const pct = costInUserCurr > 0 ? (diff / costInUserCurr) * 100 : 0;

      return {
        id: g.id,
        name: g.name || `${g.karat.toUpperCase()} Gold Bullion`,
        assetType: 'Gold',
        karat: g.karat,
        status: 'Owned',
        quantity: g.grams,
        unit: 'grams',
        currency: lotCurrency,
        displayCurrency: userCurrency,
        originalPurchasePrice: costInLotCurr,
        purchasePrice: Math.round(costInUserCurr),
        liveValue: Math.round(liveValInUserCurr),
        date: g.date,
        pnl: {
          isGain: diff >= 0,
          diff: Math.abs(Math.round(diff)),
          pct: Math.abs(Math.round(pct * 10) / 10)
        }
      };
    })
  ];

  let allAssetsInvested = 0;
  let allAssetsCurrentValue = 0;
  let allOwnedCount = 0;
  let allPlannedCount = 0;

  let goldInvested = 0;
  let goldCurrentValue = 0;
  let goldOwnedCount = 0;
  let goldPlannedCount = 0;

  let totalGoldGrams = 0;
  const byKarat = { '24k': 0, '21k': 0, '18k': 0 };

  holdings.forEach(h => {
    allAssetsInvested += h.purchasePrice || 0;
    allAssetsCurrentValue += h.liveValue || 0;
    if (h.status === 'Owned') allOwnedCount++;
    else allPlannedCount++;

    if (h.assetType === 'Gold') {
      goldInvested += h.purchasePrice || 0;
      goldCurrentValue += h.liveValue || 0;
      if (h.status === 'Owned') goldOwnedCount++;
      else goldPlannedCount++;

      totalGoldGrams += h.quantity || 0;
      const k = (h.karat || '24k').toLowerCase();
      if (byKarat[k] !== undefined) byKarat[k] += h.quantity || 0;
    }
  });

  const goldDiff = goldCurrentValue - goldInvested;
  const goldPct = goldInvested > 0 ? (goldDiff / goldInvested) * 100 : 0;

  const allDiff = allAssetsCurrentValue - allAssetsInvested;
  const allPct = allAssetsInvested > 0 ? (allDiff / allAssetsInvested) * 100 : 0;

  return NextResponse.json({
    currency: userCurrency,
    goldPrice: liveGoldPrice,
    summary: {
      currency: userCurrency,
      currentValue: Math.round(goldCurrentValue),
      totalInvested: Math.round(goldInvested),
      totalPnl: {
        isGain: goldDiff >= 0,
        diff: Math.abs(Math.round(goldDiff)),
        pct: Math.abs(Math.round(goldPct * 10) / 10)
      },
      counts: {
        owned: goldOwnedCount,
        planned: goldPlannedCount,
        totalOwned: allOwnedCount,
        totalPlanned: allPlannedCount
      },
      goldWeight: {
        totalGrams: totalGoldGrams,
        byKarat
      },
      goldValue: Math.round(goldCurrentValue),
      goldInvested: Math.round(goldInvested),
      goldPnl: {
        isGain: goldDiff >= 0,
        diff: Math.abs(Math.round(goldDiff)),
        pct: Math.abs(Math.round(goldPct * 10) / 10)
      },
      allAssetsValue: Math.round(allAssetsCurrentValue),
      allAssetsInvested: Math.round(allAssetsInvested),
      allAssetsPnl: {
        isGain: allDiff >= 0,
        diff: Math.abs(Math.round(allDiff)),
        pct: Math.abs(Math.round(allPct * 10) / 10)
      }
    },
    holdings,
    items: holdings,
    count: holdings.length
  });
}

export async function POST(req) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonError('User account not found', 401);

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true }
  });
  const defaultCurrency = dbUser?.currency || 'USD';

  const body = await req.json();
  const { name, assetType, type, quantity, grams, unit, purchasePrice, pricePaid, date, notes, status, karat, currency } = body;

  const resolvedType = assetType || type || 'Gold';
  const qty = parseFloat(quantity || grams) || 1;
  const cost = parseFloat(purchasePrice || pricePaid || 0);
  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetCurrency = (currency || defaultCurrency || 'USD').toUpperCase();

  if (resolvedType === 'Gold') {
    const karatStr = (karat || '21k').toLowerCase();
    const goldLot = await prisma.goldLot.create({
      data: {
        userId,
        name: name ? name.trim() : `${karatStr.toUpperCase()} Gold Bullion Lot`,
        grams: qty,
        karat: karatStr,
        pricePaid: cost,
        currency: targetCurrency,
        date: targetDate
      }
    });

    return NextResponse.json({
      id: goldLot.id,
      name: goldLot.name,
      assetType: 'Gold',
      karat: goldLot.karat,
      status: 'Owned',
      quantity: goldLot.grams,
      unit: 'grams',
      currency: goldLot.currency,
      purchasePrice: goldLot.pricePaid,
      date: goldLot.date
    }, { status: 201 });
  }

  const asset = await prisma.asset.create({
    data: {
      userId,
      name: name ? name.trim() : 'New Investment Asset',
      type: resolvedType,
      status: status || 'Owned',
      quantity: qty,
      unit: unit || 'units',
      purchasePrice: cost > 0 ? cost : null,
      currency: targetCurrency,
      purchaseDate: targetDate,
      notes: notes || null
    }
  });

  return NextResponse.json({
    id: asset.id,
    name: asset.name,
    assetType: asset.type,
    status: asset.status,
    quantity: asset.quantity,
    unit: asset.unit,
    currency: asset.currency,
    purchasePrice: asset.purchasePrice,
    date: asset.purchaseDate
  }, { status: 201 });
}
