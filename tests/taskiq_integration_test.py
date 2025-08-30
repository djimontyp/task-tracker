"""
Інтеграційні тести для TaskIQ з NATS
"""

import pytest
from config import settings

# Використовуємо налаштування замість змінних середовища
RUN_INTEGRATION_TESTS = settings.RUN_INTEGRATION_TESTS


class TestTaskIQIntegration:
    """Інтеграційні тести для TaskIQ з NATS"""
    
    @pytest.mark.asyncio
    @pytest.mark.skipif(not RUN_INTEGRATION_TESTS, reason="Integration tests are disabled. Set RUN_INTEGRATION_TESTS=true to run.")
    async def test_process_message_task(self):
        """Тест завдання обробки повідомлень"""
        # Використовуємо налаштування замість встановлення змінної середовища
        nats_servers = settings.taskiq_nats_servers
        
        # Імпортуємо функцію після встановлення змінної середовища
        from worker import process_message
        
        # Надсилаємо завдання
        task = await process_message.kiq("Тестове повідомлення")
        
        # Очікуємо результат
        result = await task.wait_result()
        
        # Перевіряємо результат
        assert result.return_value == "Оброблено: Тестове повідомлення"
        
        # Немає необхідності видаляти змінні середовища, оскільки ми використовуємо налаштування
