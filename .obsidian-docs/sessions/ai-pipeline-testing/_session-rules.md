# Session Rules: AI Pipeline Testing

## Дата старту
2025-01-06

## GPU & Provider
- 4070 Ti Super
- Ollama провайдер (status: connected)

## Принципи роботи
1. **Координатор НЕ виконує код** - тільки оркестрація агентів
2. **Берегти контекст** - лаконічні звіти (100-150k ліміт)
3. **Паралелізм** - запускати багато агентів одночасно
4. **Маленькі задачі** - не епіки, агенти мають завершувати
5. **Linting обов'язковий** - lint+fix після коду
6. **MCP Tools**: Playwright (браузер), Obsidian (нотатки)

## Tracking
- **Obsidian**: нотатки, рішення, знання (цей файл)
- **Beads Epic**: task-tracker-b0p0

## Goal
Налагодити flow: Telegram → AI agents → Atoms/Topics → Dashboard

## Початковий стан БД
- Messages: 1378
- Atoms: 54
- Topics: 14
- Provider: connected

## Файли з тестовими даними
- `backend/tests/fixtures/scoring_validation.json` - 1000 msgs
- `backend/tests/fixtures/ukrainian_noise_messages.json` - 200 msgs
