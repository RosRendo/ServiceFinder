import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url');

  if (!urlParam) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Fetch the URL to follow any redirects
    const res = await fetch(urlParam, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    const finalUrl = res.url;
    
    // Attempt to parse coordinates from the final URL
    // Format 1: @lat,lng
    const match1 = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    // Format 2: /search/lat,+lng
    const match2 = finalUrl.match(/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
    
    if (match1) {
        return NextResponse.json({ lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) });
    } else if (match2) {
        return NextResponse.json({ lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) });
    }

    return NextResponse.json({ error: 'Could not extract coordinates from URL', finalUrl }, { status: 404 });
  } catch (error) {
    console.error("Google Maps parser error:", error);
    return NextResponse.json({ error: 'Failed to parse URL' }, { status: 500 });
  }
}
