# Module 09: Routing

**React Router v7 з code splitting**

---

## 🎯 Що це

**React Router** - client-side navigation. Замість server redirects (FastAPI `RedirectResponse`) → JS routing без page reload.

**Key pattern:** `lazy()` import → `Suspense` fallback → code splitting

---

## 🔄 Backend аналогія

| Backend (FastAPI) | Frontend (React Router) |
|-------------------|------------------------|
| `@router.get("/users")` | `path: "/users"` |
| `@router.get("/users/{id}")` | `path: "/users/:id"` |
| Path params | `useParams()` |
| Query params | `useSearchParams()` |
| `RedirectResponse` | `useNavigate()` |
| Middleware (auth) | Protected routes |

```python
# Backend
@router.get("/projects/{id}")
async def get_project(id: int):
    return {"id": id}

# Frontend (analog)
<Route path="/projects/:id" element={<ProjectPage />} />

// Component
const { id } = useParams()
```

---

## 📂 У твоєму проекті

**Routes definition:**
- `src/app/routes.tsx` - всі 14 routes

**Pattern:**
```typescript
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))

<Routes>
    <Route element={<MainLayout />}>
        <Route path="/projects" element={
            <Suspense fallback={<div>Loading...</div>}>
                <ProjectsPage />
            </Suspense>
        } />
    </Route>
</Routes>
```

**Nested routes:**
- `/topics/:topicId` - dynamic segment
- `/dashboard/*` - nested routes

**All pages lazy-loaded:**
- 14 pages × lazy() = code splitting

---

## 💡 Ключові концепції

### 1. lazy() Import
`const Page = lazy(() => import('./Page'))` - dynamic import

### 2. Suspense Fallback
`<Suspense fallback={<Loading />}>` - loading UI

### 3. useParams()
Read URL params: `const { id } = useParams()`

### 4. useNavigate()
Programmatic navigation: `navigate('/projects')`

### 5. useSearchParams()
Query string: `?sort=name&filter=active`

### 6. MainLayout Wrapper
Shared layout (sidebar, header) для всіх routes

---

## ✅ Коли використовувати

- ✅ Multi-page SPA
- ✅ Dynamic routes (/:id)
- ✅ Code splitting потрібен
- ✅ Protected routes (auth)

## ❌ Коли НЕ використовувати

- ❌ Single page app (no routes)
- ❌ Server-side rendering needed (use Next.js)

---

## 🚫 Типові Помилки

### 1. Hardcoded Шляхи
```tsx
// ❌ НЕ РОБИ: Magic strings
navigate('/projects/123')

// ✅ РОБИ: Константи
const ROUTES = { projectDetail: (id) => `/projects/${id}` }
navigate(ROUTES.projectDetail(123))
```

### 2. Забутий lazy()
```tsx
// ❌ НЕ РОБИ: Весь код в bundle
import ProjectsPage from './ProjectsPage'

// ✅ РОБИ: Code splitting
const ProjectsPage = lazy(() => import('./ProjectsPage'))
```

### 3. navigate() в Render
```tsx
// ❌ НЕ РОБИ: Infinite loop
function Component() {
  navigate('/home')  // ❌
  return <div>...</div>
}

// ✅ РОБИ: В useEffect
useEffect(() => navigate('/home'), [])
```

### 4. Забутий <Suspense>
```tsx
// ❌ НЕ РОБИ
<Page />  // lazy() без Suspense - error!

// ✅ РОБИ
<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

---

## 📚 Офіційна документація

- [React Router Docs](https://reactrouter.com/) ✅
- [Quick Start](https://reactrouter.com/en/main/start/tutorial) ✅
- [lazy()](https://react.dev/reference/react/lazy) ✅
- [Code Splitting](https://react.dev/reference/react/lazy#suspense-for-code-splitting) ✅

---

## 🛠️ Практика

1. Відкрий `src/app/routes.tsx`
2. Подивись lazy imports для всіх pages
3. Знайди nested routes
4. Відкрий Network tab → navigate → нові chunks завантажуються
5. Спробуй додати новий route

**Estimated time:** 1-2 години

---

## ❓ FAQ

**Q: Навіщо lazy() якщо можна просто import?**
A: Code splitting. Без lazy() = весь код в одному bundle (slow initial load).

**Q: Що таке Suspense fallback?**
A: Loading UI поки chunk завантажується (lazy() import).

**Q: useNavigate vs <Link>?**
A: `<Link>` для кнопок/links, `useNavigate()` для programmatic (after form submit).

---

**Далі:** [React Router Deep Dive](react-router.md) | [Lazy Loading](lazy-loading.md)

**Повернутись до:** [Learning Home](../index.md)
