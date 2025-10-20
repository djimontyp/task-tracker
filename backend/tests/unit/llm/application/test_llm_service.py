"""Unit tests for LLMService."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.application.llm_service import LLMService, provider_to_config
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.models import AgentConfig, AgentResult, ProviderConfig, UsageInfo
from app.models import LLMProvider, ProviderType
from app.services.provider_crud import ProviderCRUD


class MockAgent:
    """Mock agent for testing."""

    async def run(self, prompt: str, dependencies=None):
        return AgentResult(
            output="Mock response",
            usage=UsageInfo(prompt_tokens=10, completion_tokens=20, total_tokens=30),
        )

    def get_config(self):
        return AgentConfig(name="mock", model_name="mock-model")


class MockFramework:
    """Mock framework for testing."""

    async def create_agent(self, config, provider_config):
        return MockAgent()

    def supports_streaming(self):
        return True

    def supports_tools(self):
        return True

    def get_framework_name(self):
        return "mock-framework"

    def get_model_factory(self):
        return MagicMock()


class TestProviderToConfig:
    """Tests for provider_to_config converter."""

    def test_provider_to_config_ollama(self):
        provider = LLMProvider(
            id=uuid4(),
            name="Ollama Local",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        crud = MagicMock(spec=ProviderCRUD)
        config = provider_to_config(provider, crud)

        assert config.provider_type == "ollama"
        assert config.base_url == "http://localhost:11434"
        assert config.api_key is None

    def test_provider_to_config_openai(self):
        provider = LLMProvider(
            id=uuid4(),
            name="OpenAI",
            type=ProviderType.openai,
            api_key_encrypted=b"encrypted_key",
            is_active=True,
        )

        crud = MagicMock(spec=ProviderCRUD)
        config = provider_to_config(provider, crud)

        assert config.provider_type == "openai"
        assert config.base_url is None
        assert config.api_key is None


class TestLLMService:
    """Tests for LLM Service."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

        self.mock_framework = MockFramework()
        FrameworkRegistry.register("mock", self.mock_framework)

        self.mock_crud = MagicMock(spec=ProviderCRUD)
        self.resolver = ProviderResolver(self.mock_crud)

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def test_service_initialization(self):
        service = LLMService(self.resolver, framework_name="mock")

        assert service.framework == self.mock_framework
        assert service.framework_name == "mock"
        assert service.provider_resolver == self.resolver

    def test_service_initialization_default_framework(self):
        service = LLMService(self.resolver)

        assert service.framework is not None
        assert service.framework_name == "default"

    def test_supports_streaming(self):
        service = LLMService(self.resolver, framework_name="mock")

        assert service.supports_streaming() is True

    @pytest.mark.asyncio
    async def test_create_agent_success(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get_by_name = AsyncMock(return_value=MagicMock(id=provider_id))

        service = LLMService(self.resolver, framework_name="mock")
        config = AgentConfig(
            name="test_agent",
            model_name="llama3.2:latest",
            system_prompt="You are a test agent",
        )

        agent = await service.create_agent(mock_session, config, provider_name="Test Provider")

        assert agent is not None
        assert hasattr(agent, "run")

    @pytest.mark.asyncio
    async def test_create_agent_by_id(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get = AsyncMock(return_value=MagicMock(id=provider_id))

        service = LLMService(self.resolver, framework_name="mock")
        config = AgentConfig(name="test", model_name="llama3.2:latest")

        agent = await service.create_agent(mock_session, config, provider_id=provider_id)

        assert agent is not None

    @pytest.mark.asyncio
    async def test_create_agent_no_provider_fallback(self):
        mock_session = AsyncMock()
        self.mock_crud.get_by_name = AsyncMock(return_value=None)

        with patch("app.llm.application.provider_resolver.settings") as mock_settings:
            mock_settings.llm.running_in_docker = False
            mock_settings.llm.ollama_base_url = "http://localhost:11434"

            service = LLMService(self.resolver, framework_name="mock")
            config = AgentConfig(name="test", model_name="llama3.2:latest")

            agent = await service.create_agent(mock_session, config)

            assert agent is not None

    @pytest.mark.asyncio
    async def test_execute_prompt_success(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get_by_name = AsyncMock(return_value=MagicMock(id=provider_id))

        service = LLMService(self.resolver, framework_name="mock")
        config = AgentConfig(name="test", model_name="llama3.2:latest")

        result = await service.execute_prompt(
            mock_session,
            config,
            "Test prompt",
            provider_name="Test Provider",
        )

        assert result.output == "Mock response"
        assert result.usage.total_tokens == 30

    @pytest.mark.asyncio
    async def test_execute_prompt_with_dependencies(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get_by_name = AsyncMock(return_value=MagicMock(id=provider_id))

        service = LLMService(self.resolver, framework_name="mock")
        config = AgentConfig(name="test", model_name="llama3.2:latest")
        dependencies = {"key": "value"}

        result = await service.execute_prompt(
            mock_session,
            config,
            "Test prompt",
            provider_name="Test Provider",
            dependencies=dependencies,
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_create_agent_with_full_config(self):
        provider_id = uuid4()
        mock_provider = LLMProvider(
            id=provider_id,
            name="Test Provider",
            type=ProviderType.ollama,
            base_url="http://localhost:11434",
            is_active=True,
        )

        mock_session = AsyncMock()
        mock_session.get = AsyncMock(return_value=mock_provider)

        self.mock_crud.get_by_name = AsyncMock(return_value=MagicMock(id=provider_id))

        service = LLMService(self.resolver, framework_name="mock")
        config = AgentConfig(
            name="advanced_agent",
            model_name="llama3.2:latest",
            system_prompt="You are an advanced agent",
            temperature=0.7,
            max_tokens=1000,
        )

        agent = await service.create_agent(mock_session, config, provider_name="Test Provider")

        assert agent is not None
        agent_config = agent.get_config()
        assert agent_config.name == "mock"

    @pytest.mark.asyncio
    async def test_service_with_different_framework(self):
        alternative_framework = MockFramework()
        FrameworkRegistry.register("alternative", alternative_framework)

        service = LLMService(self.resolver, framework_name="alternative")

        assert service.framework == alternative_framework
        assert service.framework_name == "alternative"
