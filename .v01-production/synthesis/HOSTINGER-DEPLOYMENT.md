# Hostinger VPS Deployment Strategy (Revised)

**Target Environment**: Hostinger VPS
**Resources**: 2 CPU cores, 8GB RAM (~6GB доступно після system overhead)
**Current Stack**: PostgreSQL + NATS (JetStream) + FastAPI + TaskIQ + React + Nginx

---

## Executive Summary

**Вердикт**: ✅ Task Tracker **БЕЗ ПРОБЛЕМ працює** на Hostinger VPS з 2 CPU / 6GB RAM

**Реальне використання пам'яті** (виміряно):

### Development (поточне)
```
postgres:  28MB   / 2GB    (1.4%)
nats:      11MB   / 512MB  (2.2%)
worker:    296MB  / 2GB    (14.5%)
api:       665MB  / 1GB    (65%)
dashboard: 323MB  / 512MB  (63% - Node.js dev server)
nginx:     2.8MB  / 256MB  (1%)
──────────────────────────────────
TOTAL:     ~1.3GB (development)
```

### Production (з external LLM API, БЕЗ dashboard container)
```
postgres:  ~300MB  (з даними під навантаженням)
nats:      ~50MB   (JetStream file storage)
worker:    ~600MB  (external LLM API calls)
api:       ~800MB  (single worker)
nginx:     ~20MB   (serve static frontend - НЕ окремий контейнер)
──────────────────────────────────
TOTAL:     ~1.8GB базово (4 контейнери)
PEAK:      ~2.5GB під навантаженням (41% з 6GB) ✅
FREE:      ~3.5GB safety margin ✅

Note: Dashboard = static files у nginx, НЕ окремий Node.js container
```

**Критичні висновки**:
- ✅ NATS JetStream вже налаштований (`--jetstream` flag)
- ✅ PostgreSQL memory limit 2GB достатній
- ✅ Поточні resource limits добре збалансовані
- ✅ **Dashboard у production НЕ контейнер** - статика у nginx (економія 323MB RAM!)
- ✅ External LLM API (OpenAI/Anthropic) замість Ollama
- ⚠️ Monitoring: Logfire (optional, $30-50/month) або self-hosted Prometheus/Grafana (безкоштовно, +200MB RAM)

**Змін потрібно мінімум**:
1. Frontend build на CI/CD або локально перед deploy ✅
2. External LLM API налаштування ✅
3. **Видалити dashboard service** з docker-compose.production.yml ✅
4. Nginx serve static files з `/usr/share/nginx/html` ✅
5. (Optional) Додати Logfire або Prometheus для monitoring

---

## Resource Analysis

### Поточна конфігурація (compose.yml) ✅ ДОБРА

**Resource Limits** (вже налаштовано):
```yaml
postgres:
  limits: 2GB CPU 2.0
  reservations: 512MB CPU 0.5

nats:
  limits: 512MB CPU 0.5
  reservations: 64MB CPU 0.1
  command: ["--jetstream", "--http_port", "8222"]  # ✅ JetStream enabled

worker:
  limits: 2GB CPU 2.0
  reservations: 512MB CPU 0.5

api:
  limits: 1GB CPU 1.0
  reservations: 256MB CPU 0.25

dashboard:
  limits: 512MB CPU 0.5
  reservations: 128MB CPU 0.1

nginx:
  limits: 256MB CPU 0.5
  reservations: 64MB CPU 0.1
```

**TOTAL LIMITS**: 6.25GB (perfectly sized для 8GB VPS)

**Оцінка**: ✅ **Чудово збалансовано**, змін не потрібно

---

## Production Deployment Changes

### 1. Frontend Build Strategy

**Option A: CI/CD Build (Recommended)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to VPS
        run: |
          rsync -avz --delete frontend/dist/ \
            ${{ secrets.VPS_USER }}@${{ secrets.VPS_IP }}:/home/app/tasktracker/frontend/dist/
```

**Option B: Local Build перед push**
```bash
# На локальній машині
cd frontend
npm run build

