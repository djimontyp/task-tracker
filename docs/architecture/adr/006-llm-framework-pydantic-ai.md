# ADR-006: LLM Framework - Pydantic AI vs LangChain

**Status:** Accepted
**Date:** 2025-12-28
**Decision makers:** Team

## Context

Pulse Radar requires an LLM framework for:

1. **Classification agent** - Categorize messages (signal/noise) with confidence scores
2. **Extraction agent** - Extract entities (projects, components, tags) from messages
3. **Analysis agent** - Generate structured insights from message content
4. **Multi-provider support** - Work with OpenAI and Ollama (local) models
5. **Structured output** - Return Pydantic models, not just strings

Key requirements:
- Type-safe outputs with Pydantic models
- Async-first for FastAPI integration
- Streaming support for real-time UI updates
- Provider abstraction for OpenAI and Ollama
- Minimal abstraction overhead

Current agent usage:
```python
# 3 agents with structured outputs
Classification → MessageClassification (Pydantic model)
Extraction → ExtractedEntities (Pydantic model)
Analysis → StructuredAnalysis (Pydantic model)
```

## Decision

We chose **Pydantic AI** over LangChain for LLM agent implementation.

```python
# Pydantic AI agent creation
from pydantic_ai import Agent as PydanticAgent

pydantic_agent = PydanticAgent(
    model=model,
    output_type=output_type,  # Pydantic model class
    system_prompt=system_prompt,
    deps_type=deps_type,
    model_settings=model_settings,
)

# Run with type-safe output
result = await agent.run("Analyze this message")
# result.output is already validated Pydantic model
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Pydantic AI** | Native Pydantic integration, type-safe outputs, minimal abstraction, async-first, lightweight | Newer library, smaller ecosystem, fewer integrations |
| **LangChain** | Huge ecosystem, many integrations, extensive documentation, battle-tested | Heavy abstraction, complex chains, type safety bolted on, sync-first design |
| **LlamaIndex** | Excellent for RAG, good data connectors | Focused on retrieval, overkill for agents, heavy dependency |
| **OpenAI SDK Direct** | Zero abstraction, full control, official | No structured output, manual provider switching, more boilerplate |
| **Instructor** | Excellent Pydantic integration, structured outputs | No streaming, no tool support, simpler than agents need |

## Detailed Comparison

### Type Safety

| Framework | Structured Output | Type Inference | Runtime Validation |
|-----------|------------------|----------------|-------------------|
| Pydantic AI | Native (output_type param) | Full IDE support | Automatic |
| LangChain | Output parsers (bolted on) | Limited | Manual setup |
| OpenAI SDK | JSON mode only | None | Manual |

Pydantic AI example:
```python
class MessageClassification(BaseModel):
    category: str
    confidence: float
    reasoning: str

agent = Agent(model=model, output_type=MessageClassification)
result = await agent.run(prompt)
# result.output.confidence  <- IDE knows this is float
```

LangChain equivalent:
```python
from langchain.output_parsers import PydanticOutputParser

parser = PydanticOutputParser(pydantic_object=MessageClassification)
chain = prompt | llm | parser
result = chain.invoke({"input": prompt})
# Type inference often breaks in complex chains
```

### Async Support

| Framework | Async Native | Streaming | FastAPI Integration |
|-----------|--------------|-----------|---------------------|
| Pydantic AI | Yes (async def everywhere) | run_stream() | Seamless |
| LangChain | Mixed (async + sync APIs) | astream() | Requires adapters |

### Abstraction Level

| Framework | Lines of Code for Agent | Learning Curve | Debugging |
|-----------|------------------------|----------------|-----------|
| Pydantic AI | ~20 lines | Low | Straightforward |
| LangChain | ~50+ lines | High | Chain debugging complex |

### Provider Abstraction

Both support multiple providers, but differently:

```python
# Pydantic AI - explicit factory pattern
class PydanticAIFramework:
    _factories = {
        "ollama": OllamaModelFactory(),
        "openai": OpenAIModelFactory(),
    }

# LangChain - implicit via model class
from langchain_openai import ChatOpenAI
from langchain_community.llms import Ollama
```

## Architecture: Hexagonal Approach

We wrapped Pydantic AI in a hexagonal architecture for framework independence:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AgentConfig, AgentResult, ProviderConfig (models.py)    │  │
│  │  LLMAgent, LLMFramework, ModelFactory (ports.py)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PydanticAIFramework (adapter.py)                        │  │
│  │  PydanticAIAgentWrapper (agent_wrapper.py)               │  │
│  │  OllamaModelFactory, OpenAIModelFactory (factories/)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

This allows:
- Switching LLM framework without changing business logic
- Testing with mock agents
- Adding new providers without touching domain code

### Domain Protocol

```python
class LLMAgent(Protocol[T]):
    """Framework-agnostic agent interface."""

    async def run(self, prompt: str, dependencies: Any = None) -> AgentResult[T]:
        ...

    async def stream(self, prompt: str, dependencies: Any = None) -> AsyncIterator[StreamEvent]:
        ...

    def supports_streaming(self) -> bool:
        ...
