# ADR-007: Real-time Communication - Native WebSocket vs SSE vs Socket.IO

**Status:** Accepted
**Date:** 2025-12-28
**Decision makers:** Team

## Context

Pulse Radar requires real-time updates for:

1. **Message ingestion progress** - Show Telegram message processing status
2. **Knowledge extraction events** - Notify when atoms/topics are created
3. **Task monitoring** - Display TaskIQ job status (started/completed/failed)
4. **Metrics updates** - Push system metrics to dashboard
5. **Connection health** - Heartbeat/ping-pong for connection monitoring

Communication patterns:
- Server → Client: Most events (push updates)
- Client → Server: Subscribe/unsubscribe to topics, heartbeat pong
- Cross-process: Worker → NATS → API → Browser

Current WebSocket topics:
```python
topics = [
    "agents",      # Agent CRUD events
    "tasks",       # Task status changes
    "providers",   # LLM provider updates
    "knowledge",   # Extraction events
    "messages",    # Message processing
    "monitoring",  # TaskIQ job tracking
    "metrics",     # System metrics
]
```

## Decision

We chose **native WebSocket** implementation with topic-based pub/sub pattern.

```python
# WebSocket endpoint with topic subscriptions
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    topics: str | None = None,      # Comma-separated topic list
    lastSeq: str | None = None,     # For message replay on reconnect
) -> None:
    conn_id = await websocket_manager.connect(websocket, topic_list, accept=True)
    # ...
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Native WebSocket** | Full bidirectional, FastAPI native, lightweight, full control | No auto-reconnect, manual protocol, more implementation work |
| **Server-Sent Events (SSE)** | Simple, auto-reconnect, HTTP-based | Unidirectional (server→client only), no binary support |
| **Socket.IO** | Auto-reconnect, rooms, fallback transports, rich features | Heavy dependency (~300KB), different protocol, overkill for needs |
| **WebSocket + Pusher/Ably** | Managed service, global scale, presence | Vendor lock-in, cost, external dependency, latency |

## Detailed Comparison

### Communication Patterns

| Protocol | Server → Client | Client → Server | Bidirectional |
|----------|----------------|-----------------|---------------|
| WebSocket | Yes | Yes | Full duplex |
| SSE | Yes | No (requires separate requests) | No |
| Socket.IO | Yes | Yes | Full duplex |

Pulse Radar needs client → server for:
- Topic subscribe/unsubscribe
- Heartbeat pong responses
- Future: user actions, filters

SSE would require separate REST endpoints for client→server, complicating the architecture.

### Browser Support

| Protocol | Chrome | Firefox | Safari | Edge | IE11 |
|----------|--------|---------|--------|------|------|
| WebSocket | Yes | Yes | Yes | Yes | Yes |
| SSE | Yes | Yes | Yes | Yes | Polyfill |
| Socket.IO | Yes | Yes | Yes | Yes | Yes |

All options have excellent browser support. IE11 is not a concern for Pulse Radar.

### Reconnection Handling

| Protocol | Auto-Reconnect | State Recovery |
|----------|---------------|----------------|
| WebSocket | Manual | Manual (lastSeq pattern) |
| SSE | Built-in (EventSource) | Built-in (Last-Event-ID) |
| Socket.IO | Built-in | Built-in (with acks) |

We implemented manual reconnection with sequence-based replay:

```python
# Client reconnects with lastSeq
ws.connect(`/ws?topics=messages,knowledge&lastSeq=messages:142,knowledge:89`)

# Server replays missed messages
async def _replay_missed_messages(websocket, topics, last_sequences):
    for topic in topics:
        since_seq = last_sequences[topic]
        missed_messages = await message_buffer.get_since(topic, since_seq)
        for msg in missed_messages:
            await websocket.send_text(json.dumps(msg))
```

### Bundle Size Impact

| Option | Size | Additional Dependencies |
|--------|------|------------------------|
| Native WebSocket | 0KB (browser native) | None |
| SSE | 0KB (EventSource native) | None |
| Socket.IO | ~300KB (client library) | socket.io-client |

### FastAPI Integration

| Option | Integration | Implementation |
|--------|-------------|----------------|
| WebSocket | Native (`@app.websocket`) | Built-in |
| SSE | Via StreamingResponse | Manual generator |
| Socket.IO | python-socketio | Separate ASGI app |

```python
# Native WebSocket - clean FastAPI integration
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # ...

