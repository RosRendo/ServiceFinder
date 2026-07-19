# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps

COPY . .
RUN DATABASE_URL="postgresql://dummy" npx prisma generate
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev --legacy-peer-deps
RUN DATABASE_URL="postgresql://dummy" npx prisma generate

# Copy the built dist folder from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p logs && chown -R node:node logs

USER node
EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
