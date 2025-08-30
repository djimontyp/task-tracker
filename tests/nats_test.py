#!/usr/bin/env python3
"""Simple test script to verify NATS connection with the project"""

import asyncio
import nats

async def main():
    try:
        # Спробуємо підключитися до NATS
        nc = await nats.connect("nats://localhost:4222")
        print("Підключення до NATS вдалося!")
        
        # Спробуємо опублікувати повідомлення
        await nc.publish("test", b"Hello NATS!")
        print("Повідомлення опубліковано успішно!")
        
        # Закриємо підключення
        await nc.close()
    except Exception as e:
        print(f"Помилка: {e}")

if __name__ == "__main__":
    asyncio.run(main())
