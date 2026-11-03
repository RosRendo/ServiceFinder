export function getSocketAllowedOrigins(): string[] {
  const allowedOrigins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
    'https://servicefinder-production.up.railway.app',
    'https://service-finder-five.vercel.app',
    'https://service-finder-gold.vercel.app',
    'http://3.27.148.112',
    'https://3.27.148.112',
    'http://192.168.100.171:8080',
  ];

  const extra = [
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  extra.forEach((origin) => {
    const trimmed = (origin || '').trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });

  return allowedOrigins;
}

export function socketOriginChecker() {
  return (origin: string | undefined, callback: (err: any, ok: boolean) => void) => {
    const isDev = process.env.NODE_ENV !== 'production';

    if (
      !origin ||
      getSocketAllowedOrigins().includes(origin) ||
      (isDev && origin?.endsWith('.vercel.app')) ||
      (isDev && origin?.endsWith('.railway.app')) ||
      (isDev && origin?.match(/\.trycloudflare\.com$/)) ||
      (isDev && origin?.match(/^http:\/\/192\.168\./)) ||
      (isDev && origin?.match(/^http:\/\/10\./)) ||
      (isDev && origin?.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./))
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  };
}

export function socketCorsOptions() {
  return {
    origin: socketOriginChecker(),
    credentials: true,
  };
}
