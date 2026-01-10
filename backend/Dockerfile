# ============================================================================
# Dependencies Stage: Install dependencies in isolation
# ============================================================================
FROM python:3.12-slim AS dependencies

WORKDIR /app

# Install system dependencies required for package compilation
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies in virtual environment (don't use UV_SYSTEM_PYTHON)
# This creates /app/.venv which will be copied to the application stage
RUN uv sync --locked --no-dev

# ============================================================================
# Application Stage: Copy application code and run
# ============================================================================
FROM python:3.12-slim AS application

WORKDIR /app

# Install runtime dependencies for healthchecks and monitoring
RUN apt-get update && apt-get install -y \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from dependencies stage
COPY --from=dependencies /app/.venv /app/.venv

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy application source code
COPY backend/app ./app
COPY backend/core ./core
COPY backend/alembic ./alembic
COPY backend/fixtures ./fixtures

# Create non-root user for security
RUN groupadd --gid 1001 --system appgroup && \
    useradd --uid 1001 --system --gid appgroup --create-home appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 8000

# Production command with multiple workers (no --reload)
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]