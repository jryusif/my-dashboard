import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice } from '@/lib/gold.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  const userId = await resolveUserId(req);

  let assets = [];
  let goldLots = [];

  if (userId) {
    assets = await prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    goldLots = await prisma.goldLot.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
  }

  const user = auth.authenticated ? auth.user : null;
  const userCurrency = user?.currency || 'USD';
  const liveGoldPrice = await getLiveGoldPrice(userCurrency);

  const holdings = [
    ...assets.map(a => {
      const cost = a.purchasePrice || 0;
      const liveVal = a.purchasePrice || (a.quantity * 100);
      const diff = liveVal - cost;
      const pct = cost > 0 ? (diff / cost) * 100 : 0;
      return {
        id: a.id,
        name: a.name,
        assetType: a.type || 'Other Assets',
        status: a.status || 'Owned',
        quantity: a.quantity,
        unit: a.unit || 'units',
        purchasePrice: cost,
        liveValue: Math.round(liveVal),
        date: a.purchaseDate,
        notes: a.notes,
        pnl: { isGain: diff >= 0, diff: Math.abs(Math.round(diff)), pct: Math.abs(Math.round(pct * 10) / 10) }
      };
    }),
    ...goldLots.map(g => {
      const karatRatio = (g.karat === '21k' ? 21/24 : (g.karat === '18k' ? 18/24 : 1));
      const gramRate = liveGoldPrice.pricePerGram24 || liveGoldPrice.pricePerGramEgp24;
      const liveVal = g.grams * gramRate * karatRatio;
      const cost = g.pricePaid || 0;
      const diff = cost > 0 ? liveVal - cost : 0;
      const pct = cost > 0 ? (diff / cost) * 100 : 0;
      return {
        id: g.id,
        name: g.name || `${g.karat.toUpperCase()} Gold Bullion`,
        assetType: 'Gold',
        karat: g.karat,
        status: 'Owned',
        quantity: g.grams,
        unit: 'grams',
        purchasePrice: cost,
        liveValue: Math.round(liveVal),
        date: g.date,
        pnl: { isGain: diff >= 0, diff: Math.abs(Math.round(diff)), pct: Math.abs(Math.round(pct * 10) / 10) }
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
    goldPrice: liveGoldPrice,
    summary: {
      // Primary Gold Page metrics: Total Gold live value and gold invested
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
      // Explicit breakdowns
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

  const body = await req.json();
  const { name, assetType, type, quantity, grams, unit, purchasePrice, pricePaid, date, notes, status, karat } = body;

  const resolvedType = assetType || type || 'Gold';
  const qty = parseFloat(quantity || grams) || 1;
  const cost = parseFloat(purchasePrice || pricePaid || 0);
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (resolvedType === 'Gold') {
    const karatStr = (karat || '21k').toLowerCase();
    const goldLot = await prisma.goldLot.create({
      data: {
        userId,
        name: name ? name.trim() : `${karatStr.toUpperCase()} Gold Bullion Lot`,
        grams: qty,
        karat: karatStr,
        pricePaid: cost,
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
    purchasePrice: asset.purchasePrice,
    date: asset.purchaseDate
  }, { status: 201 });
}
