"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_1 = require("@nestjs/swagger");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const nest_winston_1 = require("nest-winston");
const winston_config_1 = require("./common/logger/winston.config");
const uuid_1 = require("uuid");
const redis_io_adapter_1 = require("./common/adapters/redis-io.adapter");
const express = __importStar(require("express"));
const path = __importStar(require("path"));
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
BigInt.prototype.toJSON = function () {
    return this.toString();
};
async function bootstrap() {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    const firebaseConfigEnv = process.env.FIREBASE_CONFIG_JSON;
    if (firebaseConfigEnv || require('fs').existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = firebaseConfigEnv
                ? JSON.parse(firebaseConfigEnv)
                : require(serviceAccountPath);
            const { initializeApp, cert } = require('firebase-admin/app');
            initializeApp({
                credential: cert(serviceAccount),
            });
            common_1.Logger.log('✅ Firebase Admin initialized successfully', 'Bootstrap');
        }
        catch (e) {
            common_1.Logger.error('❌ Failed to initialize Firebase Admin SDK:', e?.message, 'Bootstrap');
        }
    }
    else {
        if (process.env.NODE_ENV === 'production') {
            common_1.Logger.warn('⚠️ Firebase credentials not found (neither FIREBASE_CONFIG_JSON env nor firebase-service-account.json). Firebase Auth will fail if invoked!', 'Bootstrap');
        }
        else {
            common_1.Logger.log('ℹ️ Firebase credentials not provided, skipping Firebase SDK initialization.', 'Bootstrap');
        }
    }
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            integrations: [(0, profiling_node_1.nodeProfilingIntegration)()],
            tracesSampleRate: 1.0,
            profilesSampleRate: 1.0,
        });
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        logger: nest_winston_1.WinstonModule.createLogger(winston_config_1.winstonConfig),
    });
    const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app);
    try {
        await redisIoAdapter.connectToRedis();
        app.useWebSocketAdapter(redisIoAdapter);
        common_1.Logger.log('✅ Redis WebSockets Adapter connected successfully', 'Bootstrap');
    }
    catch (err) {
        common_1.Logger.error('❌ Failed to connect Redis WebSockets Adapter, using default adapter:', err, 'Bootstrap');
    }
    app.setGlobalPrefix('api');
    app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
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
            const isDev = process.env.NODE_ENV !== 'production';
            if (!origin ||
                allowedOrigins.includes(origin) ||
                (isDev && origin?.endsWith('.vercel.app')) ||
                (isDev && origin?.endsWith('.railway.app')) ||
                (isDev && origin?.match(/\.trycloudflare\.com$/)) ||
                (isDev && origin?.match(/^http:\/\/192\.168\./)) ||
                (isDev && origin?.match(/^http:\/\/10\./)) ||
                (isDev && origin?.match(/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./))) {
                callback(null, true);
            }
            else {
                common_1.Logger.warn('Blocked by Strict CORS Policy: ' + origin, 'Bootstrap');
                callback(null, false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        credentials: true,
    });
    app.use((0, cookie_parser_1.default)());
    app.use((0, helmet_1.default)({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.use((_req, res, next) => {
        res.setHeader('X-Request-ID', (0, uuid_1.v4)());
        next();
    });
    BigInt.prototype.toJSON = function () {
        return this.toString();
    };
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Service Finder API')
            .setDescription('The Service Finder platform API documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
//# sourceMappingURL=main.js.map