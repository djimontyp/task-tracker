# TanStack Query - useQuery Patterns

**Data fetching з автоматичним caching**

---

## 🎯 Що таке useQuery

**useQuery** - hook для data fetching з автоматичним:
- **Caching** (не fetch двічі)
- **Background refetching** (оновлення в фоні)
- **Stale data handling** (коли data "застаріла")
- **Loading/Error states** (автоматичні флаги)

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],  // Унікальний ID
  queryFn: () => projectService.listProjects(),  // Fetch function
})
```

**Backend analog**:
```python
# Backend: SQLAlchemy session cache
user = session.get(User, 1)  # First call: SQL query
user = session.get(User, 1)  # Second call: Cache hit, no SQL

# Frontend: TanStack Query analog
const { data } = useQuery(['user', 1], () => fetchUser(1))  # First call: HTTP request
const { data } = useQuery(['user', 1], () => fetchUser(1))  # Second call: Cache hit, no HTTP
```

---

## 🔑 queryKey - Унікальний Ідентифікатор

**queryKey** = унікальний ID для query cache. Як primary key в database.

### Simple Key (Single Resource)

```typescript
// List queries
useQuery({ queryKey: ['projects'], queryFn: () => projectService.listProjects() })
useQuery({ queryKey: ['agents'], queryFn: () => agentService.listAgents() })

// Backend analog: Table name
SELECT * FROM projects;
SELECT * FROM agents;
```

### Compound Key (Resource + ID)

```typescript
// Detail queries
useQuery({
  queryKey: ['project', projectId],  // ['project', '123']
  queryFn: () => projectService.getProject(projectId),
})

useQuery({
  queryKey: ['agent', agentId],
  queryFn: () => agentService.getAgent(agentId),
})

// Backend analog: Table + Primary Key
SELECT * FROM projects WHERE id = 123;
SELECT * FROM agents WHERE id = 456;
```

### Nested Key (Resource + ID + Related)

```typescript
// Nested resource queries
useQuery({
  queryKey: ['project', projectId, 'experiments'],  // ['project', '123', 'experiments']
  queryFn: () => experimentService.listForProject(projectId),
})

// Backend analog: JOIN query
SELECT e.* FROM experiments e
JOIN projects p ON e.project_id = p.id
WHERE p.id = 123;
```

**Rule**: queryKey має match ваші параметри. Змінився параметр → змінився key → новий fetch.

---

## 🔄 queryFn - Fetch Function

**queryFn** = async function що повертає data (Promise).

### Pattern 1: Service Method

```typescript
// ✅ Service class method
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectService.listProjects(),  // Returns Promise<Project[]>
})
```

### Pattern 2: Inline Fetch

```typescript
// ✅ Inline fetch (simple cases)
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: async () => {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) throw new Error('Failed to fetch user')
    return response.json()
  },
})
```

### Pattern 3: queryFn з параметрами

```typescript
// ⚠️ BAD - closure variable (може бути stale)
const { data } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => projectService.getProject(projectId),  // Залежить від closure
})

// ✅ GOOD - queryKey як параметр
const { data } = useQuery({
  queryKey: ['project', projectId],
  queryFn: ({ queryKey }) => {
    const [, id] = queryKey  // Destructure key
    return projectService.getProject(id as string)
  },
})
```

**Backend analog**:
```python
# Backend: Query parameters
async def get_project(project_id: int):
    return await session.get(Project, project_id)

# Frontend: queryFn параметри з queryKey
queryFn: ({ queryKey }) => {
    const [, id] = queryKey
    return projectService.getProject(id)
}
```

---

## 📊 Query States (Loading, Success, Error)

useQuery повертає багато корисних полів:

```typescript
const {
  data,           // Fetched data (undefined поки loading)
  isLoading,      // true на першому fetch
  isFetching,     // true на будь-якому fetch (включно з background refetch)
  isError,        // true якщо error
  error,          // Error object
  isSuccess,      // true коли data є
} = useQuery({ queryKey: ['projects'], queryFn: projectService.listProjects })
```

### UI Pattern

```typescript
function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.listProjects(),
  })

  // Loading state
  if (isLoading) return <Spinner />

  // Error state
  if (error) return <div>Error: {error.message}</div>

  // Success state
  const projects = data?.items ?? []
  return projects.map((p) => <ProjectCard key={p.id} {...p} />)
}
```

**Backend analog**:
```python
# Backend: Exception handling
try:
    projects = await project_service.list_projects()
    return ProjectListResponse(items=projects)
except Exception as e:
    return ErrorResponse(message=str(e))

# Frontend: Auto states
const { data, isLoading, error } = useQuery(...)
# Автоматичний handling: loading → success або error
```

---

## ⏱️ staleTime - Час До "Застарілості"

**staleTime** = скільки часу data вважається "fresh" (не треба refetch).

**Config** (`frontend/src/app/providers.tsx:10`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
    },
  },
})
```

### Timeline

```
0s ────▶ Fetch ────▶ 5min ────▶ Stale
         (fresh)               (refetch on mount)

User opens page → fetch
User opens again after 2min → use cache (fresh)
User opens again after 6min → refetch (stale)
```

**Backend analog**:
```python
# Backend: Redis TTL (Time To Live)
redis.setex("projects", 300, json.dumps(projects))  # 5 min TTL

# Frontend: staleTime
staleTime: 1000 * 60 * 5  # 5 min
```

### Override staleTime

