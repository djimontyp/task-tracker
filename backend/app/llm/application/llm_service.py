"""LLM Service - High-level service for LLM operations."""

import logging
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.llm.application.framework_registry import FrameworkRegistry
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.models import AgentConfig, AgentResult, ProviderConfig
from app.llm.domain.ports import LLMAgent, LLMFramework
from app.models import LLMProvider
from app.services.provider_crud import ProviderCRUD

logger = logging.getLogger(__name__)


def provider_to_config(provider: LLMProvider, crud: ProviderCRUD) -> ProviderConfig:
    """Convert database LLMProvider to domain ProviderConfig.

    Args:
        provider: Database provider model
        crud: Provider CRUD for decrypting API keys

    Returns:
        Domain provider configuration
    """
    return ProviderConfig(
        provider_type=provider.type.value,
        base_url=provider.base_url,
        api_key=None,
        timeout=None,
        max_retries=None,
        metadata=None,
    )


class LLMService:
    """High-level service for LLM operations.

    Orchestrates:
    - Framework selection (Pydantic AI, future LangChain)
    - Provider resolution (DB → Settings → Defaults)
    - Agent creation and execution

    This service is framework-agnostic and uses dependency injection
    for all LLM operations.

    Usage:
        service = LLMService(provider_resolver, framework="pydantic_ai")

        agent = await service.create_agent(
            session=session,
            config=AgentConfig(...),
            provider_name="Ollama Local"
        )

        result = await agent.run("Analyze this text")
    """

    def __init__(
        self,
        provider_resolver: ProviderResolver,
        framework_name: str | None = None,
    ):
        """Initialize LLM service.

        Args:
            provider_resolver: Resolver for provider lookup
            framework_name: Framework to use (None = default from registry)
        """
        self.provider_resolver = provider_resolver
        self.framework: LLMFramework = FrameworkRegistry.get(framework_name)
        self.framework_name = framework_name or "default"

        logger.info(f"LLMService initialized with framework: {self.framework_name}")

    async def create_agent(
        self,
        session: AsyncSession,
        config: AgentConfig,
        provider_name: str | None = None,
        provider_id: UUID | None = None,
    ) -> LLMAgent[Any]:
        """Create agent for task execution.

        Args:
            session: Database session
            config: Agent configuration (model, prompts, settings)
            provider_name: Optional provider name
            provider_id: Optional provider UUID

        Returns:
            Configured LLMAgent ready for execution

        Raises:
            ProviderNotFoundError: If provider not found
            ModelCreationError: If model creation fails

        Example:
            config = AgentConfig(
                name="text_classifier",
                model_name="llama3.2:latest",
                system_prompt="You are a text classifier...",
                output_type=TextClassification,
                temperature=0.7,
            )

            agent = await service.create_agent(session, config)
            result = await agent.run("Classify this text")
        """
        provider = await self.provider_resolver.resolve(
            session=session,
            provider_name=provider_name,
            provider_id=provider_id,
        )

        logger.info(
            f"Creating agent '{config.name}' with provider '{provider.name}' using framework '{self.framework_name}'"
        )

        provider_config = provider_to_config(provider, self.provider_resolver.crud)

        try:
            agent = await self.framework.create_agent(config=config, provider_config=provider_config)
            logger.info(f"Agent '{config.name}' created successfully")
            return agent
        except Exception as e:
            logger.error(
                f"Failed to create agent '{config.name}': {e}",
                exc_info=True,
            )
            raise

    async def execute_prompt(
        self,
        session: AsyncSession,
        config: AgentConfig,
        prompt: str,
        provider_name: str | None = None,
        dependencies: Any = None,
    ) -> AgentResult[Any]:
        """Create agent and execute prompt in one call.

        Convenience method that combines create_agent() + agent.run().

        Args:
            session: Database session
            config: Agent configuration
            prompt: User prompt to execute
            provider_name: Optional provider name
            dependencies: Optional dependencies for agent

        Returns:
            AgentResult with output and metadata

        Example:
            result = await service.execute_prompt(
                session=session,
                config=AgentConfig(...),
                prompt="Classify this message: ...",
            )

            print(result.output)
            print(result.usage.total_tokens)
        """
        agent = await self.create_agent(
            session=session,
            config=config,
            provider_name=provider_name,
        )

        logger.info(f"Executing prompt with agent '{config.name}'")
        return await agent.run(prompt=prompt, dependencies=dependencies)

    def supports_streaming(self) -> bool:
        """Check if current framework supports streaming."""
        return self.framework.supports_streaming()
