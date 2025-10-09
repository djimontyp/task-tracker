# Frontend Docker Infrastructure Modernization Plan

**Date:** 2025-10-09
**Project:** Task Tracker Frontend
**Approach:** Sequential (Safe) Execution
**Estimated Time:** 2-3 days (8-12 hours work)

---

## Executive Summary

This plan modernizes the frontend Docker infrastructure through 3 sequential phases:
- **Phase 3A:** Docker optimizations (Node 22, security headers, cache mounts)
- **Phase 3B:** Vite migration (CRA → Vite for 10-20x performance)
- **Phase 3C:** Production hardening (nginx optimization, healthchecks)

**Expected Results:**
- Build time: 5-8 min → 10-15 sec (-95%)
- Image size: 1.77 GB → 40-60 MB (-97%)
- HMR speed: 2-5 sec → <500ms (-90%)
- Bundle size: 159.5 KB → 120-130 KB (-20%)

---

## Table of Contents

1. [Phase 3A: Docker Infrastructure Optimization](#phase-3a-docker-infrastructure-optimization)
2. [Phase 3B: Vite Migration](#phase-3b-vite-migration)
3. [Phase 3C: Production Hardening](#phase-3c-production-hardening)
4. [Integration & Testing](#integration--testing)
5. [Files Modified/Created](#files-modifiedcreated)
6. [Performance Metrics](#performance-metrics)
7. [Risk Assessment](#risk-assessment)
8. [Timeline](#timeline)
9. [Success Criteria](#success-criteria)

---

## Phase 3A: Docker Infrastructure Optimization

**Agent:** `devops-expert`
**Duration:** 2-3 hours
**Goal:** Optimize Docker build process without breaking changes

### Tasks

#### 1. Create `.dockerignore`
**File:** `/home/maks/projects/task-tracker/frontend/.dockerignore`

**Content:**
```dockerignore
# Dependencies
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.pnp
.pnp.js

# Production builds
dist
build
.vite
.eslintcache

# Development
.git
.gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo
.DS_Store
*.iml
.project
.classpath
.settings

# Testing
coverage
.nyc_output
*.log
test-results
playwright-report

# Misc
*.md
!README.md
.prettierrc
.editorconfig
.eslintrc*
tsconfig.tsbuildinfo

# Docker
Dockerfile
docker-compose*.yml
.dockerignore
```

**Impact:** Reduce build context from ~200MB to ~5-10MB (-95%)

---

#### 2. Optimize `frontend/Dockerfile`

**Current Issues:**
- Node 18 (outdated, Node 22 LTS available)
- Alpine (musl libc performance issues)
- No cache mounts (slow dependency installs)
- Layer ordering not optimal
- Missing `--frozen-lockfile`

**New Multi-Stage Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1

# =========================================
# Stage 1: Dependencies Installation
# =========================================
FROM node:22-slim AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies with cache mount for npm
# --mount=type=cache persists npm cache across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile --only=production && \
    npm cache clean --force

# =========================================
# Stage 2: Development Dependencies
# =========================================
FROM node:22-slim AS dev-deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install ALL dependencies (including dev) with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# =========================================
# Stage 3: Builder
# =========================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy installed dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# =========================================
# Stage 4: Development Server
# =========================================
FROM node:22-slim AS development

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies for development
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# Copy source files
COPY . .

# Expose development port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "start"]

# =========================================
# Stage 5: Production Server
# =========================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

# Switch to non-root user (already default in unprivileged image)
USER nginx

# Copy custom nginx configuration
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --chown=nginx:nginx --from=builder /app/build /usr/share/nginx/html

# Expose unprivileged port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Key Improvements:**
1. **Node 18 → Node 22-slim:** Latest LTS, Debian-based (glibc), ~200MB smaller
2. **Separate deps stages:** Optimizes layer caching
3. **Cache mounts:** `--mount=type=cache,target=/root/.npm` speeds up installs 60-80%
4. **`--frozen-lockfile`:** Ensures reproducible builds
5. **Security:** Non-root nginx user, unprivileged port 8080
6. **Layer ordering:** Package files → install → source → build (optimal caching)
7. **Health check:** Built-in container health monitoring

**Expected Impact:**
- Build time: 3-5 min → 30-60 sec (with warm cache)
- Image size: 1.77GB → ~50-80MB (production stage)
- Rebuild time (code change only): 10-15 sec

---

#### 3. Add Security Headers to Frontend Nginx

**File:** `/home/maks/projects/task-tracker/frontend/nginx.conf`

**Add inside `server` block:**

```nginx
    # Security Headers
    # CSP: Permissive for CRA (requires unsafe-inline/unsafe-eval)
    # Note: Tighten this after migrating to Vite in Phase 3B
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: http://localhost:8000 http://api:8000; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" always;

    # Prevent clickjacking
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Prevent MIME type sniffing
    add_header X-Content-Type-Options "nosniff" always;

    # Enable XSS filter in older browsers
    add_header X-XSS-Protection "1; mode=block" always;

    # Control referrer information
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Restrict browser features
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()" always;

    # HSTS - Uncomment for HTTPS production
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Security Headers Explained:**
1. **Content-Security-Policy:** Prevents XSS, controls resource loading
2. **X-Frame-Options:** Prevents clickjacking attacks
3. **X-Content-Type-Options:** Prevents MIME type sniffing
4. **Referrer-Policy:** Controls referrer information leakage
5. **Permissions-Policy:** Disables unnecessary browser features

**Note:** CSP is permissive due to CRA limitations. Will be tightened in Phase 3B (Vite migration).

---

#### 4. Update Main Nginx Security Headers

**File:** `/home/maks/projects/task-tracker/nginx/nginx.conf`

**Add after line 43 (`server_name localhost;`):**

```nginx
        # Security Headers
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;

        # HSTS - Uncomment for HTTPS in production
        # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

#### 5. Optimize Docker Compose Watch

**File:** `/home/maks/projects/task-tracker/compose.yml`

**Update dashboard service:**

```yaml
  dashboard:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: task-tracker-dashboard
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped
    environment:
      - REACT_APP_API_BASE_URL=${DASHBOARD_API_BASE_URL:-http://localhost:8000}
      - REACT_APP_WS_URL=${DASHBOARD_WS_URL:-ws://localhost/ws}
      # Enable React hot reload in Docker
      - WATCHPACK_POLLING=true
      - CHOKIDAR_USEPOLLING=true
    develop:
      watch:
        # Sync source code changes
        - action: sync
          path: ./frontend/src
          target: /app/src
          ignore:
            - "**/__pycache__"
            - "**/node_modules"
            - "**/.git"
            - "**/*.test.tsx"
            - "**/*.test.ts"
            - "**/*.test.jsx"
            - "**/*.test.js"
            - "**/__tests__"
            - "**/coverage"
            - "**/.vscode"
            - "**/.idea"

        # Sync public assets
        - action: sync
          path: ./frontend/public
          target: /app/public
          ignore:
            - "**/node_modules"
            - "**/.git"

        # Rebuild on package.json changes
        - action: rebuild
          path: ./frontend/package.json

        # Rebuild on package-lock.json changes
        - action: rebuild
          path: ./frontend/package-lock.json
```

**Improvements:**
1. Added `ignore` patterns to prevent syncing test files, IDE configs
2. Added polling environment variables for Docker hot reload
3. Added `package-lock.json` rebuild trigger
4. Comprehensive ignore list reduces unnecessary syncs

---

### Phase 3A Deliverables

- ✅ `.dockerignore` file created
- ✅ Optimized `Dockerfile` (Node 22-slim, cache mounts, multi-stage)
- ✅ Security headers in `frontend/nginx.conf`
- ✅ Security headers in `nginx/nginx.conf`
- ✅ Improved Docker Compose Watch configuration

### Phase 3A Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Build time (cold) | 5-8 min | 2-3 min | 60-70% faster |
| Build time (warm) | 2-3 min | 30-60 sec | 75-80% faster |
| Production image | 1.77 GB | 50-80 MB | 95% smaller |
| Build context | 200 MB | 5-10 MB | 95% smaller |
| Security headers | 0 | 6 headers | Full protection |
| Node version | 18 (EOL) | 22 LTS | Latest + secure |

---

## Phase 3B: Vite Migration

**Agent:** `react-frontend-architect`
**Duration:** 4-6 hours
**Goal:** Migrate from CRA to Vite without breaking TypeScript/features

### Tasks

#### 1. Install Vite Dependencies

```bash
cd frontend
npm install vite @vitejs/plugin-react
npm uninstall react-scripts @craco/craco craco-alias
```

---

#### 2. Create `vite.config.ts`

**File:** `/home/maks/projects/task-tracker/frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },

  server: {
    port: 3000,
    host: true, // Listen on all addresses (for Docker)
    strictPort: true,
    watch: {
      usePolling: true, // Required for Docker on some systems
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-dialog'],
        },
      },
    },
  },

  preview: {
    port: 3000,
    host: true,
  },
})
```

**Key Configuration:**
- Path aliases match existing `tsconfig.json`
- Server port 3000, host: true for Docker
- Build output to `dist/` folder
- Manual chunks for optimized splitting
- Source maps enabled for debugging

---

#### 3. Move and Update `index.html`

**Action:** Move `public/index.html` → `index.html` (project root)

**Updates to `index.html`:**

**Before (CRA):**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Task Tracker Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

**After (Vite):**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Task Tracker Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

**Changes:**
- Remove `%PUBLIC_URL%` references → use `/` directly
- Add `<script type="module" src="/src/index.tsx"></script>` at end of body

---

#### 4. Migrate Environment Variables

**Rename pattern:** `REACT_APP_*` → `VITE_*`

**Create `.env.development`:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost/ws
VITE_WS_HOST=localhost:8000
VITE_WS_PATH=/ws
NODE_ENV=development
```

**Create `.env.production`:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost/ws
VITE_WS_HOST=localhost:8000
VITE_WS_PATH=/ws
NODE_ENV=production
```

**Update `.env.example`:**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000

# WebSocket Configuration
VITE_WS_HOST=localhost:8000
VITE_WS_PATH=/ws
VITE_WS_URL=ws://localhost/ws

# Build Environment
NODE_ENV=development
```

**Code Changes:**

**Find and replace in all files:**
```typescript
// Before (CRA)
const apiUrl = process.env.REACT_APP_API_BASE_URL

// After (Vite)
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

**Files to update:**
- `src/shared/lib/api/client.ts`
- `src/shared/hooks/useWebSocket.ts`
- Any other files using `process.env.REACT_APP_*`

**TypeScript types for env:**

Add to `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_WS_HOST: string
  readonly VITE_WS_PATH: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

#### 5. Update `package.json` Scripts

**File:** `/home/maks/projects/task-tracker/frontend/package.json`

**Replace scripts section:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

**Remove dependencies:**
```json
// Remove these from dependencies/devDependencies:
"react-scripts": "5.0.1",
"@craco/craco": "^7.1.0",
"craco-alias": "^3.0.1"
```

**Optional: Add Vitest for testing:**
```bash
npm install -D vitest @vitest/ui
```

---

#### 6. Fix TypeScript Configuration

**File:** `/home/maks/projects/task-tracker/frontend/tsconfig.json`

**Update for Vite:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@app/*": ["app/*"],
      "@pages/*": ["pages/*"],
      "@widgets/*": ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Create `tsconfig.node.json` for Vite config:**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

#### 7. Remove CRA-Specific Files

```bash
# Remove CRA config file
rm frontend/craco.config.js

# public/index.html was moved to root, so old one can be deleted
rm frontend/public/index.html
```

---

#### 8. Verify Build Output

**Test commands:**

```bash
# Development server
npm run dev
# Should start in < 5 seconds
# Check http://localhost:3000

# Production build
npm run build
# Should complete without errors
# Check dist/ folder created

# Preview production build
npm run preview
# Check http://localhost:3000
```

**Verification checklist:**
- ✅ Dev server starts instantly (< 5 sec)
- ✅ Hot reload works (< 500ms)
- ✅ Build completes without errors
- ✅ `dist/` folder contains optimized assets
- ✅ All routes work
- ✅ Environment variables accessible
- ✅ TypeScript 0 errors
- ✅ All imports resolve correctly

---

### Phase 3B Deliverables

- ✅ `vite.config.ts` created with correct aliases
- ✅ `index.html` moved to root with Vite entry
- ✅ `.env.development` and `.env.production` created
- ✅ `package.json` updated (Vite scripts, CRA deps removed)
- ✅ All `REACT_APP_*` → `VITE_*` migrated
- ✅ `tsconfig.json` updated for Vite
- ✅ `tsconfig.node.json` created
- ✅ `src/vite-env.d.ts` created for env types
- ✅ CRA config files removed

### Phase 3B Expected Results

| Metric | Before (CRA) | After (Vite) | Improvement |
|--------|--------------|--------------|-------------|
| Dev start time | 20-30 sec | < 3 sec | 90%+ faster |
| HMR speed | 2-5 sec | < 500ms | 90%+ faster |
| Build time | 60-90 sec | 10-15 sec | 85% faster |
| Bundle size | 159.5 KB | 120-130 KB | 20% smaller |

---

## Phase 3C: Production Hardening

**Agent:** `devops-expert`
**Duration:** 2-3 hours
**Goal:** Production-ready Docker + nginx setup for Vite

### Tasks

#### 1. Update `frontend/Dockerfile` for Vite

**Changes needed:**

1. **Development stage:** Change `CMD ["npm", "start"]` → `CMD ["npm", "run", "dev"]`
2. **Builder stage:** Build output is now `dist/` not `build/`
3. **Production stage:** Copy from `dist/` not `build/`

**Updated Dockerfile sections:**

```dockerfile
# =========================================
# Stage 4: Development Server
# =========================================
FROM node:22-slim AS development

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

COPY . .

EXPOSE 3000

# Changed: npm start → npm run dev for Vite
CMD ["npm", "run", "dev"]

# =========================================
# Stage 5: Production Server
# =========================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

USER nginx

COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Changed: /app/build → /app/dist (Vite output)
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]

CMD ["nginx", "-g", "daemon off;"]
```

---

#### 2. Enhance `frontend/nginx.conf`

**Full production-ready configuration:**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent"';

    access_log /dev/stdout main;
    error_log /dev/stderr warn;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json
        image/svg+xml
        application/wasm;

    # Brotli compression (if module available)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    server {
        listen 8080;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security Headers
        # Stricter CSP for Vite (no unsafe-inline/unsafe-eval needed)
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: http://localhost:8000 http://api:8000; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()" always;

        # HSTS for HTTPS (uncomment in production with SSL)
        # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

        # React Router fallback - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets with aggressive caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf|wasm)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # index.html - no cache (always fetch latest)
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            expires 0;
        }

        # Favicon
        location = /favicon.ico {
            log_not_found off;
            access_log off;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**Key improvements:**
1. **Stricter CSP:** Removed `unsafe-inline` and `unsafe-eval` (Vite doesn't need them)
2. **Static asset caching:** 1 year cache for JS/CSS/images
3. **index.html no-cache:** Always fetch latest version
4. **Performance:** sendfile, tcp optimizations
5. **Health check:** `/health` endpoint for monitoring

---

#### 3. Update `compose.yml` for Vite

**Update dashboard service:**

```yaml
  dashboard:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: task-tracker-dashboard
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped
    environment:
      # Vite environment variables (renamed from REACT_APP_*)
      - VITE_API_BASE_URL=${DASHBOARD_API_BASE_URL:-http://localhost:8000}
      - VITE_WS_URL=${DASHBOARD_WS_URL:-ws://localhost/ws}
      - VITE_WS_HOST=${DASHBOARD_WS_HOST:-localhost:8000}
      - VITE_WS_PATH=${DASHBOARD_WS_PATH:-/ws}
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
          ignore:
            - "**/__pycache__"
            - "**/node_modules"
            - "**/.git"
            - "**/*.test.tsx"
            - "**/*.test.ts"
            - "**/__tests__"
            - "**/coverage"
            - "**/.vscode"
        - action: sync
          path: ./frontend/public
          target: /app/public
          ignore:
            - "**/node_modules"
        - action: rebuild
          path: ./frontend/package.json
        - action: rebuild
          path: ./frontend/vite.config.ts
    # Health check
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Changes:**
- Environment variables renamed: `REACT_APP_*` → `VITE_*`
- Added `vite.config.ts` to rebuild triggers
- Added healthcheck for dashboard service
- Removed polling env vars (Vite handles this internally)

---

#### 4. Create Environment Validation Script

**File:** `/home/maks/projects/task-tracker/scripts/validate-frontend-env.sh`

```bash
#!/bin/bash
# Frontend environment validation script

set -e

echo "🔍 Validating frontend environment variables..."

# Required variables
REQUIRED_VARS=(
  "VITE_API_BASE_URL"
  "VITE_WS_URL"
)

# Check each required variable
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  else
    echo "✅ $var is set"
  fi
done

# Report missing variables
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo ""
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Please check your .env file or environment configuration."
  exit 1
fi

echo ""
echo "✅ All required environment variables are set!"
```

**Make executable:**
```bash
chmod +x scripts/validate-frontend-env.sh
```

**Usage in Dockerfile (optional):**
```dockerfile
# In development stage, before CMD
RUN chmod +x /app/scripts/validate-frontend-env.sh
CMD ["/app/scripts/validate-frontend-env.sh && npm run dev"]
```

---

### Phase 3C Deliverables

- ✅ Updated `frontend/Dockerfile` (Vite-compatible)
- ✅ Enhanced `frontend/nginx.conf` (stricter CSP, caching, health check)
- ✅ Updated `compose.yml` (Vite env vars, healthchecks)
- ✅ Created `scripts/validate-frontend-env.sh`
- ✅ Verified production build works
- ✅ Verified development hot reload works

### Phase 3C Expected Results

| Feature | Status |
|---------|--------|
| Production nginx on port 8080 | ✅ |
| Stricter CSP (no unsafe-inline) | ✅ |
| Static asset caching (1 year) | ✅ |
| Health check endpoints | ✅ |
| Environment validation | ✅ |
| Non-root container | ✅ |

---

## Integration & Testing

**Duration:** 1-2 hours
**Responsible:** Both agents coordinate

### Testing Procedure

#### 1. Local Build Test

```bash
cd frontend

# Clean install
rm -rf node_modules package-lock.json
npm install

# Development build
npm run dev
# Expected: Starts in < 5 seconds
# Check: http://localhost:3000 works

# Production build
npm run build
# Expected: Completes in < 15 seconds
# Check: dist/ folder created with optimized assets

# Preview production
npm run preview
# Check: http://localhost:3000 serves static files
```

---

#### 2. Docker Build Test

```bash
# Build production image
docker build --target production -t task-tracker-frontend:vite ./frontend

# Expected output:
# - Build completes in < 3 minutes (cold)
# - Build completes in < 1 minute (warm cache)
# - Final image size < 100 MB

# Verify image size
docker images | grep task-tracker-frontend
# Should show ~50-80 MB for production stage
```

---

#### 3. Docker Compose Full Stack Test

```bash
# Stop existing services
docker compose down

# Build dashboard
docker compose build dashboard

# Start all services
docker compose up -d

# Check logs
docker compose logs -f dashboard

# Expected:
# - Dashboard starts in < 10 seconds
# - No errors in logs
# - All services healthy
```

---

#### 4. Verification Checklist

**Development Mode:**
- [ ] `docker compose up dashboard` starts successfully
- [ ] Hot reload works (edit `src/App.tsx` → instant update)
- [ ] All routes accessible (/, /messages, /tasks, etc.)
- [ ] API calls work (check Network tab)
- [ ] WebSocket connection stable (/ws endpoint)
- [ ] Environment variables correct (`import.meta.env.VITE_*`)
- [ ] No console errors
- [ ] Dev tools work (React DevTools, Redux DevTools)

**Production Mode:**
- [ ] Production build completes without errors
- [ ] `docker run -p 8080:8080 task-tracker-frontend:vite` works
- [ ] All routes serve correctly (nginx fallback works)
- [ ] Static assets cached (check response headers)
- [ ] Security headers present (`curl -I http://localhost:8080`)
- [ ] Health check responds (`curl http://localhost:8080/health`)
- [ ] Bundle size optimized (< 150 KB gzipped)
- [ ] Lighthouse score > 90

**Security:**
- [ ] CSP header present and strict
- [ ] X-Frame-Options present
- [ ] X-Content-Type-Options present
- [ ] No inline scripts (CSP allows)
- [ ] HTTPS ready (HSTS commented, ready to enable)

**Performance:**
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

---

#### 5. Performance Benchmarks

```bash
# Measure build time
time npm run build

# Measure dev start time
time npm run dev

# Check bundle size
du -sh dist/

# Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

**Expected metrics:**
- Build time: < 15 seconds
- Dev start: < 3 seconds
- Bundle size: < 500 KB total, < 150 KB gzipped
- Lighthouse: Performance > 90, Accessibility > 90

---

## Files Modified/Created

### Phase 3A (devops-expert)

**Created:**
- `frontend/.dockerignore`

**Modified:**
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `nginx/nginx.conf`
- `compose.yml`

### Phase 3B (react-frontend-architect)

**Created:**
- `frontend/vite.config.ts`
- `frontend/tsconfig.node.json`
- `frontend/src/vite-env.d.ts`
- `frontend/.env.development`
- `frontend/.env.production`

**Modified:**
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/.env.example`
- All files with `process.env.REACT_APP_*` (search and replace)

**Moved:**
- `frontend/public/index.html` → `frontend/index.html`

**Deleted:**
- `frontend/craco.config.js`
- `frontend/public/index.html` (old location)

### Phase 3C (devops-expert)

**Created:**
- `scripts/validate-frontend-env.sh`

**Modified:**
- `frontend/Dockerfile` (Vite compatibility)
- `frontend/nginx.conf` (enhanced)
- `compose.yml` (Vite env vars, healthchecks)

**Total:**
- **Created:** 7 new files
- **Modified:** 11 existing files
- **Deleted:** 2 obsolete files

---

## Performance Metrics

### Build Performance

| Metric | Before (CRA) | After Phase 3A | After Phase 3B | After Phase 3C | Total Improvement |
|--------|--------------|----------------|----------------|----------------|-------------------|
| **Cold build time** | 5-8 min | 2-3 min | 10-15 sec | 10-15 sec | **-95%** |
| **Warm cache build** | 2-3 min | 30-60 sec | 5-10 sec | 5-10 sec | **-97%** |
| **Code change rebuild** | 1-2 min | 30-40 sec | 3-5 sec | 3-5 sec | **-97%** |
| **Dev server start** | 20-30 sec | 15-20 sec | < 3 sec | < 3 sec | **-90%** |
| **HMR speed** | 2-5 sec | 1-3 sec | < 500ms | < 500ms | **-90%** |

### Image Sizes

| Image | Before | After Phase 3A | After Phase 3B/C | Improvement |
|-------|--------|----------------|------------------|-------------|
| **Production** | 1.77 GB | 50-80 MB | 40-60 MB | **-97%** |
| **Development** | 1.77 GB | 600-800 MB | 400-500 MB | **-72%** |
| **Build context** | ~200 MB | ~5-10 MB | ~5-10 MB | **-95%** |

### Bundle Optimization

| Metric | Before (CRA) | After (Vite) | Improvement |
|--------|--------------|--------------|-------------|
| **Main bundle (gzipped)** | 159.5 KB | 120-130 KB | **-20%** |
| **Total bundle size** | ~700 KB | ~400-500 KB | **-30%** |
| **Number of chunks** | 18 | 15-20 | Optimized splitting |
| **Largest chunk** | 159.5 KB | ~80 KB | **-50%** |

### Security Improvements

| Feature | Before | After | Status |
|---------|--------|-------|--------|
| **Security headers** | 0 | 6 | ✅ |
| **CSP strictness** | None | Strict (no unsafe-*) | ✅ |
| **Non-root container** | ❌ (root) | ✅ (nginx user) | ✅ |
| **Unprivileged port** | ❌ (80) | ✅ (8080) | ✅ |
| **Health checks** | ❌ | ✅ | ✅ |

---

## Risk Assessment

### High Risk Items

#### 1. Vite Migration Breaking Changes
**Risk:** Imports or build configuration break
**Probability:** Medium
**Impact:** High (application won't build)

**Mitigation:**
- Feature branch: `feature/vite-migration`
- Incremental testing after each step
- Comprehensive verification checklist
- TypeScript strict mode catches issues early

**Rollback Plan:**
```bash
git checkout main
docker compose down
docker compose up -d dashboard
```

---

#### 2. Node 22 Compatibility
**Risk:** Some npm packages incompatible with Node 22
**Probability:** Low
**Impact:** Medium (build fails)

**Mitigation:**
- React 18 and all current dependencies fully compatible
- Can fallback to Node 20 LTS if needed
- Test build before committing

**Fallback:**
```dockerfile
# In Dockerfile, change:
FROM node:22-slim
# To:
FROM node:20-slim
```

---

### Medium Risk Items

#### 3. CSP Headers Too Strict
**Risk:** CSP blocks legitimate scripts/styles
**Probability:** Medium
**Impact:** Low (UI broken, but easily fixed)

**Mitigation:**
- Start permissive, tighten incrementally
- Monitor browser console for CSP violations
- Test all features after applying headers

**Fix:**
```nginx
# Temporarily relax CSP if needed
add_header Content-Security-Policy "default-src 'self' 'unsafe-inline';" always;
```

---

#### 4. Docker Compose Watch Issues
**Risk:** Hot reload doesn't work in Docker
**Probability:** Low
**Impact:** Low (fallback to manual restart)

**Mitigation:**
- Polling enabled in Vite config
- Ignore patterns prevent sync issues
- Fallback to bind mounts if watch fails

**Fallback:**
```yaml
# In compose.yml, use bind mount instead of watch:
volumes:
  - ./frontend/src:/app/src
```

---

### Low Risk Items

#### 5. Port Change (80 → 8080)
**Risk:** Hardcoded port references break
**Probability:** Very Low
**Impact:** Very Low (configuration change)

**Mitigation:**
- Port mapping in compose.yml transparent to users
- All references use environment variables

---

#### 6. Environment Variable Migration
**Risk:** Missed REACT_APP_* references
**Probability:** Low
**Impact:** Low (runtime errors)

**Mitigation:**
- Global search and replace
- TypeScript types for env vars
- Validation script checks required vars

**Detection:**
```bash
# Find any remaining REACT_APP_ references
grep -r "REACT_APP_" frontend/src/
```

---

## Timeline

### Day 1: Phase 3A (3-4 hours)

**Morning (2 hours):**
- [ ] devops-expert executes Docker optimizations
- [ ] Create `.dockerignore`
- [ ] Optimize `Dockerfile` (Node 22, cache mounts)
- [ ] Add security headers to nginx configs

**Afternoon (1-2 hours):**
- [ ] Update Docker Compose Watch
- [ ] Test build times (before/after)
- [ ] Test image sizes (before/after)
- [ ] Verify security headers (`curl -I`)
- [ ] Commit: "feat: optimize Docker infrastructure (Node 22, cache, security)"

**Expected State:**
- ✅ Build time reduced 60-80%
- ✅ Image size reduced 95%
- ✅ 6 security headers active
- ✅ No breaking changes

---

### Day 2: Phase 3B (4-6 hours)

**Morning (2-3 hours):**
- [ ] react-frontend-architect executes Vite migration
- [ ] Install Vite, remove CRA dependencies
- [ ] Create `vite.config.ts`
- [ ] Move `index.html` to root
- [ ] Migrate environment variables (REACT_APP_* → VITE_*)

**Afternoon (2-3 hours):**
- [ ] Update `package.json` scripts
- [ ] Fix TypeScript imports
- [ ] Test development server (`npm run dev`)
- [ ] Test production build (`npm run build`)
- [ ] Verify all routes work
- [ ] Commit: "feat: migrate from CRA to Vite"

**Expected State:**
- ✅ HMR instant (< 500ms)
- ✅ Dev start < 3 seconds
- ✅ Build time -70%
- ✅ Bundle size -20%

---

### Day 3: Phase 3C (2-3 hours)

**Morning (1-2 hours):**
- [ ] devops-expert executes production hardening
- [ ] Update `Dockerfile` for Vite (dist/ output)
- [ ] Enhance nginx configuration (caching, compression)
- [ ] Update `compose.yml` (Vite env vars, healthchecks)
- [ ] Create environment validation script

**Afternoon (1 hour):**
- [ ] Test production Docker build
- [ ] Verify nginx serves static files correctly
- [ ] Test healthchecks
- [ ] Commit: "feat: harden production Docker setup"

**Expected State:**
- ✅ Production-ready Dockerfile
- ✅ Optimized nginx caching
- ✅ Healthchecks active
- ✅ All security features enabled

---

### Day 3-4: Integration Testing (1-2 hours)

**Final Testing:**
- [ ] Full Docker Compose stack test
- [ ] Development mode verification
- [ ] Production mode verification
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Documentation updates
- [ ] Commit: "docs: update Docker setup documentation"

**Final Deliverables:**
- ✅ All phases complete
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Ready for production deployment

---

## Success Criteria

### Phase 3A Success Criteria

- ✅ Docker build time < 1 minute (warm cache)
- ✅ Production image size < 100 MB
- ✅ 6 security headers present in nginx responses
- ✅ Build completes with 0 errors
- ✅ Node version is 22 LTS (Debian-slim)
- ✅ Cache mounts working (verify with `docker buildx du`)
- ✅ No breaking changes to existing functionality

**Verification command:**
```bash
time docker build --target production -t test ./frontend
docker images | grep test
curl -I http://localhost
```

---

### Phase 3B Success Criteria

- ✅ `npm run dev` starts in < 5 seconds
- ✅ HMR updates in < 1 second
- ✅ `npm run build` completes without errors
- ✅ `dist/` folder contains optimized assets
- ✅ All routes work (test /, /messages, /tasks, /analytics)
- ✅ Environment variables accessible via `import.meta.env`
- ✅ TypeScript compilation: 0 errors
- ✅ All imports resolve correctly
- ✅ Bundle size < 150 KB gzipped main chunk

**Verification commands:**
```bash
npm run dev # Should start < 5s
npm run build # Should complete < 15s
npm run preview # Should serve correctly
```

---

### Phase 3C Success Criteria

- ✅ Production container runs on port 8080
- ✅ Healthcheck passes (`/health` returns 200)
- ✅ Static assets cached (1 year expiry)
- ✅ index.html not cached (no-cache header)
- ✅ CSP header strict (no unsafe-inline/unsafe-eval)
- ✅ All 6 security headers present
- ✅ nginx serves Vite build from `dist/` folder
- ✅ Environment validation script works

**Verification commands:**
```bash
docker run --rm -p 8080:8080 task-tracker-frontend:vite
curl -I http://localhost:8080
curl http://localhost:8080/health
```

---

### Integration Success Criteria

**Full Stack Integration:**
- ✅ `docker compose up` starts all services successfully
- ✅ Dashboard accessible at http://localhost
- ✅ API calls work (dashboard → api)
- ✅ WebSocket connection stable (/ws endpoint)
- ✅ Hot reload works in development
- ✅ Production build deployable
- ✅ All routes accessible
- ✅ No console errors in browser
- ✅ React DevTools work

**Performance Targets:**
- ✅ Build time: < 15 seconds (production)
- ✅ Dev start: < 3 seconds
- ✅ HMR: < 500ms
- ✅ First Contentful Paint: < 1.5s
- ✅ Time to Interactive: < 3s
- ✅ Lighthouse Performance: > 90

**Security Targets:**
- ✅ All 6 security headers present
- ✅ CSP violations: 0
- ✅ Non-root container
- ✅ No exposed secrets
- ✅ HTTPS ready

---

## Post-Implementation

### Documentation Updates

**Files to update:**

1. **`frontend/CLAUDE.md`**
   - Add Vite migration notes
   - Update development commands
   - Document new environment variables
   - Add troubleshooting section

2. **`frontend/README.md`** (create if missing)
   - Quick start guide with Vite
   - Development workflow
   - Build commands
   - Docker commands

3. **`CLAUDE.md`** (root)
   - Update frontend stack (Vite instead of CRA)
   - Update Docker commands
   - Add performance metrics

4. **`frontend/FRONTEND_ASSESSMENT.md`**
   - Update Phase 3 status to "COMPLETED"
   - Add new metrics
   - Update Health Score (8.5 → 9.5)

---

### Team Training

**Key points to communicate:**

1. **New commands:**
   ```bash
   npm run dev      # Start Vite dev server (was: npm start)
   npm run build    # Build for production
   npm run preview  # Preview production build
   ```

2. **Environment variables:**
   - `REACT_APP_*` → `VITE_*`
   - Use `import.meta.env.VITE_*` instead of `process.env.REACT_APP_*`

3. **Docker changes:**
   - Production nginx on port 8080 (not 80)
   - Build output in `dist/` folder (not `build/`)
   - Faster builds with cache mounts

4. **Hot reload:**
   - Now instant (< 500ms)
   - No need for manual refresh

---

### Monitoring

**Metrics to track:**

1. **Build times:**
   - Track CI/CD pipeline build duration
   - Monitor cache hit rates
   - Alert if build time > 30 seconds

2. **Bundle sizes:**
   - Monitor main chunk size (alert if > 200 KB)
   - Track total bundle size
   - Review dependency additions

3. **Performance:**
   - Lighthouse scores (weekly)
   - Core Web Vitals (production)
   - Error rates (Sentry)

4. **Security:**
   - CSP violation reports
   - Security header compliance
   - Dependency vulnerabilities (weekly scan)

---

### Next Steps (Future Improvements)

**Phase 4 (Optional - Future):**

1. **Testing improvements:**
   - Expand test coverage to 30-40%
   - Add E2E tests with Playwright
   - Visual regression testing

2. **Performance optimizations:**
   - Implement route-based code splitting with preloading
   - Add service worker for offline support
   - Optimize images with next-gen formats (WebP, AVIF)

3. **Developer experience:**
   - Add Storybook for component development
   - Setup pre-commit hooks (husky + lint-staged)
   - Add bundle analyzer to CI/CD

4. **Security enhancements:**
   - Implement Subresource Integrity (SRI)
   - Add HTTPS/TLS in development
   - Setup SAST scanning (CodeQL)

5. **Infrastructure:**
   - Multi-arch Docker images (amd64, arm64)
   - Kubernetes deployment manifests
   - CI/CD optimization with build cache

---

## Appendix

### Context7 Research Topics

**For devops-expert:**
- `/docker/docs` topic: "multi-stage nodejs cache optimization"
- `/docker/docs` topic: "nginx security headers production"
- Web search: "Node.js 22 vs 18 LTS Docker 2025"
- Web search: "Alpine vs Debian Docker performance"

**For react-frontend-architect:**
- `/vitejs/vite` topic: "migration from Create React App"
- `/vitejs/vite` topic: "production build optimization"
- Web search: "CRA to Vite migration guide 2025"
- Web search: "Vite environment variables best practices"

---

### Useful Commands

**Docker:**
```bash
# Build with cache
docker build --target production -t frontend:vite ./frontend

# Build without cache
docker build --no-cache --target production ./frontend

# Check image size
docker images | grep frontend

# Inspect build cache
docker buildx du

# Clean build cache
docker builder prune
```

**Development:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check bundle size
npm run build && du -sh dist/

# Analyze bundle
npx vite-bundle-visualizer
```

**Testing:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Docker Compose:**
```bash
# Start all services
docker compose up -d

# Start with watch
docker compose up --watch

# Rebuild dashboard
docker compose build dashboard

# View logs
docker compose logs -f dashboard

# Stop all
docker compose down

# Clean everything
docker compose down -v --rmi all
```

---

### Troubleshooting Guide

**Issue: Build fails with "npm: not found"**
```bash
# Solution: Rebuild without cache
docker build --no-cache ./frontend
```

**Issue: Hot reload not working in Docker**
```bash
# Solution: Enable polling in vite.config.ts
server: {
  watch: {
    usePolling: true
  }
}
```

**Issue: CSP blocking inline scripts**
```bash
# Solution: Check browser console for violations
# Add 'unsafe-inline' temporarily if needed
```

**Issue: Environment variables not accessible**
```bash
# Solution: Ensure variables start with VITE_
# Check .env.development file exists
# Restart dev server after changing .env
```

**Issue: Build succeeds but app shows blank page**
```bash
# Solution: Check browser console for errors
# Verify base URL in vite.config.ts
# Check nginx try_files configuration
```

---

## Conclusion

This comprehensive plan modernizes the frontend Docker infrastructure through 3 sequential phases, achieving:

- **95% faster builds** (5-8min → 10-15sec)
- **97% smaller images** (1.77GB → 40-60MB)
- **90% faster development** (HMR < 500ms)
- **20% smaller bundles** (159KB → 120KB)
- **Full security hardening** (6 security headers)
- **Production-ready setup** (healthchecks, monitoring)

All changes are backwards compatible with clear rollback procedures. The sequential approach minimizes risk while delivering maximum value.

**Total effort:** 2-3 days
**Return on investment:** Permanent 10-20x improvement in developer productivity and deployment efficiency

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Next Review:** After Phase 3C completion