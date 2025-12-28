# ADR-004: Message Broker - NATS JetStream vs Redis Streams vs Kafka

**Status:** Accepted
**Date:** 2025-12-28
**Decision makers:** Team

## Context

Pulse Radar requires a message broker for:

1. **Background task processing** - TaskIQ workers process async jobs (message scoring, embedding generation, LLM analysis)
2. **Cross-process communication** - Worker processes need to notify API processes about completed tasks
3. **WebSocket relay** - Worker → NATS → API → Browser for real-time updates
4. **Result storage** - TaskIQ needs a result backend to store task outputs

Current system scale:
- 100+ messages/day from Telegram
- 3 LLM agents (classification, extraction, analysis)
- Multiple async tasks: `score_message_task`, `embed_messages_batch`, `extract_knowledge`
- Real-time WebSocket topics: agents, tasks, providers, knowledge, messages, monitoring, metrics

## Decision

We chose **NATS JetStream** as the message broker with `taskiq-nats` integration.

```python
# core/taskiq_config.py
from taskiq_nats import NatsBroker, NATSObjectStoreResultBackend

nats_broker = NatsBroker(
    servers=settings.taskiq.taskiq_nats_servers,
    queue=settings.taskiq.taskiq_nats_queue,
    connect_timeout=10,
    drain_timeout=30,
    max_reconnect_attempts=-1,  # Endless reconnection
)

result_backend = NATSObjectStoreResultBackend(
    servers=settings.taskiq.taskiq_nats_servers
)
```

WebSocket cross-process relay:
```python
# WebSocketManager subscribes to NATS subjects
await self._nats_client.subscribe("websocket.{topic}", cb=self._handle_nats_message)

# Worker publishes to NATS
await self._nats_client.publish(f"websocket.{topic}", message_bytes)
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **NATS JetStream** | Lightweight (~15MB), built-in persistence, native Python async, unified pub/sub + queue, TaskIQ integration | Smaller ecosystem than Kafka, less enterprise adoption |
| **Redis Streams** | Already familiar, simple setup, good performance | No built-in persistence guarantees, requires separate pub/sub for WebSocket relay, memory-bound |
| **Apache Kafka** | Industry standard, proven at scale, rich ecosystem | Heavy (~500MB+ JVM), complex setup, overkill for current scale, no native Python async |
| **RabbitMQ** | Mature, AMQP standard, good Python support | Heavier than NATS, more complex routing than needed, Erlang dependency |

## Detailed Comparison

### Message Durability

| Broker | Durability Model |
|--------|------------------|
| NATS JetStream | Persistent streams with configurable retention (time, size, count) |
| Redis Streams | AOF persistence, but memory-first design |
| Kafka | Log-based persistence, configurable retention |

For Pulse Radar: NATS JetStream provides sufficient durability for task results and message replay without Kafka's complexity.

### Resource Footprint

| Broker | Memory | Disk | Dependencies |
|--------|--------|------|--------------|
| NATS | ~15-50MB | Minimal | Single binary |
| Redis | ~50-100MB+ | AOF/RDB | Single binary |
| Kafka | ~500MB-1GB | Log storage | JVM, Zookeeper/KRaft |

For a Docker Compose setup, NATS's minimal footprint is ideal.

### Python Integration

| Broker | TaskIQ Support | Async Native |
|--------|----------------|--------------|
| NATS | `taskiq-nats` (official) | Yes (`nats-py`) |
| Redis | `taskiq-redis` (official) | Yes (`redis.asyncio`) |
| Kafka | `taskiq-aio-kafka` | Partial |

### Cross-Process Communication

NATS excels at the Worker → API → WebSocket pattern:

```
┌─────────────┐     NATS     ┌─────────────┐     WS     ┌─────────────┐
│   Worker    │ ──────────►  │     API     │ ────────►  │   Browser   │
│  (TaskIQ)   │  publish     │  (FastAPI)  │  send      │  (React)    │
└─────────────┘              └─────────────┘            └─────────────┘
     │                             │
     │ nats_broker.kiq()           │ subscribe("websocket.*")
     ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        NATS JetStream                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ task.queue   │  │ websocket.*  │  │ results.obj  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

Redis would require separate Redis Pub/Sub for WebSocket relay (separate from Streams for tasks), adding complexity.

## Consequences

**Positive:**

- Unified message infrastructure for tasks, WebSocket relay, and results
- Minimal resource usage in Docker Compose environment
- Native async support with `nats-py` library
- Built-in persistence via JetStream without external dependencies
- Simple horizontal scaling if needed (NATS cluster)
- Heartbeat and reconnection handling out of the box

**Negative:**

- Smaller community than Redis/Kafka (fewer Stack Overflow answers)
- Team may need to learn NATS concepts (subjects, streams, consumers)
- Less mature monitoring/observability tools compared to Kafka
- Potential migration cost if scaling requires Kafka-level features

**Mitigations:**

- NATS documentation is excellent and concise
- For current scale (100+ messages/day), NATS is more than sufficient
- If migration needed, task interface via TaskIQ abstracts the broker

## Implementation Details

### Docker Compose Configuration

```yaml
nats:
  image: nats:2.10-alpine
  command: ["--jetstream", "--store_dir=/data"]
  volumes:
    - nats_data:/data
  ports:
    - "4222:4222"   # Client connections
    - "8222:8222"   # HTTP monitoring
```

### TaskIQ Integration

```python
# Tasks use nats_broker
@nats_broker.task
async def score_message_task(message_id: str) -> dict:
    ...

# Results stored in NATS Object Store
result = await task.kiq(message_id)
output = await result.wait_result()
```

### WebSocket Manager Startup

```python
async def startup(self, nats_servers: str) -> None:
    self._nats_client = NATSClient()
    await self._nats_client.connect(servers=nats_servers)

    if not self._is_worker:
        # API process subscribes to relay topics
        for topic in ["agents", "tasks", "providers", "knowledge", "messages", "monitoring", "metrics"]:
            await self._nats_client.subscribe(f"websocket.{topic}", cb=self._handle_nats_message)
```

## References

- [NATS JetStream Documentation](https://docs.nats.io/nats-concepts/jetstream)
- [taskiq-nats GitHub](https://github.com/taskiq-python/taskiq-nats)
- [NATS vs Kafka vs Redis Comparison](https://docs.nats.io/compare-nats)
- [Pulse Radar WebSocket Manager](../../../backend/app/services/websocket_manager.py)
- [Pulse Radar TaskIQ Config](../../../backend/core/taskiq_config.py)
