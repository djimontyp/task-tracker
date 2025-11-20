# Service Pattern - API Layer Architecture

**Class-based API clients для централізованого data fetching**

---

## 🎯 Навіщо Service Pattern

**Problem**: Розкидані fetch() calls по всьому проекту.

```typescript
// ❌ BAD - scattered API calls
function ProjectsPage() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjects)
  }, [])
}

function ProjectCard({ id }) {
  const [project, setProject] = useState(null)

  useEffect(() => {
    fetch(`/api/projects/${id}`)  // Duplicate logic!
      .then((res) => res.json())
      .then(setProject)
  }, [id])
}
```

**Solution**: Централізований service class.

```typescript
// ✅ GOOD - service class
class ProjectService {
  async listProjects() {
    const response = await apiClient.get('/projects')
    return response.data
  }

  async getProject(id: string) {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  }
}

export const projectService = new ProjectService()  // Singleton

// Usage (clean, reusable)
const { data } = useQuery(['projects'], () => projectService.listProjects())
```

**Backend analog**:
```python
# Backend: Service layer (FastAPI)
class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    async def list_projects(self) -> list[Project]:
        return await self.db.execute(select(Project)).scalars().all()

    async def get_project(self, id: int) -> Project:
        return await self.db.get(Project, id)

# Singleton export
project_service = ProjectService(db)

# Frontend: Same pattern
class ProjectService:
    async listProjects() { ... }
    async getProject(id) { ... }

export const projectService = new ProjectService()
```

---

## 🧩 Real Example (AgentService)

**File**: `frontend/src/features/agents/api/agentService.ts:21-266`

### Structure

```typescript
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type { Agent, AgentCreate, AgentUpdate } from '../types'

class AgentService {
  // List all agents
  async listAgents(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>(API_ENDPOINTS.AGENTS.LIST)
    return response.data
  }

  // Get single agent
  async getAgent(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(
      API_ENDPOINTS.AGENTS.DETAIL(id)  // Factory function
    )
    return response.data
  }

  // Create agent
  async createAgent(data: AgentCreate): Promise<Agent> {
    const response = await apiClient.post<Agent>(
      API_ENDPOINTS.AGENTS.CREATE,
      data
    )
    return response.data
  }

  // Update agent
  async updateAgent(id: string, data: AgentUpdate): Promise<Agent> {
    const response = await apiClient.put<Agent>(
      API_ENDPOINTS.AGENTS.UPDATE(id),
      data
    )
    return response.data
  }

  // Delete agent
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.AGENTS.DELETE(id))
  }

  // Test agent (custom method)
  async testAgent(id: string, message: string): Promise<{ response: string }> {
    const response = await apiClient.post(
      API_ENDPOINTS.AGENTS.TEST(id),
      { message }
    )
    return response.data
  }
}

// ✅ Singleton export
export const agentService = new AgentService()
```

**Key features**:
- **Type safety**: TypeScript types для всіх methods
- **Centralized**: All API calls в одному місці
- **Reusable**: Used в TanStack Query hooks
- **Testable**: Easy to mock для unit tests

---

## 📦 API Client Setup

**File**: `frontend/src/shared/lib/api/client.ts`

```typescript
import axios from 'axios'

// Axios instance з base config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',  // Empty = relative URLs
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor (handle errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

**Backend analog**:
```python
# Backend: Middleware (FastAPI)
@app.middleware("http")
async def add_auth(request: Request, call_next):
    token = request.headers.get("Authorization")
    if token:
        request.state.user = verify_token(token)
    return await call_next(request)

# Frontend: Axios interceptor
apiClient.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`
})
```

---

## 🔧 API Endpoints Config

**File**: `frontend/src/shared/config/api.ts`

```typescript
export const API_ENDPOINTS = {
  HEALTH: '/health',

  AGENTS: {
    LIST: '/agents',
    DETAIL: (id: string) => `/agents/${id}`,  // Factory function
    CREATE: '/agents',
    UPDATE: (id: string) => `/agents/${id}`,
    DELETE: (id: string) => `/agents/${id}`,
    TEST: (id: string) => `/agents/${id}/test`,
  },

  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
  },

  MESSAGES: {
    LIST: '/messages',
    DETAIL: (id: string) => `/messages/${id}`,
  },

  ANALYSIS: {
    RUNS: {
      LIST: '/analysis/runs',
      DETAIL: (runId: string) => `/analysis/runs/${runId}`,
      CREATE: '/analysis/runs',
      CLOSE: (runId: string) => `/analysis/runs/${runId}/close`,
    },
  },

  WEBSOCKET: '/ws',
}
```

**Benefits**:
- **Single source of truth**: Всі URLs в одному місці
- **Type-safe**: Factory functions з параметрами
- **Easy to update**: Зміни в одному файлі

---

## 🔄 Service + TanStack Query Integration

**Pattern**: Service methods у queryFn/mutationFn.

