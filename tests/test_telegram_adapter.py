import pytest


class TestTelegramAdapter:
    """Тести для Telegram адаптера"""

    def test_telegram_adapter_initialization(self):
        """Перевірка ініціалізації Telegram адаптера"""
        from adapters.telegram import TelegramAdapter

        config = {"bot_token": "test_token"}
        adapter = TelegramAdapter(config)

        assert adapter.bot_token == "test_token"
        assert adapter.name == "Unknown"  # Значення за замовчуванням

    @pytest.mark.asyncio
    async def test_telegram_adapter_fetch_messages(self):
        """Перевірка отримання повідомлень з Telegram адаптера"""
        from adapters.telegram import TelegramAdapter

        config = {"bot_token": "test_token"}
        adapter = TelegramAdapter(config)

        messages = await adapter.fetch_messages()

        assert isinstance(messages, list)
        assert len(messages) > 0
        assert "id" in messages[0]
        assert "content" in messages[0]

    @pytest.mark.asyncio
    async def test_telegram_adapter_normalize_message(self):
        """Перевірка нормалізації повідомлення Telegram адаптером"""
        from adapters.telegram import TelegramAdapter

        config = {"bot_token": "test_token"}
        adapter = TelegramAdapter(config)

        raw_message = {
            "id": "1",
            "content": "Test message",
            "author": "Test User",
            "timestamp": "2023-01-01T00:00:00Z",
            "chat_id": "-1001234567890",
        }

        normalized = await adapter.normalize_message(raw_message)

        assert normalized["external_id"] == "1"
        assert normalized["content"] == "Test message"
        assert normalized["author"] == "Test User"
        assert normalized["source_type"] == "telegram"
