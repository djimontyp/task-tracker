"""Domain layer for LLM hexagonal architecture.

This package contains framework-agnostic domain models, protocols, and exceptions
that define the core contracts for LLM integration without depending on any
specific framework implementation.
"""

from app.llm.domain.exceptions import (
    AgentExecutionError,
    FrameworkNotSupportedError,
    InvalidConfigurationError,
    LLMDomainError,
    ModelCreationError,
    ProviderNotFoundError,
    StreamingNotSupportedError,
)
from app.llm.domain.models import (
    AgentConfig,
    AgentResult,
    ModelInfo,
    ProviderConfig,
    StreamEvent,
    ToolDefinition,
    UsageInfo,
)
from app.llm.domain.ports import AgentRegistry, LLMAgent, LLMFramework, ModelFactory

__all__ = [
    # Exceptions
    "LLMDomainError",
    "ProviderNotFoundError",
    "FrameworkNotSupportedError",
    "ModelCreationError",
    "AgentExecutionError",
    "InvalidConfigurationError",
    "StreamingNotSupportedError",
    # Models
    "AgentConfig",
    "AgentResult",
    "StreamEvent",
    "UsageInfo",
    "ToolDefinition",
    "ModelInfo",
    "ProviderConfig",
    # Protocols
    "LLMAgent",
    "LLMFramework",
    "ModelFactory",
    "AgentRegistry",
]
