# Your Stores Deep Dive

**Розбір 3 Zustand stores з проекту**

---

## 📊 Stores Overview

| Store | Location | Purpose | Middleware | Lines |
|-------|----------|---------|------------|-------|
| **uiStore** | `/shared/store/uiStore.ts` | UI preferences (theme, sidebar) | persist | 57 |
| **messagesStore** | `/features/messages/store/messagesStore.ts` | Messages normalization, WebSocket updates | devtools | 202 |
| **wizardStore** | `/features/automation/store/wizardStore.ts` | Wizard multi-step form state | none | 92 |

---

## 🎨 Store 1: uiStore (Persist Middleware)

**File**: `frontend/src/shared/store/uiStore.ts:21-56`

**Purpose**: Global UI preferences що persist між sessions.

### Structure

```typescript
interface UiStore {
  // Sidebar state
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Accordion groups
  expandedGroups: Record<string, boolean>
  setExpandedGroup: (group: string, expanded: boolean) => void

  // Theme (light/dark/system)
  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  setTheme: (theme) => void

  // Admin mode toggle
  isAdminMode: boolean
  toggleAdminMode: () => void
  setAdminMode: (enabled: boolean) => void
}
```

### Key Features

#### 1. persist() Middleware

```typescript
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({ /* state + actions */ }),
    {
      name: 'ui-settings',  // localStorage key

      partialize: (state) => ({
        // Вибір полів для збереження
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        expandedGroups: state.expandedGroups,
        isAdminMode: state.isAdminMode,
        // Actions НЕ зберігаються (функції не serializable)
      }),
    }
  )
)
```

**Result**: User preferences зберігаються в `localStorage['ui-settings']` і відновлюються після reload.

#### 2. Toggle Pattern

```typescript
toggleTheme: () => set((state) => {
  // Cycle через 3 options: light → dark → system → light
  if (state.theme === 'light') return { theme: 'dark' }
  if (state.theme === 'dark') return { theme: 'system' }
  return { theme: 'light' }
}),
```

**Pattern**: State machine (3 states, циклічний перехід).

**Backend analog**:
```python
# Backend: Enum cycling
class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

def toggle_theme(current: Theme) -> Theme:
    if current == Theme.LIGHT:
        return Theme.DARK
    if current == Theme.DARK:
        return Theme.SYSTEM
    return Theme.LIGHT
```

#### 3. Record State (expandedGroups)

```typescript
expandedGroups: Record<string, boolean>,  // { "ai-analysis": true, "workspace": false }

setExpandedGroup: (group, expanded) =>
  set((state) => ({
    expandedGroups: { ...state.expandedGroups, [group]: expanded },  // Immutable merge
  })),
```

**Use case**: Accordion state persistence. User розгортає "AI Analysis" → reload → залишається розгорнутий.

**Backend analog**: JSON field в PostgreSQL (JSONB type).

### Usage Example

```typescript
function Sidebar() {
  // Selectors (subscribe тільки до потрібних полів)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const theme = useUiStore((s) => s.theme)

  return (
    <aside className={sidebarOpen ? 'open' : 'closed'}>
      <button onClick={toggleSidebar}>Toggle</button>
      <p>Theme: {theme}</p>
    </aside>
  )
}
```

---

## 📨 Store 2: messagesStore (DevTools + Normalization)

**File**: `frontend/src/features/messages/store/messagesStore.ts:66-201`

**Purpose**: Messages state з normalization (byId pattern) та WebSocket sync.

### Structure

```typescript
interface MessagesStoreState {
  messages: MessageList[]  // Sorted array
  statusByExternalId: Record<string, MessageStatus>  // Normalization: byId lookup
  lastUpdatedAt: string | null  // Timestamp
  isHydrated: boolean  // Initial load flag

  hydrate: (messages: Message[]) => void  // Initial load
  upsertMessage: (message: Message) => void  // Add/Update
  markPersisted: (externalId: string, patch?: Partial<Message>) => void  // Status update
  setPending: (externalId: string) => void  // Status update
  clear: () => void  // Reset
}
```

### Key Features

#### 1. devtools() Middleware

```typescript
export const useMessagesStore = create<MessagesStoreState>()(
  devtools(
    (set, get) => ({ /* state + actions */ }),
    { name: 'MessagesStore' }  // Redux DevTools label
  )
)
```

**Result**: Store visible в Redux DevTools extension → дебаг history, time-travel.

