"""Infrastructure Layer - Framework Adapters

This layer contains concrete implementations of domain protocols
using specific LLM frameworks (Pydantic AI, future LangChain, etc.).

Each adapter translates domain operations into framework-specific calls,
maintaining framework independence at the domain and application layers.

Available Adapters:
- PydanticAIFramework: Adapter for Pydantic AI framework

Architecture:
    Domain Layer (protocols) → Infrastructure Layer (adapters) → Framework

The infrastructure layer is the only place where framework-specific
code exists, keeping the domain layer clean and portable.
"""

from app.llm.infrastructure.adapters.pydantic_ai import PydanticAIFramework

__all__ = ["PydanticAIFramework"]
