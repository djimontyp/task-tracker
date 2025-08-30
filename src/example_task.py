"""
Приклад використання TaskIQ з NATS
"""

import asyncio
from src.worker import process_message


async def send_test_task():
    """Надіслати тестове завдання"""
    # Надсилання тестового завдання
    task = await process_message.kiq("Тестове повідомлення")
    print(f"Надіслано завдання з ID: {task.task_id}")
    
    # Очікування результату
    result = await task.wait_result()
    print(f"Результат: {result.return_value}")


if __name__ == "__main__":
    asyncio.run(send_test_task())
