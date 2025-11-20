# WebSocket + TanStack Query Sync

**Real-time updates через query invalidation**

---

## 🎯 Integration Pattern

**Pattern**: WebSocket message → parse event → `invalidateQueries()` → auto refetch.

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'

function MessagesPage() {
  const queryClient = useQueryClient()

  useWebSocket({
    topics: ['messages'],  // Subscribe to topics
    onMessage: (event) => {
      const data = JSON.parse(event.data)

      // Invalidate relevant queries → refetch
      if (data.type === 'message_created') {
        queryClient.invalidateQueries({ queryKey: ['messages'] })
      }
    },
  })

  // useQuery automatically refetches after invalidation
  const { data } = useQuery({
    queryKey: ['messages'],
    queryFn: () => messageService.getMessages(),
  })

  return <MessageList messages={data} />
}
```

**Flow**:
1. WebSocket receives event: `{ type: "message_created", payload: {...} }`
2. Parse message → check type
3. `invalidateQueries(['messages'])` → mark query as stale
4. TanStack Query **automatically refetches** messages query
5. UI updates з новими data

**Backend analog**:
```python
# Backend: Database trigger + notification
@event.listens_for(Message, 'after_insert')
def notify_message_created(mapper, connection, target):
    # Send WebSocket event
    await websocket_manager.broadcast({
        "type": "message_created",
        "payload": target.dict()
    })

# Frontend: WebSocket listener + query invalidation
ws.onmessage = (event) => {
    if (event.type === 'message_created') {
        queryClient.invalidateQueries(['messages'])  # Refetch
    }
}
```

---

## 📡 useWebSocket Hook

**File**: `frontend/src/features/websocket/hooks/useWebSocket.ts`

**Purpose**: Native WebSocket connection з topic subscriptions та reconnection logic.

### Setup

```typescript
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import { useQueryClient } from '@tanstack/react-query'

function Dashboard() {
  const queryClient = useQueryClient()

  // Subscribe to multiple topics
  const { connectionState } = useWebSocket({
    topics: ['analysis', 'proposals', 'knowledge'],

    onMessage: (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'analysis_completed':
          queryClient.invalidateQueries({ queryKey: ['analysis', 'runs'] })
          toast.success('Analysis completed!')
          break

        case 'proposal_created':
          queryClient.invalidateQueries({ queryKey: ['proposals'] })
          toast.info('New proposal available')
          break

        case 'knowledge_updated':
          queryClient.invalidateQueries({ queryKey: ['knowledge', 'atoms'] })
          break
      }
    },
  })

  return <div>Connection: {connectionState}</div>
}
```

**Connection States**:
- `connecting` - initial connection
- `connected` - active WebSocket
- `reconnecting` - lost connection, retrying
- `disconnected` - failed after max retries

---

## 🔄 Event Types → Query Keys Mapping

**Pattern**: Map WebSocket event types до TanStack Query keys.

```typescript
// Event → Query Key mapping
const EVENT_QUERY_MAP = {
  'message_created': ['messages'],
  'message_updated': ['messages'],
  'message_deleted': ['messages'],

  'project_created': ['projects'],
  'project_updated': ['projects'],

  'analysis_started': ['analysis', 'runs'],
  'analysis_completed': ['analysis', 'runs'],

  'proposal_created': ['proposals'],
  'proposal_approved': ['proposals'],
  'proposal_rejected': ['proposals'],
}

// Generic handler
useWebSocket({
  topics: ['messages', 'projects', 'analysis'],
  onMessage: (event) => {
    const message = JSON.parse(event.data)
    const queryKey = EVENT_QUERY_MAP[message.type]

    if (queryKey) {
      queryClient.invalidateQueries({ queryKey })
    }
  },
})
```

---

## 🎯 Targeted Invalidation (Detail Pages)

**Use case**: Topic detail page → invalidate тільки для цього topic.

```typescript
function TopicDetailPage({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient()

  useWebSocket({
    topics: ['messages'],
    onMessage: (event) => {
      const message = JSON.parse(event.data)

      // Invalidate тільки messages для цього topic
      if (message.payload.topic_id === topicId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', 'topic', topicId],
        })
      }
    },
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', 'topic', topicId],
    queryFn: () => messageService.getMessagesForTopic(topicId),
  })

  return <MessageList messages={messages} />
}
```

**Why targeted**: Не refetch all topics → тільки current topic (performance).

**Backend analog**:
```python
# Backend: Filtered notification
@event.listens_for(Message, 'after_insert')
def notify_message_created(mapper, connection, target):
    # Send з topic_id для filtering
    await websocket_manager.broadcast({
        "type": "message_created",
        "payload": {
            "topic_id": target.topic_id,
            "message": target.dict()
        }
    }, room=f"topic_{target.topic_id}")

