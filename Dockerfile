# syntax=docker/dockerfile:1-labs
# 参考：https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# https://github.com/nodejs/docker-node/blob/74b0481b76e0af5b19d425ad34489e7393b23aff/24/bookworm-slim/Dockerfile
ARG NODE_VERSION=24.13-slim

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# Update openssl
RUN apt-get update && apt-get upgrade openssl -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

FROM base AS dependencies

# Set working directory
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
# 
COPY --parents package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* packages/*/package.json ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM base AS builder

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages* ./packages

# Copy application source code
COPY . .

ENV NODE_ENV=production

# ビルドに必要な環境変数を.env.exampleから設定
RUN cp /app/packages/db/.env.example /app/packages/db/.env \
    && pnpm db build
RUN cp /app/packages/web-app/.env.example /app/packages/web-app/.env \
    && pnpm web-app build

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM base AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the run time.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/packages/web-app/.next/standalone ./

# モノレポ構成のためワークスペースを移動
WORKDIR /app/packages/web-app

# Copy production assets
COPY --from=builder --chown=node:node /app/packages/web-app/public ./public
COPY --from=builder --chown=node:node /app/packages/web-app/.next/static ./.next/static

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
