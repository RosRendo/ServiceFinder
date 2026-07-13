FROM node:22-alpine AS base

WORKDIR /app

# Install native build tools for bcrypt
RUN apk add --no-cache python3 make g++

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN rm -rf node_modules package-lock.json && npm install --omit=dev

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN rm -rf node_modules package-lock.json && npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN DATABASE_URL="mariadb://root:@localhost:3306/servicefinder" npx prisma generate

# Runtime stage
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=5000

# Install native build tools, OpenSSL for Prisma
RUN apk add --no-cache python3 make g++ openssl libstdc++

# Copy Dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy application code
COPY src ./src
COPY server.js .
COPY prisma ./prisma

# Create upload directories
RUN mkdir -p uploads logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