#### 2. Normalization Pattern (byId)

```typescript
statusByExternalId: Record<string, MessageStatus>  // { "msg-123": "persisted", "msg-456": "pending" }
```

**Why**: O(1) lookup за external_message_id замість O(n) array scan.

**Backend analog**:
```python
# Backend: Index в database
CREATE INDEX idx_messages_external_id ON messages(external_message_id);

# Frontend: byId object (hash map)
statusByExternalId: { "msg-123": "persisted" }  # O(1) lookup
```

#### 3. Upsert Pattern (Add/Update)

```typescript
upsertMessage: (incoming) => {
  const { messages } = get()

  const existingIndex = messages.findIndex(
    (msg) => msg.external_message_id === incoming.external_message_id
  )

  if (existingIndex >= 0) {
    // ✅ Update existing
    const updated = [...messages]
    updated[existingIndex] = { ...updated[existingIndex], ...incoming }
    set({ messages: sortBySentAtDesc(updated) })
  } else {
    // ✅ Add new
    set({ messages: sortBySentAtDesc([incoming, ...messages]) })
  }
},
```

**Pattern**:
1. Check if exists (findIndex)
2. Update or Add
3. Sort by timestamp (desc)

**Backend analog**:
```python
# Backend: SQLAlchemy upsert
async def upsert_message(message: Message):
    existing = await session.get(Message, message.id)
    if existing:
        # Update
        for key, value in message.dict().items():
            setattr(existing, key, value)
    else:
        # Insert
        session.add(message)
    await session.commit()
```

#### 4. Data Enhancement (Transform)

```typescript
const enhanceMessage = (message: Message): MessageList => {
  const sentAtIso = normalizeSentAt(message.sent_at || message.timestamp)
  const displayTimestamp = new Date(sentAtIso).toLocaleString('uk-UA')

  return {
    ...message,
    sent_at: sentAtIso,  // Normalized
    displayTimestamp,  // Computed (для UI)
    displaySource: message.source_name || 'unknown',  // Fallback
  }
}
```

**Pattern**: Augment data з computed fields (displayTimestamp) + fallbacks (backwards compatibility).

**Backend analog**: Pydantic computed fields або SQLAlchemy hybrid properties.

### Usage Example

```typescript
function MessagesPage() {
  // Hydrate on mount
  const hydrate = useMessagesStore((s) => s.hydrate)
  const messages = useMessagesStore((s) => s.messages)

  useEffect(() => {
    messageService.getMessages().then(hydrate)
  }, [])

  // WebSocket updates
  useEffect(() => {
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      useMessagesStore.getState().upsertMessage(msg)  // Outside component
    }
  }, [])

  return messages.map((msg) => <MessageCard key={msg.id} {...msg} />)
}
```

---

## 🧙 Store 3: wizardStore (Simple State)

**File**: `frontend/src/features/automation/store/wizardStore.ts:32-91`

**Purpose**: Multi-step wizard state (automation setup).

### Structure

```typescript
interface WizardState {
  currentStep: number  // 0, 1, 2
  formData: WizardFormData  // Nested object
  isValid: { schedule: boolean; rules: boolean }  // Validation state

  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateSchedule: (data: Partial<WizardFormData['schedule']>) => void
  updateRules: (data: Partial<WizardFormData['rules']>) => void
  setStepValidity: (step: 'schedule' | 'rules', isValid: boolean) => void
  resetWizard: () => void
}
```

### Key Features

#### 1. Step Navigation (Bounded)

```typescript
nextStep: () =>
  set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 2)  // Max: 2 (3 steps: 0, 1, 2)
  })),

prevStep: () =>
  set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0)  // Min: 0
  })),
```

**Pattern**: Bounded state transitions (не може бути < 0 або > 2).

**Backend analog**:
```python
# Backend: State machine з constraints
class Wizard:
    step: int = 0
    max_steps: int = 2

    def next_step(self):
        self.step = min(self.step + 1, self.max_steps)

    def prev_step(self):
        self.step = max(self.step - 1, 0)
```

#### 2. Nested Object Updates

```typescript
updateSchedule: (data) =>
  set((state) => ({
    formData: {
      ...state.formData,  // Outer spread
      schedule: {
        ...state.formData.schedule,  // Inner spread
        ...data,  // Merge partial
      },
    },
  })),
```

**Pattern**: Deep merge через nested spreads (2 levels).

