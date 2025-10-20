"""Unit tests for PydanticAIFramework adapter."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.llm.domain.exceptions import FrameworkNotSupportedError
from app.llm.domain.models import AgentConfig, ProviderConfig
from app.llm.infrastructure.adapters.pydantic_ai.adapter import PydanticAIFramework


class TestPydanticAIFramework:
    """Tests for Pydantic AI framework adapter."""

    def test_framework_initialization(self):
        framework = PydanticAIFramework()

        assert framework is not None
        assert "ollama" in framework._factories
        assert "openai" in framework._factories

    def test_supports_streaming(self):
        framework = PydanticAIFramework()
        assert framework.supports_streaming() is True

    def test_supports_tools(self):
        framework = PydanticAIFramework()
        assert framework.supports_tools() is True

    def test_get_framework_name(self):
        framework = PydanticAIFramework()
        assert framework.get_framework_name() == "pydantic-ai"

    def test_get_model_factory(self):
        framework = PydanticAIFramework()
        factory = framework.get_model_factory()

        assert factory is not None
        assert factory.supports_provider("ollama") is True

    @pytest.mark.asyncio
    async def test_create_agent_unsupported_provider(self):
        framework = PydanticAIFramework()
        config = AgentConfig(name="test", model_name="test-model")
        provider_config = ProviderConfig(provider_type="unsupported")

        with pytest.raises(FrameworkNotSupportedError) as exc_info:
            await framework.create_agent(config, provider_config)

        assert "not supported" in str(exc_info.value)
        assert "unsupported" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_create_agent_ollama_success(self):
        framework = PydanticAIFramework()
        config = AgentConfig(
            name="test_agent",
            model_name="llama3.2:latest",
            system_prompt="You are a test agent",
            temperature=0.7,
        )
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await framework.create_agent(config, provider_config)

            assert agent is not None
            assert hasattr(agent, "run")
            assert hasattr(agent, "stream")
            assert hasattr(agent, "supports_streaming")
            assert hasattr(agent, "get_config")

    @pytest.mark.asyncio
    async def test_create_agent_openai_success(self):
        framework = PydanticAIFramework()
        config = AgentConfig(
            name="test_agent",
            model_name="gpt-4o",
            system_prompt="You are a test agent",
            max_tokens=1000,
        )
        provider_config = ProviderConfig(
            provider_type="openai",
            api_key="sk-test-key",
        )

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await framework.create_agent(config, provider_config)

            assert agent is not None


    @pytest.mark.asyncio
    async def test_create_agent_with_deps_type(self):
        framework = PydanticAIFramework()

        class CustomDeps:
            session: object

        config = AgentConfig(
            name="test",
            model_name="llama3.2:latest",
            deps_type=CustomDeps,
        )
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await framework.create_agent(config, provider_config)

            assert agent is not None

    @pytest.mark.asyncio
    async def test_create_agent_minimal_config(self):
        framework = PydanticAIFramework()
        config = AgentConfig(
            name="minimal",
            model_name="llama3.2:latest",
        )
        provider_config = ProviderConfig(
            provider_type="ollama",
            base_url="http://localhost:11434",
        )

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await framework.create_agent(config, provider_config)

            assert agent is not None
            retrieved_config = agent.get_config()
            assert retrieved_config.name == "minimal"
