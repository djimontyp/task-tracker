# Messages Feature — Design System Audit Report

**Date:** 2025-12-05
**Auditor:** React Frontend Expert (Agent 4.1)
**Scope:** Messages feature components (MessagesPage, MessageInspectModal, ConsumerMessageModal, MessageCard)

---

## Executive Summary

Messages Feature має змішаний стан дотримання Design System:
- ✅ **ConsumerMessageModal** — excellent compliance, добрий приклад
- ⚠️ **MessageInspectModal** — tabs не використовують global pattern, custom implementation
- ⚠️ **MessageCard** — minor violations (непарні spacing, відсутність semantic tokens)
- ❌ **ClassificationTab** — raw color classes (`bg-semantic-*`) замість TypeScript tokens
- ❌ **AtomsTab** — hardcoded color classes в renderEntityCard

**Blocker:** Endpoint `/api/v1/messages/${messageId}/inspect` не існує → MessageInspectModal не можна протестувати в браузері.

---

## 1. ConsumerMessageModal

**File:** `frontend/src/features/messages/components/ConsumerMessageModal/ConsumerMessageModal.tsx`

### ✅ Strengths

1. **Semantic tokens usage** (good):
   ```tsx
   // Line 119: Muted background for avatar fallback
   <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">

   // Line 120: Muted foreground for icon
   <UserIcon className="h-6 w-6 text-muted-foreground" />
   ```

2. **Accessibility (excellent)**:
   - ✅ `aria-describedby="consumer-message-description"` (line 81)
   - ✅ `sr-only` description paragraph (line 84)
   - ✅ Loading state має `role="status" aria-label="Loading"` (line 90-91)
   - ✅ Escape key handler (lines 65-73)

3. **Spacing consistency**:
   - ✅ 4px grid дотримано: `gap-2`, `gap-4`, `p-4`, `mb-4`, `px-6`, `pt-6`, `pb-4`

4. **Component composition**:
   - ✅ Використання shadcn Dialog components
   - ✅ Card для message content (line 110)
   - ✅ Badge для topics (line 137)

### ⚠️ Minor Issues

1. **Непарний spacing** (line 139):
   ```tsx
   <Badge variant="outline" className="flex items-center gap-2">
     <TagIcon className="h-3 w-3" />  {/* ← 3 не кратне 4px */}
   ```
   **Fix:** Use `h-4 w-4` (16px) or semantic size token.

2. **Hardcoded text color** (line 156):
   ```tsx
   <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
   ```
   **Issue:** `hover:bg-muted/50` — використовує opacity замість semantic token.
   **Recommendation:** Створити semantic token для interactive hover states.

---

## 2. MessageInspectModal

**File:** `frontend/src/features/messages/components/MessageInspectModal/MessageInspectModal.tsx`

### ❌ Critical: Custom Tabs Implementation

**Lines 148-167:** Custom tabs styling НЕ використовує global Tabs component pattern:

```tsx
<TabsList className="w-full justify-start px-6 border-b rounded-none bg-transparent h-auto">
  <TabsTrigger
    value="classification"
    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
  >
    Classification
  </TabsTrigger>
  {/* ... */}
</TabsList>
```

**Issues:**
1. ❌ Custom border-bottom implementation замість використання global tab pattern
2. ❌ `rounded-none` override — не слідує design system
3. ❌ `bg-transparent` override — tabs мають мати consistent background
4. ❌ No icon support (global tabs підтримують icons)

**Comparison with Global Tabs** (`frontend/src/shared/ui/tabs.tsx`):
```tsx
// Global Tabs використовує Radix primitives з consistent styling
const TabsList = React.forwardRef<...>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
```

**Recommendation:**
- Використовувати global `<Tabs>` component без custom overrides
- Якщо потрібен custom style — створити variant в global component
- Reference: Dashboard Tabs (TopicDetailPage) для прикладу

### ✅ Strengths

1. **Keyboard navigation** (lines 52-71):
   ```tsx
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'ArrowLeft') { /* previous tab */ }
       else if (e.key === 'ArrowRight') { /* next tab */ }
     }
     // ...
   }, [])
   ```
   ✅ Arrow keys працюють для перемикання tabs

2. **Accessibility**:
   - ✅ `aria-describedby` присутній (line 94)
   - ✅ DialogTitle (line 98)
   - ✅ Loading spinner має `aria-label` (line 128)

