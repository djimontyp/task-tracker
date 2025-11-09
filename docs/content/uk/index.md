# Документація Task Tracker

## Ключові можливості

- **Оновлення в реальному часі**: WebSocket інтеграція для синхронізації даних в прямому ефірі
- **Сучасний UI**: Побудовано на Radix UI компонентах з адаптивним дизайном
- **Безпека типів**: Повна підтримка TypeScript на frontend та backend

## Технологічний стек

- Backend: FastAPI, SQLModel, SQLAlchemy, Alembic, AsyncPG, TaskIQ, TaskIQ NATS
- Інфраструктура: PostgreSQL, NATS, Docker Compose, міграції Alembic
- Автентифікація та безпека: Pydantic Settings, Cryptography, Email Validator
- Асинхронність і повідомлення: AsyncIO, TaskIQ, TaskIQ NATS, Telethon, Aiogram
- Мережа та інтеграції: HTTPX, Uvicorn, Socket.IO Client
- Тестування та QA: Pytest, Pytest-Asyncio, Aiosqlite
- Інструменти: Ruff, Mypy, UV, Just, Alembic CLI
- Frontend: React, Vite, TypeScript, Tailwind CSS, Radix UI, shadcn/ui, React Query, React Hook Form, Zod, Recharts
