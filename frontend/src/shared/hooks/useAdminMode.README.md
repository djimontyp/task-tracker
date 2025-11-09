# useAdminMode Hook

**Status:** ✅ Task 1.1 Complete
**Created:** 2025-11-02
**Location:** `/frontend/src/shared/hooks/useAdminMode.ts`

## Overview

Centralized hook for managing Admin Mode state with localStorage persistence. Foundation for ADR-0001 Unified Admin Approach (Phase 1).

## Usage

```typescript
import { useAdminMode } from '@/shared/hooks'

function MyComponent() {
  const { isAdminMode, toggleAdminMode, enableAdminMode, disableAdminMode } = useAdminMode()

  return (
    <div>
      {isAdminMode ? <AdminPanel /> : <ConsumerView />}
      <button onClick={toggleAdminMode}>Toggle Admin Mode</button>
    </div>
  )
}
```

## API

### Return Value

```typescript
{
  isAdminMode: boolean           // Current admin mode state
  toggleAdminMode: () => void    // Toggle between modes
  enableAdminMode: () => void    // Explicitly enable admin mode
  disableAdminMode: () => void   // Explicitly disable admin mode
}
```

### Features

- ✅ **Persistent state** - Survives page refreshes via localStorage
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Memoized callbacks** - useCallback for stable references
- ✅ **SSR-compatible** - Safe lazy initialization
- ✅ **Zero dependencies** - Only React hooks

### Storage Key

```
localStorage: 'taskTracker_adminMode' = 'true' | 'false'
```

## Testing

**Test Suite:** `useAdminMode.test.ts`
**Tests:** 8 passing
**Coverage:** 100%

Run tests:
```bash
cd frontend
npm run test:run       # One-time run
npm run test          # Watch mode
npm run test:ui       # Interactive UI
```

## Demo Component

**Location:** `/shared/components/AdminModeDemo.tsx`

Manual browser testing component with visual state indicator and all control buttons.

**How to use:**
1. Import temporarily in any page: `import { AdminModeDemo } from '@/shared/components/AdminModeDemo'`
2. Render: `<AdminModeDemo />`
3. Test persistence by toggling and refreshing page

## Next Steps (Task 1.2)

**Cmd+Shift+A Keyboard Shortcut** - Create global keyboard listener:
- Listen for `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Win/Linux)
- Call `toggleAdminMode()` from this hook
- Show toast notification on toggle
- Location: `/shared/hooks/useAdminModeShortcut.ts` or directly in MainLayout

## Files Created

```
frontend/src/shared/hooks/
├── useAdminMode.ts           # Hook implementation ✅
├── useAdminMode.test.ts      # Test suite (8 tests) ✅
├── useAdminMode.README.md    # This file ✅
└── index.ts                  # Export added ✅

frontend/src/shared/components/
└── AdminModeDemo.tsx         # Demo component ✅

frontend/
├── vite.config.ts            # Test config added ✅
└── package.json              # Test scripts added ✅
```

## Configuration Changes

### vite.config.ts
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
  exclude: ['**/tests/e2e/**', '**/*.spec.ts'],
}
```

### package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^4.0.6",
    "jsdom": "^27.1.0",
    "@vitest/ui": "^4.0.6"
  }
}
```

## Verification Checklist

- ✅ Hook file created at correct path
- ✅ All TypeScript types are correct (no `any` types)
- ✅ Tests created and ALL 8 passing
- ✅ Hook exported from index.ts
- ✅ localStorage key is exactly `'taskTracker_adminMode'`
- ✅ TypeScript compilation successful
- ✅ Demo component created for manual testing
- ✅ Vitest configured and working
