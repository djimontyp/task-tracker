# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Production Dependencies
# ============================================
FROM node:22-slim AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install production dependencies with cache mount
# --frozen-lockfile ensures reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --frozen-lockfile

# ============================================
# Stage 2: Development Dependencies
# ============================================
FROM node:22-slim AS dev-deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies) with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# ============================================
# Stage 3: Builder
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy all dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 4: Development (for Docker Compose Watch)
# ============================================
FROM node:22-slim AS development

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# Copy application source
COPY . .

# Expose development server port
EXPOSE 3000

# Set environment variable for React
ENV NODE_ENV=development

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# ============================================
# Stage 5: Production (Nginx)
# ============================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

# Use non-root user (already configured in unprivileged image)
USER nginx

# Copy built application from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Expose unprivileged port
EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
