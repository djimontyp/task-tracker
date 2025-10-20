"""Main Pydantic AI adapter implementing LLMFramework protocol.

This module provides the top-level adapter that orchestrates agent creation,
provider handling, and framework integration for Pydantic AI.
"""

from typing import Any

from pydantic_ai import Agent as PydanticAgent

from app.llm.domain.exceptions import FrameworkNotSupportedError, InvalidConfigurationError
from app.llm.domain.models import AgentConfig, ProviderConfig
from app.llm.domain.ports import LLMAgent, LLMFramework, ModelFactory
from app.llm.infrastructure.adapters.pydantic_ai.agent_wrapper import PydanticAIAgentWrapper
from app.llm.infrastructure.adapters.pydantic_ai.converters import agent_config_to_model_settings
from app.llm.infrastructure.adapters.pydantic_ai.factories import OllamaModelFactory, OpenAIModelFactory


class PydanticAIFramework:
    """Pydantic AI adapter implementing LLMFramework protocol.

    This adapter translates domain-level LLM operations into Pydantic AI
    framework calls, maintaining framework independence at the domain layer.

    The adapter maintains a registry of provider-specific factories and
    orchestrates agent creation by:
    1. Selecting appropriate factory for provider type
    2. Creating framework-specific model via factory
    3. Converting domain config to Pydantic AI settings
    4. Creating Pydantic AI agent
    5. Wrapping agent in domain protocol implementation

    Attributes:
        _factories: Registry mapping provider types to model factories
    """

    def __init__(self) -> None:
        """Initialize Pydantic AI framework adapter.

        Creates factory registry with built-in support for Ollama and OpenAI.
        Additional factories can be registered by extending this class.
        """
        self._factories: dict[str, ModelFactory] = {
            "ollama": OllamaModelFactory(),
            "openai": OpenAIModelFactory(),
        }

    async def create_agent(
        self,
        config: AgentConfig,
        provider_config: ProviderConfig,
    ) -> LLMAgent[Any]:
        """Create agent from configuration.

        Orchestrates the complete agent creation flow:
        1. Validates provider type is supported
        2. Gets appropriate factory for provider
        3. Creates model via factory
        4. Converts domain config to Pydantic AI settings
        5. Creates Pydantic AI agent
        6. Wraps in domain protocol implementation

        Args:
            config: Agent configuration (prompt, model, settings)
            provider_config: Provider configuration

        Returns:
            Configured agent instance wrapped in domain protocol

        Raises:
            FrameworkNotSupportedError: If provider type not supported
            InvalidConfigurationError: If configuration is invalid
            ModelCreationError: If model creation fails

        Example:
            >>> framework = PydanticAIFramework()
            >>> config = AgentConfig(name="test", model_name="gpt-4", ...)
            >>> provider = ProviderConfig(provider_type="openai", api_key="...")
            >>> agent = await framework.create_agent(config, provider)
            >>> result = await agent.run("Analyze this")
        """
        factory = self._factories.get(provider_config.provider_type)
        if not factory:
            supported_types = list(self._factories.keys())
            raise FrameworkNotSupportedError(
                f"Provider type '{provider_config.provider_type}' not supported by Pydantic AI adapter. "
                f"Supported types: {supported_types}"
            )

        model = await factory.create_model(provider_config, config.model_name)

        model_settings = agent_config_to_model_settings(config)

        output_type = config.output_type if config.output_type else str
        deps_type = config.deps_type if config.deps_type else type(None)
        system_prompt = config.system_prompt if config.system_prompt else ""

        pydantic_agent = PydanticAgent(
            model=model,
            output_type=output_type,
            system_prompt=system_prompt,
            deps_type=deps_type,
            model_settings=model_settings,
        )

        wrapper: LLMAgent[Any] = PydanticAIAgentWrapper(pydantic_agent, config)  # type: ignore[assignment]
        return wrapper

    def supports_streaming(self) -> bool:
        """Check if framework supports streaming operations.

        Pydantic AI supports streaming via run_stream() method.

        Returns:
            True (Pydantic AI always supports streaming)
        """
        return True

    def supports_tools(self) -> bool:
        """Check if framework supports tool calling.

        Pydantic AI supports tool calling via @agent.tool decorator.

        Returns:
            True (Pydantic AI supports tool calling)
        """
        return True

    def get_framework_name(self) -> str:
        """Get framework name/identifier.

        Returns:
            Framework name ('pydantic-ai')
        """
        return "pydantic-ai"

    def get_model_factory(self) -> ModelFactory:
        """Get model factory for this framework.

        Returns the default factory (Ollama) for general use.
        For specific provider types, use the internal factory registry.

        Returns:
            Ollama model factory (as default)

        Note:
            This method returns a default factory for protocol compliance.
            In practice, factories are selected based on provider type
            during agent creation.
        """
        return self._factories["ollama"]
