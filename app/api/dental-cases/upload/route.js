import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const url = data.url || data.dataUrl || data.base64 || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80';
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: 'Could not process upload' }, { status: 400 });
  }
}
