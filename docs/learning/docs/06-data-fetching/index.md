# Module 06: Data Fetching

**API layer з service pattern**

---

## 🎯 Що це

**Service Pattern** - class-based API clients. Замість розкиданих fetch() по всьому проекту → централізовані services.

**Key pattern:** Service class → singleton export → use in TanStack Query

---

## 🔄 Backend аналогія

| Backend (FastAPI) | Frontend (Service) |
|-------------------|-------------------|
| Service layer | Service class |
| `class UserService` | `class AgentService` |
| Dependency injection | Singleton export |
| `@router.get("/users")` | `async getAgents()` |
| Exception handling | Response.ok check |

```python
# Backend
class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def get_user(self, id: int):
        return await self.db.get(User, id)

# Frontend (analog)
class UserService {
    async getUser(id: number) {
        const res = await fetch(`/api/users/${id}`)
        if (!res.ok) throw new Error('Failed')
        return res.json()
    }
}
```

---

## 📂 У твоєму проекті

**Services:**
- `src/features/agents/api/agentService.ts:21-266` - повний CRUD service
- `src/features/projects/api/projectService.ts` - projects API
- `src/features/messages/api/messageService.ts` - messages API

**Config:**
- `src/shared/config/api.ts` - 30+ API endpoints константи

**Pattern:**
```typescript
// Service definition
class AgentService {
    async getAgents() { ... }
}

// Singleton export
export const agentService = new AgentService()

// Usage in query
useQuery(['agents'], () => agentService.getAgents())
```

---

## 💡 Ключові концепції

### 1. Service Class Pattern
Не функції, а клас з методами (як backend service layer)

### 2. Native Fetch API
`fetch()` замість axios (менше dependencies)

### 3. Singleton Export
`export const userService = new UserService()` - один instance

### 4. Endpoints Config
Централізовані URL константи в `api.ts`

### 5. Error Handling
`if (!response.ok) throw new Error()` pattern

### 6. TypeScript Types
Request/Response типи з backend (generated або manual)

---

## ✅ Коли використовувати

- ✅ Multiple API methods для одного resource
- ✅ Shared logic (auth headers, error handling)
- ✅ Type safety з TypeScript
- ✅ Reusable service в queries/mutations

## ❌ Коли НЕ використовувати

- ❌ Single fetch call (просто fetch() inline)
- ❌ GraphQL (use Apollo/urql instead)

---

## 🚫 Типові Помилки

### 1. Не Перевіряють response.ok

```tsx
// ❌ НЕ РОБИ: Забули перевірити response.ok
async getUsers() {
  const res = await fetch('/api/users')
  return res.json()  // ❌ Якщо 404/500 - все одно спробує parse JSON!
}

// ✅ РОБИ: Завжди перевіряй response.ok
async getUsers() {
  const res = await fetch('/api/users')
  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`)  // ✅ Throw error
  }
  return res.json()
}
```

**Чому:** `fetch()` НЕ кидає error на 404/500. Треба явно перевіряти `response.ok`.

**Backend Аналогія:**
```python
# Backend - FastAPI автоматично кидає HTTPException
@router.get("/users/{id}")
async def get_user(id: int):
    user = await db.get(User, id)
    if not user:
        raise HTTPException(404, "Not found")  # Auto error
    return user

# Frontend - треба явно перевіряти
if (!res.ok) throw new Error()
```

---

### 2. Hardcoded URLs Замість Config

```tsx
// ❌ НЕ РОБИ: Hardcoded URLs скрізь
async getUsers() {
  return fetch('http://localhost:8000/api/v1/users')  // ❌ Magic string
}

async getProjects() {
  return fetch('http://localhost:8000/api/v1/projects')  // ❌ Повторення
}

// ✅ РОБИ: Централізовані константи
// config/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const ENDPOINTS = {
  users: `${API_BASE}/api/v1/users`,
  projects: `${API_BASE}/api/v1/projects`,
}

// service
async getUsers() {
  return fetch(ENDPOINTS.users)  // ✅ DRY principle
}
```

**Чому:** Hardcoded URLs = дублікація. Зміна домену = змінювати 50+ місць.

---

### 3. Забутий Error Handling в UI

```tsx
// ❌ НЕ РОБИ: Fetch без error handling
function UsersList() {
  const { data } = useQuery(['users'], fetchUsers)  // ❌ Що якщо error?

  return data.map(user => <UserCard user={user} />)  // ❌ Crash якщо data = undefined!
}

// ✅ РОБИ: Обробляй isLoading і isError
function UsersList() {
  const { data, isLoading, isError, error } = useQuery(['users'], fetchUsers)

  if (isLoading) return <Skeleton />  // ✅ Loading state
  if (isError) return <ErrorMessage error={error} />  // ✅ Error state

  return data.map(user => <UserCard key={user.id} user={user} />)
}
```

**Коли Треба:**
- Network errors (offline, timeout)
- Server errors (500)
- Validation errors (400)
- Auth errors (401)

---

### 4. Не Використовують TypeScript Types

```tsx
// ❌ НЕ РОБИ: Без типів - runtime errors
async getUser(id: number) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()  // ❌ any type!
}

// ✅ РОБИ: Типізуй request/response
interface User {
  id: number
  name: string
  email: string
}

async getUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error('Failed')
  return res.json() as User  // ✅ Type-safe
}
```

**Чому:** TypeScript перевіряє types на compile-time. Без типів - помилки в runtime.

**Pro Tip:** Використовуй code generation з OpenAPI/Swagger для auto-generated types.

---

### 5. Забуті Auth Headers

```tsx
// ❌ НЕ РОБИ: Fetch без auth token
async getProjects() {
  return fetch('/api/projects')  // ❌ 401 Unauthorized!
}

// ✅ РОБИ: Додавай auth headers
async getProjects() {
  const token = getAuthToken()  // З localStorage/Zustand
  return fetch('/api/projects', {
    headers: {
      'Authorization': `Bearer ${token}`,  // ✅ Auth header
      'Content-Type': 'application/json',
    },
  })
}

// ✅ Краще: Base class з auth headers
class BaseService {
  protected async fetch(url: string, options?: RequestInit) {
    const token = getAuthToken()
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  }
}

class UserService extends BaseService {
  async getUsers() {
    return this.fetch('/api/users')  // ✅ Auth auto-included
  }
}
```

**Backend Аналогія:**
```python
# Dependency injection для auth
@router.get("/projects")
async def get_projects(
    user: User = Depends(get_current_user)  # Auto auth check
):
    return user.projects
```

---

## 📚 Офіційна документація

- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) ✅
- [Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) ✅

---

## 🛠️ Практика

1. Відкрий `src/features/agents/api/agentService.ts`
2. Подивись методи: getAgents, createAgent, updateAgent, deleteAgent
3. Знайди використання в TanStack Query hooks
4. Спробуй додати новий метод до service

**Estimated time:** 2 години

---

## ❓ FAQ

**Q: Чому class а не просто функції?**
A: Consistency з backend. Зручно групувати методи. Можна додати state якщо треба.

**Q: Fetch vs Axios?**
A: Fetch = нативний API, менше dependencies. Axios = більше features (interceptors).

**Q: Де зберігати auth token?**
A: В service можна додати headers: `Authorization: Bearer ${token}`.

---

**Далі:** [Service Pattern Deep Dive](service-pattern.md) | [Error Handling](error-handling.md)

**Повернутись до:** [Learning Home](../index.md)
