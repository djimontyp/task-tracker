---
name: llm-pipeline
description: Pydantic-AI agents, RAG, embeddings for Pulse Radar knowledge extraction.
---

# LLM Pipeline Skill

## Pipeline Flow
```
Telegram Message
      ↓
[save_telegram_message] → TaskIQ
      ↓
[score_message_task] → ImportanceScorer (4 factors)
      ↓
[KnowledgeOrchestrator] → Topics + Atoms (if threshold met)
      ↓
[embed_*_batch_task] → pgvector (1536 dims)
      ↓
[SemanticSearchService] → RAG context
```

## Pydantic AI Agent Pattern
```python
from pydantic_ai import Agent
from pydantic import BaseModel

class ExtractionResult(BaseModel):
    topics: list[ExtractedTopic]
    atoms: list[ExtractedAtom]

extraction_agent = Agent(
    model="openai:gpt-4o-mini",
    result_type=ExtractionResult,
    system_prompt="You are a knowledge extraction expert...",
    output_retries=5,  # Retry on invalid JSON
)

result = await extraction_agent.run(messages_content)
```

## Key Thresholds
```python
# backend/app/config/ai_config.py
message_threshold: 10      # Trigger extraction
confidence_threshold: 0.7  # Auto-create atoms
semantic_search: 0.65      # RAG retrieval
```

## Providers
```python
# OpenAI
Agent(model="openai:gpt-4o-mini")  # $0.15/$0.60 per 1M
Agent(model="openai:gpt-4o")       # $2.50/$10 per 1M

# Ollama (free, local)
Agent(model="ollama:llama3.2")
```

## Embedding Service
```python
# OpenAI: 1536 dimensions
# Ollama: 768 → padded to 1536

await embedding_service.generate_embedding(text)
await embedding_service.embed_messages_batch(session, ids, batch_size=10)
```

## References
- @references/pydantic-ai.md — Agent configuration, streaming
- @references/rag.md — RAG context building
- @references/embeddings.md — Embedding service details