3. **Semantic tokens**:
   - ✅ `text-muted-foreground` (line 103, 110, 112)
   - ✅ `bg-muted` використано для empty states

### ⚠️ Minor Issues

1. **Непарний spacing** (line 138):
   ```tsx
   <Badge variant={messageData.message.source === 'telegram' ? 'default' : 'secondary'}>
   ```
   **Issue:** No gap defined between badge and other elements.

2. **Hardcoded opacity** (line 94):
   ```tsx
   className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
   ```
   **Recommendation:** Use semantic spacing tokens.

---

## 3. ClassificationTab

**File:** `frontend/src/features/messages/components/MessageInspectModal/ClassificationTab.tsx`

### ❌ Critical: Raw Color Classes

**Lines 29-47:** Hardcoded `bg-semantic-*` classes:

```tsx
const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceLevelConfig> = {
  high: {
    color: 'bg-semantic-success',        // ← Raw string
    bgColor: 'bg-semantic-success',      // ← Duplicate
    badgeVariant: 'success',
    // ...
  },
  medium: {
    color: 'bg-semantic-warning',        // ← Raw string
    bgColor: 'bg-semantic-warning',
    // ...
  },
  low: {
    color: 'bg-semantic-error',          // ← Raw string
    bgColor: 'bg-semantic-error',
    // ...
  },
}
```

**Issues:**
1. ❌ Не використовує TypeScript tokens з `@/shared/tokens/colors`
2. ❌ `color` та `bgColor` дублюються — непотрібна redundancy
3. ❌ No type safety — легко зробити typo
4. ❌ Badge має `badgeVariant`, але bg color дублюється

**Correct Implementation:**
```tsx
// Use TypeScript tokens
import { semantic } from '@/shared/tokens/colors'
import { badges } from '@/shared/tokens/patterns'

const CONFIDENCE_LEVELS = {
  high: {
    bgClass: semantic.success.bg,        // Type-safe!
    badge: badges.status.connected,       // Pre-composed pattern
    // ...
  },
  medium: {
    bgClass: semantic.warning.bg,
    badge: badges.status.validating,
    // ...
  },
  low: {
    bgClass: semantic.error.bg,
    badge: badges.status.error,
    // ...
  },
}
```

### ⚠️ Other Issues

1. **Hardcoded background colors** (lines 263, 288):
   ```tsx
   <div className="rounded-md bg-semantic-info/10 p-4">  {/* Line 263 */}
   <div className="rounded-md bg-semantic-success/10 p-4">  {/* Line 288 */}
   ```
   **Issue:** Raw opacity values замість semantic tokens.
   **Fix:** Створити semantic token для info/success containers.

2. **Непарний spacing** (line 318):
   ```tsx
   <span className="text-semantic-success mt-0.5">✓</span>
   ```
   **Issue:** `mt-0.5` (2px) не кратне 4px.
   **Fix:** Use `mt-1` (4px).

3. **Icon size inconsistency** (line 243):
   ```tsx
   <ClipboardDocumentIcon className="size-4 mr-2" />
   ```
   **Issue:** `size-4` (16px) — too small для 44px touch target.
   **Fix:** Button wrapper має бути ≥44px, icon може бути 16px (OK).

---

## 4. AtomsTab

**File:** `frontend/src/features/messages/components/MessageInspectModal/AtomsTab.tsx`

### ❌ Critical: Hardcoded Color Classes in renderEntityCard

**Lines 112-135:** Inline color classes:

```tsx
{renderEntityCard(
  'People',
  data.entities.people,
  'People',
  'bg-semantic-info/10 text-semantic-info hover:bg-semantic-info/20'  // ← Line 116
)}
{renderEntityCard(
  'Places',
  data.entities.places,
  'Places',
  'bg-semantic-success/10 text-semantic-success hover:bg-semantic-success/20'  // ← Line 122
)}
{renderEntityCard(
  'Organizations',
  data.entities.organizations,
  'Organizations',
  'bg-accent/10 text-accent-foreground hover:bg-accent/20'  // ← Line 128
)}
```

**Issues:**
1. ❌ No TypeScript tokens — string-based classes
2. ❌ Opacity використовується для hover states (`/10`, `/20`)
3. ❌ Inconsistency: Organizations використовує `bg-accent`, інші `bg-semantic-*`
4. ❌ No reusability — кожен entity має повторюваний color pattern

