"""Pydantic AI adapter for LLM hexagonal architecture.

This package implements domain protocols using Pydantic AI framework,
providing framework-specific adapters while maintaining domain independence.

Main components:
- adapter: PydanticAIFramework - Main framework adapter
- agent_wrapper: Wraps Pydantic AI agents in domain protocol
- factories: Provider-specific model factories (Ollama, OpenAI)
- converters: Domain ↔ Pydantic AI type conversions
"""

from app.llm.infrastructure.adapters.pydantic_ai.adapter import PydanticAIFramework
from app.llm.infrastructure.adapters.pydantic_ai.agent_wrapper import PydanticAIAgentWrapper
from app.llm.infrastructure.adapters.pydantic_ai.converters import (
    agent_config_to_model_settings,
    extract_messages_from_result,
    pydantic_usage_to_domain,
)
from app.llm.infrastructure.adapters.pydantic_ai.factories import (
    OllamaModelFactory,
    OpenAIModelFactory,
)

__all__ = [
    "PydanticAIFramework",
    "PydanticAIAgentWrapper",
    "OllamaModelFactory",
    "OpenAIModelFactory",
    "agent_config_to_model_settings",
    "pydantic_usage_to_domain",
    "extract_messages_from_result",
]
