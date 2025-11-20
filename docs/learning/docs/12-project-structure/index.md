# Module 12: Project Structure

**Feature-based architecture та best practices**

---

## 🎯 Що це

**Feature-based architecture** - організація по features (agents, tasks, messages), не по типах (components/, hooks/, utils/).

**Key pattern:** Feature folder містить все: components, hooks, API, store

---

## 🔄 Backend аналогія

| Backend (FastAPI) | Frontend (React) |
|-------------------|-----------------|
| `app/users/` module | `src/features/agents/` |
| `routers/`, `services/`, `models/` | `components/`, `api/`, `hooks/` |
| Feature modules | Feature folders |
| `__init__.py` exports | `index.ts` exports |

```python
# Backend structure
app/
├── users/
│   ├── router.py
│   ├── service.py
│   └── models.py
└── tasks/
    ├── router.py
    └── service.py

# Frontend structure (analog)
src/
├── features/
│   ├── agents/
│   │   ├── components/
│   │   ├── api/
│   │   └── hooks/
│   └── tasks/
│       ├── components/
│       └── api/
```

---

## 📂 Структура проекту

```
src/
├── app/                    # App setup (routes, providers)
│   ├── routes.tsx         # 14 routes з lazy loading
│   └── providers.tsx      # QueryClient, ThemeProvider
│
├── features/              # 14 feature modules
│   ├── agents/           # Agent management
│   ├── analysis/         # Analysis logic
│   ├── atoms/            # Atoms CRUD
│   ├── knowledge/        # Knowledge extraction
│   ├── messages/         # Messages + store
│   ├── tasks/            # Tasks management
│   └── websocket/        # WebSocket hook
│
├── pages/                # 14 pages (lazy-loaded)
│   ├── ProjectsPage/
│   ├── AgentsPage/
│   └── ...
│
├── shared/               # Shared utilities
│   ├── ui/              # 33 UI components (shadcn)
│   ├── components/      # DataTable, Sidebar
│   ├── hooks/           # useDebounce
│   ├── store/           # 3 Zustand stores
│   └── config/          # API endpoints
│
└── index.css            # CSS variables, Tailwind
```

---

## 💡 Ключові концепції

### 1. Feature-Based Organization
Feature містить все потрібне: components, API, hooks, store

### 2. Import Aliases
```typescript
import { Button } from '@/shared/ui/button'
import { useAgents } from '@features/agents/hooks'
```

### 3. Vite Code Splitting
3 vendor chunks:
- react-vendor (React, ReactDOM)
- router-vendor (React Router)
- vendor (інші dependencies)

### 4. Lazy Loading
Всі 14 pages lazy-loaded через `lazy()` + `Suspense`

### 5. Strict TypeScript
`strict: true` mode для type safety

### 6. Shared UI (shadcn)
33 UI components в `shared/ui/` (reusable)

---

## ✅ Best Practices

- ✅ Feature folders (не type folders)
- ✅ Import aliases (`@/`, `@features/`)
- ✅ Lazy loading для pages
- ✅ Shared UI components
- ✅ TypeScript strict mode
- ✅ CSS variables для theming

## ❌ Anti-patterns

- ❌ Type folders (`components/`, `hooks/` top-level)
- ❌ Circular imports
- ❌ Relative imports `../../../`
- ❌ Hardcoded colors (use CSS variables)
- ❌ No TypeScript types

---

## 🚫 Типові Помилки

### 1. Type-Based Folders
```tsx
// ❌ НЕ РОБИ: Group by type
src/
  components/
  hooks/
  utils/

// ✅ РОБИ: Group by feature
src/
  features/
    projects/
      components/
      hooks/
      api/
```

### 2. Глибока Вкладеність
```tsx
// ❌ НЕ РОБИ: 7+ рівнів
src/features/projects/components/list/items/card/header/

// ✅ РОБИ: Max 3-4 рівні
src/features/projects/
  components/ProjectCard.tsx
```

### 3. Відносні Імпорти
```tsx
// ❌ НЕ РОБИ
import { Button } from '../../../shared/ui/button'

// ✅ РОБИ: Absolute imports
import { Button } from '@/shared/ui/button'
```

### 4. Циклічні Імпорти
```tsx
// ❌ НЕ РОБИ
// A.tsx imports B.tsx
// B.tsx imports A.tsx  // ❌ Circular!

// ✅ РОБИ: Extract спільну логіку в C.tsx
```

### 5. Файли 1000+ Рядків
```tsx
// Якщо файл > 500 рядків → розбий на частини
// Component + hooks + utils = окремі файли
```

---

## 📚 Офіційна документація

- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy) ✅
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict) ✅

---

## 🛠️ Практика

1. Explore `src/features/` - подивись structure
2. Відкрий `vite.config.ts` - vendor chunks config
3. Check `tsconfig.json` - import aliases
4. Run `npm run build` → подивись chunk sizes

**Estimated time:** 1 години

---

## ❓ FAQ

**Q: Feature-based vs Type-based?**
A: Feature-based = easier navigation, clear boundaries. Type-based = scattered code.

**Q: Коли щось має бути в shared/?**
A: Used в 2+ features. Якщо тільки в одній feature → тримай там.

**Q: Навіщо lazy loading якщо SPA?**
A: Initial bundle size. Без lazy = 2MB initial load. З lazy = 300KB initial, решта on-demand.

---

**Далі:** [Feature-Based Architecture](feature-based.md) | [Best Practices Guide](best-practices.md)

**Повернутись до:** [Learning Home](../index.md)