**Backend analog**:
```python
# Backend: Dict update
def update_schedule(self, data: dict):
    self.form_data["schedule"].update(data)

# Frontend: Immutable nested spread
updateSchedule: (data) => set((state) => ({
  formData: {
    ...state.formData,
    schedule: { ...state.formData.schedule, ...data }
  }
}))
```

#### 3. Reset Pattern

```typescript
resetWizard: () =>
  set({
    currentStep: 0,
    formData: initialFormData,  // Reset to const
    isValid: { schedule: true, rules: true },
  }),
```

**Pattern**: Factory reset до initial const values.

**Use case**: User cancels wizard → reset state → start fresh.

### Usage Example

```typescript
function AutomationWizard() {
  const { currentStep, nextStep, prevStep, resetWizard } = useWizardStore()

  const steps = [
    <ScheduleStep />,  // Step 0
    <RulesStep />,     // Step 1
    <ReviewStep />,    // Step 2
  ]

  return (
    <div>
      {steps[currentStep]}
      <button onClick={prevStep} disabled={currentStep === 0}>Back</button>
      <button onClick={nextStep} disabled={currentStep === 2}>Next</button>
      <button onClick={resetWizard}>Cancel</button>
    </div>
  )
}
```

---

## 🔍 Comparison Table

| Feature | uiStore | messagesStore | wizardStore |
|---------|---------|---------------|-------------|
| **Middleware** | persist | devtools | none |
| **Persistence** | localStorage | memory | memory |
| **Normalization** | ❌ | ✅ (byId) | ❌ |
| **Complexity** | Low | High | Low |
| **State Shape** | Flat | Normalized | Nested |
| **Update Pattern** | Toggle | Upsert | Merge |
| **Use Case** | Preferences | Real-time data | Wizard flow |

---

## 💡 Patterns Summary

### Pattern 1: Toggle State (uiStore)
```typescript
toggleTheme: () => set((state) => {
  if (state.theme === 'light') return { theme: 'dark' }
  if (state.theme === 'dark') return { theme: 'system' }
  return { theme: 'light' }
}),
```

### Pattern 2: Upsert (messagesStore)
```typescript
upsertMessage: (incoming) => {
  const { messages } = get()
  const index = messages.findIndex((m) => m.id === incoming.id)

  if (index >= 0) {
    // Update
    const updated = [...messages]
    updated[index] = { ...updated[index], ...incoming }
    set({ messages: updated })
  } else {
    // Insert
    set({ messages: [incoming, ...messages] })
  }
}
```

### Pattern 3: Bounded State (wizardStore)
```typescript
nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, MAX) }))
prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) }))
```

### Pattern 4: Nested Merge (wizardStore)
```typescript
updateSchedule: (data) => set((s) => ({
  formData: {
    ...s.formData,
    schedule: { ...s.formData.schedule, ...data }
  }
}))
```

---

## 🛠️ Практика

### Exercise 1: Extend uiStore

Add notification preferences:
```typescript
// TODO(human): Add to uiStore
notificationsEnabled: boolean  // State
toggleNotifications: () => void  // Action
```

Ensure it persists (add to `partialize`).

### Exercise 2: Debug messagesStore

1. Відкрий Redux DevTools
2. Trigger `upsertMessage` action
3. Time-travel to previous state
4. Inspect `statusByExternalId` normalization

### Exercise 3: Add Step to wizardStore

Add 4th step (Confirmation):
```typescript
// Change max steps: Math.min(s.currentStep + 1, 3)  // Was: 2
```

Test navigation: 0 → 1 → 2 → 3, cannot go beyond.

---

## ❓ FAQ

**Q: Чому messagesStore має devtools але uiStore має persist?**
A: Different use cases:
- **uiStore**: User preferences → persist між sessions
- **messagesStore**: Real-time data → debug з DevTools, не persist (server є single source of truth)

**Q: Чи можна використовувати persist + devtools разом?**
A: Так! Middleware compose:
```typescript
create(
  devtools(
    persist(
      (set) => ({ ... }),
      { name: 'store' }
    ),
    { name: 'Store' }
  )
)
```

**Q: Навіщо wizardStore якщо можна useState в компоненті?**
A: Wizard state shared між multiple components (Step1, Step2, ReviewSummary). Zustand = global state без prop drilling.

---

**Повернутись до:** [Module 04: Zustand](index.md) | [Store Basics](store-basics.md) | [Persist Middleware](persist-middleware.md)
