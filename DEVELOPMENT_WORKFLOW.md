# Development Workflow Guide

## Overview

This guide covers the complete development workflow for the Task Tracker project, focusing on the modern Docker Compose Watch integration and best practices for efficient development.

---

## Quick Start Development Setup

### Prerequisites

1. **Docker & Docker Compose**: Latest version with Watch support
2. **Python**: 3.12+ for local development
3. **Node.js**: 18+ for frontend development (optional for Docker-only workflow)
4. **uv**: Modern Python package manager

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd task-tracker

# Setup environment
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Start all services in development mode
just services-dev
```

---

## Docker Compose Watch Development

### What is Docker Compose Watch?

Docker Compose Watch enables live file synchronization between your host machine and Docker containers, providing instant feedback during development without manual rebuilds.

### Watch Configuration

The project uses three different watch strategies:

#### 1. **Sync Strategy** (Frontend)
```yaml
# Frontend files sync without restart
- action: sync
  path: ./frontend/src
  target: /app/src
  ignore:
    - "**/__pycache__"
    - "**/node_modules"
```

**Use Case**: CSS, JavaScript, and React component changes
**Behavior**: Files are instantly copied to container, hot reload handles updates

#### 2. **Sync + Restart Strategy** (Backend)
```yaml
# Backend Python files sync with container restart
- action: sync+restart
  path: ./backend/app
  target: /app/app
  ignore:
    - "**/__pycache__"
    - "**/*.pyc"
```

**Use Case**: Python code changes requiring process restart
**Behavior**: Files sync + container restarts to reload Python modules

#### 3. **Rebuild Strategy** (Configuration)
```yaml
# Full container rebuild for major changes
- action: rebuild
  path: ./backend/pyproject.toml
```

**Use Case**: Dependency changes, Dockerfile modifications
**Behavior**: Complete container rebuild and restart

### Development Commands

#### Start Development Environment
```bash
# Start all services with live watching
just services-dev

# Alternative: use Docker Compose directly
docker compose watch
```

#### Service-Specific Development
```bash
# Watch only the API service
just dev api

# Watch only the dashboard
just dev dashboard

# Watch only the worker
just dev worker
```

#### Production Mode (No Watching)
```bash
# Standard production containers
just services
```

### Watch Behavior by Service

| Service | Watch Strategy | File Types | Restart Required |
|---------|---------------|------------|------------------|
| **API** | sync+restart | Python (.py) | Yes |
| **Dashboard** | sync | React/CSS/JS | No (Hot Reload) |
| **Worker** | sync+restart | Python (.py) | Yes |
| **Nginx** | rebuild | Config files | Yes |
| **PostgreSQL** | - | Data only | No |
| **NATS** | - | Config only | No |

---

## Development Workflow Patterns

### 1. Frontend Development Workflow

```bash
# Start development environment
just services-dev

# Edit frontend files
# Changes in ./frontend/src/ are instantly reflected
# React Hot Module Replacement handles updates

# Example workflow:
# 1. Edit src/components/TaskList.tsx
# 2. Save file
# 3. Browser automatically refreshes with changes
# 4. No manual rebuild required
```

**Supported File Types for Hot Reload:**
- **React Components**: `.tsx`, `.jsx`
- **Stylesheets**: `.css`, `.scss`
- **TypeScript**: `.ts`
- **Assets**: Images, fonts (requires refresh)

### 2. Backend API Development Workflow

```bash
# Start development environment
just services-dev

# Edit backend files
# Changes trigger container restart with new code

# Example workflow:
# 1. Edit backend/app/routers.py
# 2. Save file
# 3. Container automatically restarts
# 4. API available with new changes in ~2-3 seconds
```

**Automatic Restart Triggers:**
- **Application Code**: `backend/app/`
- **Core Logic**: `backend/core/`
- **Configuration**: Environment variables

### 3. Database Development Workflow

```bash
# Database migrations during development
just services-dev  # Start environment