**Correct Implementation:**
```tsx
// Create semantic tokens
const ENTITY_COLORS = {
  people: {
    bg: 'bg-semantic-info/10',
    text: 'text-semantic-info',
    hover: 'hover:bg-semantic-info/20',
  },
  places: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    hover: 'hover:bg-semantic-success/20',
  },
  // ... або використати TypeScript tokens
} as const

// Usage
{renderEntityCard('People', data.entities.people, 'People', ENTITY_COLORS.people)}
```

### ✅ Strengths

1. **Semantic structure**:
   - ✅ `aria-labelledby` для sections (lines 97, 140, 193)
   - ✅ Empty states handled (lines 102-109, 145-152)

2. **Spacing consistency**:
   - ✅ `space-y-8` (32px), `space-y-6` (24px), `space-y-4` (16px) — all кратні 4px

3. **Component composition**:
   - ✅ Card, CardHeader, CardTitle, CardDescription використано correctly

### ⚠️ Minor Issues

1. **Font size calculation** (line 166):
   ```tsx
   const fontSize = 12 + (keyword.relevance / 100) * 12
   ```
   **Issue:** Dynamic font size може бути < 14px (WCAG minimum).
   **Fix:** Enforce minimum 14px: `Math.max(14, 12 + ...)`

2. **Progress bar використовує vector norm** (line 218):
   ```tsx
   <Progress value={calculateVectorNorm() * 100} className="h-2" />
   ```
   **Issue:** Vector norm може бути > 1.0 → progress bar overflow.
   **Fix:** Clamp to 0-100: `Math.min(100, calculateVectorNorm() * 100)`.

---

## 5. HistoryTab

**File:** `frontend/src/features/messages/components/MessageInspectModal/HistoryTab.tsx`

### ✅ Status: Placeholder

Lines 8-26 — простий placeholder component.

**Issues:** None (not implemented yet).

---

## 6. MessageCard

**File:** `frontend/src/pages/MessagesPage/MessageCard.tsx`

### ⚠️ Design System Violations

1. **Непарний spacing** (line 35):
   ```tsx
   className="border rounded-lg p-4 sm:p-4 space-y-4"
   ```
   **Issue:** `space-y-4` OK, але `p-4 sm:p-4` redundant (same value).

2. **Missing semantic tokens** (line 36):
   ```tsx
   ${isSelected ? 'border-primary bg-accent/5' : 'hover:bg-accent/10'}
   ```
   **Issue:** `bg-accent/5` та `hover:bg-accent/10` використовують opacity.
   **Fix:** Створити semantic token для selected card state.

3. **Icon sizes** (line 57, 73):
   ```tsx
   <UserIcon className="h-5 w-5 text-muted-foreground" />  {/* Line 57 */}
   <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />  {/* Line 73 */}
   ```
   **Issue:** Inconsistent icon sizes (5 vs 4).
   **Recommendation:** Standardize to `h-4 w-4` (16px) або `h-5 w-5` (20px).

4. **Badge max-width** (line 83, 88, 93):
   ```tsx
   <Badge className={`${importanceBadge.className} flex-shrink-0 truncate max-w-[120px]`}>
   <Badge className={`${classificationBadge.className} flex-shrink-0 truncate max-w-[150px]`}>
   <Badge variant="outline" className="truncate max-w-[150px] flex-shrink-0">
   ```
   **Issue:** Hardcoded pixel values — not responsive.
   **Fix:** Use semantic spacing tokens або percentage-based.

### ✅ Strengths

1. **Responsive design**:
   - ✅ `line-clamp-3` для content (line 77)
   - ✅ `truncate` для badge text
   - ✅ `flex-shrink-0` для icons/badges

2. **Accessibility**:
   - ✅ Checkbox має proper click handler (line 45)
   - ✅ Alt text для avatars (line 52)

3. **Badge utilities usage**:
   - ✅ `getMessageAnalysisBadge`, `getImportanceBadge`, `getNoiseClassificationBadge` (lines 21-27)

---

## 7. MessagesPage

**File:** `frontend/src/pages/MessagesPage/index.tsx`

### ⚠️ Minor Issues

1. **Console warnings** (visible in browser):
   ```
   Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
   ```
   **Issue:** Modals відкриті через MessageInspectModal/ConsumerMessageModal не мають опису.
   **Fix:** Додати `aria-describedby` або `<DialogDescription>`.

