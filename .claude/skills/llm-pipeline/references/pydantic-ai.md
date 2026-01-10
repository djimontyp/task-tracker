# Pydantic AI Patterns

<structured-output>
```python
from pydantic_ai import Agent
from pydantic import BaseModel

class ExtractionResult(BaseModel):
    topics: list[ExtractedTopic]
    atoms: list[ExtractedAtom]

# CRITICAL: output_type forces JSON schema in prompt
agent = Agent(
    model=model,
    output_type=ExtractionResult,  # ← Forces structured response
    system_prompt="Extract knowledge...",
    output_retries=5,  # ← Retry on invalid JSON
)

result = await agent.run(content)
# result.output is ExtractionResult, not str!
```
</structured-output>

<streaming>
```python
# Streaming is INCOMPATIBLE with output_type!
# Two separate endpoints needed:

# 1. Structured output (no streaming)
agent = Agent(output_type=MyModel)
result = await agent.run(prompt)

# 2. Streaming (text only)
agent = Agent()  # NO output_type
async with agent.run_stream(prompt) as stream:
    async for chunk in stream.stream_text():
        yield chunk
```

See: `.obsidian-docs/знання/паттерни/optional-streaming-llm.md`
</streaming>

<model-settings>
```python
from pydantic_ai.settings import ModelSettings

settings = ModelSettings(
    temperature=0.3,  # Low for extraction (factual)
    max_tokens=4096,
    timeout=180,  # 3 min for slow local models
)

agent = Agent(
    model=model,
    model_settings=settings,
)
```
</model-settings>

<provider-creation>
```python
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider
from pydantic_ai.providers.openai import OpenAIProvider

# Ollama (local)
ollama_model = OpenAIChatModel(
    model_name="qwen3:14b",
    provider=OllamaProvider(base_url="http://192.168.3.27:11434"),
)

# OpenAI (cloud)
openai_model = OpenAIChatModel(
    model_name="gpt-4o-mini",
    provider=OpenAIProvider(api_key="sk-..."),
)
```
</provider-creation>

<error-handling>
```python
from pydantic_ai import UnexpectedModelBehavior
import asyncio

try:
    result = await asyncio.wait_for(
        agent.run(prompt),
        timeout=180,  # 3 min
    )
except UnexpectedModelBehavior as e:
    # Invalid JSON after all retries
    logger.error(f"Model failed to produce valid JSON: {e}")
    raise
except asyncio.TimeoutError:
    raise HTTPException(504, "Agent test timed out")
```
</error-handling>

<common-issues>
| Problem | Solution |
|---------|----------|
| JSON wrapped in ```json | Use `output_type` with retry |
| Model returns English | Use `get_strengthened_prompt()` |
| Slow response (>60s) | Increase nginx timeout to 180s |
| `<think>` tags in output | Switch from deepseek-r1 to qwen3 |
| embedding 404 | Use `/api/embeddings` not `/api/embed` |
</common-issues>
