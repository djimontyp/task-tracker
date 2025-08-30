import pytest
from unittest.mock import AsyncMock, patch, MagicMock


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
        mock_result = MagicMock()
        
        with patch.object(provider.classification_agent, 'run', new=AsyncMock()) as mock_run:
            mock_run.return_value = mock_result

            classification = await provider.classify_issue("Test message")
            # Повертаємо сирий результат AgentRunResult
            assert classification is mock_result
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_ollama_provider_extract_entities(self):
        """Перевірка видобування сутностей провайдером Ollama"""
        from llm.ollama import OllamaProvider

        config = {"model": "mistral-nemo:12b-instruct-2407-q4_k_m", "base_url": "http://localhost:11434"}
        provider = OllamaProvider(config)
        
        # Мокуємо агента для повернення тестових даних
        mock_result = MagicMock()
        
        with patch.object(provider.entity_extraction_agent, 'run', new=AsyncMock()) as mock_run:
            mock_run.return_value = mock_result

            entities = await provider.extract_entities("Test message")
            # Повертаємо сирий результат AgentRunResult
            assert entities is mock_result
            mock_run.assert_called_once()