2. **WebSocket errors** (lines 107-144):
   ```tsx
   const ws = new WebSocket(`${wsUrl}?topics=noise_filtering`)
   ```
   **Issue:** WebSocket відключається до підключення → багато error logs.
   **Fix:** Add connection state tracking (connecting/connected/disconnected).

3. **Empty grid gap** (line 559):
   ```tsx
   <div className="space-y-4 w-full min-w-0">
   ```
   **Issue:** `space-y-4` OK, але mobile cards можуть бути closer together.
   **Recommendation:** Use responsive gap: `space-y-2 md:space-y-4`.

### ✅ Strengths

1. **Desktop/Mobile toggle** (lines 545-591):
   ```tsx
   {isDesktop ? (
     <DataTable ... />
   ) : (
     <div className="space-y-4">
       {messages.map(message => <MessageCard ... />)}
     </div>
   )}
   ```
   ✅ Excellent responsive pattern!

2. **Bulk actions** (lines 489-498):
   - ✅ BulkActionsToolbar shows selected count
   - ✅ Admin-only features properly gated

---

## Console Errors

**Source:** Browser console + Playwright console messages

### 1. WebSocket Errors (non-critical)

```
[ERROR] WebSocket connection to 'ws://localhost/ws?topics=noise_filtering' failed
[ERROR] [MessagesPage] WebSocket error: Event
[ERROR] [Sidebar] WebSocket error: Event
```

**Cause:** WebSocket connection lifecycle issues (connecting → disconnecting rapidly).
**Impact:** Low (functionality works, але багато noise в logs).
**Fix:** Add proper connection state management з debounce.

### 2. Missing aria-describedby (moderate)

```
[WARNING] Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```

**Cause:** ConsumerMessageModal та MessageInspectModal не мають Dialog description.
**Impact:** Moderate (accessibility violation — screen readers потребують опису).
**Fix:** Add `<DialogDescription>` або `aria-describedby` attribute.

---

## Blocker: MessageInspectModal Testing

**Issue:** Endpoint `/api/v1/messages/${messageId}/inspect` не існує.

**Evidence:**
- Code reference: `MessageInspectModal.tsx:30` — `fetch(\`/api/v1/messages/${messageId}/inspect\`)`
- Browser test: Clicking message in Admin Mode → ConsumerMessageModal opens (User Mode behavior)
- Root cause: `isAdminMode` check працює, але endpoint missing

**Impact:** Неможливо протестувати:
- Tabs navigation (Classification, Atoms, History)
- Tab content rendering
- Keyboard shortcuts (Arrow keys)
- Data visualization (progress bars, collapsibles)

**Recommendation:**
1. Backend team створити endpoint `/api/v1/messages/{message_id}/inspect`
2. Response schema:
   ```typescript
   interface MessageInspectData {
     message: { id, content, source, created_at, telegram_message_id }
     classification: { confidence, noise_score, urgency_score, reasoning, topic_title }
     atoms: { entities, keywords, embedding, similarMessages }
     history: HistoryEvent[]
   }
   ```
3. Frontend продовжить тестування після endpoint готовий

---

## Recommendations Summary

### 🔥 High Priority

1. **Replace custom tabs implementation** (MessageInspectModal)
   - Use global `<Tabs>` component замість custom border-bottom styling
   - Remove `rounded-none`, `bg-transparent` overrides
   - Reference: DashboardPage tabs для consistency

2. **Migrate to TypeScript tokens** (ClassificationTab, AtomsTab)
   - Replace `'bg-semantic-success'` strings → `semantic.success.bg`
   - Use `badges.status.*` patterns замість manual composition
   - Files: `@/shared/tokens/colors`, `@/shared/tokens/patterns`

3. **Fix accessibility issues** (ConsumerMessageModal, MessageInspectModal)
   - Add `<DialogDescription>` або `aria-describedby`
   - Eliminate browser warnings

### ⚠️ Medium Priority

4. **Standardize spacing** (MessageCard, ClassificationTab)
   - Replace `h-3 w-3` → `h-4 w-4` (кратне 4px)
   - Fix `mt-0.5` → `mt-1`
   - Remove redundant `p-4 sm:p-4`

5. **Create semantic tokens for interactive states**
   - Selected card: `bg-accent/5` → semantic token
   - Hover states: `/10`, `/20` opacity → semantic tokens
   - Entity colors: hardcoded strings → type-safe object

6. **Improve WebSocket error handling** (MessagesPage)
   - Add connection state tracking
   - Debounce reconnection attempts
   - Reduce console noise

