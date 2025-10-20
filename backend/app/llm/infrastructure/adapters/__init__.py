"""Framework adapters for LLM hexagonal architecture.

This package contains concrete implementations of domain protocols
for different LLM frameworks (Pydantic AI, future LangChain, etc.).

Each adapter translates domain operations into framework-specific calls.
"""

from app.llm.infrastructure.adapters.pydantic_ai import PydanticAIFramework

__all__ = ["PydanticAIFramework"]
