import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let backendStatus = 'unknown';
  let backendLatency = 0;

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/health/ping`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      backendStatus = 'healthy';
      backendLatency = Date.now() - start;
    } else {
      backendStatus = `unhealthy (${res.status})`;
    }
  } catch (err: any) {
    backendStatus = `unreachable (${err.message || err})`;
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      backend: {
        status: backendStatus,
        latencyMs: backendLatency,
      },
    },
  }, {
    status: backendStatus === 'healthy' ? 200 : 503,
  });
}
