
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const API_URL = process.env.DURO_API_URL;
    const API_TOKEN = process.env.DURO_API_TOKEN;

    if (!API_URL || !API_TOKEN) {
      console.error('Missing DURO_API_URL or DURO_API_TOKEN environment variables');
      return NextResponse.json(
        { error: 'Server Configuration Error', message: 'Missing API configuration' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiToken': API_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API Error: ${response.status} ${response.statusText}`, details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    );
  }
}
