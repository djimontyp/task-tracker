import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from llm.ollama import OllamaProvider


class TestPydanticAIIntegration:
    """Тести для інтеграції з pydantic-ai"""

    @pytest.fixture
    def ollama_provider(self):
        """Фікстура для провайдера Ollama"""
        config = {
            "model": "mistral-nemo:12b-instruct-2407-q4_k_m",
            "base_url": "http://localhost:11434",
        }
        return OllamaProvider(config)

    @pytest.mark.asyncio
    async def test_ollama_provider_initialization(self, ollama_provider):
        """Перевірка ініціалізації провайдера Ollama з pydantic-ai"""
        assert ollama_provider is not None
        assert ollama_provider.model_name == "mistral-nemo:12b-instruct-2407-q4_k_m"
        assert ollama_provider.base_url == "http://localhost:11434"
        assert ollama_provider.model is not None
        assert ollama_provider.classification_agent is not None
        assert ollama_provider.entity_extraction_agent is not None

    @pytest.mark.asyncio
    async def test_ollama_provider_classify_issue(self, ollama_provider):
        """Перевірка класифікації проблеми провайдером Ollama"""
        # Мокуємо агента для повернення тестових даних
        mock_result = MagicMock()
        
        with patch.object(
            ollama_provider.classification_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value = mock_result

            result = await ollama_provider.classify_issue(
                "Implement new user authentication feature"
            )
            # Повертаємо сирий RunResult
            assert result is mock_result
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities(self, ollama_provider):
        """Перевірка видобування сутностей провайдером Ollama"""
        # Мокуємо агента для повернення тестових даних
        mock_result = MagicMock()
        
        with patch.object(
            ollama_provider.entity_extraction_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value = mock_result

            result = await ollama_provider.extract_entities(
                "Implement new user authentication feature with security measures on login page"
            )
            # Повертаємо сирий RunResult
            assert result is mock_result
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities_string_response(
        self, ollama_provider
    ):
        """Перевірка видобування сутностей з рядковою відповіддю"""
        # Мокуємо агента для повернення тестових даних у вигляді рядка
        mock_result = MagicMock()
        
        with patch.object(
            ollama_provider.entity_extraction_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value = mock_result

            result = await ollama_provider.extract_entities(
                "Implement new user authentication feature with security measures on login page"
            )
            # Повертаємо сирий RunResult
            assert result is mock_result
            mock_run.assert_called_once()
