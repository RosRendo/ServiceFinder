# -- Stage 1: Builder ------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# -- Stage 2: Production ---------------------------------------
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /usr/src/app/dist ./dist

RUN mkdir -p logs && chown -R node:node logs
USER node

EXPOSE 3005
CMD ["node", "dist/main.js"]
