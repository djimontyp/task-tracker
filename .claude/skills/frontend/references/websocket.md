# WebSocket Reference

## Native WebSocket (NOT Socket.IO!)

### Hook Usage
```typescript
import { useWebSocket } from '@/features/websocket';

function MessagesPage() {
  const queryClient = useQueryClient();

  const { status, reconnect } = useWebSocket({
    topics: ['messages', 'analysis'],
    onMessage: (data) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      // Or optimistic update
      if (data.event === 'message.created') {
        queryClient.setQueryData(['messages'], (old) => [...old, data.data]);
      }
    },
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    reconnect: true,  // Exponential backoff
  });

  return (
    <div>
      <Badge className={status === 'connected' ? badges.status.connected : badges.status.error}>
        {status}
      </Badge>
    </div>
  );
}
```

### Connection URL
```typescript
// Constructed automatically from env
// ws://localhost/ws?topics=messages,analysis

// Environment variables:
// VITE_WS_URL — Full URL (optional)
// VITE_WS_HOST — Hostname (default: window.location.hostname)
// VITE_WS_PATH — Path (default: /ws)
```

### WebSocket States
```typescript
type WebSocketStatus =
  | 'connecting'    // Initial connection
  | 'connected'     // Active connection
  | 'reconnecting'  // Lost connection, retrying
  | 'disconnected'; // Gave up or manual disconnect
```

### Available Topics
```typescript
const TOPICS = [
  'agents',      // Agent CRUD events
  'tasks',       // Task assignment events
  'providers',   // Provider validation events
  'messages',    // New message, classification
  'analysis',    // Analysis run progress
  'proposals',   // Proposal status changes
  'monitoring',  // Service health
  'metrics',     // Real-time metrics
];
```

### Message Format
```typescript
// Server → Client
interface WebSocketMessage {
  topic: string;
  event: 'created' | 'updated' | 'deleted' | 'started' | 'completed' | 'failed';
  data: unknown;
  timestamp: string;
}

// Examples:
// { topic: 'messages', event: 'created', data: { id: '...', content: '...' } }
// { topic: 'analysis', event: 'completed', data: { run_id: '...', atoms: [...] } }
```

### Reconnection Strategy
```typescript
// Exponential backoff
// Attempt 1: 1s delay
// Attempt 2: 2s delay
// Attempt 3: 4s delay
// Attempt 4: 8s delay
// Attempt 5: 16s delay (max)
// After 5 attempts: give up, status = 'disconnected'
```