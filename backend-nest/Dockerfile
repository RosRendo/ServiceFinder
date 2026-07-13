# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

# Install OpenSSL and build dependencies required by Prisma
RUN apk add --no-cache openssl python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for build)
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN DATABASE_URL="mysql://dummy" npx prisma generate

# Bundle app source
COPY . .

# Build the NestJS application (fail fast if build fails)
RUN npm run build || (echo "Build failed!" && exit 1)
RUN ls -la /usr/src/app/dist/ || echo "dist folder not found"


# --- Stage 2: Production ---
FROM node:20-alpine AS production

# Install OpenSSL required by Prisma at runtime
RUN apk add --no-cache openssl

# Set Node environment to production
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies to keep the image small
RUN npm install --omit=dev --legacy-peer-deps

# Generate Prisma Client (required for production)
RUN DATABASE_URL="mysql://dummy" npx prisma generate

# Copy the built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create logs directory
RUN mkdir -p logs && chown -R node:node logs

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 5000

# Run database migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
