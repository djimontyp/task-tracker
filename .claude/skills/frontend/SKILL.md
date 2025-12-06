---
name: frontend
description: React 18, TypeScript, shadcn/ui patterns for Pulse Radar frontend development.
---

# Frontend Development Skill

## Architecture
```
frontend/src/
├── pages/           # 14 lazy-loaded pages
├── features/        # 16 domain modules (api/, components/, hooks/, types/)
├── shared/
│   ├── ui/          # 33 shadcn/ui components
│   ├── components/  # 17 business components
│   ├── patterns/    # CardWithStatus, EmptyState, FormField
│   ├── tokens/      # Design tokens
│   └── store/       # Zustand (uiStore)
└── app/routes.tsx   # All routes
```

## State Management
- **Server state** → TanStack Query (`useQuery`, `useMutation`)
- **Client state** → Zustand (`useUiStore`)
- **Never** store server data in Zustand

## WebSocket (Native)
```typescript
import { useWebSocket } from '@/features/websocket';
const { status } = useWebSocket({
  topics: ['messages'],
  onMessage: (data) => queryClient.invalidateQueries(['messages'])
});
```

## Verification
```bash
npm run build && npx tsc --noEmit
```

## References
- @references/state-management.md — Detailed Zustand + TanStack patterns
- @references/websocket.md — WebSocket reconnection, topics
- @references/testing.md — Vitest + Playwright patterns