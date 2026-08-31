import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';
import { getLiveGoldPrice } from '@/lib/gold.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  const user = await prisma.user.findFirst({ where: { email: 'jryusif@dashboard.com' } });
  return user ? user.id : null;
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

  const liveGoldPrice = await getLiveGoldPrice();

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
      const liveVal = g.grams * liveGoldPrice.pricePerGramEgp24 * karatRatio;
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

  let totalInvested = 0;
  let currentValue = 0;
  let ownedCount = 0;
  let plannedCount = 0;
  let totalGoldGrams = 0;
  const byKarat = { '24k': 0, '21k': 0, '18k': 0 };

  holdings.forEach(h => {
    totalInvested += h.purchasePrice || 0;
    currentValue += h.liveValue || 0;
    if (h.status === 'Owned') ownedCount++;
    else plannedCount++;

    if (h.assetType === 'Gold') {
      totalGoldGrams += h.quantity || 0;
      const k = (h.karat || '24k').toLowerCase();
      if (byKarat[k] !== undefined) byKarat[k] += h.quantity || 0;
    }
  });

  const totalDiff = currentValue - totalInvested;
  const totalPct = totalInvested > 0 ? (totalDiff / totalInvested) * 100 : 0;

  return NextResponse.json({
    goldPrice: liveGoldPrice,
    summary: {
      totalInvested,
      currentValue,
      totalPnl: { isGain: totalDiff >= 0, diff: Math.abs(Math.round(totalDiff)), pct: Math.abs(Math.round(totalPct * 10) / 10) },
      goldWeight: {
        totalGrams: totalGoldGrams,
        byKarat
      },
      counts: {
        owned: ownedCount,
        planned: plannedCount
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
