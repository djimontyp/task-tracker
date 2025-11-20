# Persist Middleware - localStorage Sync

**Auto-sync Zustand state ↔ localStorage**

---

## 🎯 Що робить persist middleware

**persist()** автоматично зберігає Zustand state в **localStorage** і відновлює при reload:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',  // localStorage key
    }
  )
)
```

**Result**:
1. User змінює theme → `setTheme('dark')`
2. Store оновлюється: `{ theme: 'dark' }`
3. **Автоматично** зберігається в `localStorage['theme-storage']`
4. Page reload → **Автоматично** відновлюється `{ theme: 'dark' }`

**Backend analog**:
```python
# Backend: Session middleware (HTTP sessions)
@app.middleware("http")
async def session_middleware(request, call_next):
    # Load session from cookie
    session = load_session(request.cookies.get("session_id"))
    request.state.session = session

    response = await call_next(request)

    # Save session to database
    save_session(session)
    return response

# Frontend: persist middleware (localStorage)
persist((set) => ({ ... }), { name: 'session' })
# Автоматично load/save з localStorage
```

---

## 🔧 uiStore - Real Example

**File**: `frontend/src/shared/store/uiStore.ts:21-56`

```typescript
export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      expandedGroups: {},
      isAdminMode: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      // ... інші actions
    }),
    {
      name: 'ui-settings',  // localStorage key

      partialize: (state) => ({
        // Вибір полів для збереження
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        expandedGroups: state.expandedGroups,
        isAdminMode: state.isAdminMode,
        // ⚠️ Functions НЕ зберігаються (toggleSidebar, setTheme)
      }),
    }
  )
)
```

**localStorage result**:
```json
{
  "state": {
    "theme": "dark",
    "sidebarOpen": true,
    "expandedGroups": { "ai-analysis": true },
    "isAdminMode": false
  },
  "version": 0
}
```

**Key**: `localStorage.getItem('ui-settings')` → above JSON

---

## 📦 partialize - Select Fields

**Problem**: Не всі поля треба зберігати (напр., loading states, derived values).

**Solution**: `partialize` option:

```typescript
persist(
  (set) => ({
    // State
    theme: 'light',
    loading: false,  // Не треба persist (transient)
    computedValue: 123,  // Не треба persist (derived)

    // Actions
    setTheme: (theme) => set({ theme }),
  }),
  {
    name: 'theme-storage',

    // ✅ Вибір полів
    partialize: (state) => ({
      theme: state.theme,  // Тільки theme
      // loading, computedValue - пропущено
    }),
  }
)
```

**Backend analog**:
```python
# Backend: Serializable fields (як Pydantic exclude)
class User(BaseModel):
    name: str
    email: str
    password: str  # Exclude from JSON response

    class Config:
        fields = {'password': {'exclude': True}}

# Frontend: partialize (exclude transient fields)
partialize: (state) => ({ name: state.name, email: state.email })
# password не зберігається в localStorage
```

---

## 🔄 Hydration - Load from localStorage

**Hydration** = процес відновлення state з localStorage при app startup.

```typescript
export const useStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    {
      name: 'counter-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Hydration failed:', error)
        } else {
          console.log('Hydration complete:', state)
        }
      },
    }
  )
)
```

**Lifecycle**:
1. App startup
2. persist middleware читає `localStorage['counter-storage']`
3. Parses JSON: `{ state: { count: 5 }, version: 0 }`
4. Hydrates store: `set({ count: 5 })`
5. Calls `onRehydrateStorage` callback

**Backend analog**:
```python
# Backend: Database connection pool initialization
@app.on_event("startup")
async def startup():
    # Load config from database/env
    app.state.config = load_config()

# Frontend: persist hydration
# Автоматично при create() - завантажує з localStorage
```

---

## 🛠️ Advanced Options

### Version & Migration

**Use case**: Schema changes (додав нове поле, змінив структуру).

```typescript
persist(
  (set) => ({
    theme: 'light',
    fontSize: 14,  // Нове поле (v1)
  }),
  {
    name: 'settings',
    version: 1,  // Increment on breaking changes

    migrate: (persistedState, version) => {
      // Migration від v0 до v1
      if (version === 0) {
        return {
          ...persistedState,
          fontSize: 14,  // Default для старих users
        }
      }
      return persistedState
    },
  }
)
```

**Backend analog**:
```python
# Backend: Alembic migrations
def upgrade():
    op.add_column('users', sa.Column('avatar_url', sa.String()))

