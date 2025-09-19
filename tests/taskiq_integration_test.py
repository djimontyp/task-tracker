import pytest
from config import settings

class TestTaskIQIntegration:
    """Інтеграційні тести для TaskIQ з NATS"""
    
    @pytest.mark.asyncio
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
