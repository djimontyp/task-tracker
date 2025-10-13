"""Agent testing service with LLM integration.

Provides functionality to test agent configurations with custom prompts
using pydantic-ai for structured LLM interactions.
"""

import logging
import time
from uuid import UUID

from pydantic import BaseModel, Field
from pydantic_ai import Agent as PydanticAgent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.settings import ModelSettings
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import AgentConfig, LLMProvider, ProviderType, ValidationStatus
from app.services.credential_encryption import CredentialEncryption

logger = logging.getLogger(__name__)


class TestAgentRequest(BaseModel):
    """Request schema for testing an agent."""

    prompt: str = Field(min_length=1, max_length=5000, description="Test prompt to send to the agent")


class TestAgentResponse(BaseModel):
    """Response schema for agent test results."""

    agent_id: UUID = Field(description="UUID of the tested agent")
    agent_name: str = Field(description="Name of the tested agent")
    prompt: str = Field(description="Prompt that was sent to the agent")
    response: str = Field(description="Agent's response from LLM")
    elapsed_time: float = Field(description="Time taken to get response in seconds")
    model_name: str = Field(description="Model used for the test")
    provider_name: str = Field(description="Provider name")
    provider_type: str = Field(description="Provider type (ollama, openai)")


class AgentTestService:
    """Service for testing agent configurations with LLM providers."""

    def __init__(self, session: AsyncSession):
        """Initialize the agent test service.

        Args:
            session: Async database session
        """
        self.session = session
        self.encryptor = CredentialEncryption()

    async def test_agent(self, agent_id: UUID, test_prompt: str) -> TestAgentResponse:
        """Test an agent configuration with a custom prompt.

        Args:
            agent_id: UUID of the agent to test
            test_prompt: Prompt to send to the LLM

        Returns:
            Test response with LLM output and metadata

        Raises:
            ValueError: If agent not found, provider not found, or validation failed
            Exception: If LLM request fails
        """
        # Load agent configuration
        agent = await self.session.get(AgentConfig, agent_id)
        if not agent:
            raise ValueError(f"Agent with ID '{agent_id}' not found")

        # Load associated provider
        provider = await self.session.get(LLMProvider, agent.provider_id)
        if not provider:
            raise ValueError(f"Provider with ID '{agent.provider_id}' not found. Agent configuration is invalid.")

        # Verify provider is validated and active
        if not provider.is_active:
            raise ValueError(f"Provider '{provider.name}' is inactive. Please activate the provider before testing.")

        if provider.validation_status != ValidationStatus.connected:
            raise ValueError(
                f"Provider '{provider.name}' is not validated "
                f"(status: {provider.validation_status}). "
                "Please validate the provider before testing."
            )

        # Get API key if needed and build model
        api_key = None
        if provider.api_key_encrypted:
            try:
                api_key = self.encryptor.decrypt(provider.api_key_encrypted)
            except Exception as e:
                raise ValueError(f"Failed to decrypt API key for provider '{provider.name}': {e}")

        # Build model instance with provider configuration
        model = self._build_model_instance(provider, agent.model_name, api_key)

        # Create pydantic-ai agent
        start_time = time.time()

        try:
            pydantic_agent = PydanticAgent(
                model=model,
                system_prompt=agent.system_prompt,
            )

            # Build model settings
            model_settings_obj: ModelSettings | None = None
            if agent.temperature is not None or agent.max_tokens is not None:
                model_settings_obj = {}
                if agent.temperature is not None:
                    model_settings_obj["temperature"] = agent.temperature
                if agent.max_tokens is not None:
                    model_settings_obj["max_tokens"] = agent.max_tokens

            # Run the agent
            result = await pydantic_agent.run(
                test_prompt,
                model_settings=model_settings_obj,
            )

            elapsed_time = time.time() - start_time

            # Extract response text
            response_text = str(result.output)

            logger.info(f"Successfully tested agent '{agent.name}' (elapsed: {elapsed_time:.2f}s)")

            return TestAgentResponse(
                agent_id=agent.id,
                agent_name=agent.name,
                prompt=test_prompt,
                response=response_text,
                elapsed_time=elapsed_time,
                model_name=agent.model_name,
                provider_name=provider.name,
                provider_type=provider.type.value,
            )

        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(
                f"Agent test failed for '{agent.name}' after {elapsed_time:.2f}s: {e}",
                exc_info=True,
            )
            raise Exception(f"LLM request failed: {str(e)}. Check provider configuration and connectivity.") from e

    def _build_model_instance(
        self,
        provider: LLMProvider,
        model_name: str,
        api_key: str | None = None,
    ) -> OpenAIChatModel:
        """Build pydantic-ai model instance from provider configuration.

        Args:
            provider: LLM provider configuration
            model_name: Name of the model to use
            api_key: Decrypted API key (if required)

        Returns:
            Configured model instance for pydantic-ai

        Raises:
            ValueError: If provider type is unsupported
        """
        from pydantic_ai.models.openai import OpenAIChatModel
        from pydantic_ai.providers.ollama import OllamaProvider
        from pydantic_ai.providers.openai import OpenAIProvider

        if provider.type == ProviderType.ollama:
            # For Ollama, create provider with base_url
            if not provider.base_url:
                raise ValueError(
                    f"Provider '{provider.name}' is missing base_url. "
                    "Ollama providers require a base_url configuration."
                )

            ollama_provider = OllamaProvider(base_url=provider.base_url)
            return OpenAIChatModel(
                model_name=model_name,
                provider=ollama_provider,
            )

        elif provider.type == ProviderType.openai:
            # For OpenAI, create provider with API key
            if not api_key:
                raise ValueError(
                    f"Provider '{provider.name}' requires an API key. OpenAI providers must have an API key configured."
                )

            openai_provider = OpenAIProvider(api_key=api_key)
            return OpenAIChatModel(
                model_name=model_name,
                provider=openai_provider,
            )

        else:
            raise ValueError(f"Unsupported provider type: {provider.type}. Supported types: ollama, openai")
