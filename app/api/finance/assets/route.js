import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

async function resolveUserId(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) return auth.userId;
  
  return null;
}

export async function GET(req) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return successResponse({ assets: [], lots: [] });

    const assets = await prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const lots = await prisma.goldLot.findMany({
      where: { userId },
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
    const userId = await resolveUserId(req);
    if (!userId) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { name, type, status, quantity, unit, purchasePrice, purchaseDate, notes } = body;

    if (!name || quantity === undefined) {
      return errorResponse('Asset name and quantity are required.', 400);
    }

    const asset = await prisma.asset.create({
      data: {
        userId,
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
