FROM node:20-alpine

# Install OpenSSL required by Prisma at runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy" npx prisma generate

# Copy the pre-built dist folder from your local machine
COPY dist ./dist

# Create logs directory
RUN mkdir -p logs && chown -R node:node logs

USER node
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