# SSE - requires StreamingResponse
@router.get("/events")
async def sse_endpoint():
    async def event_generator():
        while True:
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Socket.IO - separate ASGI mount
sio = socketio.AsyncServer(async_mode='asgi')
app.mount("/socket.io", socketio.ASGIApp(sio))
```

## Implementation Details

### WebSocket Manager Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocketManager                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Connection Storage                                         │ │
│  │  ┌────────────────────┐  ┌────────────────────┐            │ │
│  │  │ _connections       │  │ _conn_by_id        │            │ │
│  │  │ topic → {id: conn} │  │ id → ConnectionInfo│            │ │
│  │  └────────────────────┘  └────────────────────┘            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cross-Process (NATS)                                       │ │
│  │  Worker → publish("websocket.{topic}") → API → broadcast   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Heartbeat System                                           │ │
│  │  Ping every 20s → Client pong → Track last_pong            │ │
│  │  Stale after 30s → Auto-disconnect                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Connection Lifecycle

```python
@dataclass
class ConnectionInfo:
    id: str                    # 8-char UUID
    websocket: WebSocket
    topics: set[str]           # Subscribed topics
    connected_at: datetime
    last_pong: datetime        # For stale detection
```

### Topic-Based Broadcasting

```python
async def broadcast(self, topic: str, message: dict) -> None:
    """Route message based on process type."""
    if self._is_worker:
        # Worker process: publish to NATS
        await self._broadcast_via_nats(topic, message)
    else:
        # API process: broadcast to local connections
        await self._broadcast_local(topic, message)
```

### Message Protocol

**Server → Client:**
```json
// Heartbeat ping
{"type": "ping", "ts": 1703750400000}

// Connection confirmation
{"type": "connection", "data": {"status": "connected", "connectionId": "abc12345", "topics": ["messages"]}}

// Event with sequence (for replay)
{"topic": "knowledge", "event": "atom_created", "data": {...}, "_seq": 143}
```

**Client → Server:**
```json
// Subscribe to topic
{"action": "subscribe", "topic": "metrics"}

// Unsubscribe from topic
{"action": "unsubscribe", "topic": "tasks"}

// Heartbeat pong
{"action": "pong"}
```

### Heartbeat System

```python
class WebSocketManager:
    PING_INTERVAL = 20  # Send ping every 20 seconds
    PONG_TIMEOUT = 30   # Disconnect if no pong within 30 seconds

    async def _start_heartbeat_loop(self) -> None:
        while True:
            await asyncio.sleep(self.PING_INTERVAL)
            await self._send_pings()
            await self._cleanup_stale_connections()

    async def _cleanup_stale_connections(self) -> None:
        now = datetime.now(UTC)
        for conn_info in self._conn_by_id.values():
            if (now - conn_info.last_pong) > timedelta(seconds=self.PONG_TIMEOUT):
                await self.disconnect(conn_id=conn_info.id)
```

### Message Buffer for Replay

```python
class MessageBuffer:
    """Ring buffer for storing recent messages per topic."""

    async def add(self, topic: str, message: dict) -> int:
        """Add message and return sequence number."""
        seq = self._next_seq(topic)
        self._buffers[topic].append({"_seq": seq, **message})
        return seq

    async def get_since(self, topic: str, since_seq: int) -> list[dict]:
        """Get all messages with seq > since_seq."""
        return [m for m in self._buffers[topic] if m["_seq"] > since_seq]
```

## Consequences

**Positive:**

- Full bidirectional communication for future features
- No external dependencies (browser-native WebSocket API)
- Full control over protocol and reconnection logic
- Seamless FastAPI integration
- Topic-based pub/sub scales well
- Cross-process via NATS works reliably
- Sequence-based replay handles reconnections

**Negative:**

- More implementation work than Socket.IO
- Manual reconnection logic in frontend
- No built-in rooms/namespaces (implemented via topics)
- Need to handle edge cases (stale connections, network issues)

**Mitigations:**

- Implemented robust heartbeat system for connection health
- Message buffer with sequences for replay on reconnect
- Topic-based architecture provides room-like functionality
- Stale connection cleanup prevents resource leaks

## Frontend Integration

### React Hook Pattern

```typescript
function useWebSocket(topics: string[]) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSeq, setLastSeq] = useState<Record<string, number>>({});

  useEffect(() => {
    const topicsParam = topics.join(',');
    const seqParam = Object.entries(lastSeq)
      .map(([t, s]) => `${t}:${s}`)
      .join(',');

    const ws = new WebSocket(
      `/ws?topics=${topicsParam}&lastSeq=${seqParam}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ action: 'pong' }));
        return;
      }

      if (data._seq && data.topic) {
        setLastSeq(prev => ({ ...prev, [data.topic]: data._seq }));
      }

      // Handle event...
    };

    return () => ws.close();
  }, [topics]);

  return { isConnected };
}
```

## When to Reconsider

Consider **Socket.IO** if:
- Need complex room management with presence
- Require long-polling fallback for restrictive networks
- Team is already familiar with Socket.IO patterns

Consider **SSE** if:
- Only need server→client updates
- Want simpler reconnection (EventSource auto-reconnect)
- No client→server real-time needs

## References

- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [FastAPI WebSocket Documentation](https://fastapi.tiangolo.com/advanced/websockets/)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Pulse Radar WebSocket Manager](../../../backend/app/services/websocket_manager.py)
- [Pulse Radar WebSocket Router](../../../backend/app/ws/router.py)