# Frontend: Filter by topic_id
if (message.payload.topic_id === currentTopicId) {
    queryClient.invalidateQueries(['messages', 'topic', currentTopicId])
}
```

---

## 🚀 Optimistic Updates + WebSocket

**Pattern**: Optimistic update → WebSocket confirms → reconcile.

```typescript
function CreateMessageForm({ topicId }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: messageService.createMessage,

    // 1. Optimistic update
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', topicId] })

      const previousMessages = queryClient.getQueryData(['messages', topicId])

      // Add optimistically
      queryClient.setQueryData(['messages', topicId], (old: any) => [
        newMessage,
        ...old,
      ])

      return { previousMessages }
    },

    // 2. On error → rollback
    onError: (err, variables, context) => {
      queryClient.setQueryData(['messages', topicId], context.previousMessages)
    },

    // 3. WebSocket confirms → reconcile
    onSuccess: () => {
      // WebSocket event прийде з server → invalidate → fetch real data
      // Optimistic data replaced з server data
    },
  })

  // WebSocket listener (reconcile)
  useWebSocket({
    topics: ['messages'],
    onMessage: (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'message_created' && message.payload.topic_id === topicId) {
        // Replace optimistic data з real server data
        queryClient.invalidateQueries({ queryKey: ['messages', topicId] })
      }
    },
  })

  return <form onSubmit={(e) => {
    e.preventDefault()
    mutation.mutate({ topicId, content: e.target.content.value })
  }}>
    <textarea name="content" />
    <button>Send</button>
  </form>
}
```

**Timeline**:
```
User clicks "Send"
  ↓
  Optimistic update → UI shows message instantly (pending status)
  ↓
  HTTP POST → server creates message
  ↓
  WebSocket event → message_created
  ↓
  invalidateQueries → refetch → replace optimistic with real data (persisted status)
```

---

## 🔔 Toast Notifications + Invalidation

**Pattern**: WebSocket event → invalidate + show toast.

```typescript
useWebSocket({
  topics: ['analysis'],
  onMessage: (event) => {
    const message = JSON.parse(event.data)

    switch (message.type) {
      case 'analysis_started':
        toast.info('Analysis started...')
        queryClient.invalidateQueries({ queryKey: ['analysis', 'runs'] })
        break

      case 'analysis_completed':
        toast.success('Analysis completed!', {
          action: {
            label: 'View Results',
            onClick: () => navigate(`/analysis/${message.payload.run_id}`),
          },
        })
        queryClient.invalidateQueries({ queryKey: ['analysis', 'runs'] })
        queryClient.invalidateQueries({ queryKey: ['analysis', message.payload.run_id] })
        break

      case 'analysis_failed':
        toast.error('Analysis failed', {
          description: message.payload.error,
        })
        queryClient.invalidateQueries({ queryKey: ['analysis', 'runs'] })
        break
    }
  },
})
```

**User experience**: Real-time notifications + auto data refresh.

---

## 🛑 Conditional Invalidation

**Use case**: Invalidate тільки якщо query active (user на цій сторінці).

```typescript
useWebSocket({
  topics: ['messages'],
  onMessage: (event) => {
    const message = JSON.parse(event.data)

    // Check якщо query active
    const activeQueries = queryClient.getQueriesData({ queryKey: ['messages'] })

    if (activeQueries.length > 0) {
      // User на Messages page → invalidate
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    } else {
      // User не на Messages page → skip (save bandwidth)
      console.log('Messages updated but page not active')
    }
  },
})
```

**Optimization**: Не refetch якщо user не бачить ці data.

---

## 📊 Multiple Queries Invalidation

**Use case**: One WebSocket event → invalidate multiple related queries.

```typescript
useWebSocket({
  topics: ['projects'],
  onMessage: (event) => {
    const message = JSON.parse(event.data)

    if (message.type === 'project_updated') {
      // Invalidate multiple related queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })  // List
      queryClient.invalidateQueries({ queryKey: ['project', message.payload.id] })  // Detail
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })  // Stats
      queryClient.invalidateQueries({ queryKey: ['agents'] })  // Related agents
    }
  },
})
```

---

## 💡 Best Practices

### ✅ DO

1. **Invalidate після WebSocket events**:
   ```typescript
   ws.onMessage = (event) => {
     queryClient.invalidateQueries({ queryKey: ['messages'] })
   }
   ```

2. **Parse WebSocket messages safely**:
   ```typescript
   try {
     const data = JSON.parse(event.data)
     // Handle...
   } catch (error) {
     console.error('Invalid WebSocket message', error)
   }
   ```

3. **Show toast notifications**:
   ```typescript
   ws.onMessage = (event) => {
     toast.info('New message received')
     queryClient.invalidateQueries(['messages'])
   }
   ```

4. **Map event types до query keys**:
   ```typescript
   const EVENT_QUERY_MAP = { 'message_created': ['messages'] }
   ```

### ❌ DON'T

1. **Не refetch занадто часто**:
   ```typescript
   // ❌ BAD - refetch на кожен WS message
   ws.onMessage = () => queryClient.refetchQueries()

   // ✅ GOOD - targeted invalidation
   ws.onMessage = (event) => {
     const key = getQueryKeyForEvent(event.type)
     queryClient.invalidateQueries({ queryKey: key })
   }
   ```

2. **Не забувай cleanup WebSocket**:
   ```typescript
   useEffect(() => {
     const ws = new WebSocket(url)
     // ...
     return () => ws.close()  // ✅ Cleanup
   }, [])
   ```

3. **Не invalidate якщо data не змінились**:
   ```typescript
   // Check event payload перед invalidate
   if (event.payload.changed) {
     queryClient.invalidateQueries(['messages'])
   }
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/features/websocket/hooks/useWebSocket.ts`
2. Знайди topic subscriptions logic
3. Відкрий Messages page → send message
4. Подивись Network → WS tab → message event
5. Query автоматично refetch → UI updates

---

## ❓ FAQ

**Q: Чому не просто update cache з WebSocket data?**
A: Server може змінити data (validation, formatting). Refetch гарантує consistency.

**Q: Що якщо WebSocket reconnects?**
A: useWebSocket hook має exponential backoff (1s, 2s, 4s, 8s, 16s). Max 5 attempts.

**Q: Чи можна invalidateQueries з WebSocket для іншого user?**
A: Так! Multi-user collaboration pattern. User A edits → WS broadcast → User B refetch.

---

**Повернутись до:** [Module 05: TanStack Query](index.md) | [Queries](queries.md) | [Mutations](mutations.md)
