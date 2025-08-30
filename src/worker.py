"""
Worker для обробки завдань TaskIQ з використанням NATS
"""

from src.taskiq_config import nats_broker


@nats_broker.task
async def process_message(message: str) -> str:
    """Приклад функції для обробки повідомлень"""
    print(f"Обробка повідомлення: {message}")
    # Тут буде реалізація обробки повідомлення
    return f"Оброблено: {message}"