```

### Pydantic AI Adapter

```python
class PydanticAIAgentWrapper(Generic[T]):
    """Wraps Pydantic AI agent to implement domain protocol."""

    def __init__(self, agent: PydanticAgent, config: AgentConfig):
        self._agent = agent
        self._config = config

    async def run(self, prompt: str, dependencies: Any = None) -> AgentResult[T]:
        result = await self._agent.run(prompt, deps=dependencies)
        return AgentResult(
            output=result.output,
            usage=self._convert_usage(result.usage),
            messages=result.messages,
        )
```

## Consequences

**Positive:**

- Type-safe outputs without boilerplate (native Pydantic integration)
- Minimal abstraction - easy to understand and debug
- Async-first design matches FastAPI patterns
- Lightweight dependency (~1MB vs ~50MB for LangChain)
- Framework independence via hexagonal adapter pattern
- Streaming support for real-time UI updates

**Negative:**

- Smaller ecosystem than LangChain (fewer pre-built chains)
- Newer library (less Stack Overflow coverage)
- Team may need to build more custom components
- Fewer integrations (vector stores, document loaders, etc.)

**Mitigations:**

- For complex RAG, can use LlamaIndex for retrieval + Pydantic AI for generation
- Hexagonal architecture allows framework switch if needed
- Pydantic AI documentation is excellent for core use cases

## Implementation Details

### Project Structure

```
backend/app/llm/
├── __init__.py
├── startup.py                    # App startup/shutdown
├── domain/
│   ├── models.py                 # AgentConfig, AgentResult, etc.
│   ├── ports.py                  # LLMAgent, LLMFramework protocols
│   └── exceptions.py             # Domain exceptions
├── application/
│   ├── llm_service.py            # High-level LLM operations
│   ├── framework_registry.py     # Framework management
│   └── provider_resolver.py      # Provider configuration
└── infrastructure/
    └── adapters/
        └── pydantic_ai/
            ├── adapter.py        # PydanticAIFramework
            ├── agent_wrapper.py  # PydanticAIAgentWrapper
            ├── converters.py     # Config converters
            └── factories/
                ├── base.py
                ├── ollama.py     # OllamaModelFactory
                └── openai.py     # OpenAIModelFactory
```

### Factory Pattern for Providers

```python
class OllamaModelFactory:
    async def create_model(self, provider_config: ProviderConfig, model_name: str):
        from pydantic_ai.models.ollama import OllamaModel
        return OllamaModel(
            model_name=model_name,
            base_url=provider_config.base_url,
        )

class OpenAIModelFactory:
    async def create_model(self, provider_config: ProviderConfig, model_name: str):
        from pydantic_ai.models.openai import OpenAIModel
        return OpenAIModel(
            model_name=model_name,
            api_key=provider_config.api_key,
        )
```

### Usage in Business Logic

```python
# Clean business logic, no framework details
async def classify_message(message: Message) -> MessageClassification:
    agent = await framework.create_agent(
        config=AgentConfig(
            name="classifier",
            model_name="gpt-4",
            output_type=MessageClassification,
            system_prompt="Classify the following message...",
        ),
        provider_config=provider_config,
    )
    result = await agent.run(message.content)
    return result.output  # Type-safe MessageClassification
```

## When to Reconsider

Consider LangChain if:
- Need complex multi-step chains with memory
- Require extensive document processing (use LlamaIndex instead)
- Team is already familiar with LangChain patterns
- Need LangSmith observability integration

Consider direct OpenAI SDK if:
- Only need OpenAI with simple prompts
- Want zero abstraction overhead
- Don't need structured outputs

## References

- [Pydantic AI Documentation](https://ai.pydantic.dev/)
- [LangChain Documentation](https://docs.langchain.com/)
- [Pydantic AI vs LangChain Discussion](https://ai.pydantic.dev/faq/)
- [Pulse Radar LLM Domain](../../../backend/app/llm/domain/)
- [Pulse Radar Pydantic AI Adapter](../../../backend/app/llm/infrastructure/adapters/pydantic_ai/)
- [Hexagonal Architecture Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
