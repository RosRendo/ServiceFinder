# 🚀 NestJS Production Backend — Complete Migration Guide

> A full walkthrough of everything built in the `backend-nest` project, from scaffolding to production deployment. Use this as your personal reference.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Phase 1 — Swagger API Documentation](#2-phase-1--swagger-api-documentation)
3. [Phase 2 — Full API Migration (Controllers & Services)](#3-phase-2--full-api-migration)
4. [Phase 3 — Data Validation (DTOs & Custom Validators)](#4-phase-3--data-validation)
5. [Phase 4 — Error Handling & Middleware](#5-phase-4--error-handling--middleware)
6. [Phase 5 — Redis Caching](#6-phase-5--redis-caching)
7. [Phase 6 — Winston Logging & Log Rotation](#7-phase-6--winston-logging--log-rotation)
8. [Phase 7 — Unit Testing with Jest](#8-phase-7--unit-testing-with-jest)
9. [Phase 8 — Docker Multi-Stage Build](#9-phase-8--docker-multi-stage-build)
10. [Phase 9 — GitHub Actions CI/CD Pipeline](#10-phase-9--github-actions-cicd-pipeline)
11. [Phase 10 — Health Checks & Production Hardening](#11-phase-10--health-checks--production-hardening)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [Available npm Scripts](#13-available-npm-scripts)
14. [Key Concepts Glossary](#14-key-concepts-glossary)

---

## 1. Project Structure

```
backend-nest/
├── src/
│   ├── app.module.ts           # Root module (wires everything together)
│   ├── main.ts                 # Entry point (bootstrap, Swagger, global config)
│   ├── auth/                   # Authentication (JWT, Google OAuth, password reset)
│   ├── users/                  # User management
│   ├── companies/              # Company profiles
│   ├── categories/             # Service categories
│   ├── service-types/          # Service types within categories
│   ├── services/               # Individual service listings
│   ├── reviews/                # Customer reviews
│   ├── saved-items/            # Saved/wishlist items
│   ├── bookings/               # Booking management
│   ├── payments/               # Stripe, PayPal, Cash payments
│   ├── mail/                   # Email via Nodemailer
│   ├── health/                 # Health check endpoints (/api/health)
│   ├── prisma/                 # Prisma ORM service
│   └── common/
│       ├── filters/            # Global exception filter
│       ├── interceptors/       # Response transform interceptor
│       ├── middleware/         # HTTP request logger
│       ├── validators/         # Custom class-validator decorators
│       ├── exceptions/         # Custom exception classes
│       └── logger/             # Winston config
├── prisma/
│   └── schema.prisma           # Database schema
├── Dockerfile                  # Multi-stage production Docker image
├── .dockerignore               # Files excluded from Docker build
├── .env                        # Local environment variables (never commit!)
└── .github/
    └── workflows/
        └── backend-ci.yml      # GitHub Actions CI/CD pipeline
```

---

## 2. Phase 1 — Swagger API Documentation

**Goal:** Auto-generate interactive API docs at `/api/docs`.

### Install

```bash
npm install @nestjs/swagger swagger-ui-express
```

### Enable in `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Service Finder API')
  .setDescription('The Service Finder platform API documentation')
  .setVersion('1.0')
  .addBearerAuth()   // enables JWT auth in the UI
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Enable CLI Plugin (auto-documents DTOs)

In `nest-cli.json`:
```json
{
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

### Decorating Controllers

```typescript
@ApiTags('Companies')               // Groups endpoints in the UI
@Controller('companies')
export class CompaniesController {

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  getAllCompanies() { ... }

  @Post()
  @ApiBearerAuth()                  // Marks as requiring JWT
  @ApiOperation({ summary: 'Create a company' })
  createCompany() { ... }
}
```

> 📌 **Access docs at:** `http://localhost:5000/api/docs`

---

## 3. Phase 2 — Full API Migration

**Goal:** Implement all controllers and services across all 11 modules.

### NestJS Module Pattern

Every feature follows the same pattern:

```
module.ts     → declares what belongs to this feature
controller.ts → handles HTTP routes, delegates to service
service.ts    → contains all business logic
dto/          → defines the shape of request/response data
```

### Example — AuthModule

```typescript
// auth.module.ts
@Module({
  imports: [JwtModule, PrismaModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({ data: { ...dto, passwordHash: hash } });
    const token = this.jwt.sign({ userId: user.id.toString() });
    return { user, token };
  }
}
```

### Route Guards

```typescript
// Protect a route with JWT authentication
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@CurrentUser() user: User) { ... }

// Protect with role-based access
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
deleteUser() { ... }
```

---

## 4. Phase 3 — Data Validation

**Goal:** Validate all incoming request data and reject bad payloads automatically.

### Install

```bash
npm install class-validator class-transformer
```

### Enable Global Validation Pipe in `main.ts`

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,   // strips unknown properties
    transform: true,   // auto-transforms types (e.g. string -> number)
  }),
);
```

### Writing DTOs

```typescript
// register.dto.ts
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsStrongPasswordCustom()  // our custom validator
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

### Custom Validators

Located in `src/common/validators/`:

#### `IsStrongPassword` — Password strength

```typescript
// is-strong-password.validator.ts
export function IsStrongPasswordCustom() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: any) {
          // 8+ chars, uppercase, lowercase, number, special char
          const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
          return typeof value === 'string' && regex.test(value);
        },
        defaultMessage() {
          return 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}
```

#### `IsFutureDate` — Booking date must be in the future

```typescript
export function IsFutureDate() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: any) {
          const date = new Date(value);
          return !isNaN(date.getTime()) && date > new Date();
        },
        defaultMessage() {
          return 'bookingDate must be a valid future date';
        },
      },
    });
  };
}
```

---

## 5. Phase 4 — Error Handling & Middleware

**Goal:** Standardize all API error responses and log request timing.

### Global Exception Filter

Located at `src/common/filters/all-exceptions.filter.ts`

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
    }

    // Every error returns this consistent shape:
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Transform Interceptor (Response Envelope)

Located at `src/common/interceptors/transform.interceptor.ts`

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const start = Date.now();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,                                     // actual payload
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - start}ms`,      // response time
      })),
    );
  }
}
```

All successful responses look like:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-26T05:00:00.000Z",
  "duration": "42ms"
}
```

### Register Globally in `main.ts`

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
app.useGlobalInterceptors(new TransformInterceptor());
```

---

## 6. Phase 5 — Redis Caching

**Goal:** Cache read-heavy endpoints in Redis to reduce database load.

### Install

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet
```

### Configure Redis in `app.module.ts`

```typescript
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    store: await redisStore({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: 60 * 60 * 1000,  // default 1 hour
    }),
  }),
}),
```

### Apply to Controllers

```typescript
@Controller('categories')
@UseInterceptors(CacheInterceptor)  // applies to all GET routes
export class CategoriesController {

  @Get()
  @CacheTTL(60000)   // cache for 60 seconds
  getAllCategories() { ... }

  @Get(':slug')
  @CacheTTL(60000)
  getCategoryBySlug(@Param('slug') slug: string) { ... }
}
```

**Which endpoints were cached and why:**
| Endpoint | TTL | Reason |
|---|---|---|
| `GET /categories` | 60s | Rarely changes, very high read volume |
| `GET /services` | 30s | Changes occasionally, moderate volume |
| `GET /companies` | 30s | Changes occasionally, moderate volume |

> 📌 **Add to `.env`:** `REDIS_URL="redis://localhost:6379"`

---

## 7. Phase 6 — Winston Logging & Log Rotation

**Goal:** Replace NestJS's default console logger with structured file logging and daily rotation.

### Install

```bash
npm install nest-winston winston winston-daily-rotate-file
```

### Configure in `src/common/logger/winston.config.ts`

```typescript
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Colored console output for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) =>
          `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`
        ),
      ),
    }),

    // Error-only rotating log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',    // keep 14 days of logs
      zippedArchive: true,
    }),

    // All-levels rotating log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
};
```

### Hook Into NestJS in `main.ts`

```typescript
const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger(winstonConfig),
});
```

### HTTP Request Logger Middleware

Located at `src/common/middleware/logger.middleware.ts`

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const start = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const msg = `${method} ${originalUrl} ${statusCode} - ${ip} - ${Date.now() - start}ms`;

      if (statusCode >= 500) this.logger.error(msg);
      else if (statusCode >= 400) this.logger.warn(msg);
      else this.logger.log(msg);
    });

    next();
  }
}
```

