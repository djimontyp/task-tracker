import pytest
from unittest.mock import AsyncMock


class TestMessageProcessor:
    """Тести для основного обробника повідомлень"""

    @pytest.mark.asyncio
    async def test_message_processor_initialization(self):
        """Перевірка ініціалізації основного обробника повідомлень"""
        from core.message_processor import MessageProcessor

        # Створити моки для залежностей
        source_adapter = AsyncMock()
        llm_provider = AsyncMock()
        output_processor = AsyncMock()

        processor = MessageProcessor(source_adapter, llm_provider, output_processor)

        assert processor.source_adapter == source_adapter
        assert processor.llm_provider == llm_provider
        assert processor.output_processor == output_processor

    @pytest.mark.asyncio
    async def test_message_processor_process_messages(self):
        """Перевірка обробки повідомлень основним обробником"""
        from core.message_processor import MessageProcessor

        # Створити моки для залежностей
        source_adapter = AsyncMock()
        llm_provider = AsyncMock()
        output_processor = AsyncMock()

        # Налаштувати моки
        source_adapter.fetch_messages.return_value = [
            {
                "id": "1",
                "content": "Test message",
                "author": "Test User",
                "timestamp": "2023-01-01T00:00:00Z",
                "chat_id": "-1001234567890",
            }
        ]

        source_adapter.normalize_message.return_value = {
            "external_id": "1",
            "content": "Test message",
            "author": "Test User",
            "timestamp": "2023-01-01T00:00:00Z",
            "source_type": "telegram",
            "source_id": "-1001234567890",
        }

        llm_provider.classify_issue.return_value = {
            "classification": "task",
            "category": "feature",
            "priority": "medium",
            "confidence": 0.85,
        }

        output_processor.process.return_value = True
        source_adapter.mark_as_processed.return_value = None

        # Створити обробник повідомлень
        processor = MessageProcessor(source_adapter, llm_provider, output_processor)

        # Обробити повідомлення
        issues = await processor.process_messages()

        # Перевірити результати
        assert isinstance(issues, list)
        assert len(issues) == 1
        assert issues[0]["content"] == "Test message"
        assert issues[0]["classification"] == "task"

        # Перевірити, що методи були викликані
        source_adapter.fetch_messages.assert_called_once()
        source_adapter.normalize_message.assert_called_once()
        llm_provider.classify_issue.assert_called_once()
        output_processor.process.assert_called_once()
        source_adapter.mark_as_processed.assert_called_once()
