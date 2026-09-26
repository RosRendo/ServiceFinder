
import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Enable standalone output mode during Docker build only to keep Vercel compatibility
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: 'cambodiaservice.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow Google OAuth, Maps popups without COEP restrictions
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },

          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          // Stop MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Allow camera/mic for webcam features; block everything else
          {
            key: "Permissions-Policy",
            value: "camera=self, microphone=self, geolocation=self, payment=self",
          },

          // Force HTTPS for 1 year (production only)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),

          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://maps.googleapis.com https://us.i.posthog.com https://eu.i.posthog.com https://*.posthog.com https://*.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com https://i.pravatar.cc https://lh3.googleusercontent.com https://*.cartocdn.com https://cdnjs.cloudflare.com https://unpkg.com https://cambodiaservice.com https://api.dicebear.com ${SITE_URL}`,
              `connect-src 'self' ws: wss: ${API_URL} https://accounts.google.com https://us.i.posthog.com https://eu.i.posthog.com https://*.posthog.com https://*.i.posthog.com`,
              "frame-src 'self' https://accounts.google.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
/*
export default withSentryConfig(nextConfig, {
  org: "servicefinder-lo",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
*/
