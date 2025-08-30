"""
Тести для TaskIQ з NATS
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from src.taskiq_config import nats_broker, result_backend


class TestTaskIQNATS:
    """Тести для TaskIQ з NATS"""
    
    @pytest.mark.asyncio
    async def test_nats_broker_initialization(self):
        """Тест ініціалізації брокера NATS"""
        # Перевіряємо, що брокер було ініціалізовано
        assert nats_broker is not None
        assert nats_broker.url == "nats://localhost:4222"
        assert nats_broker.queue == "taskiq"
    
    @pytest.mark.asyncio
    async def test_result_backend_initialization(self):
        """Тест ініціалізації бекенду результатів"""
        # Перевіряємо, що бекенд було ініціалізовано
        assert result_backend is not None
    
    @pytest.mark.asyncio
    async def test_process_message_function(self):
        """Тест функції обробки повідомлень"""
        # Імпортуємо функцію для тестування
        from src.worker import process_message
        
        # Тестуємо функцію
        result = await process_message("Тестове повідомлення")
        assert result == "Оброблено: Тестове повідомлення"