### Register in `app.module.ts`

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

**Log output example:**
```
2026-04-26 12:00:01 [info] [HTTP] GET /api/companies 200 - ::1 - 38ms
2026-04-26 12:00:05 [warn] [HTTP] GET /api/companies/999 404 - ::1 - 12ms
```

---

## 8. Phase 7 — Unit Testing with Jest

**Goal:** Write focused unit tests for critical business services.

### How NestJS Testing Works

```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Create an isolated testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // Replace real dependencies with mocks
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'mock.token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should throw ConflictException if email exists', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 1 });

    await expect(service.register({ email: 'exists@test.com', ... }))
      .rejects.toThrow(ConflictException);
  });
});
```

### Mocking External Modules (e.g. bcryptjs)

When a module uses non-writable properties, use `jest.mock()` at the top:

```typescript
// This replaces the ENTIRE module with mocked functions
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Then in tests, control the return value:
(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

### Run Tests

```bash
npm run test           # run all tests once
npm run test:watch     # watch mode (re-runs on file save)
npm run test:cov       # with HTML coverage report
```

### What Was Tested

**AuthService** (`src/auth/auth.service.spec.ts`):
- ✅ `register()` — throws `ConflictException` if email exists
- ✅ `register()` — successfully creates user and returns JWT
- ✅ `login()` — throws `UnauthorizedException` if user not found
- ✅ `login()` — throws `UnauthorizedException` if password is wrong
- ✅ `login()` — returns token and user (without passwordHash) on success

**PaymentsService** (`src/payments/payments.service.spec.ts`):
- ✅ `createPayment()` — throws `NotFoundException` if booking not found
- ✅ `createPayment()` — throws `ForbiddenException` if booking belongs to someone else
- ✅ `createPayment()` — throws `ConflictException` if payment already exists
- ✅ `createPayment()` — successfully creates payment record
- ✅ `completePayment()` — throws `BadRequestException` for card method (use Stripe instead)
- ✅ `completePayment()` — completes cash payment and confirms booking

---

## 9. Phase 8 — Docker Multi-Stage Build

**Goal:** Create a lean, secure production Docker image.

### `.dockerignore`

Prevents large/sensitive files from being sent to Docker during build:

```
node_modules/
dist/
coverage/
logs/
.env
.git
```

### `Dockerfile` — Explained Line by Line

```dockerfile
# ---- STAGE 1: Builder ----
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Copy manifests first (Docker caches this layer)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (includes devDeps needed to compile TypeScript)
RUN npm ci

