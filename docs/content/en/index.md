# Task Tracker Documentation

## Key Features

- **Keyboard Navigation**: Full keyboard accessibility with intuitive shortcuts across the entire application
- **Accessibility First**: Built on Radix UI primitives with ARIA attributes and screen reader support
- **Real-time Updates**: WebSocket integration for live data synchronization

See the [Keyboard Navigation guide](guides/keyboard-navigation.md) for comprehensive keyboard shortcuts and accessibility features.

## Technology Stack

- Backend: FastAPI, SQLModel, SQLAlchemy, Alembic, AsyncPG, TaskIQ, TaskIQ NATS
- Infrastructure: PostgreSQL, NATS, Docker Compose, Alembic migrations
- Authentication & Security: Pydantic Settings, Cryptography, Email Validator
- Async & Messaging: AsyncIO, TaskIQ, TaskIQ NATS, Telethon, Aiogram
- Networking & Integrations: HTTPX, Uvicorn, Socket.IO Client
- Testing & QA: Pytest, Pytest-Asyncio, Aiosqlite
- Tooling: Ruff, Mypy, UV, Just, Alembic CLI
- Frontend: React, Vite, TypeScript, Tailwind CSS, Radix UI, shadcn/ui, React Query, React Hook Form, Zod, Recharts
