# Task Tracker (Українська)

Веб-система управління завданнями з обробкою повідомлень у реальному часі та AI-класифікацією задач.

## Швидкий старт

1. **Клонування репозиторію**:
   ```bash
   git clone https://github.com/your-org/task-tracker.git
   cd task-tracker
   ```

2. **Копіювання конфігурації**:
   ```bash
   cp .env.example .env
   # Відредагуйте .env з токеном Telegram bot та іншими налаштуваннями
   ```

3. **Запуск всіх сервісів**:
   ```bash
   just services
   ```

## Огляд архітектури

Task Tracker - сучасна мікросервісна система з шістьма Docker-сервісами:
- **PostgreSQL**: База даних для зберігання повідомлень та задач
- **NATS**: Брокер повідомлень для асинхронної обробки
- **FastAPI Backend**: REST API для управління задачами
- **React Dashboard**: Веб-інтерфейс для відстеження задач у реальному часі
- **Nginx**: Веб-сервер та зворотній проксі
- **TaskIQ Worker**: Фонова обробка задач

## Точки доступу

- **Веб-панель**: http://localhost:3000
- **API**: http://localhost:8000
- **Перевірка здоров'я API**: http://localhost:8000/api/health

## Команди розробки

- `just services-dev`: Запуск сервісів з live-перезавантаженням
- `just test`: Запуск всіх тестів
- `just lint`: Перевірка якості коду
- `just fmt`: Форматування коду

## Поточні API endpoints

- `GET /`: Статус API
- `GET /api/health`: Перевірка здоров'я
- `GET /api/config`: Конфігурація клієнта
- `POST /api/messages`: Створити повідомлення
- `GET /api/messages`: Список повідомлень
- `POST /api/tasks`: Створити задачу
- `GET /api/tasks`: Список задач
- `GET /api/tasks/{id}`: Отримати конкретну задачу
- `PUT /api/tasks/{id}/status`: Оновити статус задачі
- `GET /api/stats`: Статистика задач
- `POST /webhook/telegram`: Telegram webhook
- `WS /ws`: WebSocket оновлення у реальному часі

## Ліцензування

MIT License