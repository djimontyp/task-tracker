"""
Тести для TaskIQ з NATS
"""

import pytest
from taskiq_config import nats_broker, result_backend


class TestTaskIQNATS:
    """Тести для TaskIQ з NATS"""
    
    def test_nats_broker_initialization(self):
        """Тест ініціалізації брокера NATS"""
        # Перевіряємо, що брокер має правильні сервери
        assert nats_broker.servers == "nats://nats:4222"
    
    def test_result_backend_initialization(self):
        """Тест ініціалізації бекенду результатів"""
        assert result_backend is not None
    
    def test_process_message_function(self):
        """Тест функції обробки повідомлень"""
        from worker import process_message
        assert process_message is not None
