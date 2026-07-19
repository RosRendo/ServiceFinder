import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { v4 as uuidv4 } from 'uuid';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import * as express from 'express';
import * as path from 'path';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import * as admin from 'firebase-admin';

// Fix BigInt serialization for JSON.stringify globally
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
  if (require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    const { initializeApp, cert } = require('firebase-admin/app');
    initializeApp({
      credential: cert(serviceAccount),
    });
    Logger.log('✅ Firebase Admin initialized successfully', 'Bootstrap');
  } else {
    Logger.warn('⚠️ firebase-service-account.json not found, Firebase Auth will fail!', 'Bootstrap');
  }

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
  }

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  try {
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    Logger.log(
      '✅ Redis WebSockets Adapter connected successfully',
      'Bootstrap',
    );
  } catch (err) {
    Logger.error(
      '❌ Failed to connect Redis WebSockets Adapter, using default adapter:',
      err,
      'Bootstrap',
    );
  }

  app.setGlobalPrefix('api');

  // Serve uploaded files statically
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'public', 'uploads')),
  );

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
  ];

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((origin) => {
      const trimmedOrigin = origin.trim();
      if (trimmedOrigin && !allowedOrigins.includes(trimmedOrigin)) {
        allowedOrigins.push(trimmedOrigin);
      }
    });
  }

  app.enableCors({
    origin: (origin, callback) => {
      // In production, we ONLY allow the exact domains listed in allowedOrigins or env.ALLOWED_ORIGINS
      // We allow mobile apps and API clients (!origin) universally since they don't send an Origin header
      const isDev = process.env.NODE_ENV !== 'production';

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDev && origin?.endsWith('.vercel.app')) ||
        (isDev && origin?.endsWith('.railway.app')) ||
        (isDev && origin?.match(/\.trycloudflare\.com$/))
      ) {
        callback(null, true);
      } else {
        Logger.warn('Blocked by Strict CORS Policy: ' + origin, 'Bootstrap');
        callback(null, false);
      }
    },
    credentials: true,
  });

  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // Required for Swagger UI to work
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Attach a unique X-Request-ID to every response for distributed tracing
  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Request-ID', uuidv4());
    next();
  });

  // Allow bigints to be serialized to JSON
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  // Swagger Documentation — disabled in production for security
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Service Finder API')
      .setDescription('The Service Finder platform API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
