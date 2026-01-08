---
title: "Optional Streaming для LLM тестування"
created: 2026-01-08
tags:
  - паттерн
  - llm
  - streaming
  - sse
  - pydantic-ai
status: active
---

# Optional Streaming для LLM тестування

## Проблема

При тестуванні LLM агентів є дві потреби:
1. **Structured output** - валідований JSON з типами (надійніше)
2. **Real-time feedback** - бачити відповідь поступово (краще UX)

Pydantic-AI `stream_text()` не працює зі structured output (`output_type`).

## Рішення

Зробити streaming **опційним** через UI toggle:

```
┌─────────────────────────────────────┐
│ [  ] Streaming (real-time)          │
└─────────────────────────────────────┘
```

### Backend: Два endpoints

```python
# Non-streaming - structured output
@router.post("/{agent_id}/test")
async def test_agent(...):
    pydantic_agent = Agent(output_type=KnowledgeExtractionOutput)
    result = await asyncio.wait_for(
        pydantic_agent.run(prompt),
        timeout=180
    )
    return AgentTestResponse(response=result.model_dump_json())

# Streaming - text only, no validation
@router.post("/{agent_id}/test-stream")
async def test_agent_stream(...):
    pydantic_agent = Agent()  # NO output_type!
    async with pydantic_agent.run_stream(prompt) as streamed:
        async for chunk in streamed.stream_text():
            yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
```

### Frontend: Mode switch

```tsx
const [streamingEnabled, setStreamingEnabled] = useState(false)
const isPending = streamingEnabled ? isStreaming : testMutation.isPending

const handleTest = () => {
  if (streamingEnabled) {
    startStream(agent.id, prompt)  // SSE
  } else {
    testMutation.mutate(prompt)    // REST
  }
}
```

## Ключові деталі

| Режим | Output | Валідація | UX |
|-------|--------|-----------|-----|
| Non-streaming | Structured JSON | Pydantic | Чекаємо результат |
| Streaming | Raw text | Немає | Real-time feedback |

### SSE Headers (важливо для nginx)

```python
return StreamingResponse(
    event_generator(),
    media_type="text/event-stream",
    headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",  # Disable nginx buffering!
    }
)
```

### Timeout

```python
AGENT_TEST_TIMEOUT_SECONDS = 180  # 3 хвилини

try:
    result = await asyncio.wait_for(agent.run(prompt), timeout=180)
except asyncio.TimeoutError:
    raise HTTPException(504, "Agent test timed out")
```

## Коли використовувати

- **Streaming OFF** (default): production testing, потрібна валідація
- **Streaming ON**: debugging, хочемо бачити що генерує LLM

## Пов'язане

- [[архітектура/websocket-architecture]]
- [[концепції/llm-pipeline]]
- Pydantic-AI docs: streaming