# Generate Prisma Client for the target OS (Linux Alpine)
RUN npx prisma generate

# Copy source code and compile TypeScript → JavaScript
COPY . .
RUN npm run build   # outputs to /dist


# ---- STAGE 2: Production ----
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Only install PRODUCTION deps (no Jest, TypeScript, etc.)
# Final image is ~193MB instead of 800MB+
RUN npm ci --only=production

# Regenerate Prisma Client for this OS
RUN npx prisma generate

# Copy only the compiled output from Stage 1
COPY --from=builder /usr/src/app/dist ./dist

# Create logs dir and use non-root user (security best practice)
RUN mkdir -p logs && chown -R node:node logs
USER node

EXPOSE 5000

# Run DB migrations automatically, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

**Why multi-stage?**
- Stage 1 builds everything but is discarded after
- Stage 2 only contains what's needed to run — no TypeScript compiler, no test runners
- Result: 193MB final image vs ~800MB single-stage

### Build & Run Locally

```bash
# Build
docker build -t servicefinder-backend .

# Run (pass env vars)
docker run -p 5000:5000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  -e REDIS_URL="redis://host.docker.internal:6379" \
  servicefinder-backend
```

---

## 10. Phase 9 — GitHub Actions CI/CD Pipeline

**Goal:** Automate testing, Docker builds, and deployment on every push to `main`.

**File:** `.github/workflows/backend-ci.yml`

### Pipeline Overview

```
Push to main (backend-nest/** files)
        │
        ▼
┌─────────────────────┐
│   Job 1: Test       │  ← Checkout → Install → Prisma Generate → Lint → Jest
│   (ubuntu-latest)   │
└────────┬────────────┘
         │ if PASS
         ▼
┌─────────────────────┐
│ Job 2: Docker Push  │  ← Buildx → Login to DockerHub → Build & Push
│ (ubuntu-latest)     │     tags: latest + git SHA (immutable)
└────────┬────────────┘
         │ if PASS
         ▼
┌─────────────────────┐
│ Job 3: Deploy       │  ← Install Railway CLI → railway up --environment staging
│ (ubuntu-latest)     │
└─────────────────────┘
```

### Key Concepts

**Caching npm for speed:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: './backend-nest/package-lock.json'
```

**Docker layer caching:**
```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=registry,ref=user/repo:buildcache
    cache-to: type=registry,ref=user/repo:buildcache,mode=max
