"""Unit tests for OllamaModelFactory."""

import pytest
from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.factories.ollama import OllamaModelFactory


class TestOllamaModelFactory:
    """Tests for Ollama model factory."""

    @pytest.mark.asyncio
    async def test_create_model_success(self):
        factory = OllamaModelFactory()
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )

        model = await factory.create_model(provider_config, "llama3.2:latest")

        assert model is not None
        assert hasattr(model, "model_name")
        assert model.model_name == "llama3.2:latest"

    @pytest.mark.asyncio
    async def test_create_model_missing_base_url(self):
        factory = OllamaModelFactory()
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url=None,
        )

        with pytest.raises(InvalidConfigurationError) as exc_info:
            await factory.create_model(provider_config, "llama3.2:latest")

        assert "base_url" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_create_model_wrong_provider_type(self):
        factory = OllamaModelFactory()
        provider_config = ProviderConfig(
            provider_type="openai",
            base_url="http://localhost:11434",
        )

        with pytest.raises(ModelCreationError) as exc_info:
            await factory.create_model(provider_config, "llama3.2:latest")

        assert "Provider type mismatch" in str(exc_info.value)
        assert "expected 'ollama'" in str(exc_info.value)

    def test_supports_provider_ollama(self):
        factory = OllamaModelFactory()
        assert factory.supports_provider("ollama") is True

    def test_supports_provider_other(self):
        factory = OllamaModelFactory()
        assert factory.supports_provider("openai") is False
        assert factory.supports_provider("anthropic") is False

    @pytest.mark.asyncio
    async def test_validate_provider_success(self):
        factory = OllamaModelFactory()
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )

        is_valid, error = await factory.validate_provider(provider_config)
        assert is_valid is True
        assert error is None

    @pytest.mark.asyncio
    async def test_create_model_with_custom_base_url(self):
        factory = OllamaModelFactory()
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://custom-ollama:11434",
        )

        model = await factory.create_model(provider_config, "qwen2.5-coder:7b")

        assert model is not None
        assert model.model_name == "qwen2.5-coder:7b"

    def test_get_model_info(self):
        factory = OllamaModelFactory()

        class MockModel:
            model_name = "llama3.2:latest"

        model_info = factory.get_model_info(MockModel())

        assert model_info.name == "llama3.2:latest"
        assert model_info.supports_streaming is True
        assert model_info.supports_tools is True
