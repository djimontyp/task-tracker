# TanStack Query - Mutations & Invalidation

**Create/Update/Delete з автоматичним cache оновленням**

---

## 🎯 Що таке useMutation

**useMutation** - hook для write operations (POST/PUT/DELETE). На відміну від useQuery (read), mutation:
- **Не має cache** (кожен mutate = новий request)
- **Manually triggered** (не auto-fetch)
- **Invalidates queries** після success → auto refetch

```typescript
const mutation = useMutation({
  mutationFn: (data) => projectService.createProject(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })  // Оновити projects list
    toast.success('Project created!')
  },
})

// Usage
<button onClick={() => mutation.mutate(projectData)}>Create</button>
```

**Backend analog**:
```python
# Backend: POST endpoint + cache invalidation
@router.post("/projects")
async def create_project(data: ProjectCreate):
    project = await project_service.create(data)

    # Invalidate cache (якщо є Redis)
    redis.delete("projects_list")

    return project

# Frontend: useMutation + invalidateQueries
mutationFn: createProject,
onSuccess: () => queryClient.invalidateQueries(['projects'])
```

---

## 🔧 useMutation Setup

### Basic Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateProjectButton() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectService.createProject(data),

    onSuccess: (createdProject) => {
      // Invalidate projects list → refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      console.log('Created:', createdProject)
    },

    onError: (error: Error) => {
      console.error('Failed:', error.message)
    },
  })

  return (
    <button onClick={() => mutation.mutate({ name: 'New Project' })}>
      {mutation.isPending ? 'Creating...' : 'Create Project'}
    </button>
  )
}
```

**Lifecycle**:
1. User clicks button → `mutation.mutate(data)`
2. `mutationFn` виконується → HTTP POST
3. **Success**: `onSuccess` → `invalidateQueries` → projects refetch
4. **Error**: `onError` → show error message

---

## 📋 Mutation States

```typescript
const mutation = useMutation({ ... })

mutation.isPending    // true коли mutation в процесі
mutation.isSuccess    // true після successful mutation
mutation.isError      // true якщо error
mutation.error        // Error object
mutation.data         // Response data від mutationFn
```

### UI Pattern

```typescript
function CreateForm() {
  const mutation = useMutation({ ... })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      mutation.mutate(Object.fromEntries(formData))
    }}>
      <input name="name" />
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>

      {mutation.isError && <div>Error: {mutation.error.message}</div>}
      {mutation.isSuccess && <div>Created successfully!</div>}
    </form>
  )
}
```

---

## 🔄 Query Invalidation - Automatic Refetch

**invalidateQueries** = mark query as stale → refetch.

### Pattern 1: Invalidate Single Key

```typescript
// After create/update/delete project
queryClient.invalidateQueries({ queryKey: ['projects'] })

// Refetches all queries з цим key:
// - useQuery({ queryKey: ['projects'] })
```

### Pattern 2: Invalidate Multiple Keys

```typescript
// After create project → invalidate list + dashboard
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
}
```

### Pattern 3: Invalidate with Prefix

```typescript
// Invalidate всі queries що починаються з ['project', ...]
queryClient.invalidateQueries({ queryKey: ['project'] })

// Refetches:
// - ['project', '123']
// - ['project', '456', 'experiments']
// - ['projects']  (НІ - це інший key)
```

**Backend analog**:
```python
# Backend: Cache invalidation patterns
# Pattern 1: Single key
redis.delete("projects")

# Pattern 2: Multiple keys
redis.delete_many(["projects", "dashboard:stats"])

# Pattern 3: Prefix pattern
for key in redis.scan_iter("project:*"):
    redis.delete(key)

# Frontend: invalidateQueries
queryClient.invalidateQueries({ queryKey: ['project'] })
# Invalidates всі keys з prefix 'project'
```

---

## 🧩 Real Example (ProjectsPage)

**File**: `frontend/src/pages/ProjectsPage/index.tsx:78-114`

### Create Mutation

```typescript
const createMutation = useMutation({
  mutationFn: projectService.createProject,  // Service method

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })  // Refetch list
    toast.success('Project created successfully')  // Toast notification
    setFormOpen(false)  // Close form dialog
    setSelectedProject(undefined)  // Clear selection
  },

  onError: (error: Error) => {
    toast.error(error.message || 'Failed to create project')
  },
})
```

**Usage**:
```typescript
<ProjectForm
  onSubmit={(data) => createMutation.mutate(data)}
  isLoading={createMutation.isPending}
/>
```

### Update Mutation

```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: any }) =>
    projectService.updateProject(id, data),  // Parameters object

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    toast.success('Project updated successfully')
    setFormOpen(false)
    setSelectedProject(undefined)
  },

  onError: (error: Error) => {
    toast.error(error.message || 'Failed to update project')
  },
})
```

**Usage**:
```typescript
<ProjectForm
  project={selectedProject}
  onSubmit={(data) => updateMutation.mutate({ id: selectedProject.id, data })}
/>
```

**Note**: mutationFn приймає **один параметр**. Для multiple params → object.

### Delete Mutation

```typescript
const deleteMutation = useMutation({
  mutationFn: projectService.deleteProject,  // (id: string) => Promise<void>

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    toast.success('Project deleted successfully')
  },

  onError: (error: Error) => {
    toast.error(error.message || 'Failed to delete project')
  },
})
```

**Usage**:
```typescript
<button onClick={() => {
  if (confirm('Delete project?')) {
    deleteMutation.mutate(project.id)
  }
}}>
  Delete
