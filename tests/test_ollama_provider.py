import pytest
from unittest.mock import AsyncMock, patch


class TestOllamaProvider:
    """Тести для провайдера LLM (Ollama)"""

    def test_ollama_provider_initialization(self):
        """Перевірка ініціалізації провайдера Ollama"""
        from llm.ollama import OllamaProvider

        config = {"model": "mistral-nemo:12b-instruct-2407-q4_k_m", "base_url": "http://localhost:11434"}
        provider = OllamaProvider(config)

        assert provider.model_name == "mistral-nemo:12b-instruct-2407-q4_k_m"
        assert provider.base_url == "http://localhost:11434"
        assert provider.model is not None
        assert provider.classification_agent is not None
        assert provider.entity_extraction_agent is not None

    @pytest.mark.asyncio
    async def test_ollama_provider_classify_issue(self):
        """Перевірка класифікації проблеми провайдером Ollama"""
        from llm.ollama import OllamaProvider

        config = {"model": "mistral-nemo:12b-instruct-2407-q4_k_m", "base_url": "http://localhost:11434"}
        provider = OllamaProvider(config)
        
        # Мокуємо агента для повернення тестових даних
        with patch.object(provider.classification_agent, 'run', new=AsyncMock()) as mock_run:
            mock_run.return_value.data = {
                "is_issue": True,
                "category": "feature",
                "priority": "medium",
                "confidence": 0.85
            }

            classification = await provider.classify_issue("Test message")

            assert classification["is_issue"] is True
            assert classification["category"] == "feature"
            assert classification["priority"] == "medium"
            assert classification["confidence"] == 0.85
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities(self):
        """Перевірка видобування сутностей провайдером Ollama"""
        from llm.ollama import OllamaProvider

        config = {"model": "mistral-nemo:12b-instruct-2407-q4_k_m", "base_url": "http://localhost:11434"}
        provider = OllamaProvider(config)
        
        # Мокуємо агента для повернення тестових даних
        with patch.object(provider.entity_extraction_agent, 'run', new=AsyncMock()) as mock_run:
            mock_run.return_value.data = ["entity1", "entity2"]

            entities = await provider.extract_entities("Test message")

            assert isinstance(entities, list)
            assert len(entities) == 2
            assert "entity1" in entities
            assert "entity2" in entities
            mock_run.assert_called_once()
