# Матриця Рішень: State Management

## Який інструмент вибрати?

Одне з найпоширеніших питань: "Zustand чи TanStack Query чи Context чи useState?". Ця матриця допоможе вибрати правильний інструмент за секунди.

---

## 📊 Матриця Вибору

| Use Case | Рішення | Чому саме це | Приклад з проєкту |
|----------|---------|--------------|-------------------|
| **UI стан (sidebar відкрито/закрито)** | Zustand | Глобальний доступ, persist в localStorage | `useUIStore(s => s.sidebarOpen)` |
| **Серверні дані (юзери, списки, проєкти)** | TanStack Query | Автоматичний кешінг, refetching, stale handling | `useQuery(['users'], fetchUsers)` |
| **Налаштування теми (dark/light)** | Context API | Рідко змінюється, потрібно скрізь | `useTheme()` з ThemeProvider |
| **Локальний стан компонента (input значення)** | useState | Прив'язано до компонента, не шерить | `const [name, setName] = useState('')` |
| **Складний локальний стан (multi-step wizard)** | useReducer | Передбачувані state transitions | `useReducer(wizardReducer, initialState)` |
| **Форми (валідація, errors)** | react-hook-form | Валідація, перформанс, інтеграції | `const { register } = useForm()` |
| **WebSocket real-time дані** | TanStack Query + Zustand | Query для initial fetch, Zustand для оптимістичних оновлень | `queryClient.setQueryData` + WS listener |

---

## ❌ Коли НЕ використовувати

### Zustand - НЕ для:
- ❌ **Серверних даних** → Використай TanStack Query
  - Zustand не має вбудованого кешування/refetching
  - Втрачаєш automatic background refetch
  - Доведеться писати логіку stale/fresh вручну

- ❌ **Стану форм** → Використай react-hook-form
  - Ре-рендер на кожен keystroke (погана UX)
  - Немає вбудованої валідації

- ❌ **Локального стану компонента** → Використай useState
  - Over-engineering для простих випадків
  - Ускладнює код без потреби

### TanStack Query - НЕ для:
- ❌ **UI стану** → Використай Zustand
  - Не прив'язано до сервера = марнування кешу
  - Query key pollution без причини

- ❌ **Синхронних даних** → Використай useState/Zustand
  - Якщо немає API call = не потрібен Query
  - Зайва складність

### Context API - НЕ для:
- ❌ **Часто змінюваних даних** → Використай Zustand
  - Кожна зміна context = ре-рендер ВСІХ consumers
  - Погана перформанс

- ❌ **Серверних даних** → Використай TanStack Query
  - Немає кешування, stale handling

---

## 🔄 Backend Аналогії

Якщо ти backend розробник, думай так:

| Backend | Frontend Еквівалент | Пояснення |
|---------|---------------------|-----------|
| **PostgreSQL Database** | TanStack Query | Persistent, structured, джерело істини для серверних даних |
| **Redis Cache** | Zustand Store | Швидкий, ephemeral, для UI стану |
| **Request locals** (`request.state` в FastAPI) | Context API | Scoped до request (компонента), рідко змінюється |
| **Змінна у функції** | useState | Function-scoped, не виходить за межі |
| **SQLAlchemy Session** | TanStack Query QueryClient | Керує lifecycle даних, transactions (mutations) |

### Приклад з кодом:

**Backend (FastAPI + SQLAlchemy):**
```python
# Database (persistent)
user = await db.query(User).filter(User.id == user_id).first()

# Redis cache (ephemeral UI state)
await redis.set(f"sidebar_open:{user_id}", "true")

# Request state (scoped to request)
request.state.theme = "dark"

# Function local
def process_data():
    temp_result = []  # локальна змінна
```

**Frontend (React) - Еквівалент:**
```tsx
// TanStack Query (як Database)
const { data: user } = useQuery(['users', userId], () => fetchUser(userId))

// Zustand (як Redis cache)
const sidebarOpen = useUIStore(s => s.sidebarOpen)

// Context API (як request.state)
const { theme } = useTheme()

// useState (як function local)
function ProcessData() {
  const [tempResult, setTempResult] = useState([])
}
```

---

## 🎯 Реальні Приклади з Проєкту

