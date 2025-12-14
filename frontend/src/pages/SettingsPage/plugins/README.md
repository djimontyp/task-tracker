# Source Plugins Architecture

This document describes the architecture and patterns for source integration plugins (Telegram, Slack, etc.).

## Architecture Overview

```
SourceCard (presentational)
    ↑ props: status, statusLabel, enabled
    |
{Source}Card (container - e.g. TelegramCard, SlackCard)
    ↑ uses
    |
use{Source}Settings (hook - business logic)
    ↑ uses
    |
use{Source}Store (Zustand - shared status state)
```

## Status Types

```typescript
type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'error'
```

| Status | Meaning | UI Display |
|--------|---------|------------|
| `unknown` | Initial state, not checked yet | "Checking..." |
| `checking` | API call in progress | "Checking..." |
| `connected` | Source is active and responding | "Connected • N groups" |
| `error` | Source disabled or API error | "Not configured" |

## Required Patterns

Every source plugin MUST implement these patterns:

### 1. Check Status on Mount

The container card must check real status when it mounts:

```typescript
// {Source}Card.tsx
const { checkRealStatus, isLoadingConfig } = use{Source}Settings()

useEffect(() => {
  if (!isLoadingConfig) {
    checkRealStatus()
  }
}, [checkRealStatus, isLoadingConfig])
```

### 2. Re-check on Visibility Change

The settings hook must re-check when user returns to tab:

```typescript
// use{Source}Settings.ts
useEffect(() => {
  const onVisible = () => {
    if (!document.hidden) checkRealStatus()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}, [checkRealStatus])
```

### 3. Clear State Immediately on Disable

When disabling the source, update local state BEFORE server call completes:

```typescript
// use{Source}Settings.ts
const handleDisable = async () => {
  setIsDisabling(true)
  try {
    const { data } = await apiClient.delete(...)

    if (data.success) {
      // Immediately update local state
      setIsActive(false)
      setConnectionStatus('error')
      setConnectionError('Source disabled')

      toast.success('Source disabled')
      await loadConfig() // Then refresh from server
    }
  } finally {
    setIsDisabling(false)
  }
}
```

### 4. Handle 'unknown' Status as Loading

Never show stale data when status is unknown:

```typescript
// {Source}Card.tsx
const getStatusLabel = () => {
  if (connectionStatus === 'unknown') return 'Checking...'
  if (connectionStatus === 'checking') return 'Checking...'
  if (connectionStatus === 'connected') return 'Connected'
  if (connectionStatus === 'error') return 'Not configured'
  return 'Not configured'
}
```

## Status Flow

```
Component Mount
      ↓
connectionStatus = 'unknown'
      ↓
checkRealStatus() called
      ↓
connectionStatus = 'checking'
      ↓
API call to check real status
      ↓
connectionStatus = 'connected' | 'error'

User disables source
      ↓
connectionStatus = 'error' (immediately)
      ↓
loadConfig() refreshes from server
```

## File Structure for New Sources

When adding a new source (e.g. Slack):

```
plugins/
├── SlackSource/
│   ├── SlackCard.tsx           # Container component
│   ├── SlackSettingsSheet.tsx  # Settings panel
│   ├── useSlackSettings.ts     # Business logic hook
│   ├── useSlackStore.ts        # Zustand store for status
│   ├── types.ts                # TypeScript interfaces
│   └── components/             # Sub-components
│       ├── ChannelList.tsx
│       └── TestConnectionButton.tsx
```

## Example: Adding Slack Integration

1. **Create store** (`useSlackStore.ts`):
```typescript
import { create } from 'zustand'

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'error'

interface SlackState {
  connectionStatus: ConnectionStatus
  lastChecked: Date | null
  connectionError: string | null
  setConnectionStatus: (status: ConnectionStatus) => void
  // ... other setters
  reset: () => void
}

export const useSlackStore = create<SlackState>((set) => ({
  connectionStatus: 'unknown',
  lastChecked: null,
  connectionError: null,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  // ... implement setters
  reset: () => set({ connectionStatus: 'unknown', lastChecked: null, connectionError: null }),
}))
```

2. **Create settings hook** (`useSlackSettings.ts`):
- Implement `loadConfig`, `checkRealStatus`, `handleEnable`, `handleDisable`
- Follow patterns from `useTelegramSettings.ts`

3. **Create card component** (`SlackCard.tsx`):
- Use `SourceCard` for presentation
- Add mount effect for status check
- Handle all status states properly

## Testing Checklist

- [ ] Fresh page load shows "Checking..." then real status
- [ ] Enable shows "Activating..." then "Connected"
- [ ] Disable shows "Deactivating..." then "Not configured"
- [ ] Tab switch triggers status re-check
- [ ] Navigate away and back triggers fresh check
- [ ] Status always reflects real API state
