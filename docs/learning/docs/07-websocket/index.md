# Module 07: WebSocket

**Real-time updates через native WebSocket**

---

## 🎯 Що це

**WebSocket** - bidirectional connection для real-time updates. Замість polling (запит кожні 5 сек) → server push.

**Key pattern:** Native WebSocket API → topic subscriptions → TanStack Query invalidation

---

## 🔄 Backend аналогія

| Backend (FastAPI) | Frontend (WebSocket) |
|-------------------|---------------------|
| `@router.websocket("/ws")` | `new WebSocket(url)` |
| Connection lifecycle | open/close/error events |
| `await websocket.send()` | `socket.send()` |
| Topic filtering | `?topics=analysis,proposals` |
| Reconnection logic | Exponential backoff |

```python
# Backend
@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    while True:
        data = await ws.receive_json()
        await ws.send_json({"type": "update"})

# Frontend (analog)
const socket = new WebSocket('ws://localhost/ws')
socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // Handle update
}
```

---

## 📂 У твоєму проекті

**WebSocket hook:**
- `src/features/websocket/hooks/useWebSocket.ts:64-286` - повна реалізація

**Key features:**
- Topic subscriptions: `?topics=analysis,proposals,knowledge`
- Exponential backoff: 1s → 2s → 4s → 8s → 16s
- Max 5 reconnect attempts
- TanStack Query integration (invalidateQueries)
- Connection states: connecting, connected, reconnecting, disconnected

**Environment:**
- `VITE_WS_HOST` - WebSocket host
- `VITE_WS_PATH` - WebSocket path

---

## 💡 Ключові концепції

### 1. Native WebSocket API
Не socket.io-client (dead dependency!), native browser WebSocket

### 2. Topic Subscriptions
`/ws?topics=analysis,proposals` - фільтрація message types

### 3. Exponential Backoff Reconnection
1s, 2s, 4s, 8s, 16s (max 5 attempts)

### 4. Connection States
`connecting` → `connected` → `reconnecting` → `disconnected`

### 5. Query Invalidation Integration
WebSocket message → `queryClient.invalidateQueries()` → auto refetch

### 6. Cleanup
`useEffect` return → `socket.close()` on unmount

---

## ✅ Коли використовувати

- ✅ Real-time updates (chat, notifications)
- ✅ Live data streams
- ✅ Collaborative editing
- ✅ Progress updates

## ❌ Коли НЕ використовувати

- ❌ Simple CRUD (use TanStack Query refetch)
- ❌ One-time data fetch
- ❌ Static content

---

## 🚫 Типові Помилки

### 1. Забутий Cleanup (Memory Leak)

```tsx
// ❌ НЕ РОБИ: WebSocket без cleanup
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws')

  ws.onmessage = (event) => {
    console.log(event.data)
  }
  // ❌ Немає cleanup - connection залишається відкритою після unmount!
}, [])

// ✅ РОБИ: Завжди cleanup WebSocket
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws')

  ws.onmessage = (event) => {
    console.log(event.data)
  }

  return () => {
    ws.close()  // ✅ Закрий connection при unmount
  }
}, [])
```

**Чому:** Відкриті connections = memory leak + server навантаження.

**Backend Аналогія:**
```python
# FastAPI WebSocket з cleanup
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
    finally:
        await websocket.close()  # Cleanup
```

---

### 2. Немає Reconnection Logic

```tsx
// ❌ НЕ РОБИ: Один connection attempt - падає назавжди
const ws = new WebSocket('ws://localhost:8000/ws')

ws.onerror = () => {
  console.log('Connection failed')  // ❌ І все - користувач втратив real-time
}

// ✅ РОБИ: Exponential backoff reconnection
function useWebSocket(url: string) {
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onclose = () => {
      const delay = Math.min(1000 * (2 ** attempt), 30000)  // 1s, 2s, 4s, 8s, ...max 30s
      setTimeout(() => {
        setAttempt(a => a + 1)  // Trigger reconnect
      }, delay)
    }

    return () => ws.close()
  }, [url, attempt])
}
```