</button>
```

---

## 🎯 Optimistic Updates (Advanced)

**Optimistic Update** = оновити UI перед server response (instant feedback).

### Pattern

```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => projectService.updateProject(id, data),

  // 1. Before mutation
  onMutate: async (variables) => {
    // Cancel ongoing queries (щоб не override)
    await queryClient.cancelQueries({ queryKey: ['projects'] })

    // Snapshot previous value (для rollback)
    const previousProjects = queryClient.getQueryData(['projects'])

    // Optimistically update UI
    queryClient.setQueryData(['projects'], (old: any) => {
      return {
        ...old,
        items: old.items.map((p: any) =>
          p.id === variables.id ? { ...p, ...variables.data } : p
        ),
      }
    })

    // Return context для rollback
    return { previousProjects }
  },

  // 2. On error → rollback
  onError: (err, variables, context) => {
    queryClient.setQueryData(['projects'], context.previousProjects)
    toast.error('Update failed, rolled back')
  },

  // 3. On settled (success або error) → refetch
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  },
})
```

**Timeline**:
```
User clicks "Update" → UI updates instantly (optimistic)
                    ↓
                    Server response (500ms later)
                    ↓
                    Success: Keep UI
                    Error: Rollback UI → show previous data
```

**Backend analog**:
```python
# Backend: Database transaction rollback
try:
    async with session.begin():
        project.name = new_name  # Optimistic change
        await session.commit()  # Persist
except Exception:
    await session.rollback()  # Rollback on error

# Frontend: Optimistic update з rollback
onMutate: () => setQueryData(newData)  # Optimistic
onError: (context) => setQueryData(context.previousData)  # Rollback
```

---

## 🔁 Multiple Mutations (Sequential)

**Use case**: Створити project → створити agent для цього project.

```typescript
const createProjectMutation = useMutation({
  mutationFn: projectService.createProject,
})

const createAgentMutation = useMutation({
  mutationFn: agentService.createAgent,
})

async function createProjectWithAgent(projectData, agentData) {
  try {
    // 1. Create project
    const project = await createProjectMutation.mutateAsync(projectData)

    // 2. Create agent для цього project
    await createAgentMutation.mutateAsync({
      ...agentData,
      project_id: project.id,  // Use created project ID
    })

    toast.success('Project and agent created!')
  } catch (error) {
    toast.error('Failed to create')
  }
}
```

**Note**: `mutateAsync` повертає Promise (на відміну від `mutate` що void).

---

## 💾 setQueryData - Manual Cache Update

**setQueryData** = manually оновити query cache (без refetch).

### Use Case 1: Add Item to List

```typescript
const createMutation = useMutation({
  mutationFn: projectService.createProject,

  onSuccess: (newProject) => {
    // ✅ Add to cache manually (без refetch)
    queryClient.setQueryData(['projects'], (old: any) => ({
      ...old,
      items: [...old.items, newProject],  // Append
      total: old.total + 1,
    }))

    // ❌ Alternative: invalidateQueries (refetch all)
    // queryClient.invalidateQueries(['projects'])
  },
})
```

**When to use**:
- **setQueryData**: Response містить created item → add to cache
- **invalidateQueries**: Response не містить data → refetch

### Use Case 2: Remove Item from List

```typescript
const deleteMutation = useMutation({
  mutationFn: projectService.deleteProject,

  onSuccess: (_, deletedId) => {
    // ✅ Remove from cache
    queryClient.setQueryData(['projects'], (old: any) => ({
      ...old,
      items: old.items.filter((p: any) => p.id !== deletedId),
      total: old.total - 1,
    }))
  },
})
```

---

## 💡 Best Practices

### ✅ DO

1. **Invalidate після mutations**:
   ```typescript
   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
   ```

2. **Show toast notifications**:
   ```typescript
   onSuccess: () => toast.success('Created!')
   onError: (error) => toast.error(error.message)
   ```

3. **Disable buttons під час mutation**:
   ```typescript
   <button disabled={mutation.isPending}>Submit</button>
   ```

4. **Type mutationFn params**:
   ```typescript
   mutationFn: (data: ProjectCreate) => projectService.create(data)  // ✅ Typed
   ```

### ❌ DON'T

1. **Не забувай invalidateQueries**:
   ```typescript
   // ❌ BAD - list не оновиться
   onSuccess: () => { console.log('Created!') }

   // ✅ GOOD - list refetch
   onSuccess: () => queryClient.invalidateQueries(['projects'])
   ```

2. **Не викликай mutate у render**:
   ```typescript
   // ❌ BAD - infinite loop
   mutation.mutate(data)

   // ✅ GOOD - у event handler
   <button onClick={() => mutation.mutate(data)}>Create</button>
   ```

3. **Не retry mutations за замовчуванням**:
   ```typescript
   // ✅ Config у providers.tsx
   mutations: { retry: 1 }  // 1 attempt only (не 3 як queries)
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/pages/ProjectsPage/index.tsx:78-114`
2. Знайди 3 mutations: create, update, delete
3. Створи project → подивись Network tab → POST request
4. List автоматично оновлюється (invalidateQueries)
5. Подивись Redux DevTools → query ['projects'] refetch

---

## ❓ FAQ

**Q: mutate vs mutateAsync?**
A:
- `mutate(data)` - void (fire and forget)
- `mutateAsync(data)` - Promise (await result)

**Q: Коли optimistic updates?**
A: Коли instant feedback важливий (like button, toggle). НЕ для critical ops (payment).

**Q: Чи invalidateQueries робить fetch одразу?**
A: Так, якщо query active (component mounted). Якщо unmounted → fetch on next mount.

---

**Далі:** [WebSocket Sync](websocket-sync.md) | [Queries Deep Dive](queries.md)

**Повернутись до:** [Module 05: TanStack Query](index.md)
