"""
Інтеграційні тести для TaskIQ з NATS
"""

import pytest
import asyncio
from src.worker import process_message


class TestTaskIQIntegration:
    """Інтеграційні тести для TaskIQ з NATS"""
    
    @pytest.mark.asyncio
    async def test_process_message_task(self):
        """Тест завдання обробки повідомлень"""
        # Надсилаємо завдання
        task = await process_message.kiq("Тестове повідомлення")
        
        # Очікуємо результат
        result = await task.wait_result()
        
        # Перевіряємо результат
        assert result.return_value == "Оброблено: Тестове повідомлення"