```typescript
// ✅ Override per query
useQuery({
  queryKey: ['live-stats'],
  queryFn: fetchStats,
  staleTime: 1000 * 10,  // 10 seconds (frequently changing data)
})

useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: 1000 * 60 * 60,  // 1 hour (rarely changing data)
})
```

---

## 🔄 refetchOnWindowFocus - Background Refetch

**refetchOnWindowFocus** = refetch коли user повертається до tab (focus).

**Config** (`providers.tsx:11`):
```typescript
refetchOnWindowFocus: false,  // Вимкнено у проекті
```

**Timeline** (якщо enabled):
```
User switches to another tab → 5 min → switches back → refetch (if stale)
```

**Use cases**:
- **false**: Admin dashboard (рідко змінюється)
- **true**: Chat app, live data (часто змінюється)

---

## 🛑 enabled - Conditional Queries

**enabled** = чи виконувати query (conditional fetch).

### Use Case 1: Dependent Query

```typescript
function ProjectDetails({ projectId }: { projectId?: string }) {
  // Query виконується тільки якщо projectId є
  const { data } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,  // false якщо projectId = undefined
  })

  if (!projectId) return <div>Select a project</div>
  return <div>{data?.name}</div>
}
```

**Backend analog**:
```python
# Backend: Early return
async def get_project_details(project_id: Optional[int]):
    if not project_id:
        return None  # Don't query database

    return await session.get(Project, project_id)

# Frontend: enabled
enabled: !!projectId  # Don't fetch якщо projectId undefined
```

### Use Case 2: User Interaction

```typescript
function SearchResults() {
  const [searchQuery, setSearchQuery] = useState('')

  // Query виконується тільки якщо є search query
  const { data } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchService.search(searchQuery),
    enabled: searchQuery.length > 0,  // Fetch тільки якщо є query
  })

  return (
    <div>
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      {data?.results.map(...)}
    </div>
  )
}
```

---

## 📦 Data Transformation (select)

**select** = transform data перед повернення з query.

```typescript
// ✅ Extract тільки потрібні поля
const { data: projectNames } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectService.listProjects(),
  select: (data) => data.items.map((p) => p.name),  // Transform: Project[] → string[]
})

// projectNames = ['Project A', 'Project B', 'Project C']
```

**Backend analog**:
```python
# Backend: SELECT specific columns
projects = session.execute(
    select(Project.name)  # Тільки name, не весь Project
).scalars().all()

# Frontend: select option
select: (data) => data.items.map((p) => p.name)  # Extract name
```

---

## 🧩 Real Example (ProjectsPage)

**File**: `frontend/src/pages/ProjectsPage/index.tsx:21-28`

```typescript
const {
  data: projectsResponse,  // Renamed data
  isLoading,
  error,
} = useQuery<ProjectListResponse>({  // TypeScript type
  queryKey: ['projects'],  // Simple key
  queryFn: () => projectService.listProjects(),  // Service method
})

const projects = projectsResponse?.items ?? []  // Fallback to []
const totalProjects = projectsResponse?.total ?? projects.length
```

**Pattern breakdown**:
1. **TypeScript type**: `<ProjectListResponse>` для type safety
2. **Data rename**: `data: projectsResponse` (зручніше ім'я)
3. **Fallback**: `?? []` (якщо undefined)
4. **Derived values**: `totalProjects` computed з `projectsResponse`

---

## 💡 Best Practices

### ✅ DO

1. **Stable queryKey** (не створюй нові objects):
   ```typescript
   // ✅ GOOD - stable keys
   useQuery({ queryKey: ['projects'] })
   useQuery({ queryKey: ['project', id] })

   // ❌ BAD - нові objects кожен render
   useQuery({ queryKey: [{ resource: 'projects' }] })
   ```

2. **Type your data**:
   ```typescript
   const { data } = useQuery<Project[]>({ ... })  // ✅ Type-safe
   ```

3. **Fallback values**:
   ```typescript
   const projects = data ?? []  // ✅ Завжди array
   ```

### ❌ DON'T

1. **Не fetch у useEffect** (use useQuery instead):
   ```typescript
   // ❌ BAD - manual fetch
   useEffect(() => {
     fetch('/api/projects').then(...)
   }, [])

   // ✅ GOOD - useQuery
   useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
   ```

2. **Не зберігай query result у useState**:
   ```typescript
   // ❌ BAD - duplicate state
   const { data } = useQuery(...)
   const [projects, setProjects] = useState(data)  // Duplicate!

   // ✅ GOOD - use data directly
   const { data } = useQuery(...)
   const projects = data ?? []  // Direct usage
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/pages/ProjectsPage/index.tsx:21-28`
2. Подивись useQuery setup
3. Trigger page → Network tab → запит виконується
4. Navigate away → back → запит НЕ виконується (cache!)
5. Wait 6 min → back → запит виконується (stale → refetch)

---

## ❓ FAQ

**Q: queryKey чому array, а не string?**
A: Array дозволяє compound keys: `['project', id]`, `['user', userId, 'posts']`. String тільки для simple keys.

**Q: Що якщо queryFn throws error?**
A: `isError = true`, `error` object populated, query **retry** (1 attempt за замовчуванням).

**Q: Як fetch заново (manual refetch)?**
A: `const { refetch } = useQuery(...)` → `<button onClick={refetch}>Reload</button>`.

---

**Далі:** [Mutations & Invalidation](mutations.md) | [WebSocket Sync](websocket-sync.md)

**Повернутись до:** [Module 05: TanStack Query](index.md)
