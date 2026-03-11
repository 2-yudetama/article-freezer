# syntax=docker/dockerfile:1-labs
# 参考：https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
# 参考：https://github.com/astral-sh/uv-docker-example/blob/main/Dockerfile

ARG PYTHON_VERSION=3.13-slim-trixie
ARG UV_VERSION=0.10.7
# https://docs.astral.sh/uv/guides/integration/docker/#available-images
ARG UV_IMAGE=python3.13-trixie-slim

# Base Python image without uv
FROM python:${PYTHON_VERSION} AS base
# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Python image with uv included
FROM ghcr.io/astral-sh/uv:${UV_VERSION}-${UV_IMAGE} AS uv-base
# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy
# Disable installer metadata, to create a deterministic layer.
ENV UV_NO_INSTALLER_METADATA=1

# ============================================
# Builder stage
# ============================================

FROM uv-base AS builder
WORKDIR /app

COPY pyproject.toml uv.lock ./

# Install the application dependencies.
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project
    
# ============================================
# Runner stage
# ============================================

FROM base AS runner
WORKDIR /app

# Copy the application into the container.
COPY . .
COPY --from=builder /app/.venv ./.venv

# Setup a non-root user
RUN groupadd --system --gid 999 nonroot \
    && useradd --system --gid 999 --uid 999 --create-home nonroot

# Use the non-root user to run our application
USER nonroot

# Expose port 8080 to allow HTTP traffic
EXPOSE 8080

# Run the application.
CMD ["python", "-m", "src.main"]