**Чому:** Network може падати (wifi issues, server restart). Треба auto-reconnect.

**Exponential Backoff:** 1s → 2s → 4s → 8s → 16s (уникає server overload)

---

### 3. Забутий Heartbeat / Ping

```tsx
// ❌ НЕ РОБИ: Без heartbeat - connection може "зависнути"
const ws = new WebSocket('ws://localhost:8000/ws')
// ❌ Connection може бути закритою, але ви не знаєте!

// ✅ РОБИ: Periodic ping для перевірки connection
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws')

  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }))  // ✅ Heartbeat
    }
  }, 30000)  // Ping every 30s

  return () => {
    clearInterval(pingInterval)  // ✅ Cleanup interval
    ws.close()
  }
}, [])
```

**Чому:** WebSocket connection може "зависнути" без явного error. Heartbeat виявляє dead connections.

**Backend Pong:**
```python
# Backend повинен відповідати на ping
if message["type"] == "ping":
    await websocket.send_json({"type": "pong"})
```

---

### 4. Нескінченний Reconnect Без Max Attempts

```tsx
// ❌ НЕ РОБИ: Infinite reconnect loop - server overload
ws.onclose = () => {
  setTimeout(connect, 1000)  // ❌ Завжди reconnect - навіть якщо server down
}

// ✅ РОБИ: Max attempts з fallback
const MAX_ATTEMPTS = 5

ws.onclose = () => {
  if (attempt < MAX_ATTEMPTS) {
    setTimeout(connect, delay)
  } else {
    showNotification('WebSocket unavailable')  // ✅ User feedback
  }
}
```

**Чому:** Якщо server down → infinite reconnect = DDoS на власний server.

---

### 5. Не Обробляють Різні Message Types

```tsx
// ❌ НЕ РОБИ: Весь код в onmessage - нечитабельно
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // 100 рядків if/else для різних message types
  if (data.type === 'notification') { ... }
  if (data.type === 'update') { ... }
  if (data.type === 'delete') { ... }
}

// ✅ РОБИ: Message handler pattern
type MessageHandler = {
  [key: string]: (data: any) => void
}

const handlers: MessageHandler = {
  notification: (data) => showToast(data.message),
  update: (data) => queryClient.invalidateQueries(['projects']),
  delete: (data) => queryClient.removeQueries(['projects', data.id]),
}

ws.onmessage = (event) => {
  const { type, ...data } = JSON.parse(event.data)
  handlers[type]?.(data)  // ✅ Clean dispatch
}
```

**Backend Аналогія:**
```python
# FastAPI router pattern (similar)
@router.get("/users")
async def get_users(): ...

@router.post("/users")
async def create_user(): ...

# WebSocket message routing (similar concept)
```

---

## 📚 Офіційна документація

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) ✅
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455) ✅

---

## 🛠️ Практика

1. Відкрий `src/features/websocket/hooks/useWebSocket.ts`
2. Подивись reconnection logic (exponential backoff)
3. Знайди використання в компонентах
4. Перевір WebSocket в DevTools → Network → WS
5. Зупини backend → подивись reconnection attempts

**Estimated time:** 2-3 години

---

## ❓ FAQ

**Q: Чому не socket.io-client?**
A: Native WebSocket простіший, менше dependencies, socket.io-client dead у твоєму проекті.

**Q: Як працює exponential backoff?**
A: 1s delay після 1st fail, 2s після 2nd, 4s, 8s, 16s. Max 5 attempts.

**Q: Що робити якщо 5 attempts failed?**
A: Show error toast, button "Reconnect" для manual retry.

---

**Далі:** [Native WebSocket Deep Dive](native-websocket.md) | [useWebSocket Hook Breakdown](useWebSocket-hook.md)

**Повернутись до:** [Learning Home](../index.md)