```typescript
// hooks/useAgents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentService } from '../api/agentService'

// List query
export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.listAgents(),  // Service method
  })
}

// Detail query
export const useAgent = (id: string) => {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentService.getAgent(id),
    enabled: !!id,
  })
}

// Create mutation
export const useCreateAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: agentService.createAgent,  // Service method
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Usage in component
function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const createAgent = useCreateAgent()

  if (isLoading) return <Spinner />

  return (
    <div>
      {agents?.map((agent) => <AgentCard key={agent.id} {...agent} />)}
      <button onClick={() => createAgent.mutate({ name: 'New Agent' })}>
        Create
      </button>
    </div>
  )
}
```

**Separation of concerns**:
- **Service**: API communication (HTTP)
- **Hook**: TanStack Query setup (caching, invalidation)
- **Component**: UI rendering

---

## 🎯 Advanced Patterns

### Pattern 1: Request Cancellation

```typescript
class ProjectService {
  private abortController: AbortController | null = null

  async listProjects(filters?: ProjectFilters): Promise<Project[]> {
    // Cancel previous request
    this.abortController?.abort()
    this.abortController = new AbortController()

    const response = await apiClient.get('/projects', {
      params: filters,
      signal: this.abortController.signal,  // Cancellation token
    })

    return response.data
  }
}
```

**Use case**: Швидкий typing у search → cancel старі requests.

### Pattern 2: Retry Logic

```typescript
class AgentService {
  async createAgent(data: AgentCreate, retries = 3): Promise<Agent> {
    try {
      const response = await apiClient.post('/agents', data)
      return response.data
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(1000)  // Wait 1s
        return this.createAgent(data, retries - 1)  // Retry
      }
      throw error
    }
  }

  private isRetryable(error: any): boolean {
    return error.response?.status >= 500  // Server errors only
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
```

### Pattern 3: Response Transformation

```typescript
class MessageService {
  async getMessages(): Promise<Message[]> {
    const response = await apiClient.get('/messages')

    // Transform backend data → frontend format
    return response.data.map((msg: any) => ({
      id: msg.external_message_id,  // Rename
      content: msg.text || msg.content,  // Fallback
      timestamp: new Date(msg.sent_at).toLocaleString('uk-UA'),  // Format
      author: msg.author_name || 'Unknown',  // Default
    }))
  }
}
```

**Backend analog**: Pydantic response models з computed fields.

---

## 🧪 Testing Service

```typescript
// agentService.test.ts
import { agentService } from './agentService'
import { apiClient } from '@/shared/lib/api/client'

// Mock apiClient
jest.mock('@/shared/lib/api/client')

describe('AgentService', () => {
  it('should list agents', async () => {
    const mockAgents = [{ id: '1', name: 'Agent 1' }]

    // Mock API response
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: mockAgents,
    })

    const result = await agentService.listAgents()

    expect(apiClient.get).toHaveBeenCalledWith('/agents')
    expect(result).toEqual(mockAgents)
  })

  it('should create agent', async () => {
    const newAgent = { name: 'New Agent' }
    const createdAgent = { id: '2', ...newAgent }

    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: createdAgent,
    })

    const result = await agentService.createAgent(newAgent)

    expect(apiClient.post).toHaveBeenCalledWith('/agents', newAgent)
    expect(result).toEqual(createdAgent)
  })
})
```

---

## 💡 Best Practices

### ✅ DO

1. **Class-based services** (не plain functions):
   ```typescript
   class AgentService { ... }  // ✅ Групуємо related methods
   ```

2. **Singleton export**:
   ```typescript
   export const agentService = new AgentService()  // ✅ One instance
   ```

3. **Type all methods**:
   ```typescript
   async listAgents(): Promise<Agent[]> { ... }  // ✅ Type-safe
   ```

4. **Centralized endpoints**:
   ```typescript
   API_ENDPOINTS.AGENTS.LIST  // ✅ Single source of truth
   ```

### ❌ DON'T

1. **Не розкидуй fetch() по компонентам**:
   ```typescript
   // ❌ BAD
   useEffect(() => { fetch('/agents').then(...) }, [])

   // ✅ GOOD
   const { data } = useQuery(['agents'], () => agentService.listAgents())
   ```

2. **Не дублюй error handling**:
   ```typescript
   // ✅ Global interceptor замість per-request try/catch
   apiClient.interceptors.response.use(...)
   ```

3. **Не hardcode URLs**:
   ```typescript
   // ❌ BAD
   fetch('/agents/123')

   // ✅ GOOD
   fetch(API_ENDPOINTS.AGENTS.DETAIL('123'))
   ```

---

## 🛠️ Практика

1. Відкрий `frontend/src/features/agents/api/agentService.ts`
2. Подивись structure: class, methods, types
3. Знайди використання в TanStack Query hooks
4. Спробуй додати новий method (напр., `duplicateAgent`)

---

## ❓ FAQ

**Q: Class vs plain functions?**
A: Class = групування related methods + shared state (якщо треба). Functions = simpler але розкидані.

**Q: Axios vs Fetch API?**
A: Axios = interceptors, auto JSON parsing. Fetch = native, менше dependencies. Обидва OK.

**Q: Singleton vs new instance?**
A: Singleton для stateless services (як у проекті). New instance якщо треба різні configs.

---

**Повернутись до:** [Module 06: Data Fetching](index.md)
