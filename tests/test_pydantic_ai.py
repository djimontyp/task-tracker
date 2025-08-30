import pytest
from unittest.mock import AsyncMock, patch
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
        with patch.object(
            ollama_provider.classification_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value.data = {
                "is_issue": True,
                "category": "feature",
                "priority": "medium",
                "confidence": 0.85,
            }

            result = await ollama_provider.classify_issue(
                "Implement new user authentication feature"
            )

            assert result["is_issue"] is True
            assert result["category"] == "feature"
            assert result["priority"] == "medium"
            assert result["confidence"] == 0.85
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities(self, ollama_provider):
        """Перевірка видобування сутностей провайдером Ollama"""
        # Мокуємо агента для повернення тестових даних
        with patch.object(
            ollama_provider.entity_extraction_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value.data = [
                "user authentication",
                "security",
                "login page",
            ]

            result = await ollama_provider.extract_entities(
                "Implement new user authentication feature with security measures on login page"
            )

            assert isinstance(result, list)
            assert len(result) == 3
            assert "user authentication" in result
            assert "security" in result
            assert "login page" in result
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities_string_response(
        self, ollama_provider
    ):
        """Перевірка видобування сутностей з рядковою відповіддю"""
        # Мокуємо агента для повернення тестових даних у вигляді рядка
        with patch.object(
            ollama_provider.entity_extraction_agent, "run", new=AsyncMock()
        ) as mock_run:
            mock_run.return_value.data = "user authentication, security, login page"

            result = await ollama_provider.extract_entities(
                "Implement new user authentication feature with security measures on login page"
            )

            assert isinstance(result, list)
            assert len(result) == 3
            assert "user authentication" in result
            assert "security" in result
            assert "login page" in result
            mock_run.assert_called_once()
