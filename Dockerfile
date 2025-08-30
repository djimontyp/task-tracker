FROM python:3.12-slim

WORKDIR /app

# Встановлення uv
RUN pip install uv

# Копіювання файлів проекту
COPY pyproject.toml uv.lock ./
COPY src/ ./src/

# Встановлення залежностей
RUN uv sync

# Команда за замовчуванням
CMD ["uv", "run", "taskiq", "worker", "src.taskiq_config:nats_broker", "src.worker"]
