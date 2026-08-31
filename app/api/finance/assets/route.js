import { prisma } from '@/lib/prisma.js';
import { getAuthUser, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth.js';

export async function GET(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const assets = await prisma.asset.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    });

    const lots = await prisma.goldLot.findMany({
      where: { userId: auth.userId },
      orderBy: { date: 'desc' }
    });

    return successResponse({ assets, lots });
  } catch (err) {
    console.error('Error fetching assets:', err);
    return errorResponse('Could not fetch assets.');
  }
}

export async function POST(req) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return unauthorizedResponse();

    const body = await req.json();
    const { name, type, status, quantity, unit, purchasePrice, purchaseDate, notes } = body;

    if (!name || quantity === undefined) {
      return errorResponse('Asset name and quantity are required.', 400);
    }

    const asset = await prisma.asset.create({
      data: {
        userId: auth.userId,
        name: name.trim(),
        type: type || 'Gold Bullion',
        status: status || 'Owned',
        quantity: parseFloat(quantity),
        unit: unit || 'grams',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        notes: notes || null
      }
    });

    return successResponse(asset, 201);
  } catch (err) {
    console.error('Error creating asset:', err);
    return errorResponse('Could not create asset.');
  }
}
