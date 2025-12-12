# UI State Diagrams

**Продукт:** Pulse Radar
**Статус:** Draft
**Дата:** 2025-12-11

---

## Overview

State machine діаграми для ключових UI компонентів.
Документують всі можливі стани та переходи між ними.

| Component | States | Transitions |
|-----------|--------|-------------|
| [DataTable](#1-datatable) | 5 | 7 |
| [Form](#2-form) | 5 | 6 |
| [Modal](#3-modal) | 4 | 4 |
| [Button](#4-button) | 5 | 5 |
| [Toast](#5-toast) | 4 | 4 |
| [WebSocket](#6-websocket-connection) | 4 | 5 |

---

## Legend

```
┌──────────┐
│  STATE   │     State box
└──────────┘

    │
    │ trigger()    Transition with trigger
    ▼

─────────►         Transition arrow

- - - - - ►        Async/background transition

[condition]        Guard condition

{action}           Side effect
```

---

## 1. DataTable

Interactive data table with selection, sorting, and pagination.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DataTable State Machine                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        ┌──────────┐
                                        │   IDLE   │
                                        │          │
                                        │ Initial  │
                                        │ state    │
                                        └────┬─────┘
                                             │
                                             │ useQuery() / fetch()
                                             │ {show skeleton}
                                             ▼
                                        ┌──────────┐
                                        │ LOADING  │
                                        │          │
                                        │ Skeleton │
                                        │ visible  │
                                        └────┬─────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                          │ [data.length=0]  │ [data.length>0]  │ [error]
                          ▼                  ▼                  ▼
                     ┌──────────┐       ┌──────────┐       ┌──────────┐
                     │  EMPTY   │       │   DATA   │       │  ERROR   │
                     │          │       │          │       │          │
                     │ Empty    │       │ Rows     │       │ Error    │
                     │ state    │       │ rendered │       │ message  │
                     │ icon     │       │          │       │ + retry  │
                     └──────────┘       └────┬─────┘       └────┬─────┘
                          │                  │                  │
                          │                  │ select(row)      │ retry()
                          │                  │ {highlight}      │
                          │                  ▼                  │
                          │             ┌──────────┐            │
                          │             │SELECTING │            │
                          │             │          │            │
                          │             │ Checkbox │            │
                          │             │ toolbar  │            │
                          │             └────┬─────┘            │
                          │                  │                  │
                          │                  │ bulkAction()     │
                          │                  │ {API call}       │
                          │                  ▼                  │
                          │             ┌──────────┐            │
                          │             │ LOADING  │◄───────────┘
                          │             └──────────┘
                          │                  │
                          └──────────────────┘
                                refetch() / filter change
```

### States

| State | Description | Visual |
|-------|-------------|--------|
| IDLE | Initial, before first fetch | Nothing rendered |
| LOADING | Fetching data | Skeleton rows |
| EMPTY | No data matches filters | Empty state icon + message |
| DATA | Rows available | Table with data |
| SELECTING | One or more rows selected | Checkboxes + bulk toolbar |
| ERROR | Fetch failed | Error message + retry button |

### Triggers

| Trigger | From | To | Side Effect |
|---------|------|----|----|
| `fetch()` | IDLE | LOADING | Start API request |
| `success(data)` | LOADING | DATA/EMPTY | Render rows or empty state |
| `error(e)` | LOADING | ERROR | Show error message |
| `select(row)` | DATA | SELECTING | Highlight row, show toolbar |
| `deselect()` | SELECTING | DATA | Hide toolbar |
| `bulkAction()` | SELECTING | LOADING | Execute bulk operation |
| `retry()` | ERROR | LOADING | Retry failed request |

---

## 2. Form

Form with validation, submission, and feedback states.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      Form State Machine                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        ┌──────────┐
                                        │   IDLE   │
                                        │          │
                                        │ Clean    │
                                        │ form     │
                                        └────┬─────┘
                                             │
                                             │ onChange() / onBlur()
                                             │ {validate field}
                                             ▼
                                        ┌──────────┐
                                        │VALIDATING│
                                        │          │
                                        │ Check    │
                                        │ rules    │
                                        └────┬─────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                          │ [valid]                             │ [invalid]
                          ▼                                     ▼
                     ┌──────────┐                          ┌──────────┐
                     │  VALID   │                          │ INVALID  │
                     │          │                          │          │
                     │ Submit   │                          │ Error    │
                     │ enabled  │                          │ messages │
                     └────┬─────┘                          └────┬─────┘
                          │                                     │
                          │ submit()                            │ fix errors
                          │ {disable form}                      │
                          ▼                                     │
                     ┌──────────┐                               │
                     │SUBMITTING│                               │
                     │          │                               │
                     │ Spinner  │                               │
                     │ disabled │                               │
                     └────┬─────┘                               │
                          │                                     │
               ┌──────────┴──────────┐                         │
               │                     │                         │
               │ [success]           │ [error]                 │
               ▼                     ▼                         │
          ┌──────────┐          ┌──────────┐                   │
          │ SUCCESS  │          │  ERROR   │                   │
          │          │          │          │                   │
          │ Toast    │          │ Server   │                   │
          │ redirect │          │ error    │                   │
          └──────────┘          └────┬─────┘                   │
                                     │                         │
                                     │ dismiss() / retry()     │
                                     └─────────────────────────┘
```

### States

| State | Description | Visual |
|-------|-------------|--------|
| IDLE | Clean form, no interaction | Empty fields |
| VALIDATING | Checking field rules | Debounced validation |
| VALID | All fields pass validation | Submit button enabled |
| INVALID | One or more errors | Error messages under fields |
| SUBMITTING | API request in progress | Spinner, form disabled |
| SUCCESS | Submission successful | Success toast, redirect |
| ERROR | Server returned error | Error message, retry option |

### Validation Rules

```typescript
// Example validation schema (zod)
const schema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name too short"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone"),
})
```

---

## 3. Modal

Dialog lifecycle with open/close animations.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Modal State Machine                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

         ┌──────────┐                                              ┌──────────┐
         │  CLOSED  │◄─────────────────────────────────────────────│ CLOSING  │
         │          │              onAnimationEnd()                │          │
         │ Hidden   │              {remove from DOM}               │ Fade out │
         │          │                                              │ overlay  │
         └────┬─────┘                                              └────┬─────┘
              │                                                         ▲
              │ open()                                                  │
              │ {render, focus trap}                                    │ close() / Escape / backdrop click
              ▼                                                         │
         ┌──────────┐                                              ┌────┴─────┐
         │ OPENING  │─────────────────────────────────────────────►│   OPEN   │
         │          │              onAnimationEnd()                │          │
         │ Fade in  │              {focus first element}           │ Visible  │
         │ overlay  │                                              │ interact │
         └──────────┘                                              └──────────┘
```

### States

| State | Description | Visual |
|-------|-------------|--------|
| CLOSED | Modal not rendered | Nothing visible |
| OPENING | Enter animation playing | Overlay fading in |
| OPEN | Fully visible, interactive | Modal content, backdrop |
| CLOSING | Exit animation playing | Overlay fading out |

### Accessibility

```
┌─────────────────────────────────────────────────────────────┐
│                    MODAL ACCESSIBILITY                       │
│                                                              │
│  [OPEN state]                                               │
│                                                              │
│  • Focus trap: Tab cycles within modal                      │
│  • Escape: closes modal                                     │
│  • aria-modal="true"                                        │
│  • aria-labelledby → modal title                            │
│  • Return focus to trigger on close                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Button

Button states including loading and disabled.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    Button State Machine                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        ┌──────────┐
                    ┌──────────────────►│   IDLE   │◄──────────────────┐
                    │                   │          │                   │
                    │                   │ Default  │                   │
                    │                   │ style    │                   │
                    │                   └────┬─────┘                   │
                    │                        │                         │
                    │ mouseLeave()           │ mouseEnter()            │
                    │                        ▼                         │
                    │                   ┌──────────┐                   │
                    └───────────────────│  HOVER   │                   │
                                        │          │                   │
                                        │ Lighter  │                   │
                                        │ bg color │                   │
                                        └────┬─────┘                   │
                                             │                         │
                                             │ mouseDown()             │
                                             ▼                         │
                                        ┌──────────┐                   │
                                        │  ACTIVE  │───────────────────┘
                                        │          │     mouseUp()
                                        │ Pressed  │
                                        │ darker   │
                                        └────┬─────┘
                                             │
                                             │ click() + async action
                                             ▼
                                        ┌──────────┐
                                        │ LOADING  │
                                        │          │
                                        │ Spinner  │
                                        │ disabled │
                                        └────┬─────┘
                                             │
                                             │ onComplete()
                                             ▼
                                        ┌──────────┐
                                        │   IDLE   │
                                        └──────────┘


    ════════════════════════════════════════════════════════════════════

                                        ┌──────────┐
                                        │ DISABLED │
                                        │          │
                                        │ Grayed   │
                                        │ no events│
                                        └──────────┘

                         Set via: disabled={true} prop
                         Ignores: all mouse/keyboard events
```

### States

| State | Description | Tailwind Classes |
|-------|-------------|------------------|
| IDLE | Default resting state | `bg-primary text-primary-foreground` |
| HOVER | Mouse over button | `hover:bg-primary/90` |
| ACTIVE | Button pressed | `active:scale-95` |
| LOADING | Async action in progress | `opacity-70` + spinner |
| DISABLED | Cannot interact | `disabled:opacity-50 disabled:cursor-not-allowed` |

---

## 5. Toast

Notification toast with auto-dismiss.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Toast State Machine                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

         ┌──────────┐     show()      ┌──────────┐    onAnimationEnd()   ┌──────────┐
         │  HIDDEN  │────────────────►│ ENTERING │──────────────────────►│ VISIBLE  │
         │          │                 │          │                       │          │
         │ Not in   │                 │ Slide in │                       │ Full     │
         │ DOM      │                 │ from top │                       │ opacity  │
         └──────────┘                 └──────────┘                       └────┬─────┘
              ▲                                                               │
              │                                                               │
              │ onAnimationEnd()                                              │ setTimeout(5s)
              │ {remove from queue}                                           │ OR dismiss()
              │                                                               │
         ┌────┴─────┐                                                         │
         │ EXITING  │◄────────────────────────────────────────────────────────┘
         │          │
         │ Fade out │
         │ slide    │
         └──────────┘
```

### Toast Queue

```
┌─────────────────────────────────────────────────────────────┐
│                      TOAST QUEUE                             │
│                                                              │
│   New toast → Add to queue → Display if < MAX_VISIBLE       │
│                                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│   │ Toast 1 │  │ Toast 2 │  │ Toast 3 │  (max 3 visible)    │
│   │ visible │  │ visible │  │ queued  │                     │
│   └─────────┘  └─────────┘  └─────────┘                     │
│                                                              │
│   When Toast 1 exits → Toast 3 becomes visible              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Toast Types

| Type | Icon | Color | Duration |
|------|------|-------|----------|
| success | CheckCircle | semantic-success | 5s |
| error | XCircle | semantic-error | 8s (longer) |
| warning | AlertTriangle | semantic-warning | 5s |
| info | Info | semantic-info | 5s |

---

## 6. WebSocket Connection

Real-time connection state machine.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  WebSocket Connection States                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        ┌──────────────┐
                                        │ DISCONNECTED │
                                        │              │
                                        │ No connection│
                                        │ Initial      │
                                        └──────┬───────┘
                                               │
                                               │ connect()
                                               │ {new WebSocket()}
                                               ▼
                                        ┌──────────────┐
                                        │  CONNECTING  │
                                        │              │
                                        │ Handshake    │
                                        │ in progress  │
                                        └──────┬───────┘
                                               │
                          ┌────────────────────┴────────────────────┐
                          │                                         │
                          │ [success]                               │ [error/timeout]
                          ▼                                         ▼
                   ┌──────────────┐                          ┌──────────────┐
                   │  CONNECTED   │                          │ RECONNECTING │
                   │              │                          │              │
                   │ Active       │                          │ Backoff      │
                   │ receiving    │                          │ 1s, 2s, 4s   │
                   └──────┬───────┘                          └──────┬───────┘
                          │                                         │
                          │ onclose() / onerror()                   │ [max retries]
                          │                                         │
                          │                    ┌────────────────────┘
                          │                    │
                          ▼                    ▼
                   ┌──────────────┐     ┌──────────────┐
                   │ RECONNECTING │     │ DISCONNECTED │
                   │              │     │              │
                   │ Auto-retry   │     │ Manual       │
                   │ with backoff │     │ reconnect    │
                   └──────────────┘     └──────────────┘
```

### Reconnection Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  EXPONENTIAL BACKOFF                         │
│                                                              │
│  Attempt 1: wait 1s   → retry                               │
│  Attempt 2: wait 2s   → retry                               │
│  Attempt 3: wait 4s   → retry                               │
│  Attempt 4: wait 8s   → retry                               │
│  Attempt 5: wait 16s  → give up, show error UI              │
│                                                              │
│  On user action: reset counter, retry immediately           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Connection Status UI

| State | Indicator | User Action |
|-------|-----------|-------------|
| DISCONNECTED | Red dot | "Connect" button |
| CONNECTING | Yellow dot + spinner | None (wait) |
| CONNECTED | Green dot | None |
| RECONNECTING | Yellow dot + "Reconnecting..." | "Retry now" link |

---

## Component Implementation Notes

### React Query Integration

```typescript
// DataTable state derived from useQuery
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['messages', filters],
  queryFn: () => fetchMessages(filters),
})

// State mapping:
// isLoading → LOADING
// isError → ERROR
// data?.length === 0 → EMPTY
// data?.length > 0 → DATA
```

### Zustand for Global State

```typescript
// Toast store
interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

// WebSocket store
interface WebSocketStore {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  connect: () => void
  disconnect: () => void
}
```

---

## Related Documents

- [User Flows](../flows/README.md) — User-centric flow diagrams
- [Sequence Diagrams](../sequences/README.md) — API interaction diagrams
- [Design System](../../../design-system/README.md) — Component styling
