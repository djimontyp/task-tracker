# Module 04: State Management - Zustand

**Global state без Redux boilerplate**

---

## 🎯 Що це

**Zustand** - мінімалістична бібліотека для глобального state. Замість props drilling (передача props через 5 рівнів) → global store.

**Key concept:** `create()` factory → hook → subscribe to updates

---

## 🔄 Backend аналогія

| Backend (FastAPI) | Frontend (Zustand) |
|-------------------|-------------------|
| Class instance variables | Store state |
| `self.count = 0` | `count: 0` in store |
| Methods | Store actions |
| Singleton | `export const useStore = create(...)` |
| No persistence | `persist()` middleware → localStorage |

```python
# Backend
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1

# Frontend (Zustand analog)
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

---

## 📂 У твоєму проекті

**3 Zustand stores:**

1. **UI Store** - `src/shared/store/uiStore.ts:21-56`
   - Sidebar open/close
   - Theme (light/dark)
   - persist() middleware

2. **Messages Store** - `src/features/messages/store/messagesStore.ts`
   - Messages normalization (byId object)
   - WebSocket updates

3. **Tasks Store** - `src/features/tasks/store/tasksStore.ts`
   - Tasks state management

---

## 💡 Ключові концепції

### 1. create() Factory
`create((set, get) => ({ ... }))` - store initialization

### 2. set() Function
Immutable updates: `set((state) => ({ count: state.count + 1 }))`

### 3. get() Function
Read current state inside actions: `get().count`

### 4. persist() Middleware
Auto-sync state ↔ localStorage (для UI theme, sidebar)

### 5. DevTools Middleware
`devtools()` - Redux DevTools integration

### 6. Selectors
`const count = useStore((state) => state.count)` - subscribe to slice

---

## ✅ Коли використовувати

- ✅ Global state (theme, auth, sidebar)
- ✅ State між distant components
- ✅ Потрібен localStorage sync
- ✅ Simple state logic

## ❌ Коли НЕ використовувати

- ❌ Server data (use TanStack Query instead!)
- ❌ Form state (use react-hook-form)
- ❌ Component-local state (use useState)

---

## 📊 Матриця Рішень

**Не впевнений коли використовувати Zustand vs TanStack Query vs Context vs useState?**

👉 [**Матриця Вибору: State Management**](../decision-matrices/state-management.md)

Порівняння всіх інструментів state management з use cases, backend аналогіями та реальними прикладами.

---

## 🚫 Типові Помилки

### 1. Мутація Store Напряму (Без set)

```tsx
// ❌ НЕ РОБИ: Пряма мутація store
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => {
    useCounterStore.getState().count++  // ❌ Мутація напряму!
  },
}))

// ✅ РОБИ: Використовуй set() для змін
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),  // ✅ Immutable update
}))
```

**Чому:** Zustand відслідковує зміни через immutable updates. Пряма мутація → компоненти не ре-рендеряться.

**Backend Аналогія:**
```python
# Як SQLAlchemy session.add() - треба flush для commit
user.name = "Updated"  # Змінили об'єкт
session.add(user)      # Позначили для update
session.commit()       # Commit змін

# Zustand set() - аналогічно
set({ count: 1 })  # Commit зміни
```

---

### 2. Забуті Селектори (Зайві Ре-рендери)

```tsx
// ❌ НЕ РОБИ: Subscribe на весь store
function Component() {
  const store = useUIStore()  // ❌ Ре-рендер при будь-якій зміні в store!
  return <div>{store.sidebarOpen}</div>
}
// Якщо theme змінився → Component ре-рендериться (хоч sidebarOpen не змінився)

