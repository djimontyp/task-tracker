# Verification Pipeline

Detailed reference for Phase 5 of frontend-flow.

## Full Pipeline

Run ALL steps in sequence:

```bash
cd frontend

# 1. TypeScript — type safety
npx tsc --noEmit

# 2. ESLint — Design System compliance
npm run lint

# 3. Unit tests — logic correctness
npm run test:run

# 4. Story coverage — documentation
npm run story:check

# 5. Accessibility (for shared/)
npm run test:a11y
```

## ESLint Design System Rules (9 total)

### 1. no-raw-tailwind-colors (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN
className="bg-red-500"
className="text-green-600"
className="border-blue-400"
```

**Fix:**
```tsx
// ✅ USE
className="bg-semantic-error"
className="text-status-connected"
className="border-primary"
```

### 2. no-odd-spacing (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN (off 4px grid)
className="gap-3"   // 12px
className="p-5"     // 20px
className="m-7"     // 28px
```

**Fix:**
```tsx
// ✅ USE (4px grid)
className="gap-2"   // 8px
className="gap-4"   // 16px
className="p-4"     // 16px
className="p-6"     // 24px
```

### 3. no-heroicons (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN
import { CheckIcon } from '@heroicons/react/24/solid'
```

**Fix:**
```tsx
// ✅ USE
import { Check } from 'lucide-react'
```

### 4. no-raw-zindex (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN
style={{ zIndex: 50 }}
className="z-[100]"
```

**Fix:**
```tsx
// ✅ USE named tokens
className="z-dropdown"
className="z-modal"
```

### 5. no-direct-fonts (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN
style={{ fontFamily: 'Inter' }}
```

**Fix:**
```tsx
// ✅ USE
className="font-sans"
```

### 6. no-raw-page-wrapper (WARN)

**Catches:** Page components without PageWrapper

**Fix:** Wrap page content in PageWrapper component

### 7. no-direct-api-imports (WARN)

**Catches:**
```tsx
// ❌ FORBIDDEN in components
import axios from 'axios'
import { apiClient } from '@/shared/lib/api'
```

**Fix:**
```tsx
// ✅ USE service classes
import { topicsService } from '@/features/topics/api'
```

### 8. no-hardcoded-api-paths (ERROR)

**Catches:**
```tsx
// ❌ FORBIDDEN
fetch('/api/v1/topics')
apiClient.get('/api/v1/messages')
```

**Fix:**
```tsx
// ✅ USE
import { API_ENDPOINTS } from '@/shared/config/api'
apiClient.get(API_ENDPOINTS.topics)
```

### 9. stories-require-autodocs (WARN)

**Catches:**
```tsx
// ❌ MISSING
const meta: Meta = {
  component: Button,
}
```

**Fix:**
```tsx
// ✅ REQUIRED
const meta: Meta = {
  component: Button,
  tags: ['autodocs'],  // ADD THIS
}
```

## Troubleshooting

### TypeScript Errors

```bash
# Get detailed output
npx tsc --noEmit --pretty

# Common fixes:
# - Missing types → add interface
# - any → proper type
# - null checks → optional chaining ?.
```

### ESLint Errors

```bash
# See specific errors
npm run lint

# Auto-fix what's possible
npm run lint:fix

# Manual fixes needed for:
# - Raw colors → use semantic tokens
# - Odd spacing → use 4px grid
# - Missing aria-labels → add them
```

### Missing Story

```bash
# Check coverage
npm run story:check

# See what's missing
npm run story:check:fix  # shows suggestions
```

### Test Failures

```bash
# Run specific test file
npm run test -- TopicCard.test.tsx

# Run with verbose output
npm run test -- --reporter=verbose
```

## If Verification Fails

1. **Identify** which step failed
2. **Fix** the specific issues
3. **Re-run** the FULL pipeline
4. **Don't proceed** until ALL steps pass

**Principle:** Verification failure = task NOT complete