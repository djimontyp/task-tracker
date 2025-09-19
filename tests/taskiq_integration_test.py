import pytest

class TestTaskIQIntegration:
    """Інтеграційні тести для TaskIQ з NATS"""
    
    @pytest.mark.asyncio
    async def test_process_message_task(self):
        """Тест завдання обробки повідомлень"""

        from worker import process_message
        
        task = await process_message.kiq("Тестове повідомлення")
        result = await task.wait_result()

        assert result.return_value == "Оброблено: Тестове повідомлення"
