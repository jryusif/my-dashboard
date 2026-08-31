import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function GET(req) {
  const auth = await getAuthUser(req);
  const userId = auth.authenticated ? auth.user.id : null;

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

  const items = [
    ...assets.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      category: a.type,
      quantity: a.quantity,
      unit: a.unit,
      purchasePrice: a.purchasePrice,
      currentValue: a.purchasePrice || (a.quantity * 88.5),
      date: a.purchaseDate,
      notes: a.notes
    })),
    ...goldLots.map(g => ({
      id: g.id,
      name: `${g.karat}k Gold Bullion (${g.weightGrams}g)`,
      type: 'Gold Bullion',
      category: 'Gold',
      quantity: g.weightGrams,
      unit: 'grams',
      purchasePrice: g.purchasePriceUsd,
      currentValue: g.grams24kEquivalent * 88.5,
      date: g.date,
      notes: g.serialNumber ? `Serial: ${g.serialNumber}` : ''
    }))
  ];

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { name, type, quantity, unit, purchasePrice, date, notes } = await req.json();
  const asset = await prisma.asset.create({
    data: {
      userId: auth.user.id,
      name: name || 'New Asset',
      type: type || 'Other',
      quantity: parseFloat(quantity) || 1,
      unit: unit || 'units',
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      purchaseDate: date || null,
      notes: notes || null
    }
  });

  return NextResponse.json(asset, { status: 201 });
}