// ✅ РОБИ: Використовуй селектори
function Component() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)  // ✅ Ре-рендер тільки якщо sidebarOpen змінився
  return <div>{sidebarOpen}</div>
}
```

**Чому:** Без селектора компонент subscribe на ВСІ зміни store. З селектором - тільки на потрібну частину.

**Перформанс:** В великих store (50+ fields) різниця може бути 10x ре-рендерів.

---

### 3. Неправильна Конфігурація persist()

```tsx
// ❌ НЕ РОБИ: Persist without storage key - data collision
export const useStore = create(
  persist(
    (set) => ({ count: 0 }),
    { name: 'store' }  // ❌ Generic name - може конфліктувати з іншими stores
  )
)

// ✅ РОБИ: Унікальний key + selective persist
export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      tempData: null,  // Не треба persist
    }),
    {
      name: 'ui-store',  // ✅ Унікальне ім'я
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        // tempData не persist
      }),
    }
  )
)
```

**Чому:** Generic keys → data collision. Persist всього → заповнює localStorage непотрібними даними.

---

### 4. Store Subscriptions Без Cleanup

```tsx
// ❌ НЕ РОБИ: Subscribe без unsubscribe
useEffect(() => {
  useStore.subscribe((state) => {
    console.log('State changed:', state)
  })
  // ❌ Немає cleanup - memory leak
}, [])

// ✅ РОБИ: Завжди cleanup subscriptions
useEffect(() => {
  const unsub = useStore.subscribe((state) => {
    console.log('State changed:', state)
  })

  return () => unsub()  // ✅ Cleanup при unmount
}, [])
```

**Коли Треба:** WebSocket sync, analytics tracking, localStorage manual sync.

---

### 5. Складна Бізнес-Логіка в Store

```tsx
// ❌ НЕ РОБИ: Складна логіка в store actions
const useProjectStore = create((set) => ({
  projects: [],
  addProject: async (project) => {
    // 50 рядків валідації
    // API calls
    // Error handling
    // Transformations
    set((state) => ({ projects: [...state.projects, project] }))
  },
}))

// ✅ РОБИ: Логіка в custom hooks, store тільки для state
// hooks/useProjects.ts
function useProjects() {
  const { data } = useQuery(['projects'], fetchProjects)  // TanStack Query для API
  const addToRecent = useProjectStore((s) => s.addToRecent)  // Zustand для UI state

  const handleAdd = async (project) => {
    // Бізнес-логіка тут
    await createProject(project)
    addToRecent(project.id)  // Zustand тільки для UI state
  }

  return { projects: data, handleAdd }
}
```

**Правило:** Store для state, custom hooks для logic.

**Backend Аналогія:**
```python
# Store = Database (тільки data)
# Custom hooks = Service layer (business logic)

# ❌ НЕ РОБИ: Business logic в repository
class ProjectRepo:
    def create(self, project):
        # 100 рядків валідації - НЕ ТУТ!

# ✅ РОБИ: Logic в service
class ProjectService:
    def create(self, project):
        # Бізнес-логіка тут
        return self.repo.save(project)  # Repo тільки для DB
```

---

## 📚 Офіційна документація

- [Zustand Docs](https://zustand-demo.pmnd.rs/) ✅
- [Getting Started](https://docs.pmnd.rs/zustand/getting-started/introduction) ✅
- [Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data) ✅

---

## 🛠️ Практика

1. Відкрий `src/shared/store/uiStore.ts`
2. Подивись як theme зберігається в localStorage
3. Знайди використання `useUIStore()` в компонентах
4. Toggle theme → перевір localStorage в DevTools

**Estimated time:** 2-3 години

---

## ❓ FAQ

**Q: Zustand vs Redux - в чому різниця?**
A: Zustand = 5 рядків setup, Redux = 50 рядків boilerplate. Zustand простіший.

**Q: Чому для server data не Zustand?**
A: Server data needs caching, refetching, invalidation. Use TanStack Query.

**Q: Як уникнути re-renders?**
A: Selectors. `useStore((s) => s.count)` замість `useStore()` (весь state).

---

**Далі:** [Store Basics](store-basics.md) | [Persist Middleware](persist-middleware.md) | [Your Stores Deep Dive](your-stores.md)

**Повернутись до:** [Learning Home](../index.md)
