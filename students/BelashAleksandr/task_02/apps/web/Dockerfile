FROM node:18-alpine AS base

# Install pnpm via Corepack (avoid npm, keep builds reproducible)
RUN corepack enable \
	&& corepack prepare pnpm@9.0.0 --activate

# Development stage
FROM base AS development
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/web ./apps/web

# Set working directory to web app
WORKDIR /app/apps/web

# Expose port
EXPOSE 5173

# Start development server
CMD ["pnpm", "dev", "--host"]
