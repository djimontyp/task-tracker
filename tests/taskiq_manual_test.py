#!/usr/bin/env python3
"""Simple test script to verify TaskIQ manual configuration with the project"""

import asyncio
import os
from taskiq_nats import NatsBroker, NATSObjectStoreResultBackend

async def main():
    try:
        print("Створюємо брокер...")
        # Створюємо брокер з правильними параметрами
        broker = NatsBroker(
            servers="nats://localhost:4222",
            queue="test_queue",
            connect_timeout=10,
            drain_timeout=30,
            max_reconnect_attempts=-1,
        )
        
        print("Створюємо бекенд результатів...")
        # Створюємо бекенд результатів
        result_backend = NATSObjectStoreResultBackend(
            servers="nats://localhost:4222",
        )
        
        print("Налаштовуємо брокер з бекендом результатів...")
        # Налаштовуємо брокер з бекендом результатів
        broker = broker.with_result_backend(result_backend)
        
        print("Запускаємо брокер...")
        # Запускаємо брокер
        await broker.startup()
        
        print("Створюємо тестове завдання...")
        # Створюємо тестове завдання
        @broker.task
        async def test_task(message: str) -> str:
            print(f"Обробка повідомлення: {message}")
            return f"Оброблено: {message}"
        
        print("Надсилаємо тестове завдання...")
        # Надсилаємо завдання
        task = await test_task.kiq("Тестове повідомлення")
        
        print("Очікуємо результат...")
        # Очікуємо результат
        result = await task.wait_result()
        
        print(f"Результат: {result.return_value}")
        
        # Перевіряємо результат
        assert result.return_value == "Оброблено: Тестове повідомлення"
        print("Тест пройдено успішно!")
        
        print("Зупиняємо брокер...")
        # Зупиняємо брокер
        await broker.shutdown()
        
    except Exception as e:
        print(f"Помилка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
