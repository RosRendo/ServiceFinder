# -- Stage 1: Builder ------------------------------------------
FROM node:20-slim AS builder
WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# -- Stage 2: Production ---------------------------------------
FROM node:20-slim AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --production
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p logs && chown -R node:node /usr/src/app
USER node

EXPOSE 3001
CMD ["node", "dist/main.js"]
