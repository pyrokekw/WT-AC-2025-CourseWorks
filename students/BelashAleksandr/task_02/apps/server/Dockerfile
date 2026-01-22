FROM node:18-alpine AS base

# Install pnpm via Corepack (avoid npm, keep builds reproducible)
RUN corepack enable \
	&& corepack prepare pnpm@9.0.0 --activate

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/server ./apps/server

# Generate Prisma client and build (from root with workspace context)
RUN pnpm --filter server db:generate \
	&& pnpm --filter server build

# Compile seed file
WORKDIR /app/apps/server
RUN pnpm exec tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --resolveJsonModule --skipLibCheck

# Production stage
FROM base AS runner

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/server/package.json ./apps/server/

# Copy all node_modules (includes Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Copy built files
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["node", "dist/index.js"]
