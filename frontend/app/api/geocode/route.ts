import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) return NextResponse.json([]);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
        throw new Error(`Geocoding API failed: ${res.status}`);
    }

    const data = await res.json();
    
    // Map Photon GeoJSON to Nominatim format so frontend doesn't need to change
    const results = (data.features || []).map((f: any) => {
      const props = f.properties;
      const coords = f.geometry.coordinates; // [lon, lat]
      
      const parts = [];
      if (props.name) parts.push(props.name);
      if (props.city && props.city !== props.name) parts.push(props.city);
      if (props.state && props.state !== props.city) parts.push(props.state);
      if (props.country) parts.push(props.country);
      
      return {
        display_name: parts.join(', '),
        lat: coords[1],
        lon: coords[0]
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}