# Commit dist/ (або add до .gitignore і rsync окремо)
git add dist/
git commit -m "build: production frontend build"
git push
```

---

### 2. Nginx Configuration для Production

**File**: `nginx/nginx.conf`

```nginx
http {
    # Existing configuration...

    # Frontend static files (production)
    server {
        listen 80;
        server_name yourdomain.com;

        # Frontend (React static files)
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API proxy
        location /api/ {
            proxy_pass http://api:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket proxy
        location /ws {
            proxy_pass http://api:8000/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check
        location /nginx-health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

### 3. Docker Compose Production Override

**File**: `docker-compose.production.yml`

```yaml
# Production overrides
version: '3.8'

services:
  # ❌ REMOVE dashboard service - static files served by nginx
  # Dashboard container НЕ потрібен у production!

  nginx:
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro  # ✅ Static files
    deploy:
      resources:
        limits:
          memory: 128M  # ✅ Serve static + proxy
          cpus: '0.3'

  # API - може бути single worker або multiple
  api:
    environment:
      - WORKERS=${API_WORKERS:-1}  # ✅ Configurable
    command: >
      uvicorn app.main:app
      --host 0.0.0.0
      --port 8000
      --workers ${API_WORKERS:-1}

```

---

### 4. Frontend Dockerfile Multi-Stage

**File**: `frontend/Dockerfile`

```dockerfile
# Development stage (existing)
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage (minimal)
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Використання**:
```bash
# Development
docker compose up  # Uses development target

# Production
docker compose -f compose.yml -f docker-compose.production.yml up
```

---

## External LLM API Configuration

### Environment Variables (.env.production)

```bash
# LLM Provider Configuration
LLM_PROVIDER=openai  # or anthropic

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4o-mini  # ✅ $0.15/$0.60 per 1M tokens

# Anthropic (alternative)
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_DEFAULT_MODEL=claude-3-5-haiku-20241022  # ✅ $1/$5 per 1M tokens

# Ollama (NOT for production VPS - too heavy)
# OLLAMA_BASE_URL=http://localhost:11434  # ❌ Disabled
```

### Cost Estimation (External LLM)

**Scenario: 200 messages/day**

**OpenAI gpt-4o-mini**:
- Knowledge extraction: ~5,000 tokens per batch (20 messages)
- 10 batches/day × 30 days = 300 batches/month
- Input: 300 × 5,000 = 1.5M tokens
- Output: ~300K tokens
- **Cost**: (1.5M × $0.15) + (0.3M × $0.60) = $0.225 + $0.18 = **$0.40/month**

**Claude Haiku 4.5**:
- Same workload
- **Cost**: (1.5M × $1) + (0.3M × $5) = $1.50 + $1.50 = **$3/month**

**Рекомендація**: gpt-4o-mini для classification/extraction (дешевше, достатньо якості)

---

## Monitoring Strategy (MVP Production)

### Поточний стан (вже є):
- ✅ **Loguru structured logging** - вже налаштовано у backend
- ✅ Logs пишуться у файли + stdout
- ✅ Docker logs доступні через `docker logs`

### MVP Production Monitoring (рекомендовано):

**Phase 1 (Launch)**: Loguru logs + docker logs
- **Cost**: $0
- **RAM**: 0 MB додатково
- **Effort**: 0 хвилин (вже працює)
- **Достатньо для**: 200-500 msg/day, troubleshooting

**Phase 2 (Optional, якщо потрібен LLM tracing)**: Logfire Cloud
- **Cost**: $30-50/month
- **RAM**: 0 MB (cloud service)
- **Setup**: 5 хвилин
- **Коли**: Якщо потрібен detailed LLM performance analysis

```python
# Якщо вирішиш додати Logfire пізніше:
# uv add logfire
# import logfire
# logfire.configure()
# logfire.instrument_fastapi(app)
```

**Рекомендація**: Почати з Loguru (вже є), додати Logfire тільки якщо реально потрібен LLM tracing

---

## Deployment Process

### Step 1: Prepare VPS (One-time Setup)

```bash
# SSH до VPS
ssh user@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt update
sudo apt install docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

### Step 2: Clone Repository

```bash
# На VPS
cd /home/user
git clone https://github.com/yourusername/task-tracker.git
cd task-tracker

# Create .env.production
cp .env.example .env
nano .env

# Edit з production values:
# - DATABASE_URL
# - OPENAI_API_KEY
# - TELEGRAM_BOT_TOKEN
# - APP URLs (your domain)
```

---

### Step 3: Build Frontend (CI або локально)

**Option A: GitHub Actions** (automatic)
- Push до main → CI builds frontend → deploys dist/

**Option B: Local Build**
```bash
# На локальній машині
cd frontend
npm run build

# Deploy dist/ до VPS
rsync -avz --progress dist/ user@vps-ip:/home/user/tasktracker/frontend/dist/
```

---

### Step 4: Start Services

```bash
# На VPS
cd /home/user/tasktracker

# Start production stack
docker compose -f compose.yml -f docker-compose.production.yml up -d

# Check logs
docker compose logs -f

# Verify services
docker compose ps
curl http://localhost:8000/api/health
curl http://localhost/nginx-health
```

---

### Step 5: Run Database Migrations

```bash
# Apply Alembic migrations
docker compose exec api uv run alembic upgrade head

# Verify
docker compose exec postgres psql -U postgres -d tasktracker -c "\dt"
```

---

### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Stop nginx container temporarily
docker compose stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com

# Copy certificates до project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown user:user nginx/ssl/*

# Update nginx.conf для SSL
# (add server block listening на 443 з ssl configuration)

# Restart nginx
docker compose start nginx

# Auto-renewal (crontab)
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet --deploy-hook "docker restart task-tracker-nginx"
```

---

## Monitoring & Optimization

### Resource Monitoring

```bash
# Real-time container stats
docker stats

# Memory usage breakdown
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# System memory
free -h

# Disk usage
df -h
du -sh /var/lib/docker
```

---

### Performance Tuning

#### PostgreSQL Connection Pool

**Current** (backend/app/database.py):
```python
pool_size=20
max_overflow=30
```

**For VPS** (adjust if needed):
```python
pool_size=15        # ✅ Sufficient для VPS workload
max_overflow=20     # ✅ Reasonable overflow
pool_timeout=30
pool_pre_ping=True
pool_recycle=3600   # ✅ Recycle hourly
```

---

#### NATS JetStream Configuration

**Current** (compose.yml):
```yaml
nats:
  command: ["--jetstream", "--http_port", "8222"]
```

**✅ Already optimal** для VPS. JetStream file storage у `/data` volume.

**Verify JetStream**:
```bash
# Check NATS status
curl http://localhost:8222/varz

# Expected: "jetstream": "enabled"
```

---

### Expected Performance

**API Throughput**:
- ~50-100 req/s (single worker)
- p95 latency < 500ms
- Concurrent connections: ~100-200

**Background Tasks**:
- Telegram messages: 200-300/day ✅
- LLM calls: 5-10/minute ✅
- Knowledge extraction: ~10 batches/hour ✅

**Database**:
- Connections: 15-20 concurrent
- Query latency p95 < 100ms (з indexes)
- pgvector search: < 50ms (з HNSW indexes)

---

## Backup Strategy

### 1. PostgreSQL Backups

**Automated daily backup**:
```bash
# Create backup script: ~/backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/postgres
mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U postgres tasktracker \
  | gzip > $BACKUP_DIR/tasktracker_$DATE.sql.gz

# Keep last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup complete: tasktracker_$DATE.sql.gz"
```

**Crontab**:
```bash
crontab -e
# Add: 0 2 * * * ~/backup-db.sh
```

---

### 2. NATS JetStream Backups

**NATS data volume backup**:
```bash
# Backup NATS data
docker compose exec nats tar czf - /data \
  > ~/backups/nats/nats_$(date +%Y%m%d).tar.gz
```

---

### 3. Application Files

```bash
# Backup .env, configs, logs
tar czf ~/backups/app/tasktracker_$(date +%Y%m%d).tar.gz \
  .env nginx/ logs/
```

---

## Scaling Triggers (When to Upgrade)

**Monitor ці metrics**:

### ❌ Upgrade to 4CPU/16GB VPS if:
- Memory usage > 5GB sustained (> 83%)
- CPU usage > 80% sustained
- API latency p95 > 500ms
- Telegram messages > 500/day
- Database connections maxing out

**Cost**: ~$30-50/month (Hostinger VPS upgrade)

---

### ❌ Consider Horizontal Scaling if:
- Messages > 1000/day
- Concurrent users > 200
- Multiple regions needed
- 99.9% uptime SLA required

**Options**:
- Load Balancer + 2x VPS
- Kubernetes (DigitalOcean, AWS ECS)
- Managed services (DB, Redis, NATS Cloud)

---

## Cost Breakdown (Monthly)

### Базова конфігурація (Мінімум)

| Service | Cost | Required? | Notes |
|---------|------|-----------|-------|
| Hostinger VPS (2CPU/8GB) | $15-25 | ✅ YES | Core infrastructure |
| Domain + DNS | $1-2 | ✅ YES | Your domain |
| SSL (Let's Encrypt) | $0 | ✅ FREE | Auto-renewal |
| LLM API (200 msg/day) | $0.40-3 | ✅ YES | gpt-4o-mini або Haiku |
| **BASE TOTAL** | **$16.40-30/month** | | |

---

### Monitoring Options (Optional)

| Option | Monthly Cost | RAM Impact | Best For |
|--------|-------------|------------|----------|
| **Loguru (вже є)** | $0 | 0 MB | ✅ MVP Production (рекомендовано) |
| **Logfire Cloud** | $30-50 | 0 MB | LLM tracing, якщо бюджет є |

**MVP Production**: Loguru вже налаштований, додаткове monitoring не потрібне для початку

---

### Total Cost Scenarios

**Scenario A: Minimal (Recommended початок)**
- VPS + Domain + SSL + LLM API (200 msg/day) + Hybrid monitoring
- **Total**: **$16.40-30/month** ✅
- RAM: ~1.8GB used, 3.5GB free

**Scenario B: With Logfire**
- Same as A + Logfire Cloud
- **Total**: **$46.40-80/month**
- RAM: ~1.8GB used, 3.5GB free (Logfire cloud)

**Scenario C: Self-Hosted Monitoring**
- Same as A + Prometheus + Grafana on VPS
- **Total**: **$16.40-30/month**
- RAM: ~2.3GB used, 3GB free (+512MB для monitoring)

**Scenario D: High Volume (500 msg/day)**
- Base + більше LLM calls
- **Total**: **$17-38/month** (залежно від LLM usage)

---

### Scaling Cost Projections

| Messages/Day | LLM Cost | Monitoring | VPS | Total/Month |
|--------------|----------|------------|-----|-------------|
| 100 | $0.20 | $0 (Hybrid) | $20 | **$21.20** |
| 200 | $0.40 | $0 (Hybrid) | $20 | **$21.40** |
| 500 | $1-3 | $0-30 | $20 | **$22-53** |
| 1000 | $2-6 | $30 (Logfire) | $35 (4CPU/16GB) | **$67-71** |

**Break-even point**: ~500 msg/day = hour to consider 4CPU/16GB VPS upgrade

---

## Troubleshooting

### Problem: High Memory Usage

**Symptoms**: `docker stats` shows containers near limits

**Solution**:
```bash
# Check which service
docker stats --no-stream

# Reduce API workers if needed
# docker-compose.production.yml
api:
  environment:
    - WORKERS=1  # Reduce from 2-4

# Restart
docker compose restart api
```

---

### Problem: PostgreSQL Connection Exhausted

**Symptoms**: API errors `pool exhausted`

**Solution**:
```python
# backend/app/database.py
pool_size=10        # Reduce
max_overflow=15     # Reduce

# Or increase PostgreSQL max_connections
docker compose exec postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 150;"
docker compose restart postgres
```

---

### Problem: NATS JetStream Disk Full

**Symptoms**: Worker errors, NATS logs show disk issues

**Solution**:
```bash
# Check NATS volume size
docker volume inspect task-tracker-nats-data

# Clean old streams (if retention too long)
docker compose exec nats nats stream purge TASKIQ_STREAM --force

# Or increase retention settings in compose.yml
```

---

## Production Checklist

### Pre-Deployment
- [ ] Frontend build готовий (dist/ folder)
- [ ] `.env` налаштовано з production credentials
- [ ] External LLM API key додано
- [ ] Domain DNS налаштовано на VPS IP
- [ ] SSL certificates готові

### Deployment
- [ ] Clone repo на VPS
- [ ] `docker compose up -d` успішно
- [ ] Migrations applied (`alembic upgrade head`)
- [ ] Health endpoints відповідають (200 OK)
- [ ] Telegram webhook налаштований

### Post-Deployment
- [ ] Test Telegram bot functionality
- [ ] Verify WebSocket connections
- [ ] Monitor logs (перші 24h)
- [ ] Setup daily backups (cron)
- [ ] Document rollback procedure

---

## З чого почати? (Actionable Steps)

### Крок 1: Підготовка (на локальній машині, 30 хв)

```bash
# 1. Build frontend
cd frontend
npm run build
# Результат: frontend/dist/ готовий для deploy

# 2. Створити .env.production
cd ..
cp .env.example .env.production
nano .env.production

# Встановити:
# - DATABASE_URL (postgres на VPS буде localhost)
# - TELEGRAM_BOT_TOKEN
# - OPENAI_API_KEY (для external LLM)
# - APP_URL, WEBAPP_URL (ваш домен)

# 3. Commit changes
git add .
git commit -m "prod: prepare for hostinger deployment"
git push
```

---

### Крок 2: VPS Setup (одноразово, 20 хв)

```bash
# SSH до Hostinger VPS
ssh user@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Clone repo
git clone https://github.com/yourusername/task-tracker.git
cd task-tracker

# Copy .env
nano .env  # paste .env.production content

# Copy frontend build (або використати rsync з локальної машини)
```

---

### Крок 3: Deploy (15 хв)

```bash
# На VPS
cd /home/user/task-tracker

# Start services (БЕЗ dashboard container)
docker compose up -d postgres nats api worker nginx

# Check status
docker compose ps

# Run migrations
docker compose exec api uv run alembic upgrade head

# Verify
curl http://localhost:8000/api/health
curl http://localhost/nginx-health
```

---

### Крок 4: SSL + Domain (20 хв)

```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Stop nginx temporarily
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*

# Update nginx.conf для HTTPS (add server block port 443)

# Start nginx
docker compose start nginx

# Test
curl https://yourdomain.com
```

---

### Крок 5: Verify Production (10 хв)

```bash
# 1. Test API
curl https://yourdomain.com/api/health

# 2. Test WebSocket
# Open browser: https://yourdomain.com/dashboard

# 3. Test Telegram bot
# Send message to bot

# 4. Check logs
docker compose logs -f api
docker compose logs -f worker

# 5. Monitor resources
docker stats
```

---

### Крок 6: Backup Setup (10 хв)

```bash
# Create backup script
cat > ~/backup-db.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres tasktracker \
  | gzip > ~/backups/tasktracker_$DATE.sql.gz
find ~/backups -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x ~/backup-db.sh

# Add to cron
crontab -e
# Add: 0 2 * * * ~/backup-db.sh
```

---

## Summary

**Total deployment time**: ~2 години (one-time setup)

**Subsequent deploys**: 5-10 хвилин (git pull + docker compose restart)

**Expected performance**:
- RAM usage: ~1.8GB базово, ~2.5GB peak (41% з 6GB) ✅
- Capacity: 200-300 msg/day комфортно ✅
- Cost: $16-30/month ✅

**Production-ready checklist**:
- ✅ NATS JetStream persistence
- ✅ PostgreSQL backups (daily cron)
- ✅ SSL certificate (Let's Encrypt)
- ✅ External LLM API
- ✅ Dashboard як static files (не Node.js container)
- ✅ Loguru logging (вже налаштовано)

**Next**: Monitor перші 24-48 годин, adjust якщо потрібно (але скоріш за все не потрібно - stack добре збалансований)
