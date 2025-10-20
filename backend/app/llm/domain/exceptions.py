"""Domain-specific exceptions for LLM layer.

These exceptions represent domain-level failures in the LLM hexagonal architecture.
All exceptions are framework-agnostic and can be raised by any adapter implementation.
"""


class LLMDomainError(Exception):
    """Base exception for all LLM domain errors.

    All custom LLM-related exceptions should inherit from this base class
    to enable consistent error handling across the domain layer.
    """

    pass


class ProviderNotFoundError(LLMDomainError):
    """Provider not found in registry or database.

    Raised when attempting to use a provider that doesn't exist or
    cannot be located in the system configuration.
    """

    pass


class FrameworkNotSupportedError(LLMDomainError):
    """Framework not supported by current adapter registry.

    Raised when attempting to use an LLM framework that hasn't been
    registered or implemented in the system.
    """

    pass


class ModelCreationError(LLMDomainError):
    """Failed to create model instance from provider configuration.

    Raised when model instantiation fails due to invalid configuration,
    missing credentials, connectivity issues, or framework-specific errors.
    """

    pass


class AgentExecutionError(LLMDomainError):
    """Agent execution failed during runtime.

    Raised when agent.run() or agent.stream() encounters errors during
    execution, such as API failures, timeout issues, or invalid responses.
    """

    pass


class InvalidConfigurationError(LLMDomainError):
    """Agent or provider configuration is invalid.

    Raised when configuration validation fails before agent creation,
    such as missing required fields or invalid parameter values.
    """

    pass


class StreamingNotSupportedError(LLMDomainError):
    """Framework does not support streaming operations.

    Raised when attempting to use streaming on a framework that doesn't
    support it or when streaming is explicitly disabled.
    """

    pass
