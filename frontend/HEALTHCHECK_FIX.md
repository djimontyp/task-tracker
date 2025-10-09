# Healthcheck Fix for Dashboard Container

## Issue
The dashboard container healthcheck is failing because `wget` is not available in the `node:22-slim` base image.

**Current Error:**
```
OCI runtime exec failed: exec failed: unable to start container process:
exec: "wget": executable file not found in $PATH
```

## Solution

Replace the wget-based healthcheck with a node-based healthcheck in `/home/maks/projects/task-tracker/compose.yml`.

### Current Configuration (line 131-136)
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Option 1: Node-based Check (Recommended)
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Option 2: Use curl (if available)
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Option 3: Install wget in Dockerfile
Add to the development stage in `/home/maks/projects/task-tracker/frontend/Dockerfile`:

```dockerfile
FROM node:22-slim AS development

WORKDIR /app

# Install wget for healthcheck
RUN apt-get update && \
    apt-get install -y wget && \
    rm -rf /var/lib/apt/lists/*

# ... rest of the stage
```

**Note:** This increases image size by ~10-15MB.

## Recommendation

**Use Option 1 (Node-based check)** because:
- ✅ No additional dependencies
- ✅ No image size increase
- ✅ Works in both development and production
- ✅ Node is already available in the container

## Apply the Fix

```bash
# Edit compose.yml
vim /home/maks/projects/task-tracker/compose.yml

# Find line 132 and replace with Option 1

# Rebuild and restart
docker compose build dashboard
docker compose up -d dashboard

# Verify healthcheck
docker ps --filter name=task-tracker-dashboard
# Should show "healthy" status after 40 seconds
```

## Verification

After applying the fix, wait 40 seconds (start_period) and check:

```bash
# Check container status
docker ps --filter name=task-tracker-dashboard --format "{{.Names}}: {{.Status}}"

# Should output:
# task-tracker-dashboard: Up X minutes (healthy)
```

## Production Considerations

For production deployment, also consider:

1. **Stricter healthcheck intervals:**
   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
     interval: 15s      # Check more frequently
     timeout: 5s        # Shorter timeout
     retries: 3
     start_period: 30s  # Shorter startup grace period
   ```

2. **Different healthcheck for production stage:**
   - Production uses nginx on port 8080
   - Already has wget available
   - Current healthcheck in Dockerfile works correctly

## Related Files

- `/home/maks/projects/task-tracker/compose.yml` - Main fix location
- `/home/maks/projects/task-tracker/frontend/Dockerfile` - Production healthcheck (working)
- `/home/maks/projects/task-tracker/frontend/TEST_REPORT.md` - Full test report

---

**Priority:** High
**Effort:** 5 minutes
**Impact:** Fixes container health monitoring