### Zustand використовуємо для:
```tsx
// frontend/src/shared/stores/uiStore.ts
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'ui-store' } // Зберігається в localStorage
  )
)
```

**Чому Zustand?**
- UI стан (не серверні дані)
- Потрібно persist між сесіями
- Глобальний доступ з будь-якого компонента

### TanStack Query використовуємо для:
```tsx
// frontend/src/features/projects/api/projectsApi.ts
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 хв
  })
}
```

**Чому TanStack Query?**
- Серверні дані (проєкти з бекенду)
- Автоматичний refetch при stale
- Кешування для перформансу

### Context використовуємо для:
```tsx
// frontend/src/shared/providers/ThemeProvider.tsx
export function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**Чому Context?**
- Рідко змінюється (тема 1-2 рази на день)
- Потрібно на всіх рівнях дерева
- Немає серверного API

### useState використовуємо для:
```tsx
// frontend/src/features/messages/components/MessageDialog.tsx
export function MessageDialog() {
  const [open, setOpen] = useState(false) // Локальний UI стан

  return <Dialog open={open} onOpenChange={setOpen}>...</Dialog>
}
```

**Чому useState?**
- Локальний стан (тільки цей діалог)
- Не треба шерити з іншими компонентами
- Простий boolean

---

## 🚦 Швидкий Вибір (Flowchart)

```
Потрібен стан?
  ↓
Це дані з сервера (API call)?
  ├─ ТАК → TanStack Query ✅
  └─ НІ → Потрібен глобальний доступ?
      ├─ ТАК → Часто змінюється?
      │   ├─ ТАК → Zustand ✅
      │   └─ НІ → Context API ✅
      └─ НІ → Складний стан (багато transitions)?
          ├─ ТАК → useReducer ✅
          └─ НІ → useState ✅
```

---

## 💡 Pro Tips

### 1. Комбінуй інструменти
```tsx
// ✅ ДОБРЕ: Query для fetch, Zustand для optimistic updates
const { data } = useQuery(['messages'], fetchMessages)
const addOptimisticMessage = useMessagesStore(s => s.addOptimistic)

function sendMessage(text: string) {
  const tempId = Date.now()
  addOptimisticMessage({ id: tempId, text }) // Миттєво в UI

  mutation.mutate({ text }, {
    onSuccess: () => queryClient.invalidateQueries(['messages']) // Refetch real data
  })
}
```

### 2. Не створюй зайвих stores
```tsx
// ❌ ПОГАНО: Окремий store для кожного UI стану
const useDialogStore = create(...)
const useSidebarStore = create(...)
const useToastStore = create(...)

// ✅ ДОБРЕ: Один UI store
const useUIStore = create({
  dialogOpen: false,
  sidebarOpen: true,
  toasts: [],
})
```

### 3. Query keys мають бути ієрархічними
```tsx
// ❌ ПОГАНО
useQuery(['user', id])
useQuery(['users', id]) // Різні ключі, немає cache sharing

// ✅ ДОБРЕ
useQuery(['users', 'list'])
useQuery(['users', 'detail', id])
useQuery(['users', 'detail', id, 'projects'])
```

---

## 📚 Дивись Також

- [Модуль 04: Zustand](/04-state-zustand/) - Глибокий dive в Zustand patterns
- [Модуль 05: TanStack Query](/05-state-tanstack/) - Query lifecycle, mutations
- [Модуль 00: Foundations](/00-foundations/) - useState, useReducer basics

---

## ❓ FAQ

**Питання:** Чи можна використовувати і Zustand, і TanStack Query одночасно?

**Відповідь:** Так! Вони вирішують різні проблеми:
- **Query** для серверних даних (GET/POST/PUT/DELETE)
- **Zustand** для UI стану (sidebar, modals, preferences)

---

**Питання:** Коли використовувати useReducer замість useState?

**Відповідь:** Коли стан має складні transitions:
```tsx
// useState - просто
const [count, setCount] = useState(0)

// useReducer - складна логіка (wizard з кроками)
const [state, dispatch] = useReducer(wizardReducer, {
  step: 1,
  data: {},
  errors: {},
})
```

---

**Питання:** Context API повільний?

**Відповідь:** Так, якщо value часто змінюється. Кожна зміна = ре-рендер всіх consumers. Використовуй Context лише для рідко змінюваних даних (тема, locale).
