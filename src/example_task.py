"""
Приклад використання TaskIQ з NATS
"""

import asyncio


async def main():
    """Головна функція для відправки прикладного завдання"""
    print("Надсилаємо завдання для обробки повідомлення...")

    # Додаємо невелику затримку для того, щоб NATS встиг запуститися
    await asyncio.sleep(2)

    # Імпортуємо функцію
    from src.worker import process_message

    # Надсилаємо завдання
    task = await process_message.kiq("Приклад повідомлення для обробки")

    # Очікуємо результат
    print("Очікуємо результат обробки...")
    result = await task.wait_result()

    # Виводимо результат
    print(f"Результат: {result.return_value}")


if __name__ == "__main__":
    # Запускаємо асинхронну функцію
    asyncio.run(main())
