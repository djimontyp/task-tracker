FROM python:3.12-slim

WORKDIR /app

# Встановлення uv
RUN pip install uv

# Копіювання файлів проекту
COPY pyproject.toml uv.lock ./
COPY src/ ./src/

# Встановлення залежностей
RUN uv sync

# Встановлення додаткових залежностей для worker
RUN uv pip install taskiq-nats

# Команда за замовчуванням
CMD ["uv", "run", "taskiq", "worker", "src.taskiq_config:nats_broker", "src.worker"]