```

**Double-tagging Docker images:**
```yaml
tags: |
  myuser/servicefinder-backend:latest
  myuser/servicefinder-backend:${{ github.sha }}
```
Using the commit SHA as a tag means you can always roll back to any exact version.

### Required GitHub Repository Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub access token (not your password) |
| `RAILWAY_TOKEN` | From Railway dashboard → Project Settings → Tokens |

---

## 11. Phase 10 — Health Checks & Production Hardening

### Environment Variable Validation (Joi)

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    DATABASE_URL: Joi.string().required(),   // app refuses to start without this
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
    REDIS_URL: Joi.string().required(),
  }),
}),
```

If any `required()` variable is missing, the app **throws immediately at startup** rather than silently misbehaving.

### Health Check Endpoints

Located at `src/health/`:

**`GET /api/health`** — Full deep check (used by load balancers / Railway):
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_rss": { "status": "up" },
    "memory_heap": { "status": "up" },
    "disk": { "status": "up" }
  }
}
```

**`GET /api/health/ping`** — Ultra-fast lightweight check (used by uptime monitors):
```json
{ "status": "ok", "timestamp": "2026-04-26T05:35:00.000Z" }
```

### PrismaHealthIndicator

```typescript
// prisma.health.ts
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;  // cheapest possible DB query
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Database check failed', this.getStatus(key, false));
    }
  }
}
```

### Automatic Database Migrations

Production Dockerfile CMD:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

`prisma migrate deploy`:
- Runs **only pending** migrations (safe — does not re-run old ones)
- Exits with an error code if migration fails (prevents corrupt deployments)
- Does NOT prompt for confirmation — safe for CI/CD

---

## 12. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MariaDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | — | JWT expiry (default: `7d`) |
| `REDIS_URL` | ✅ | Redis connection URL |
| `PORT` | — | Server port (default: `5000`) |
| `NODE_ENV` | — | `development` / `production` / `test` |
| `FRONTEND_URL` | — | For CORS and redirect URLs |
| `ALLOWED_ORIGINS` | — | Comma-separated list of allowed origins |
| `SMTP_HOST` | — | Email server host |
| `SMTP_USER` | — | Email account username |
| `SMTP_PASS` | — | Email account password |
| `CLOUDINARY_CLOUD_NAME` | — | For image uploads |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | For verifying Stripe webhooks |
| `PAYPAL_CLIENT_ID` | — | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | — | PayPal secret |
| `GOOGLE_CLIENT_ID` | — | For Google OAuth login |

---

## 13. Available npm Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `nest start --watch` | Development with hot reload |
| `start:prod` | `node dist/main` | Production (no migrations) |
| `start:migrate` | `prisma migrate deploy && node dist/main` | Production with auto-migrations |
| `migrate:prod` | `prisma migrate deploy` | Run migrations only |
| `build` | `nest build` | Compile TypeScript |
| `test` | `jest` | Run all unit tests |
| `test:watch` | `jest --watch` | Watch mode |
| `test:cov` | `jest --coverage` | With coverage report |
| `lint` | `eslint ... --fix` | Lint and auto-fix |

---

## 14. Key Concepts Glossary

| Term | Meaning |
|---|---|
| **Module** | NestJS building block that groups related controllers, services, and providers |
| **Controller** | Handles HTTP requests and delegates work to services |
| **Service** | Contains business logic, injected into controllers via DI |
| **DTO** | Data Transfer Object — defines the shape and validation rules of request data |
| **Guard** | Runs before a route handler to check authentication/authorization |
| **Interceptor** | Wraps route handler execution (good for logging, transforming responses) |
| **Filter** | Catches exceptions and formats the error response |
| **Middleware** | Runs before guards/interceptors — good for request logging |
| **Decorator** | TypeScript syntax (`@Something`) used heavily in NestJS for metadata |
| **Dependency Injection** | NestJS automatically creates and injects class instances |
| **Prisma** | Type-safe database ORM — generates a client from your schema |
| **JWT** | JSON Web Token — stateless authentication token |
| **Redis** | In-memory data store used for caching |
| **Health Check** | Endpoint that reports system status (DB up?, memory ok?, disk ok?) |
| **Multi-stage build** | Docker technique: use a build image, then copy artifacts to a lean runtime image |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated test + deploy pipeline |

---

*Generated from the complete backend-nest NestJS Production Migration — April 2026*
