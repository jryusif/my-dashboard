import { NextResponse } from 'next/server';

export async function POST(req) {
  // Return placeholder or accept base64 photo URL
  try {
    const data = await req.json();
    return NextResponse.json({ url: data.url || data.base64 || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80' });
  } catch {
    return NextResponse.json({ url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80' });
  }
}
