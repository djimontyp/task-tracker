#!/usr/bin/env python3
"""Simple test script to verify NATS direct messaging with the project"""

import asyncio
import nats

async def main():
    try:
        # Спробуємо підключитися до NATS
        nc = await nats.connect("nats://localhost:4222")
        print("Підключення до NATS вдалося!")
        
        # Створимо чергу для тестування
        queue_name = "test_queue"
        
        # Функція для обробки повідомлень
        async def message_handler(msg):
            print(f"Отримано повідомлення: {msg.data.decode()}")
            await msg.ack()
        
        # Підпишемося на чергу
        await nc.subscribe(queue_name, cb=message_handler)
        
        # Спробуємо опублікувати повідомлення
        await nc.publish(queue_name, b"Hello NATS!")
        print("Повідомлення опубліковано успішно!")
        
        # Зачекаємо трохи, щоб повідомлення було оброблено
        await asyncio.sleep(1)
        
        # Закриємо підключення
        await nc.close()
        print("Підключення закрито успішно!")
    except Exception as e:
        print(f"Помилка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
