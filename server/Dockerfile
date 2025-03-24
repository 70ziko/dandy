FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Development stage
FROM base AS development
COPY package*.json ./
COPY bun.lock ./
RUN bun install
EXPOSE 3001
CMD ["bun", "--hot", "src/index.ts"]

# Production stage
FROM base AS production
COPY package*.json ./
COPY bun.lock ./
COPY tsconfig.json ./
RUN bun install
COPY . .
RUN bun build ./src/index.ts --outdir ./dist --target bun
EXPOSE 3001
CMD ["bun", "./dist/index.js"]
