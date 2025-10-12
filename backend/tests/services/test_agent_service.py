"""Comprehensive tests for AgentTestService.

This test module provides complete coverage for the AgentTestService including:
- Testing agents with different provider types (Ollama, OpenAI)
- Provider validation and error handling
- API key decryption and encryption
- LLM integration and response handling
- Execution time measurement
- Error scenarios and edge cases
"""

from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from app.models import (
    AgentConfig,
    LLMProvider,
    ProviderType,
    ValidationStatus,
)
from app.services.agent_service import AgentTestService, TestAgentResponse
from app.services.credential_encryption import CredentialEncryption
from sqlalchemy.ext.asyncio import AsyncSession

# ==================== FIXTURES ====================


@pytest.fixture
def encryptor() -> CredentialEncryption:
    """Create encryption service instance."""
    return CredentialEncryption()


@pytest.fixture
async def ollama_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create a validated Ollama provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test Ollama",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        api_key_encrypted=encryptor.encrypt("fake-ollama-key"),
        is_active=True,
        validation_status=ValidationStatus.connected,
        validated_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def openai_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create a validated OpenAI provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test OpenAI",
        type=ProviderType.openai,
        base_url=None,
        api_key_encrypted=encryptor.encrypt("sk-test-key-123"),
        is_active=True,
        validation_status=ValidationStatus.connected,
        validated_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def inactive_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create an inactive provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Inactive Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        api_key_encrypted=encryptor.encrypt("fake-key"),
        is_active=False,
        validation_status=ValidationStatus.connected,
        validated_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def unvalidated_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create a provider with pending validation status."""
    provider = LLMProvider(
        id=uuid4(),
        name="Unvalidated Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        api_key_encrypted=encryptor.encrypt("fake-key"),
        is_active=True,
        validation_status=ValidationStatus.pending,
        validated_at=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def error_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create a provider with error validation status."""
    provider = LLMProvider(
        id=uuid4(),
        name="Error Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        api_key_encrypted=encryptor.encrypt("fake-key"),
        is_active=True,
        validation_status=ValidationStatus.error,
        validation_error="Connection failed",
        validated_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def ollama_agent(db_session: AsyncSession, ollama_provider: LLMProvider) -> AgentConfig:
    """Create an agent configured with Ollama provider."""
    agent = AgentConfig(
        id=uuid4(),
        name="Ollama Test Agent",
        description="Agent for Ollama testing",
        provider_id=ollama_provider.id,
        model_name="llama3.2:latest",
        system_prompt="You are a helpful assistant for testing.",
        temperature=0.7,
        max_tokens=2000,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def openai_agent(db_session: AsyncSession, openai_provider: LLMProvider) -> AgentConfig:
    """Create an agent configured with OpenAI provider."""
    agent = AgentConfig(
        id=uuid4(),
        name="OpenAI Test Agent",
        description="Agent for OpenAI testing",
        provider_id=openai_provider.id,
        model_name="gpt-4",
        system_prompt="You are a helpful assistant.",
        temperature=0.8,
        max_tokens=1500,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


# ==================== SUCCESSFUL TEST SCENARIOS ====================


@pytest.mark.asyncio
async def test_agent_with_ollama_success(
    db_session: AsyncSession, ollama_agent: AgentConfig, ollama_provider: LLMProvider
):
    """Test successful agent testing with Ollama provider."""
    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        # Setup mock LLM response
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "This is the Ollama response."
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        result = await service.test_agent(ollama_agent.id, "Test prompt")

        # Verify response structure
        assert isinstance(result, TestAgentResponse)
        assert result.agent_id == ollama_agent.id
        assert result.agent_name == ollama_agent.name
        assert result.prompt == "Test prompt"
        assert result.response == "This is the Ollama response."
        assert result.elapsed_time >= 0
        assert result.model_name == "llama3.2:latest"
        assert result.provider_name == "Test Ollama"
        assert result.provider_type == "ollama"

        # Verify PydanticAgent was called with correct parameters
        mock_agent_class.assert_called_once()
        mock_agent.run.assert_called_once()


@pytest.mark.asyncio
async def test_agent_with_openai_success(
    db_session: AsyncSession, openai_agent: AgentConfig, openai_provider: LLMProvider
):
    """Test successful agent testing with OpenAI provider."""
    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        # Setup mock LLM response
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "This is the OpenAI GPT-4 response."
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        result = await service.test_agent(openai_agent.id, "Hello GPT-4")

        # Verify response structure
        assert isinstance(result, TestAgentResponse)
        assert result.agent_id == openai_agent.id
        assert result.agent_name == openai_agent.name
        assert result.prompt == "Hello GPT-4"
        assert result.response == "This is the OpenAI GPT-4 response."
        assert result.elapsed_time >= 0
        assert result.model_name == "gpt-4"
        assert result.provider_name == "Test OpenAI"
        assert result.provider_type == "openai"


@pytest.mark.asyncio
async def test_agent_execution_time_measurement(db_session: AsyncSession, ollama_agent: AgentConfig):
    """Test that execution time is properly measured."""
    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "Response"

        # Simulate delay in LLM response
        async def delayed_run(*args, **kwargs):
            import asyncio

            await asyncio.sleep(0.1)  # 100ms delay
            return mock_result

        mock_agent.run = delayed_run
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        result = await service.test_agent(ollama_agent.id, "Test")

        # Verify execution time is measured
        assert result.elapsed_time >= 0.1  # At least 100ms
        assert result.elapsed_time < 1.0  # Less than 1 second


@pytest.mark.asyncio
async def test_agent_with_custom_temperature(db_session: AsyncSession, ollama_provider: LLMProvider):
    """Test agent with custom temperature setting."""
    # Create agent with specific temperature
    agent = AgentConfig(
        name="Custom Temp Agent",
        provider_id=ollama_provider.id,
        model_name="llama3",
        system_prompt="Test",
        temperature=0.3,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "Response"
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        await service.test_agent(agent.id, "Test")

        # Verify model_settings includes temperature
        call_kwargs = mock_agent.run.call_args.kwargs
        assert "model_settings" in call_kwargs
        assert call_kwargs["model_settings"]["temperature"] == 0.3


@pytest.mark.asyncio
async def test_agent_with_max_tokens(db_session: AsyncSession, ollama_provider: LLMProvider):
    """Test agent with custom max_tokens setting."""
    # Create agent with specific max_tokens
    agent = AgentConfig(
        name="Max Tokens Agent",
        provider_id=ollama_provider.id,
        model_name="llama3",
        system_prompt="Test",
        max_tokens=500,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "Response"
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        await service.test_agent(agent.id, "Test")

        # Verify model_settings includes max_tokens
        call_kwargs = mock_agent.run.call_args.kwargs
        assert "model_settings" in call_kwargs
        assert call_kwargs["model_settings"]["max_tokens"] == 500


# ==================== ERROR SCENARIOS ====================


@pytest.mark.asyncio
async def test_agent_not_found(db_session: AsyncSession):
    """Test ValueError raised when agent doesn't exist."""
    service = AgentTestService(db_session)
    fake_uuid = uuid4()

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(fake_uuid, "Test prompt")

    assert "not found" in str(exc_info.value).lower()
    assert str(fake_uuid) in str(exc_info.value)


@pytest.mark.asyncio
async def test_provider_not_found(db_session: AsyncSession, ollama_provider: LLMProvider):
    """Test ValueError raised when provider is deleted after agent creation."""
    # Create agent
    agent = AgentConfig(
        name="Orphaned Agent",
        provider_id=ollama_provider.id,
        model_name="llama3",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    # Delete the provider
    await db_session.delete(ollama_provider)
    await db_session.commit()

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "provider" in str(exc_info.value).lower()
    assert "not found" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_inactive_provider_error(db_session: AsyncSession, inactive_provider: LLMProvider):
    """Test ValueError raised when provider is inactive."""
    # Create agent with inactive provider
    agent = AgentConfig(
        name="Agent with Inactive Provider",
        provider_id=inactive_provider.id,
        model_name="llama3",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "inactive" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_unvalidated_provider_error(db_session: AsyncSession, unvalidated_provider: LLMProvider):
    """Test ValueError raised when provider validation status is not 'connected'."""
    # Create agent with unvalidated provider
    agent = AgentConfig(
        name="Agent with Unvalidated Provider",
        provider_id=unvalidated_provider.id,
        model_name="llama3",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "not validated" in str(exc_info.value).lower()
    assert "pending" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_error_validation_status(db_session: AsyncSession, error_provider: LLMProvider):
    """Test ValueError raised when provider has error validation status."""
    # Create agent with error provider
    agent = AgentConfig(
        name="Agent with Error Provider",
        provider_id=error_provider.id,
        model_name="llama3",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "not validated" in str(exc_info.value).lower()
    assert "error" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_api_key_decryption_failure(db_session: AsyncSession, openai_provider: LLMProvider):
    """Test ValueError raised when API key decryption fails."""
    # Create agent
    agent = AgentConfig(
        name="Agent for Decryption Test",
        provider_id=openai_provider.id,
        model_name="gpt-4",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    # Mock decryption to raise exception
    with patch.object(CredentialEncryption, "decrypt", side_effect=Exception("Decryption failed")):
        service = AgentTestService(db_session)

        with pytest.raises(ValueError) as exc_info:
            await service.test_agent(agent.id, "Test")

        assert "failed to decrypt" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_llm_call_failure(db_session: AsyncSession, ollama_agent: AgentConfig):
    """Test Exception raised when LLM request fails."""
    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_agent.run = AsyncMock(side_effect=Exception("LLM API timeout"))
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)

        with pytest.raises(Exception) as exc_info:
            await service.test_agent(ollama_agent.id, "Test")

        assert "llm request failed" in str(exc_info.value).lower()


# ==================== MODEL BUILDING TESTS ====================


@pytest.mark.asyncio
async def test_build_model_ollama_without_base_url(db_session: AsyncSession, encryptor: CredentialEncryption):
    """Test ValueError raised when Ollama provider is missing base_url."""
    # Create provider without base_url
    provider = LLMProvider(
        name="Invalid Ollama",
        type=ProviderType.ollama,
        base_url=None,  # Missing!
        is_active=True,
        validation_status=ValidationStatus.connected,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    # Create agent
    agent = AgentConfig(
        name="Agent with Invalid Provider",
        provider_id=provider.id,
        model_name="llama3",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "base_url" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_build_model_openai_without_api_key(db_session: AsyncSession):
    """Test ValueError raised when OpenAI provider is missing API key."""
    # Create provider without API key
    provider = LLMProvider(
        name="Invalid OpenAI",
        type=ProviderType.openai,
        api_key_encrypted=None,  # Missing!
        is_active=True,
        validation_status=ValidationStatus.connected,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    # Create agent
    agent = AgentConfig(
        name="Agent without API Key",
        provider_id=provider.id,
        model_name="gpt-4",
        system_prompt="Test",
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    service = AgentTestService(db_session)

    with pytest.raises(ValueError) as exc_info:
        await service.test_agent(agent.id, "Test")

    assert "api key" in str(exc_info.value).lower()


# ==================== RESPONSE STRUCTURE VALIDATION ====================


@pytest.mark.asyncio
async def test_response_structure_contains_all_fields(db_session: AsyncSession, ollama_agent: AgentConfig):
    """Test that TestAgentResponse contains all expected fields."""
    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "Test response"
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        result = await service.test_agent(ollama_agent.id, "Test prompt")

        # Verify all required fields are present
        assert hasattr(result, "agent_id")
        assert hasattr(result, "agent_name")
        assert hasattr(result, "prompt")
        assert hasattr(result, "response")
        assert hasattr(result, "elapsed_time")
        assert hasattr(result, "model_name")
        assert hasattr(result, "provider_name")
        assert hasattr(result, "provider_type")

        # Verify field types
        assert isinstance(result.agent_id, UUID)
        assert isinstance(result.agent_name, str)
        assert isinstance(result.prompt, str)
        assert isinstance(result.response, str)
        assert isinstance(result.elapsed_time, float)
        assert isinstance(result.model_name, str)
        assert isinstance(result.provider_name, str)
        assert isinstance(result.provider_type, str)


@pytest.mark.asyncio
async def test_response_with_complex_llm_output(db_session: AsyncSession, ollama_agent: AgentConfig):
    """Test handling of complex LLM output (multiline, special chars)."""
    complex_output = """This is a multi-line response.

    It contains:
    - Bullet points
    - Special characters: !@#$%^&*()
    - Unicode: 你好世界 🌍

    And more text."""

    with patch("app.services.agent_service.PydanticAgent") as mock_agent_class:
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = complex_output
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        result = await service.test_agent(ollama_agent.id, "Test")

        assert result.response == complex_output


# ==================== ENCRYPTION/DECRYPTION TESTS ====================


@pytest.mark.asyncio
async def test_api_key_encryption_decryption_cycle(
    db_session: AsyncSession, openai_agent: AgentConfig, openai_provider: LLMProvider, encryptor: CredentialEncryption
):
    """Test that API key is properly decrypted when testing agent."""
    original_key = "sk-original-key-12345"

    # Update provider with new encrypted key
    openai_provider.api_key_encrypted = encryptor.encrypt(original_key)
    db_session.add(openai_provider)
    await db_session.commit()

    with (
        patch("app.services.agent_service.PydanticAgent") as mock_agent_class,
        patch("app.services.agent_service.OpenAIProvider") as mock_provider_class,
    ):
        mock_agent = AsyncMock()
        mock_result = Mock()
        mock_result.output = "Response"
        mock_agent.run = AsyncMock(return_value=mock_result)
        mock_agent_class.return_value = mock_agent

        service = AgentTestService(db_session)
        await service.test_agent(openai_agent.id, "Test")

        # Verify OpenAIProvider was called with decrypted key
        mock_provider_class.assert_called_once()
        call_kwargs = mock_provider_class.call_args.kwargs
        assert call_kwargs["api_key"] == original_key