### ✅ Low Priority

7. **Responsive improvements**
   - Badge max-width: hardcoded pixels → responsive tokens
   - Mobile card gap: `space-y-4` → `space-y-2 md:space-y-4`

8. **Icon size consistency** (MessageCard)
   - Standardize to `h-4 w-4` (16px) або `h-5 w-5` (20px)

---

## Code Examples

### ❌ Before (ClassificationTab)

```tsx
const CONFIDENCE_LEVELS = {
  high: {
    color: 'bg-semantic-success',      // ← String, no type safety
    bgColor: 'bg-semantic-success',    // ← Duplicate
    badgeVariant: 'success',
  },
}

// Usage
<div className={cn('absolute inset-0 h-full rounded-full', overallConfig.bgColor)} />
```

### ✅ After (with TypeScript tokens)

```tsx
import { semantic } from '@/shared/tokens/colors'
import { badges } from '@/shared/tokens/patterns'

const CONFIDENCE_LEVELS = {
  high: {
    bg: semantic.success.bg,           // ← Type-safe token
    badge: badges.status.connected,    // ← Pre-composed pattern
  },
} as const

// Usage
<div className={cn('absolute inset-0 h-full rounded-full', CONFIDENCE_LEVELS.high.bg)} />
```

---

### ❌ Before (MessageInspectModal tabs)

```tsx
<TabsList className="w-full justify-start px-6 border-b rounded-none bg-transparent h-auto">
  <TabsTrigger
    value="classification"
    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
  >
    Classification
  </TabsTrigger>
</TabsList>
```

### ✅ After (use global Tabs)

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="classification">Classification</TabsTrigger>
    <TabsTrigger value="atoms">Atoms</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="classification">
    <ClassificationTab data={messageData.classification} />
  </TabsContent>
  {/* ... */}
</Tabs>
```

---

### ❌ Before (AtomsTab entity colors)

```tsx
{renderEntityCard(
  'People',
  data.entities.people,
  'People',
  'bg-semantic-info/10 text-semantic-info hover:bg-semantic-info/20'  // ← Hardcoded
)}
```

### ✅ After (type-safe entity colors)

```tsx
const ENTITY_STYLES = {
  people: {
    container: 'bg-semantic-info/10 hover:bg-semantic-info/20',
    text: 'text-semantic-info',
  },
  places: {
    container: 'bg-semantic-success/10 hover:bg-semantic-success/20',
    text: 'text-semantic-success',
  },
} as const

{renderEntityCard('People', data.entities.people, 'People', ENTITY_STYLES.people)}
```

---

## Files Audited

1. ✅ `frontend/src/features/messages/components/ConsumerMessageModal/ConsumerMessageModal.tsx` (200 lines)
2. ⚠️ `frontend/src/features/messages/components/MessageInspectModal/MessageInspectModal.tsx` (197 lines)
3. ❌ `frontend/src/features/messages/components/MessageInspectModal/ClassificationTab.tsx` (354 lines)
4. ❌ `frontend/src/features/messages/components/MessageInspectModal/AtomsTab.tsx` (276 lines)
5. ✅ `frontend/src/features/messages/components/MessageInspectModal/HistoryTab.tsx` (27 lines — placeholder)
6. ⚠️ `frontend/src/pages/MessagesPage/MessageCard.tsx` (102 lines)
7. ⚠️ `frontend/src/pages/MessagesPage/index.tsx` (622 lines)

**Total:** 1,778 lines audited.

---

## Conclusion

Messages Feature демонструє **змішану якість** Design System compliance:

**✅ Excellent:**
- ConsumerMessageModal — reference implementation
- Accessibility basics (aria-labels, keyboard handlers)
- Responsive desktop/mobile patterns

**⚠️ Needs Improvement:**
- Custom tabs implementation (не слідує global pattern)
- TypeScript tokens не використовуються (string-based colors)
- Spacing inconsistencies (непарні значення)

**❌ Critical:**
- Hardcoded color classes замість type-safe tokens
- Missing aria-describedby warnings
- Blocker: `/inspect` endpoint не існує

**Next Steps:**
1. Створити backend endpoint `/api/v1/messages/{message_id}/inspect`
2. Migrate ClassificationTab + AtomsTab до TypeScript tokens
3. Replace custom tabs → global Tabs component
4. Fix accessibility warnings
5. Re-audit після endpoint готовий
