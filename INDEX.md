# Task Tracker - Navigation Index

**AI-powered task classification system** that filters communication noise and automatically generates tasks from signals. Built with FastAPI, React, and PostgreSQL.

---

## Quick Start

**New to the project?** Start here:

- [README.md](./README.md) - Installation, commands, and access points
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and standards
- [NEXT_SESSION_TODO.md](./NEXT_SESSION_TODO.md) - Current priorities and next steps

---

## Architecture Documentation

**System design and technical deep-dives:**

- [OVERVIEW.md](./docs/architecture/OVERVIEW.md) - System architecture, stack, and status (15 min)
- [NOISE_FILTERING.md](./docs/architecture/NOISE_FILTERING.md) - Four-layer filtering and scoring (25 min)
- [ANALYSIS_SYSTEM.md](./docs/architecture/ANALYSIS_SYSTEM.md) - AI analysis pipeline and API (20 min)
- [VECTOR_DATABASE.md](./docs/architecture/VECTOR_DATABASE.md) - Semantic search and RAG (25 min)

**Entry point:** [docs/architecture/README.md](./docs/architecture/README.md) - Reading guide by role

---

## User Documentation

**Product features and workflows:**

- [English Documentation](./docs/content/en/index.md) - Topics, auto-save, event flow
- [Ukrainian Documentation](./docs/content/uk/index.md) - Теми, автозбереження, потік подій

---

## For Different Roles

### New Developers
**Start here:**
1. [README.md](./README.md) - Quick start and service setup
2. [docs/architecture/OVERVIEW.md](./docs/architecture/OVERVIEW.md) - System architecture
3. [CLAUDE.md](./CLAUDE.md) - Code standards and patterns

### Backend Developers
**Focus on:**
1. [docs/architecture/NOISE_FILTERING.md](./docs/architecture/NOISE_FILTERING.md) - Scoring system
2. [docs/architecture/ANALYSIS_SYSTEM.md](./docs/architecture/ANALYSIS_SYSTEM.md) - API and models
3. [docs/architecture/VECTOR_DATABASE.md](./docs/architecture/VECTOR_DATABASE.md) - Embeddings
4. Backend code: `/backend/app/` with type checking (`just typecheck`)

### Frontend Developers
**Focus on:**
1. [README.md](./README.md) - Access points and WebSocket
2. [docs/content/en/event-flow.md](./docs/content/en/event-flow.md) - Real-time updates
3. Frontend code: `/frontend/src/` with live reload (`just services-dev`)

### DevOps Engineers
**Focus on:**
1. [README.md](./README.md) - Docker services and commands
2. [docs/architecture/OVERVIEW.md](./docs/architecture/OVERVIEW.md) - Technology stack
3. Docker setup: `docker-compose.yml` and `justfile` commands

---

## Additional Resources

**Specialized documentation:**

- [System Concepts](./docs/architecture/OVERVIEW.md) - System concepts and architecture
- [Architecture Documentation](./docs/architecture/README.md) - Complete architecture catalog
- Business requirements are covered in [OVERVIEW.md](./docs/architecture/OVERVIEW.md#user-requirements)

---

## Common Commands

See [justfile](./justfile) for all available commands.

---

**Last Updated:** October 18, 2025
