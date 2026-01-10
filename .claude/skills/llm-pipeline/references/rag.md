# RAG & CAG Context Strategies

<rag-vs-cag>
## RAG vs CAG in Pulse Radar

| Approach | Description | Use in Pulse Radar |
|----------|-------------|-------------------|
| **RAG** | Dynamic retrieval via embeddings | Messages, Atoms — semantic search |
| **CAG** | Preloaded static context | **Project** — keywords, glossary, components |

**CAG (Context-Augmented Generation):**
- Preload entire context into LLM prompt (no retrieval step)
- Works with long-context models (128K+ tokens)
- Faster inference, simpler architecture
- Ideal for: Project glossaries, domain rules, static knowledge

**Pulse Radar Hybrid Approach:**
```
┌─────────────────────────────────────────┐
│           EXTRACTION PROMPT             │
├─────────────────────────────────────────┤
│ 1. BASE PROMPT (hardcoded schema)       │  ← Static
│ 2. PROJECT CONTEXT (CAG - preloaded)    │  ← CAG
│    • keywords: ["flutter", "crash"]     │
│    • glossary: {"ANR": "App Not..."}    │
│    • components: ["auth", "payments"]   │
│ 3. RAG CONTEXT (retrieved)              │  ← RAG
│    • similar_atoms (semantic search)    │
│    • related_messages (history)         │
│ 4. AGENT CUSTOMIZATION (user edits)     │  ← Static
└─────────────────────────────────────────┘
```

**When to use:**
- **CAG:** Project config, stable glossaries, domain rules (< changes)
- **RAG:** Messages, atoms — dynamic, frequently updated
- **Hybrid:** Best of both — preload Project, retrieve relevant history

References:
- [Context-Augmented Generation](https://www.helicone.ai/blog/implement-and-monitor-cag)
- [CAG vs RAG](https://www.montecarlodata.com/blog-rag-vs-cag/)
- [Don't Do RAG (arXiv)](https://arxiv.org/abs/2412.15605)
</rag-vs-cag>

<semantic-search>
```python
# SemanticSearchService uses pgvector
from sqlalchemy import select
from pgvector.sqlalchemy import Vector

# Cosine similarity search
query = select(Atom).order_by(
    Atom.embedding.cosine_distance(query_embedding)
).limit(limit).where(
    Atom.embedding.cosine_distance(query_embedding) < (1 - threshold)
)

# threshold 0.65 = similarity > 0.35
```
</semantic-search>

<context-assembly>
```python
class RAGContextBuilder:
    async def build_context(
        self,
        query: str,
        similar_atoms: list[Atom],
        related_messages: list[Message],
        max_tokens: int = 4000,
    ) -> str:
        """Assemble context for LLM prompt."""
        context_parts = []

        # 1. Similar atoms (highest priority)
        for atom in similar_atoms[:5]:
            context_parts.append(f"[{atom.type}] {atom.title}: {atom.content}")

        # 2. Related messages (raw context)
        for msg in related_messages[:10]:
            context_parts.append(f"- {msg.content[:200]}")

        return "\n\n".join(context_parts)
```
</context-assembly>

<embedding-dimensions>
| Provider | Model | Dimensions |
|----------|-------|------------|
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |
| Ollama | mxbai-embed-large | 1024 → pad to 1536 |
| Ollama | nomic-embed-text | 768 → pad to 1536 |

**Note:** pgvector column is fixed at 1536. Smaller embeddings are zero-padded.
</embedding-dimensions>

<embedding-service>
```python
# EmbeddingService location: backend/app/services/embedding_service.py

# Generate single embedding
embedding = await embedding_service.generate_embedding(text)

# Batch embedding (more efficient)
await embedding_service.embed_messages_batch(
    session=session,
    message_ids=ids,
    batch_size=10,
)

# Atom embedding
await embedding_service.embed_atoms_batch(
    session=session,
    atom_ids=ids,
    batch_size=10,
)
```
</embedding-service>

<caching>
```python
# Embeddings are computed once and cached in DB
# Re-embedding triggered by:
# 1. Content change
# 2. Embedding model change (provider switch)
# 3. Manual re-index via API

await embedding_service.embed_if_needed(atom, force=False)
```
</caching>

<taskiq-workers>
```python
# Location: backend/app/tasks/knowledge.py

# Embedding tasks
@broker.task
async def embed_messages_batch_task(message_ids: list[str]):
    ...

@broker.task
async def embed_atoms_batch_task(atom_ids: list[str]):
    ...

# Auto-triggered after extraction
await embed_atoms_batch_task.kiq(new_atom_ids)
```
</taskiq-workers>