# In another terminal:
# Create new migration
uv run alembic revision --autogenerate -m "Add new field"

# Apply migration
uv run alembic upgrade head

# Database changes persist via Docker volumes
```

### 4. Full Stack Development Workflow

```bash
# Typical full-stack feature development:

# 1. Start development environment
just services-dev

# 2. Create new API endpoint
# Edit: backend/app/routers.py
# Result: API container restarts automatically

# 3. Update frontend to use new endpoint
# Edit: frontend/src/services/api.ts
# Result: Frontend hot reloads instantly

# 4. Test integration
# Frontend and backend communicate in real-time
# WebSocket connections maintain state

# 5. Add database changes if needed
# Create migration, apply, containers continue running
```

---

## Local Development (Without Docker)

### Python Backend Local Development

```bash
# Install dependencies
uv sync --all-groups

# Start PostgreSQL and NATS (still via Docker)
docker compose up -d postgres nats

# Run backend locally
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run worker locally (separate terminal)
uv run python -m taskiq worker core.taskiq_config:nats_broker core.worker

# Run bot locally (separate terminal)
uv run python -m app.telegram_bot
```

### Frontend Local Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Frontend runs on http://localhost:3000
# Proxies API requests to backend
```

### Benefits of Local Development

✅ **Faster Iteration**: No container restart overhead
✅ **Better Debugging**: Direct access to debuggers and profilers
✅ **IDE Integration**: Full IntelliSense and breakpoint support
✅ **Resource Efficiency**: Lower CPU/memory usage

### When to Use Local vs Docker Development

| Scenario | Recommendation | Reason |
|----------|---------------|---------|
| **Quick API Changes** | Local | Faster restart, better debugging |
| **Frontend Development** | Local or Docker | Both work well, preference-based |
| **Full Integration Testing** | Docker | Complete system simulation |
| **Database Schema Changes** | Docker | Consistent environment |
| **Multi-service Features** | Docker | Service interaction testing |
| **Production Debugging** | Docker | Environment parity |

---

## File Watching Configuration

### Watched Directories

```
./frontend/src/          → /app/src (Dashboard container)
./backend/app/           → /app/app (API container)
./backend/core/          → /app/core (API + Worker containers)
./compose.yml            → Full rebuild trigger
./backend/Dockerfile     → API/Worker rebuild trigger
```

### Ignored Files

```
**/__pycache__          # Python bytecode
**/*.pyc                # Compiled Python
**/node_modules         # Node.js dependencies
**/.git                 # Git repository data
**/*.log                # Log files
.DS_Store               # macOS system files
.env.local              # Local environment overrides
```

### Performance Optimization

#### File Watching Performance
- **Large Directories**: Use `.dockerignore` to exclude unnecessary files
- **Network Drives**: Avoid watching network-mounted directories
- **File Limits**: Monitor `inotify` limits on Linux systems

#### Container Performance
```bash
# Monitor container resource usage
docker stats

# Check watch synchronization status
docker compose alpha watch --no-up --dry-run
```

---

## Testing During Development

### Automated Testing with Watch

```bash
# Run tests automatically when files change
just services-dev  # In terminal 1

# Run test watcher in terminal 2
cd backend
uv run python -m pytest --watch

# Frontend test watcher in terminal 3
cd frontend
npm run test
```

### Integration Testing Workflow

```bash
# 1. Start full development environment
just services-dev

# 2. Run integration tests
just test

# 3. Modify code, tests re-run automatically
# 4. Services restart/reload as needed
# 5. Test results reflect latest changes
```

### Testing Best Practices

1. **Database State**: Use test database or cleanup between tests
2. **Service Dependencies**: Ensure all services are running for integration tests
3. **Port Conflicts**: Use different ports for test vs development environments
4. **Data Isolation**: Use separate data volumes for testing

---

## Debugging in Development

### Backend Debugging

