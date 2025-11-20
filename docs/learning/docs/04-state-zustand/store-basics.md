# Zustand Store Basics

**create() pattern та immutable updates**

---

## 🎯 create() Factory

**Zustand** створює stores через factory function `create()`:

```typescript
import { create } from 'zustand'

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterStore>((set, get) => ({
  // State
  count: 0,

  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

**Backend analog**:
```python
# Backend (class instance)
class Counter:
    def __init__(self):
        self.count = 0  # Instance variable

    def increment(self):
        self.count += 1  # Mutable update

# Frontend (Zustand)
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))  // Immutable
}))
```

---

## 🔄 set() Function - Immutable Updates

**Two patterns**:

### Pattern 1: Object Merge (простий)
```typescript
export const useStore = create((set) => ({
  name: "Alice",
  age: 25,

  // ✅ Simple update - merge object
  setName: (name: string) => set({ name }),
  setAge: (age: number) => set({ age }),
}))
```

### Pattern 2: Function Update (з попереднім state)
```typescript
export const useStore = create((set) => ({
  count: 0,

  // ✅ Function update - access previous state
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

**Коли використовувати**:
- **Object merge**: Коли нове значення не залежить від старого
- **Function update**: Коли потрібен попередній state (counter, arrays)

---

## 📝 get() Function - Read State Inside Actions

**Use case**: Читання state всередині action:

```typescript
export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) => {
    const { items } = get()  // Read current state

    set({
      items: [...items, item],
      total: items.length + 1,
    })
  },

  clearIfEmpty: () => {
    const { items } = get()
    if (items.length === 0) {
      set({ total: 0 })
    }
  },
}))
```

**Backend analog**:
```python
class CartService:
    def __init__(self):
        self.items = []

    def add_item(self, item):
        current = self.items  # Read current state
        self.items = [...current, item]  # Update
```

---

## 🎭 Immutable Updates (Manual)

Zustand **НЕ** використовує Immer (на відміну від Redux Toolkit). Треба вручну робити immutable updates:

### Arrays

```typescript
export const useTasksStore = create((set) => ({
  tasks: [],

  // ✅ Add item
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]  // Spread operator
  })),

  // ✅ Remove item
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)  // Filter creates new array
  })),

  // ✅ Update item
  updateTask: (id, patch) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, ...patch } : t  // Map creates new array
    )
  })),
}))
```

### Objects

```typescript
export const useUserStore = create((set) => ({
  profile: { name: "Alice", age: 25 },

  // ✅ Update nested object
  updateProfile: (patch) => set((state) => ({
    profile: { ...state.profile, ...patch }  // Spread merge
  })),
}))
```

**Backend analog**:
```python
# Backend (mutable - не треба spread)
def update_task(self, id, patch):
    task = self.tasks[id]
    task.update(patch)  # In-place update

# Frontend (immutable - треба spread)
updateTask: (id, patch) => set((state) => ({
  tasks: state.tasks.map((t) =>
    t.id === id ? { ...t, ...patch } : t  # Новий об'єкт
  )
}))
```

---

## 🪝 Hook Usage (у компонентах)

### Subscribe to Full Store

```typescript
function Counter() {
  const { count, increment } = useCounterStore()  // ⚠️ Re-renders on ANY state change

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

**Problem**: Re-renders коли будь-яка частина store змінюється (не тільки `count`).

### Selector Pattern (recommended)

```typescript
function Counter() {
  // ✅ Re-renders тільки коли count змінюється
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

**Backend analog**:
```python
# Backend: No re-render concept, але analog - query optimization
# ❌ SELECT * FROM tasks  (all columns)
# ✅ SELECT id, title FROM tasks  (only needed columns)

# Frontend: Same principle
# ❌ const state = useStore()  (all state)
# ✅ const title = useStore((s) => s.title)  (only needed slice)
```

---

## 🔍 Multiple Selectors

```typescript
function TaskItem({ taskId }) {
  // Each selector subscribes independently
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === taskId))
  const updateTask = useTasksStore((s) => s.updateTask)

  // Re-renders тільки коли task з цим taskId змінюється
  return <div>{task.title}</div>
}
```

---

## 🧩 Store Patterns (у проекті)

### Pattern 1: Simple State (wizardStore)

```typescript
// frontend/src/features/automation/store/wizardStore.ts
export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 0,
  formData: initialFormData,

  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 2)
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0)
  })),
}))
```

**Pattern**: Простий state + actions без middleware.

### Pattern 2: Normalized State (messagesStore)

```typescript
// frontend/src/features/messages/store/messagesStore.ts
export const useMessagesStore = create(
  devtools((set, get) => ({
    messages: [],
    statusByExternalId: {},  // Normalization: byId object

    upsertMessage: (incoming) => {
      const { messages } = get()
      const existingIndex = messages.findIndex(
        (msg) => msg.external_message_id === incoming.external_message_id
      )

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...messages]
        updated[existingIndex] = { ...updated[existingIndex], ...incoming }
        set({ messages: updated })
      } else {
        // Add new
        set({ messages: [incoming, ...messages] })
      }
    },
  }))
)
```

**Pattern**: Normalization (byId) + devtools middleware.

**Backend analog**: SQLAlchemy session cache з by-ID lookup.

---

## 💡 Best Practices

### ✅ DO

1. **Use selectors** для performance:
   ```typescript
   const count = useStore((s) => s.count)  // ✅
   ```

2. **Immutable updates** (spread, map, filter):
   ```typescript
   set((state) => ({ items: [...state.items, newItem] }))  // ✅
   ```

3. **TypeScript types** для store interface:
   ```typescript
   interface Store { count: number; increment: () => void }
   create<Store>(...)  // ✅
   ```

4. **Shallow objects** у store (не deep nested):
   ```typescript
   { user: { profile: { name: "Alice" } } }  // ⚠️ Deep nesting - складно update
   { userName: "Alice" }  // ✅ Flat structure
   ```

### ❌ DON'T

1. **Не мутуй state**:
   ```typescript
   // ❌ BAD
   set((state) => {
     state.count += 1  // Mutation!
     return state
   })

   // ✅ GOOD
   set((state) => ({ count: state.count + 1 }))  // Immutable
   ```

2. **Не підписуйся на весь store**:
   ```typescript
   const state = useStore()  // ❌ Re-renders на всі зміни
   const count = useStore((s) => s.count)  // ✅ Re-renders тільки на count
   ```

3. **Не зберігай derived state**:
   ```typescript
   // ❌ BAD - зберігаємо count і doubledCount
   { count: 5, doubledCount: 10 }

   // ✅ GOOD - compute on read
   const count = useStore((s) => s.count)
   const doubledCount = count * 2  // Derived у компоненті
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/features/automation/store/wizardStore.ts`
2. Подивись як `nextStep` та `prevStep` використовують `Math.min`/`Math.max`
3. Знайди використання `useWizardStore` у компонентах
4. Спробуй додати новий action `jumpToStep(step: number)`

---

## ❓ FAQ

**Q: Навіщо `set((state) => ...)` замість просто `set({ ... })`?**
A: Щоб читати попередній state. Без функції ти не знаєш старе значення.

**Q: Чи можна викликати actions з інших actions?**
A: Так! Використовуй `get()` щоб читати інші actions:
```typescript
const store = create((set, get) => ({
  increment: () => set((s) => ({ count: s.count + 1 })),
  incrementTwice: () => {
    get().increment()
    get().increment()
  },
}))
```

**Q: Як дебажити store?**
A: Використовуй `devtools()` middleware (див. persist-middleware.md) + Redux DevTools extension.

---

**Далі:** [Persist Middleware](persist-middleware.md) | [Your Stores Deep Dive](your-stores.md)

**Повернутись до:** [Module 04: Zustand](index.md)
