"""Unit tests for OpenAIModelFactory."""

import pytest

from app.llm.domain.exceptions import InvalidConfigurationError, ModelCreationError
from app.llm.domain.models import ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.factories.openai import OpenAIModelFactory


class TestOpenAIModelFactory:
    """Tests for OpenAI model factory."""

    @pytest.mark.asyncio
    async def test_create_model_success(self):
        factory = OpenAIModelFactory()
        provider_config = ProviderConfig(
            provider_type="openai",
            api_key="sk-test-key-123",
        )

        model = await factory.create_model(provider_config, "gpt-4o")

        assert model is not None
        assert hasattr(model, "model_name")
        assert model.model_name == "gpt-4o"

    @pytest.mark.asyncio
    async def test_create_model_missing_api_key(self):
        factory = OpenAIModelFactory()
        provider_config = ProviderConfig(
            provider_type="openai",
            api_key=None,
        )

        with pytest.raises(InvalidConfigurationError) as exc_info:
            await factory.create_model(provider_config, "gpt-4o")

        assert "API key" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_create_model_wrong_provider_type(self):
        factory = OpenAIModelFactory()
        provider_config = ProviderConfig(
            provider_type="ollama",
            api_key="sk-test-key-123",
        )

        with pytest.raises(ModelCreationError) as exc_info:
            await factory.create_model(provider_config, "gpt-4o")

        assert "Provider type mismatch" in str(exc_info.value)
        assert "expected 'openai'" in str(exc_info.value)

    def test_supports_provider_openai(self):
        factory = OpenAIModelFactory()
        assert factory.supports_provider("openai") is True

    def test_supports_provider_other(self):
        factory = OpenAIModelFactory()
        assert factory.supports_provider("ollama") is False
        assert factory.supports_provider("anthropic") is False

    @pytest.mark.asyncio
    async def test_validate_provider_success(self):
        factory = OpenAIModelFactory()
        provider_config = ProviderConfig(
            provider_type="openai",
            api_key="sk-test-key-123",
        )

        is_valid, error = await factory.validate_provider(provider_config)
        assert is_valid is True
        assert error is None


    @pytest.mark.asyncio
    async def test_create_model_with_different_models(self):
        factory = OpenAIModelFactory()
        provider_config = ProviderConfig(
            provider_type="openai",
            api_key="sk-test-key-123",
        )

        models_to_test = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]

        for model_name in models_to_test:
            model = await factory.create_model(provider_config, model_name)
            assert model is not None
            assert model.model_name == model_name

    def test_get_model_info(self):
        factory = OpenAIModelFactory()

        class MockModel:
            model_name = "gpt-4o"

        model_info = factory.get_model_info(MockModel())

        assert model_info.name == "gpt-4o"
        assert model_info.supports_streaming is True
        assert model_info.supports_tools is True