# Frontend: persist migrate()
# Додає default values для нових полів
```

### Storage Type (не тільки localStorage)

```typescript
import { createJSONStorage } from 'zustand/middleware'

persist(
  (set) => ({ theme: 'light' }),
  {
    name: 'theme',
    storage: createJSONStorage(() => sessionStorage),  // sessionStorage замість localStorage
  }
)
```

**localStorage vs sessionStorage**:
- **localStorage**: Permanent (до manual clear)
- **sessionStorage**: Cleared on tab close

**Use case**:
- **localStorage**: User preferences (theme, sidebar)
- **sessionStorage**: Wizard state (multi-step form)

---

## 💡 Patterns in Your Project

### uiStore (localStorage)

**File**: `frontend/src/shared/store/uiStore.ts`

**Persisted fields**:
- `theme: 'light' | 'dark' | 'system'` - user preference
- `sidebarOpen: boolean` - sidebar state
- `expandedGroups: Record<string, boolean>` - accordion state
- `isAdminMode: boolean` - admin toggle

**NOT persisted**:
- Actions (`toggleSidebar`, `setTheme`) - functions не serializable

**Use case**: User preferences persist між sessions.

---

## 🧪 Testing Persist

**Browser DevTools**:

1. **Check localStorage**:
   ```javascript
   // Console
   localStorage.getItem('ui-settings')
   // → '{"state":{"theme":"dark","sidebarOpen":true},"version":0}'
   ```

2. **Modify store**:
   ```typescript
   const { setTheme } = useUiStore.getState()
   setTheme('dark')
   ```

3. **Verify localStorage updated**:
   ```javascript
   localStorage.getItem('ui-settings')
   // → '{"state":{"theme":"dark",...},"version":0}'
   ```

4. **Reload page** → theme залишається 'dark' ✅

---

## ✅ Best Practices

### ✅ DO

1. **Persist user preferences**:
   ```typescript
   // Theme, sidebar, language
   persist((set) => ({ theme: 'light' }), { name: 'ui' })
   ```

2. **Use partialize** для вибору полів:
   ```typescript
   partialize: (state) => ({ theme: state.theme })  // Exclude loading, errors
   ```

3. **Version** при breaking changes:
   ```typescript
   version: 2,  // Increment коли schema changes
   migrate: (old, v) => ({ ...old, newField: 'default' })
   ```

### ❌ DON'T

1. **Не persist transient state**:
   ```typescript
   // ❌ BAD
   partialize: (state) => ({ loading: state.loading })  // Transient

   // ✅ GOOD
   partialize: (state) => ({ theme: state.theme })  // Persistent
   ```

2. **Не persist sensitive data**:
   ```typescript
   // ❌ BAD - localStorage доступний через JS
   partialize: (state) => ({ password: state.password })

   // ✅ GOOD - тільки non-sensitive
   partialize: (state) => ({ theme: state.theme })
   ```

3. **Не persist large data**:
   ```typescript
   // ❌ BAD - localStorage limit ~5-10MB
   partialize: (state) => ({ messages: state.messages })  // 1000+ items

   // ✅ GOOD - use TanStack Query cache instead
   // Messages from API → cached in memory, not localStorage
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/shared/store/uiStore.ts`
2. Знайди `persist()` middleware setup
3. Відкрий DevTools → Application → Local Storage → `ui-settings`
4. Toggle theme → verify localStorage updated
5. Reload page → theme persists ✅

---

## ❓ FAQ

**Q: localStorage vs TanStack Query cache?**
A:
- **localStorage** (persist): User preferences (theme, sidebar)
- **TanStack Query**: Server data (messages, tasks) - memory cache

**Q: Що якщо localStorage full?**
A: Browser throws `QuotaExceededError`. Handle gracefully:
```typescript
onRehydrateStorage: () => (state, error) => {
  if (error?.name === 'QuotaExceededError') {
    console.error('localStorage full!')
    // Clear old data або fallback to defaults
  }
}
```

**Q: Чи можна persist в IndexedDB замість localStorage?**
A: Так! Custom storage:
```typescript
storage: createJSONStorage(() => ({
  getItem: async (name) => { /* IndexedDB get */ },
  setItem: async (name, value) => { /* IndexedDB set */ },
  removeItem: async (name) => { /* IndexedDB remove */ },
}))
```

---

**Далі:** [Your Stores Deep Dive](your-stores.md) | [Store Basics](store-basics.md)

**Повернутись до:** [Module 04: Zustand](index.md)
