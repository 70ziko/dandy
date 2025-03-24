FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Development stage
FROM base AS development
COPY package*.json ./
COPY bun.lock ./
RUN bun install
EXPOSE 3000
CMD ["bun", "run", "dev"]

# Production stage
FROM base AS production
COPY package*.json ./
COPY bun.lock ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
# Use preview for production Vite build
CMD ["bun", "run", "preview", "--host"]
