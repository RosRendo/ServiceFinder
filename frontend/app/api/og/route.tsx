import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic title and description
    const title = searchParams.get('title') || 'Service Finder';
    const description = searchParams.get('description') || 'Find trusted local service providers for all your home, auto, and professional needs.';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #111827 2%, transparent 0%), radial-gradient(circle at 75px 75px, #111827 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            color: '#ffffff',
            padding: '40px 80px',
            position: 'relative',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '20px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '30px',
            }}
          >
            Service Finder
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              background: 'linear-gradient(to right, #60a5fa, #3b82f6, #1d4ed8)',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.1,
              margin: '0 0 20px 0',
              padding: '0',
              textAlign: 'center',
            }}
          >
            {title}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '24px',
              color: '#9ca3af',
              maxWidth: '850px',
              margin: '0',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            {description}
          </p>

          {/* URL / Branding */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '50px',
              color: '#4b5563',
              fontSize: '18px',
              fontWeight: 500,
              letterSpacing: '1px',
            }}
          >
            servicefinder.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
