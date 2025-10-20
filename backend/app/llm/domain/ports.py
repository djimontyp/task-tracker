"""Framework-agnostic Protocol interfaces for LLM layer.

These Protocol interfaces define the contracts for LLM framework adapters.
They enable framework independence by defining what operations must be supported
without specifying how they're implemented.

Protocol Pattern Benefits:
- Structural subtyping (duck typing with type safety)
- No need to explicitly inherit from base classes
- Framework adapters can implement these contracts naturally
- Easy to mock/test with any object that matches the protocol
"""

from collections.abc import AsyncIterator
from typing import Any, Protocol, TypeVar

from app.llm.domain.models import AgentConfig, AgentResult, ModelInfo, ProviderConfig, StreamEvent


T = TypeVar("T")


class LLMAgent(Protocol[T]):
    """Framework-agnostic agent interface.

    Defines the contract for any LLM agent implementation regardless of
    underlying framework (Pydantic AI, LangChain, LlamaIndex, etc.)

    Type parameter T represents the output type of the agent.
    """

    async def run(
        self,
        prompt: str,
        dependencies: Any = None,
    ) -> AgentResult[T]:
        """Run agent synchronously and return complete result.

        Args:
            prompt: Input prompt/user message
            dependencies: Optional dependencies (DB session, context, etc.)

        Returns:
            Complete agent result with output and metadata

        Raises:
            AgentExecutionError: If execution fails
        """
        ...

    async def stream(
        self,
        prompt: str,
        dependencies: Any = None,
    ) -> AsyncIterator[StreamEvent]:
        """Stream agent execution for progressive output.

        Args:
            prompt: Input prompt/user message
            dependencies: Optional dependencies (DB session, context, etc.)

        Yields:
            Stream events as they occur during generation

        Raises:
            AgentExecutionError: If execution fails
            StreamingNotSupportedError: If streaming not supported
        """
        ...

    def supports_streaming(self) -> bool:
        """Check if agent supports streaming operations.

        Returns:
            True if agent can use stream() method
        """
        ...

    def get_config(self) -> AgentConfig:
        """Get agent configuration.

        Returns:
            Current agent configuration
        """
        ...


class ModelFactory(Protocol):
    """Factory for creating framework-specific models from provider configurations.

    Abstracts model instantiation so business logic doesn't depend on
    framework-specific model creation APIs.
    """

    async def create_model(
        self,
        provider_config: ProviderConfig,
        model_name: str,
    ) -> Any:
        """Create framework-specific model instance.

        Args:
            provider_config: Provider configuration (URLs, keys, etc.)
            model_name: Model identifier/name

        Returns:
            Framework-specific model instance (type depends on adapter)

        Raises:
            ModelCreationError: If model creation fails
            InvalidConfigurationError: If configuration is invalid
        """
        ...

    async def validate_provider(
        self,
        provider_config: ProviderConfig,
    ) -> tuple[bool, str | None]:
        """Validate provider configuration and connectivity.

        Args:
            provider_config: Provider configuration to validate

        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if provider is accessible and valid
            - error_message: None if valid, otherwise error description
        """
        ...

    def get_model_info(
        self,
        model: Any,
    ) -> ModelInfo:
        """Get metadata about a model instance.

        Args:
            model: Framework-specific model instance

        Returns:
            Model information and capabilities
        """
        ...

    def supports_provider(
        self,
        provider_type: str,
    ) -> bool:
        """Check if factory supports a provider type.

        Args:
            provider_type: Provider type string (e.g., 'ollama', 'openai')

        Returns:
            True if provider type is supported
        """
        ...


class LLMFramework(Protocol):
    """Framework adapter interface.

    Top-level protocol for an LLM framework adapter. Orchestrates agent creation
    and provides framework-level capabilities.
    """

    async def create_agent(
        self,
        config: AgentConfig,
        provider_config: ProviderConfig,
    ) -> LLMAgent[Any]:
        """Create agent from configuration.

        Args:
            config: Agent configuration (prompt, model, settings)
            provider_config: Provider configuration

        Returns:
            Configured agent instance

        Raises:
            ModelCreationError: If model creation fails
            InvalidConfigurationError: If configuration is invalid
            FrameworkNotSupportedError: If framework can't handle config
        """
        ...

    def supports_streaming(self) -> bool:
        """Check if framework supports streaming operations.

        Returns:
            True if framework can create streaming agents
        """
        ...

    def supports_tools(self) -> bool:
        """Check if framework supports tool calling.

        Returns:
            True if framework can use tools/functions
        """
        ...

    def get_framework_name(self) -> str:
        """Get framework name/identifier.

        Returns:
            Framework name (e.g., 'pydantic-ai', 'langchain')
        """
        ...

    def get_model_factory(self) -> ModelFactory:
        """Get model factory for this framework.

        Returns:
            Model factory instance
        """
        ...


class AgentRegistry(Protocol):
    """Registry for managing multiple agent instances.

    Provides lookup and lifecycle management for agents used throughout
    the application.
    """

    async def register_agent(
        self,
        name: str,
        agent: LLMAgent[Any],
    ) -> None:
        """Register an agent instance.

        Args:
            name: Unique agent name/identifier
            agent: Agent instance to register

        Raises:
            ValueError: If agent name already exists
        """
        ...

    async def get_agent(
        self,
        name: str,
    ) -> LLMAgent[Any] | None:
        """Get agent by name.

        Args:
            name: Agent name/identifier

        Returns:
            Agent instance if found, None otherwise
        """
        ...

    async def unregister_agent(
        self,
        name: str,
    ) -> bool:
        """Unregister an agent instance.

        Args:
            name: Agent name/identifier

        Returns:
            True if agent was unregistered, False if not found
        """
        ...

    async def list_agents(self) -> list[str]:
        """List all registered agent names.

        Returns:
            List of agent names
        """
        ...

    async def clear(self) -> None:
        """Clear all registered agents.

        Useful for testing and cleanup.
        """
        ...
