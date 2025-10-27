"""Fixtures for LLM testing."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.application.llm_service import LLMService
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.models import AgentConfig, AgentResult, ProviderConfig, UsageInfo
from app.llm.infrastructure.adapters.pydantic_ai.adapter import PydanticAIFramework
from app.models import LLMProvider, ProviderType
from app.services.provider_crud import ProviderCRUD
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def ollama_provider_data():
    """Provider data for Ollama."""
    return {
        "name": "Test Ollama",
        "type": ProviderType.ollama,
        "base_url": "http://localhost:11434",
        "is_active": True,
    }


@pytest.fixture
def openai_provider_data():
    """Provider data for OpenAI."""
    return {
        "name": "Test OpenAI",
        "type": ProviderType.openai,
        "api_key_encrypted": b"encrypted_test_key",
        "is_active": True,
    }


@pytest.fixture
async def db_ollama_provider(db_session: AsyncSession, ollama_provider_data):
    """Create Ollama provider in database."""
    provider = LLMProvider(**ollama_provider_data)
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def db_openai_provider(db_session: AsyncSession, openai_provider_data):
    """Create OpenAI provider in database."""
    provider = LLMProvider(**openai_provider_data)
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
def mock_pydantic_framework():
    """Mock Pydantic AI framework for testing."""
    return PydanticAIFramework()


@pytest.fixture
def provider_crud(db_session: AsyncSession):
    """Create provider CRUD instance."""
    return ProviderCRUD(db_session)


@pytest.fixture
def provider_resolver(db_session: AsyncSession):
    """Create provider resolver."""
    crud = ProviderCRUD(db_session)
    return ProviderResolver(crud)


@pytest.fixture
def llm_service(provider_resolver):
    """Create LLM service with clean registry."""
    FrameworkRegistry._frameworks = {}
    FrameworkRegistry._default = None
    FrameworkRegistry.register("pydantic_ai", PydanticAIFramework())
    service = LLMService(provider_resolver, framework_name="pydantic_ai")
    yield service
    FrameworkRegistry._frameworks = {}
    FrameworkRegistry._default = None


@pytest.fixture
def mock_agent_result():
    """Mock AgentResult for testing."""
    return AgentResult(
        output="Test output",
        usage=UsageInfo(prompt_tokens=10, completion_tokens=20, total_tokens=30),
        messages=None,
    )


@pytest.fixture
def agent_config():
    """Standard agent configuration for testing."""
    return AgentConfig(
        name="test_agent",
        model_name="llama3.2:latest",
        system_prompt="You are a test agent",
        temperature=0.7,
    )


@pytest.fixture
def ollama_provider_config():
    """Ollama provider configuration."""
    return ProviderConfig(
        provider_type="ollama",
        base_url="http://localhost:11434",
    )


@pytest.fixture
def openai_provider_config():
    """OpenAI provider configuration."""
    return ProviderConfig(
        provider_type="openai",
        api_key="sk-test-key-123",
    )


@pytest.fixture
def mock_pydantic_agent():
    """Mock Pydantic AI Agent for testing."""
    agent = AsyncMock()

    class MockUsage:
        request_tokens = 10
        response_tokens = 20
        total_tokens = 30

    class MockResult:
        output = "Mock response"

        def usage(self):
            return MockUsage()

        def all_messages(self):
            return []

    agent.run = AsyncMock(return_value=MockResult())
    return agent


@pytest.fixture
def mock_streamed_agent():
    """Mock streaming Pydantic AI Agent."""
    agent = MagicMock()

    class MockStreamedResult:
        async def stream_text(self):
            yield "Hello"
            yield " World"

        async def get_output(self):
            return "Hello World"

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    agent.run_stream = MagicMock(return_value=MockStreamedResult())
    return agent
