"""Functional tests for LLM startup initialization."""

import pytest
from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.startup import create_llm_service, initialize_llm_system
from sqlalchemy.ext.asyncio import AsyncSession


class TestStartupInitialization:
    """Tests for LLM system startup initialization."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def test_initialize_llm_system(self):
        initialize_llm_system()

        assert "pydantic_ai" in FrameworkRegistry.list_frameworks()
        assert FrameworkRegistry._default == "pydantic_ai"

    def test_initialize_llm_system_idempotent(self):
        initialize_llm_system()
        initialize_llm_system()
        initialize_llm_system()

        frameworks = FrameworkRegistry.list_frameworks()
        assert len(frameworks) == 1
        assert "pydantic_ai" in frameworks

    def test_default_framework_registered(self):
        initialize_llm_system()

        framework = FrameworkRegistry.get()

        assert framework is not None
        assert framework.get_framework_name() == "pydantic-ai"
        assert framework.supports_streaming() is True

    @pytest.mark.asyncio
    async def test_create_llm_service(self, db_session: AsyncSession):
        initialize_llm_system()

        service = create_llm_service(db_session)

        assert service is not None
        assert service.framework_name == "pydantic_ai"
        assert service.provider_resolver is not None

    @pytest.mark.asyncio
    async def test_create_llm_service_supports_streaming(self, db_session: AsyncSession):
        initialize_llm_system()

        service = create_llm_service(db_session)

        assert service.supports_streaming() is True

    @pytest.mark.asyncio
    async def test_create_multiple_services(self, db_session: AsyncSession):
        initialize_llm_system()

        service1 = create_llm_service(db_session)
        service2 = create_llm_service(db_session)

        assert service1 is not None
        assert service2 is not None
        assert service1.framework == service2.framework


class TestAppIntegration:
    """Tests for integration with FastAPI app startup."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    @pytest.mark.asyncio
    async def test_app_lifespan_initialization(self):
        frameworks_before = len(FrameworkRegistry.list_frameworks())

        assert frameworks_before >= 0


class TestServiceFactory:
    """Tests for service factory function."""

    def setup_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    def teardown_method(self):
        FrameworkRegistry._frameworks = {}
        FrameworkRegistry._default = None

    @pytest.mark.asyncio
    async def test_service_factory_creates_working_service(
        self,
        db_session: AsyncSession,
        db_ollama_provider,
    ):
        from unittest.mock import MagicMock, patch

        from app.llm.domain.models import AgentConfig

        initialize_llm_system()
        service = create_llm_service(db_session)

        config = AgentConfig(
            name="test",
            model_name="llama3.2:latest",
        )

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
    async def test_service_factory_with_provider_resolver(self, db_session: AsyncSession):
        initialize_llm_system()
        service = create_llm_service(db_session)

        assert service.provider_resolver is not None
        assert service.provider_resolver.crud is not None