#### Using pdb (Python Debugger)
```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Attach to container for interactive debugging
docker compose exec api python -c "import pdb; pdb.set_trace()"
```

#### Using IDE Debuggers
```bash
# For PyCharm/VSCode remote debugging
# 1. Start services without the specific container
docker compose up postgres nats dashboard nginx

# 2. Run API locally with debugger attached
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Debugging

#### Browser DevTools
- **React DevTools**: Component inspection and state debugging
- **Network Tab**: API request/response monitoring
- **Console**: Real-time error reporting

#### WebSocket Debugging
```javascript
// Monitor WebSocket connections in browser console
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => console.log('WS:', JSON.parse(event.data));
```

---

## Environment Configuration

### Development Environment Variables

```bash
# .env for development
NODE_ENV=development
REACT_APP_API_URL=http://localhost:8000
DATABASE_URL=postgresql://user:password@localhost:5555/tasktracker
OLLAMA_BASE_URL=http://localhost:11434
TELEGRAM_BOT_TOKEN=your_bot_token_here
LOG_LEVEL=DEBUG
```

### Service-Specific Configuration

#### API Service
```yaml
environment:
  - DEBUG=1
  - RELOAD=1
  - LOG_LEVEL=DEBUG
```

#### Dashboard Service
```yaml
environment:
  - NODE_ENV=development
  - CHOKIDAR_USEPOLLING=true  # For file watching on some systems
```

---

## Performance Monitoring During Development

### Resource Monitoring

```bash
# Monitor Docker resource usage
docker stats

# Monitor disk usage (volumes)
docker system df

# Monitor network usage
docker network ls
```

### Application Performance

```bash
# API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/health

# Database query performance
# Connect to PostgreSQL and use EXPLAIN ANALYZE

# WebSocket connection monitoring
# Use browser Network tab or specialized tools
```

---

## Troubleshooting Development Issues

### Common Docker Watch Issues

#### Files Not Syncing
```bash
# Check watch status
docker compose alpha watch --no-up --dry-run

# Verify file permissions
ls -la ./backend/app/

# Restart watch
docker compose watch --build
```

#### Container Not Restarting
```bash
# Check container logs
docker compose logs api

# Verify sync+restart configuration
cat compose.yml | grep -A 10 "sync+restart"

# Manual restart
docker compose restart api
```

#### Performance Issues
```bash
# Check inotify limits (Linux)
cat /proc/sys/fs/inotify/max_user_watches

# Increase if needed
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U tasktracker -d tasktracker -c "SELECT 1;"

# Reset database
docker compose down
docker volume rm task-tracker_postgres_data
docker compose up -d postgres
```

### Frontend Build Issues

```bash
# Clear build cache
docker compose build dashboard --no-cache

# Check Node.js version in container
docker compose exec dashboard node --version

# Verify file permissions
docker compose exec dashboard ls -la /app/
```

---

## Best Practices

### Development Workflow Best Practices

1. **Start Clean**: Always start with `just services-dev` for consistent state
2. **Monitor Logs**: Keep terminal open with `docker compose logs -f`
3. **Test Early**: Run tests after significant changes
4. **Commit Often**: Small, frequent commits work better with file watching
5. **Resource Cleanup**: Regularly clean up Docker resources

### Code Organization Best Practices

1. **Separation of Concerns**: Keep API logic in routers, business logic in services
2. **Type Safety**: Use TypeScript/Pydantic for type validation
3. **Error Handling**: Comprehensive error handling for better development experience
4. **Documentation**: Keep code documentation up-to-date

### Performance Best Practices

1. **Minimal Rebuilds**: Use appropriate watch strategies for different file types
2. **Resource Limits**: Set container resource limits to prevent system overload
3. **Efficient Queries**: Optimize database queries during development
4. **Caching**: Implement caching where appropriate

This development workflow provides an efficient, modern development experience with fast feedback loops and comprehensive tooling support.