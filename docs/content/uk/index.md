# Документація Task Tracker

## Ключові можливості

- **Навігація клавіатурою**: Повна доступність клавіатури з інтуїтивними скороченнями в усьому додатку
- **Доступність на першому місці**: Побудовано на Radix UI примітивах з ARIA атрибутами та підтримкою screen reader
- **Оновлення в реальному часі**: WebSocket інтеграція для синхронізації даних в прямому ефірі

Див. [посібник з клавіатурної навігації](guides/keyboard-navigation.md) для повного списку клавіатурних скорочень та функцій доступності.

## Технологічний стек

- Backend: FastAPI, SQLModel, SQLAlchemy, Alembic, AsyncPG, TaskIQ, TaskIQ NATS
- Інфраструктура: PostgreSQL, NATS, Docker Compose, міграції Alembic
- Автентифікація та безпека: Pydantic Settings, Cryptography, Email Validator
- Асинхронність і повідомлення: AsyncIO, TaskIQ, TaskIQ NATS, Telethon, Aiogram
- Мережа та інтеграції: HTTPX, Uvicorn, Socket.IO Client
- Тестування та QA: Pytest, Pytest-Asyncio, Aiosqlite
- Інструменти: Ruff, Mypy, UV, Just, Alembic CLI
- Frontend: React, Vite, TypeScript, Tailwind CSS, Radix UI, shadcn/ui, React Query, React Hook Form, Zod, Recharts
