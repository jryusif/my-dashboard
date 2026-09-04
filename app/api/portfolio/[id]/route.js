import { NextResponse } from 'next/server';
import { getAuthUser, jsonError } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

export async function DELETE(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  await prisma.asset.deleteMany({
    where: { id, userId: auth.user.id }
  });
  await prisma.goldLot.deleteMany({
    where: { id, userId: auth.user.id }
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req, { params }) {
  const auth = await getAuthUser(req);
  if (!auth.authenticated) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const body = await req.json();

  const assetData = {};
  if (body.name !== undefined) assetData.name = body.name;
  if (body.status !== undefined) assetData.status = body.status;
  if (body.quantity !== undefined || body.grams !== undefined) assetData.quantity = parseFloat(body.quantity || body.grams);
  if (body.purchasePrice !== undefined || body.pricePaid !== undefined) assetData.purchasePrice = parseFloat(body.purchasePrice || body.pricePaid);
  if (body.date !== undefined) assetData.purchaseDate = body.date;
  if (body.currency !== undefined) assetData.currency = body.currency;

  const goldData = {};
  if (body.name !== undefined) goldData.name = body.name;
  if (body.quantity !== undefined || body.grams !== undefined) goldData.grams = parseFloat(body.quantity || body.grams);
  if (body.karat !== undefined) goldData.karat = body.karat;
  if (body.pricePaid !== undefined || body.purchasePrice !== undefined) goldData.pricePaid = parseFloat(body.pricePaid || body.purchasePrice);
  if (body.date !== undefined) goldData.date = body.date;
  if (body.currency !== undefined) goldData.currency = body.currency;

  const [assetRes, goldRes] = await Promise.all([
    prisma.asset.updateMany({
      where: { id, userId: auth.user.id },
      data: assetData
    }),
    prisma.goldLot.updateMany({
      where: { id, userId: auth.user.id },
      data: goldData
    })
  ]);

  return NextResponse.json({ success: true, count: assetRes.count + goldRes.count });
}
