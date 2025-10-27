"""Integration tests for framework switching."""

from unittest.mock import MagicMock, patch

import pytest
from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.application.llm_service import LLMService
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.models import AgentConfig
from app.llm.infrastructure.adapters.pydantic_ai.adapter import PydanticAIFramework
from app.models import LLMProvider
from sqlalchemy.ext.asyncio import AsyncSession


class MockAlternativeFramework:
    """Mock alternative framework for testing switching."""

    async def create_agent(self, config, provider_config):
        return MagicMock()

    def supports_streaming(self):
        return False

    def supports_tools(self):
        return True

    def get_framework_name(self):
        return "alternative-framework"

    def get_model_factory(self):
        return MagicMock()


class TestFrameworkSwitching:
    """Tests for switching between different frameworks."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    @pytest.mark.asyncio
    async def test_register_multiple_frameworks(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        pydantic_framework = PydanticAIFramework()
        alternative_framework = MockAlternativeFramework()

        FrameworkRegistry.register("pydantic_ai", pydantic_framework)
        FrameworkRegistry.register("alternative", alternative_framework)

        frameworks = FrameworkRegistry.list_frameworks()

        assert len(frameworks) == 2
        assert "pydantic_ai" in frameworks
        assert "alternative" in frameworks

    @pytest.mark.asyncio
    async def test_create_agent_with_pydantic_ai(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())

        service = LLMService(provider_resolver, framework_name="pydantic_ai")
        config = AgentConfig(name="test", model_name="llama3.2:latest")

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            agent = await service.create_agent(
                db_session,
                config,
                provider_name=db_ollama_provider.name,
            )

            assert agent is not None

    @pytest.mark.asyncio
    async def test_create_agent_with_alternative_framework(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("alternative", MockAlternativeFramework())

        service = LLMService(provider_resolver, framework_name="alternative")
        config = AgentConfig(name="test", model_name="llama3.2:latest")

        agent = await service.create_agent(
            db_session,
            config,
            provider_name=db_ollama_provider.name,
        )

        assert agent is not None

    @pytest.mark.asyncio
    async def test_switch_between_frameworks(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())
        FrameworkRegistry.register("alternative", MockAlternativeFramework())

        service1 = LLMService(provider_resolver, framework_name="pydantic_ai")
        assert service1.framework.get_framework_name() == "pydantic-ai"

        service2 = LLMService(provider_resolver, framework_name="alternative")
        assert service2.framework.get_framework_name() == "alternative-framework"

    @pytest.mark.asyncio
    async def test_default_framework_selection(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())

        service = LLMService(provider_resolver)

        assert service.framework is not None
        assert service.framework_name == "default"

    @pytest.mark.asyncio
    async def test_change_default_framework(
        self,
        db_session: AsyncSession,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())
        FrameworkRegistry.register("alternative", MockAlternativeFramework())

        FrameworkRegistry.set_default("alternative")

        service = LLMService(provider_resolver)

        assert service.framework.get_framework_name() == "alternative-framework"

    @pytest.mark.asyncio
    async def test_framework_capabilities_differ(self):
        pydantic_framework = PydanticAIFramework()
        alternative_framework = MockAlternativeFramework()

        assert pydantic_framework.supports_streaming() is True
        assert alternative_framework.supports_streaming() is False

        assert pydantic_framework.supports_tools() is True
        assert alternative_framework.supports_tools() is True

    @pytest.mark.asyncio
    async def test_service_supports_streaming_based_on_framework(
        self,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())
        FrameworkRegistry.register("alternative", MockAlternativeFramework())

        service1 = LLMService(provider_resolver, framework_name="pydantic_ai")
        assert service1.supports_streaming() is True

        service2 = LLMService(provider_resolver, framework_name="alternative")
        assert service2.supports_streaming() is False

    @pytest.mark.asyncio
    async def test_multiple_services_same_framework(
        self,
        db_session: AsyncSession,
        db_ollama_provider: LLMProvider,
        provider_resolver: ProviderResolver,
    ):
        FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())

        service1 = LLMService(provider_resolver, framework_name="pydantic_ai")
        service2 = LLMService(provider_resolver, framework_name="pydantic_ai")

        assert service1.framework == service2.framework

        with patch("pydantic_ai.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            config = AgentConfig(name="test", model_name="llama3.2:latest")

            agent1 = await service1.create_agent(
                db_session,
                config,
                provider_name=db_ollama_provider.name,
            )
            agent2 = await service2.create_agent(
                db_session,
                config,
                provider_name=db_ollama_provider.name,
            )

            assert agent1 is not None
            assert agent2 is not None
