# Hexagonal LLM Architecture

<domain-layer>
Location: `backend/app/llm/domain/`

**models.py** — Domain entities:
- `AgentConfig` — Agent configuration (model, prompt, settings)
- `AgentResult[T]` — Typed execution result
- `ProviderConfig` — Provider settings (URL, API key)
- `StreamEvent` — Streaming event types
- `ModelInfo` — Model metadata

**ports.py** — Protocol interfaces:
- `LLMAgent[T]` — Framework-agnostic agent interface
- `LLMFramework` — Framework adapter interface
- `ModelFactory` — Model creation factory
- `AgentRegistry` — Agent lifecycle management

**exceptions.py** — Domain exceptions:
- `AgentExecutionError`
- `ModelCreationError`
- `InvalidConfigurationError`
</domain-layer>

<infrastructure-layer>
Location: `backend/app/llm/infrastructure/adapters/pydantic_ai/`

**adapter.py** — `PydanticAIFramework`:
- Implements `LLMFramework` protocol
- Creates agents from config
- Manages provider factories

**agent_wrapper.py** — `PydanticAIAgentWrapper[T]`:
- Wraps native Pydantic AI agent
- Implements `LLMAgent[T]` protocol
- Converts results to domain types

**factories/**:
- `ollama.py` — `OllamaModelFactory`
- `openai.py` — `OpenAIModelFactory`
</infrastructure-layer>

<application-layer>
Location: `backend/app/llm/application/`

**llm_service.py** — High-level operations:
- Agent execution
- Provider management
- Result caching

**framework_registry.py** — Framework management:
- Register/get frameworks
- Default framework selection

**provider_resolver.py** — Provider configuration:
- Resolve provider by type
- Decrypt API keys
- Validate connectivity
</application-layer>

<knowledge-layer>
Location: `backend/app/services/knowledge/`

**llm_agents.py** — Prompts and model building:
- `KNOWLEDGE_EXTRACTION_PROMPT_UK` / `_EN`
- `get_extraction_prompt(language)`
- `build_model_instance(agent_config, provider, api_key)`
- `validate_output_language(text, expected_language)`

**knowledge_orchestrator.py** — Main extraction logic:
- `KnowledgeOrchestrator.extract_knowledge()`
- Topic/Atom creation from LLM output
- Language retry logic

**knowledge_schemas.py** — Pydantic output types:
- `ExtractedTopic` — Topic with confidence, keywords
- `ExtractedAtom` — Atom with type, content, links
- `KnowledgeExtractionOutput` — Full extraction result
</knowledge-layer>
