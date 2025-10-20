"""LLM Hexagonal Architecture.

Domain-driven design with framework independence for LLM integration.

Architecture Layers:
------------------

1. **domain/** - Framework-agnostic core
   - ports.py: Protocol interfaces (contracts)
   - models.py: Domain data models
   - exceptions.py: Domain-specific errors

2. **infrastructure/** - Framework-specific adapters (future)
   - adapters/pydantic_ai/: Pydantic AI implementation
   - adapters/langchain/: LangChain implementation (future)
   - adapters/llamaindex/: LlamaIndex implementation (future)

3. **application/** - Business logic orchestration (future)
   - orchestrator.py: Agent lifecycle management
   - resolver.py: Dynamic provider/framework selection
   - registry.py: Agent registry implementation

4. **services/** - High-level application services (future)
   - proposal_service.py: Task proposal generation
   - classification_service.py: Message classification
   - extraction_service.py: Knowledge extraction

Design Principles:
-----------------

- **Dependency Inversion**: Domain depends on abstractions (Protocols), not implementations
- **Framework Independence**: Business logic never imports Pydantic AI/LangChain directly
- **Substitutability**: Any adapter can be swapped without changing domain logic
- **Type Safety**: Full type hints with Protocol structural subtyping
- **Async-First**: All interfaces are async for scalability

Key Concepts:
------------

- **Ports (Protocols)**: Interfaces defining contracts (LLMAgent, LLMFramework, ModelFactory)
- **Adapters**: Concrete implementations for specific frameworks
- **Domain Models**: Framework-agnostic data structures (AgentConfig, AgentResult)
- **Orchestrator**: Coordinates agent creation and execution
- **Resolver**: Selects appropriate framework/provider based on configuration

Usage Example:
-------------

```python
from app.llm.domain.ports import LLMFramework
from app.llm.domain.models import AgentConfig, ProviderConfig

# Domain layer only depends on abstractions
framework: LLMFramework = get_framework_adapter("pydantic-ai")

agent_config = AgentConfig(
    name="proposal_generator",
    model_name="llama3",
    system_prompt="You are a task proposal assistant.",
)

provider_config = ProviderConfig(
    provider_type="ollama",
    base_url="http://localhost:11434",
)

agent = await framework.create_agent(agent_config, provider_config)
result = await agent.run("Analyze these messages...")
```

Migration Path:
--------------

Current: app/services/llm_proposal_service.py (direct Pydantic AI usage)
Phase 1: Create domain layer (this package) ✅
Phase 2: Create Pydantic AI adapter
Phase 3: Implement orchestrator and resolver
Phase 4: Migrate existing services to use domain layer
Phase 5: Add support for additional frameworks (LangChain, etc.)
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
