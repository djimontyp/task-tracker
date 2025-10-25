# Frontend Architecture

Modern React 18 application with TypeScript, featuring real-time WebSocket updates, comprehensive state management, and a feature-based architecture pattern.

---

## Overview

Task Tracker frontend is a production-grade TypeScript application built for real-time task management and AI-powered analysis. The architecture prioritizes type safety, developer experience, and scalability through domain-driven feature organization.

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Build Tool** | Vite 7.1.9 | Fast HMR, native ESM, optimized production builds |
| **Architecture** | Feature-based (domain-driven) | Better scalability than FSD for complex domains |
| **Type System** | TypeScript 5.9.3 (strict mode) | Compile-time safety, better IDE support |
| **State Management** | Zustand + TanStack Query | Clear separation: client state vs server state |
| **Real-time** | Native WebSocket | Lower overhead than Socket.IO, full protocol control |
| **Component Library** | Radix UI + shadcn/ui | Accessible primitives, full styling control |
| **Styling** | Tailwind CSS 3.4.17 | Utility-first, minimal CSS bundle size |
| **Routing** | React Router 7.9.3 | Industry standard, lazy loading support |

---

## Technology Stack

### Core Framework

| Package | Version | Purpose | Alternatives Considered |
|---------|---------|---------|------------------------|
| **react** | 18.3.1 | UI library with concurrent rendering | Vue 3 (less TypeScript-friendly), Svelte (smaller ecosystem) |
| **react-dom** | 18.3.1 | React DOM renderer | - |
| **typescript** | 5.9.3 | Type system with strict mode | Flow (deprecated), JSDoc (weaker guarantees) |
| **vite** | 7.1.9 | Build tool and dev server | Webpack (slower), Parcel (less mature) |

### State Management

| Package | Version | Purpose | Alternatives Considered |
|---------|---------|---------|------------------------|
| **zustand** | 5.0.8 | Client state (UI, local data) | Redux (boilerplate), Jotai (less mature), Context API (performance issues) |
| **@tanstack/react-query** | 5.90.2 | Server state (caching, sync) | SWR (fewer features), RTK Query (Redux dependency), Apollo (GraphQL-only) |

**Zustand** chosen for minimal boilerplate, TypeScript support, and no Provider wrapping. **TanStack Query** handles server state caching, invalidation, and background refetching with zero configuration.

### Routing & Data Fetching

| Package | Version | Purpose | Alternatives Considered |
|---------|---------|---------|------------------------|
| **react-router-dom** | 7.9.3 | Client-side routing | TanStack Router (too new), Reach Router (deprecated) |
| **axios** | 1.12.2 | HTTP client | Fetch API (used in some services), ky (smaller but less mature) |

**Note**: Mixed pattern - some services use axios, others use native Fetch API. Axios preferred for interceptors and TypeScript types.

### UI Component System

#### Radix UI Primitives (16 packages)

| Package | Version | Purpose |
|---------|---------|---------|
| **@radix-ui/react-dialog** | 1.1.15 | Modal dialogs |
| **@radix-ui/react-dropdown-menu** | 2.1.16 | Dropdown menus |
| **@radix-ui/react-select** | 2.2.6 | Select dropdowns |
| **@radix-ui/react-tabs** | 1.1.13 | Tab containers |
| **@radix-ui/react-tooltip** | 1.2.8 | Tooltips |
| **@radix-ui/react-checkbox** | 1.3.3 | Checkboxes |
| **@radix-ui/react-switch** | 1.2.6 | Toggle switches |
| **@radix-ui/react-slider** | 1.3.6 | Range sliders |
| **@radix-ui/react-popover** | 1.1.15 | Popovers |
| **@radix-ui/react-avatar** | 1.1.10 | Avatar components |
| **@radix-ui/react-label** | 2.1.7 | Form labels |
| **@radix-ui/react-separator** | 1.1.7 | Visual separators |
| **@radix-ui/react-radio-group** | 1.3.8 | Radio button groups |
| **@radix-ui/react-alert-dialog** | 1.1.15 | Alert dialogs |
| **@radix-ui/react-slot** | 1.2.3 | Component composition utility |
| **@radix-ui/react-icons** | 1.3.2 | Icon set |

**Rationale**: Radix UI provides unstyled, accessible primitives with full keyboard navigation, ARIA attributes, and focus management. Wrapped with shadcn/ui for Tailwind-based styling.

### Styling & Design System

| Package | Version | Purpose |
|---------|---------|---------|
| **tailwindcss** | 3.4.17 | Utility-first CSS framework |
| **@tailwindcss/typography** | 0.5.19 | Typography plugin for content |
| **@tailwindcss/aspect-ratio** | 0.4.2 | Aspect ratio utilities |
| **postcss** | 8.5.6 | CSS processor |
| **autoprefixer** | 10.4.21 | CSS vendor prefixing |
| **class-variance-authority** | 0.7.1 | Component variant utilities |
| **clsx** | 2.1.1 | Conditional className helper |
| **tailwind-merge** | 3.3.1 | Merge Tailwind classes intelligently |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| **react-hook-form** | 7.63.0 | Form state management |
| **@hookform/resolvers** | 5.2.2 | Validation schema adapters |
| **zod** | 3.25.76 | TypeScript-first schema validation |

**Pattern**: Zod schemas define validation + TypeScript types simultaneously, reducing duplication.

### Data Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| **recharts** | 2.15.4 | Declarative chart library |
| **@tanstack/react-table** | 8.21.3 | Headless table utilities |

### Additional UI Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| **@heroicons/react** | 2.2.0 | Heroicons icon set |
| **react-colorful** | 5.6.1 | Color picker component |
| **react-diff-viewer-continued** | 3.4.0 | Side-by-side diff viewer |
| **react-hot-toast** | 2.6.0 | Toast notifications (primary) |
| **sonner** | 2.0.7 | Alternative toast library |
| **cmdk** | 1.1.1 | Command palette (⌘K) |
| **next-themes** | 0.4.6 | Theme switching (light/dark) |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| **date-fns** | 4.1.0 | Date formatting and manipulation |
| **web-vitals** | 4.2.0 | Performance metrics collection |

### Testing (DevDependencies)

| Package | Version | Purpose |
|---------|---------|---------|
| **@testing-library/react** | 14.3.1 | React component testing |
| **@testing-library/jest-dom** | 6.9.1 | Jest DOM matchers |
| **@testing-library/user-event** | 14.6.1 | User interaction simulation |
| **@types/jest** | 30.0.0 | Jest TypeScript types |

### Build Tools (DevDependencies)

| Package | Version | Purpose |
|---------|---------|---------|
| **@vitejs/plugin-react** | 5.0.4 | Vite React plugin with Fast Refresh |
| **shadcn** | 3.3.1 | CLI for adding shadcn/ui components |

---

## Architecture Pattern

### Feature-Based Structure

Unlike Feature-Sliced Design (FSD), the architecture uses **domain-driven feature modules** for better encapsulation of complex business logic.

**Directory Structure**:

```
frontend/src/
├── app/                           # Application core
│   ├── App.tsx                    # Root component
│   ├── routes.tsx                 # Route configuration
│   └── providers.tsx              # Global providers (Query, Theme)
├── features/                      # 15 feature modules
│   ├── agents/                    # AI agent configuration
│   │   ├── api/
│   │   │   ├── agentService.ts    # API service class
│   │   │   ├── taskService.ts     # Task API service
│   │   │   └── index.ts           # Exports + TanStack Query hooks
│   │   ├── components/
│   │   │   ├── AgentCard.tsx      # Agent display card
│   │   │   ├── AgentForm.tsx      # Create/edit form
│   │   │   ├── AgentList.tsx      # Agent list with CRUD
│   │   │   └── ...
│   │   └── types/
│   │       └── index.ts           # TypeScript interfaces
│   ├── analysis/                  # Analysis run management
│   ├── atoms/                     # Knowledge atoms
│   ├── experiments/               # ML topic classification
│   ├── knowledge/                 # Knowledge extraction
│   ├── messages/                  # Message feed
│   ├── noise/                     # Noise filtering
│   ├── onboarding/                # User onboarding
│   ├── projects/                  # Project management
│   ├── proposals/                 # Task proposal review
│   ├── providers/                 # LLM provider config
│   ├── tasks/                     # Task state management
│   ├── topics/                    # Topic management
│   └── websocket/                 # WebSocket connection
├── pages/                         # 14 page components
│   ├── DashboardPage/
│   │   ├── index.tsx              # Main page component
│   │   ├── RecentTopics.tsx       # Sub-component
│   │   └── TopicCard.tsx          # Topic card
│   ├── MessagesPage/
│   │   ├── index.tsx
│   │   ├── columns.tsx            # Table column definitions
│   │   └── faceted-filter.tsx     # Filter component
│   └── ...
└── shared/                        # Shared infrastructure
    ├── ui/                        # 33 shadcn/ui components
    │   ├── button.tsx
    │   ├── dialog.tsx
    │   ├── input.tsx
    │   └── ...
    ├── components/                # 15+ business components
    │   ├── AppSidebar.tsx         # Main sidebar
    │   ├── DataTable/             # Generic data table
    │   ├── MetricCard/            # Metric display
    │   └── ...
    ├── layouts/
    │   └── MainLayout/            # Main layout wrapper
    ├── hooks/                     # 4 shared hooks
    │   ├── use-mobile.tsx
    │   ├── useAutoSave.ts
    │   ├── useDebounce.ts
    │   └── index.ts
    ├── store/
    │   └── uiStore.ts             # UI state (sidebar, theme)
    ├── types/
    │   └── index.ts               # Shared TypeScript types
    ├── utils/
    │   ├── avatars.ts
    │   ├── date.ts
    │   └── logger.ts
    ├── config/
    │   └── api.ts                 # API endpoint configuration
    └── lib/
        └── api/
            └── client.ts          # Axios client instance
```

### Feature Module Responsibilities

Each feature module encapsulates:

1. **API Layer** (`api/`): Service classes, HTTP calls, TanStack Query hooks
2. **Components** (`components/`): Domain-specific React components
3. **Types** (`types/`): TypeScript interfaces and type definitions
4. **Store** (`store/`, optional): Zustand store for client state
5. **Hooks** (`hooks/`, optional): Custom React hooks
6. **Utils** (`utils/`, optional): Domain-specific utilities

**Benefits**:

- **Cohesion**: Related code stays together
- **Encapsulation**: Clear boundaries between features
- **Discoverability**: Easy to find feature-specific code
- **Scalability**: Add features without affecting others

---

## Feature Modules Catalog

**Total**: 15 modules (87 files)

### 1. agents (17 files)

**Purpose**: AI agent configuration, testing, and task assignment

**Key Components**:
- `AgentCard` - Display agent details with status
- `AgentForm` - Create/edit agent configuration
- `AgentList` - CRUD operations for agents
- `AgentTestDialog` - Test agent prompts (50-2000 chars)
- `TaskAssignment` - Assign tasks to agents
- `TaskForm` - Task creation form
- `SchemaEditor` - JSON schema editor for responses
- `ProviderForm` - LLM provider selection

**API Services**:
- `agentService.ts` - Agent CRUD operations
- `taskService.ts` - Task management API

**Types**: Agent config, task schemas, test results

---

### 2. analysis (6 files)

**Purpose**: Analysis run lifecycle management with WebSocket updates

**Key Components**:
- `RunCard` - Display analysis run status
- `CreateRunModal` - Start new analysis run
- `TimeWindowSelector` - Select time range for analysis

**API Services**:
- `analysisService.ts` - Run CRUD, start/close operations

**Types**: Analysis run, run status, time window

---

### 3. atoms (7 files)

**Purpose**: Knowledge atom CRUD operations

**Key Components**:
- `AtomCard` - Display knowledge atom
- `CreateAtomDialog` - Create new atom

**API Services**:
- `atomService.ts` - Atom CRUD operations

**Types**: Knowledge atom, atom metadata

---

### 4. experiments (9 files)

**Purpose**: Topic classification experiments with ML metrics

**Key Components**:
- `ClassificationExperimentsPanel` - Experiment dashboard
- `ConfusionMatrixHeatmap` - Visualize classification results
- `ExperimentDetailsDialog` - View experiment details
- `ExperimentsList` - List all experiments
- `StartExperimentDialog` - Configure and start experiment

**API Services**:
- `experimentService.ts` - Experiment management

**Types**: Experiment config, metrics, confusion matrix

---

### 5. knowledge (11 files)

**Purpose**: Knowledge extraction, version history, diff viewing

**Key Components**:
- `KnowledgeExtractionPanel` - Trigger extraction
- `GlobalKnowledgeExtractionDialog` - Extract from all messages
- `VersionHistoryList` - Show version timeline
- `VersionDiffViewer` - Side-by-side diff view

**API Services**:
- `knowledgeService.ts` - Extraction operations
- `versioningService.ts` - Version history API

**Utils**:
- `diffFormatters.ts` - Format diff output

**Types**: Knowledge extraction, version metadata

---

### 6. messages (5 files)

**Purpose**: Message feed with error boundary and WebSocket integration

**Key Components**:
- `MessagesErrorBoundary` - Catch rendering errors

**Hooks**:
- `useMessagesFeed.ts` - WebSocket message updates

**Store**:
- `messagesStore.ts` - Message state management

**API Services**:
- `messageService.ts` - Fetch messages by topic

**Types**: Message, author, importance score

---

### 7. noise (2 files)

**Purpose**: Noise filtering API integration

**API Services**:
- `noiseService.ts` - Noise scoring API

**Types**: Noise stats, score response

---

### 8. onboarding (3 files)

**Purpose**: User onboarding wizard

**Key Components**:
- `OnboardingWizard` - Multi-step onboarding flow

---

### 9. projects (5 files)

**Purpose**: Project CRUD with keyword management

**Key Components**:
- `ProjectCard` - Display project details
- `ProjectForm` - Create/edit project with keywords

**API Services**:
- `projectService.ts` - Project CRUD, keyword versioning

**Types**: Project, keyword version

---

### 10. proposals (5 files)

**Purpose**: Task proposal review workflow with batch actions

**Key Components**:
- `ProposalCard` - Display proposal with confidence score
- `RejectProposalDialog` - Reject with reason

**API Services**:
- `proposalService.ts` - Proposal CRUD, accept/reject

**Types**: Proposal, confidence score, rejection reason

---

### 11. providers (8 files)

**Purpose**: LLM provider configuration, Ollama model management

**Key Components**:
- `ValidationStatus` - Show provider validation status

**Hooks**:
- `useOllamaModels.ts` - Fetch available Ollama models

**API Services**:
- `providerService.ts` - Provider CRUD, validation

**Types**: Provider config, Ollama models

---

### 12. tasks (1 file)

**Purpose**: Client-side task state management

**Store**:
- `tasksStore.ts` - Zustand store for tasks

---

### 13. topics (6 files)

**Purpose**: Topic management with icons and colors

**Key Components**:
- `HexColorPicker` - Custom color picker

**Utils**:
- `renderIcon.tsx` - Render topic icon from name

**API Services**:
- `topicService.ts` - Topic CRUD

**Types**: Topic, icon, color

---

### 14. websocket (2 files)

**Purpose**: WebSocket connection and service status monitoring

**Hooks**:
- `useWebSocket.ts` - WebSocket connection with reconnection
- `useServiceStatus.ts` - Monitor backend service health

---

## Pages & Routing

**Total**: 14 pages (34 files)

### Page Structure

| Page | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| **DashboardPage** | `/` | Main dashboard | Recent topics, activity stats, quick actions |
| **MessagesPage** | `/messages` | Message feed | Faceted filters, importance scores, ingestion modal |
| **TopicsPage** | `/topics` | Topic list | Faceted filters, color/icon display |
| **TopicDetailPage** | `/topics/:topicId` | Topic details | Messages, atoms, version history |
| **TasksPage** | `/tasks` | Task management | Analysis results, status filters |
| **AnalysisRunsPage** | `/analysis` | Analysis runs | Real-time updates, lifecycle visualization |
| **ProposalsPage** | `/proposals` | Task proposals | Batch actions, confidence filters |
| **AgentsPage** | `/agents` | Agent config | CRUD, testing (50-2000 chars), real-time execution |
| **AgentTasksPage** | `/agent-tasks` | Task assignment | Assign tasks to agents |
| **ProvidersPage** | `/providers` | LLM providers | CRUD, Ollama model selection, validation |
| **ProjectsPage** | `/projects` | Projects | CRUD, keyword versioning |
| **NoiseFilteringDashboard** | `/noise-filtering` | Noise stats | Filtering statistics and controls |
| **AnalyticsPage** | `/analytics` | Analytics | Insights and visualizations |
| **SettingsPage** | `/settings` | Settings | General tab, Telegram source plugin |

### Lazy Loading Strategy

All pages use **React.lazy()** with **Suspense** fallback for code splitting.

**Route Configuration** (`/app/routes.tsx`):

```typescript
const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const MessagesPage = lazy(() => import('@pages/MessagesPage'))
// ... 12 more pages

const AppRoutes = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
    <Routes>
      <Route element={<MainLayout><DashboardPage /></MainLayout>} path="/" />
      <Route element={<MainLayout><MessagesPage /></MainLayout>} path="/messages" />
      {/* ... */}
    </Routes>
  </Suspense>
)
```

**Benefits**:
- Faster initial page load (smaller bundle)
- Pages loaded on-demand
- Smooth transitions with Spinner fallback

---

## State Management Deep Dive

### Zustand Stores (Client State)

**Philosophy**: Feature-scoped stores for client-side data (UI state, filters, selections).

#### 1. tasksStore

**Location**: `/features/tasks/store/tasksStore.ts`

**Responsibilities**:
- Task list state
- Task selection
- Filter status
- Loading/error states

**State Shape**:

```typescript
interface TasksStore {
  tasks: Task[]
  selectedTask: Task | null
  isLoading: boolean
  error: string | null
  filterStatus: TaskStatus | 'all' | null

  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  selectTask: (task: Task | null) => void
  setFilterStatus: (status: TaskStatus | 'all' | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}
```

**Usage Pattern**: Immutable updates with spread syntax

---

#### 2. messagesStore

**Location**: `/features/messages/store/messagesStore.ts`

**Responsibilities**:
- Message feed state
- WebSocket updates
- Message filters

---

#### 3. uiStore

**Location**: `/shared/store/uiStore.ts`

**Responsibilities**:
- Sidebar open/closed state
- Theme (light/dark mode)

**State Shape**:

```typescript
interface UiStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark'

  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}
```

---

### TanStack Query (Server State)

**Philosophy**: Server state caching, background refetching, optimistic updates.

#### Configuration

**Provider Setup** (`/app/providers.tsx`):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
    },
    mutations: {
      retry: 1,
    },
  },
})
```

#### Usage Patterns

**Pattern 1: Inline queryFn** (used in pages):

```typescript
const { data, isLoading, error } = useQuery<AnalysisRun[]>({
  queryKey: ['analysis-runs'],
  queryFn: async () => {
    const response = await apiClient.get(API_ENDPOINTS.analysis.runs)
    return response.data.items as AnalysisRun[]
  },
})
```

**Pattern 2: Custom hooks** (exported from service files):

```typescript
export function useExperiments() {
  return useQuery<ExperimentListResponse>({
    queryKey: ['experiments'],
    queryFn: () => experimentService.listExperiments(),
  })
}

export function useStartExperiment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: StartExperimentRequest) => experimentService.startExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
}
```

**Pattern 3: Mutations with optimistic updates**:

```typescript
const deleteMutation = useMutation({
  mutationFn: (id: string) => agentService.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['agents'] })
    toast.success('Agent deleted successfully')
  },
  onError: (error) => {
    toast.error(`Failed to delete agent: ${error.message}`)
  },
})
```

#### Query Invalidation Strategy

**WebSocket → Query Invalidation**:

```typescript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.topic === 'analysis') {
    switch (message.event) {
      case 'run_created':
        queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
        toast.success('New analysis run created')
        break
      case 'run_progress':
        queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
        break
    }
  }
}
```

---

## Component Architecture

### Shared UI Components (shadcn/ui)

**Location**: `/shared/ui/` (33 components)

**Approach**: **shadcn/ui** components are Radix UI primitives wrapped with Tailwind CSS styling. Components are **copied into the project** (not npm packages), allowing full customization.

#### Component Categories

**Dialogs & Overlays**:
- `alert-dialog.tsx` - Confirmation dialogs
- `dialog.tsx` - Modal dialogs
- `sheet.tsx` - Slide-out panels
- `popover.tsx` - Floating popovers
- `tooltip.tsx` - Hover tooltips
- `dropdown-menu.tsx` - Dropdown menus

**Form Inputs**:
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line text
- `checkbox.tsx` - Checkboxes
- `switch.tsx` - Toggle switches
- `slider.tsx` - Range sliders
- `select.tsx` - Select dropdowns
- `radio-group.tsx` - Radio buttons
- `label.tsx` - Form labels

**Layout & Structure**:
- `card.tsx` - Card containers
- `separator.tsx` - Visual dividers
- `tabs.tsx` - Tab containers
- `sidebar.tsx` - Sidebar navigation

**Feedback & Loading**:
- `badge.tsx` - Status badges
- `spinner/` - Loading spinners
- `skeleton.tsx` - Content placeholders
- `progress.tsx` - Progress bars
- `sonner.tsx` - Toast notifications

**Data Display**:
- `table.tsx` - Data tables
- `chart.tsx` - Chart wrapper (recharts)
- `metric-card.tsx` - Metric cards
- `notification-badge.tsx` - Notification badges

**Navigation**:
- `breadcrumb.tsx` - Breadcrumb trails
- `pagination.tsx` - Page navigation

**Utilities**:
- `button.tsx` - Button component
- `command.tsx` - Command palette (⌘K)

---

### Shared Components (Business Logic)

**Location**: `/shared/components/` (15+ components)

#### Navigation

- **AppSidebar** - Main application sidebar with navigation groups
- **NavUser** - User profile menu in sidebar

#### Data Display

- **DataTable** - Generic data table with TanStack Table
- **DataTableToolbar** - Toolbar with filters and actions
- **DataTablePagination** - Pagination controls
- **DataTableColumnHeader** - Sortable column headers
- **DataTableFacetedFilter** - Multi-select faceted filters

#### Visualizations

- **MetricCard** - Display key metrics with trend indicators
- **TrendChart** - Line/area charts for trends
- **ActivityHeatmap** - GitHub-style activity heatmap
- **AvatarGroup** - Stacked avatar display

#### Utilities

- **ColorPickerPopover** - Color picker in popover
- **EmptyState** - Empty state placeholder
- **SaveStatusIndicator** - Auto-save status indicator
- **AutoSaveToggle** - Toggle auto-save feature
- **ThemeProvider** - Theme context provider

---

### Import Aliases

**Configuration** (`tsconfig.json`, `vite.config.ts`):

```typescript
{
  "baseUrl": "./src",
  "paths": {
    "@/*": ["./*"],
    "@app/*": ["app/*"],
    "@pages/*": ["pages/*"],
    "@features/*": ["features/*"],
    "@shared/*": ["shared/*"]
  }
}
```

**Benefits**:
- Clean imports: `@/shared/ui` instead of `../../../shared/ui`
- Easier refactoring: move files without updating imports
- Better IDE autocomplete

---

## Data Fetching Patterns

### API Service Classes

**Pattern**: Service classes with typed methods, exported as singletons.

**Axios Client** (`/shared/lib/api/client.ts`):

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '' // Relative URL for Nginx proxy

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error)
    return Promise.reject(error)
  }
)
```

**Service Class Example** (`/features/analysis/api/analysisService.ts`):

```typescript
class AnalysisService {
  async listRuns(params?: AnalysisRunFilters): Promise<AnalysisRunListResponse> {
    const { data } = await apiClient.get<AnalysisRunListResponse>(
      API_ENDPOINTS.analysis.runs,
      { params }
    )
    return data
  }

  async createRun(data: CreateAnalysisRun): Promise<AnalysisRun> {
    const response = await apiClient.post<AnalysisRun>(
      API_ENDPOINTS.analysis.runs,
      data
    )
    return response.data
  }

  async getRunDetails(runId: string): Promise<AnalysisRun> {
    const { data } = await apiClient.get<AnalysisRun>(
      API_ENDPOINTS.analysis.run(runId)
    )
    return data
  }

  async closeRun(runId: string): Promise<AnalysisRun> {
    const { data } = await apiClient.put<AnalysisRun>(
      `${API_ENDPOINTS.analysis.run(runId)}/close`
    )
    return data
  }
}

export const analysisService = new AnalysisService()
```

**Alternative: Fetch API** (used in `messageService.ts`):

```typescript
class MessageService {
  async getMessagesByTopic(topicId: number): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/topics/${topicId}/messages`)

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }

    const data: TopicMessagesResponse = await response.json()
    return data.items || data
  }
}

export const messageService = new MessageService()
```

**Note**: Mixed pattern exists - axios preferred for interceptors, but some services use fetch.

---

### API Endpoints Configuration

**Location**: `/shared/config/api.ts`

**Structure**:

```typescript
export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export const API_ENDPOINTS = {
  // Health & Config
  health: '/api/v1/health',
  config: '/api/v1/config',

  // Messages
  messages: '/api/v1/messages',
  updateAuthors: (chatId: string) => `/api/v1/messages/update-authors?chat_id=${chatId}`,

  // Tasks
  tasks: '/api/v1/tasks',
  taskConfigs: '/api/v1/task-configs',

  // Statistics
  stats: '/api/v1/stats',
  activity: '/api/v1/activity',
  sidebarCounts: '/api/v1/sidebar-counts',

  // Analysis
  analysis: {
    runs: '/api/v1/analysis/runs',
    run: (runId: string) => `/api/v1/analysis/runs/${runId}`,
  },

  // Proposals
  proposals: '/api/v1/analysis/proposals',
  proposal: (proposalId: string) => `/api/v1/analysis/proposals/${proposalId}`,

  // AI Configuration
  agents: '/api/v1/agents',
  providers: '/api/v1/providers',
  ollamaModels: (host: string) => `/api/v1/providers/ollama/models?host=${encodeURIComponent(host)}`,
  projects: '/api/v1/projects',
  topics: '/api/v1/topics',

  // Experiments
  experiments: {
    base: '/api/v1/experiments/topic-classification',
    detail: (id: number) => `/api/v1/experiments/topic-classification/${id}`,
  },

  // Noise Filtering
  noise: {
    stats: '/api/v1/noise/stats',
    scoreMessage: (messageId: number) => `/api/v1/noise/score/${messageId}`,
    scoreBatch: '/api/v1/noise/score-batch',
  },

  // Knowledge Extraction
  knowledge: '/api/v1/knowledge',
  versions: '/api/v1/versions',

  // WebSocket
  ws: '/ws',
}
```

**Total**: 30+ endpoints

---

## Styling Approach

### Tailwind CSS Configuration

**Utility-First Approach**: All styling uses Tailwind CSS utility classes.

**Custom Configuration** (`tailwind.config.js`):

- Custom color palette extended from defaults
- Typography plugin for content styling
- Aspect ratio utilities
- Dark mode support via `next-themes`

**Component Variants**: **class-variance-authority** (CVA) for component variant management.

**Example**:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Class Merging**: **tailwind-merge** intelligently merges Tailwind classes, preventing conflicts.

---

## Real-time Communication

### Native WebSocket (NOT Socket.IO)

**Critical**: `socket.io-client` is installed in `package.json` but **NOT USED**. The project uses **native WebSocket API** exclusively. Remove Socket.IO dependency.

### WebSocket Implementation

**Custom Hook** (`/features/websocket/hooks/useWebSocket.ts`):

**Features**:
1. Topic-based subscriptions via query params
2. Exponential backoff reconnection (max 5 attempts)
3. Connection state tracking: `connecting`, `connected`, `reconnecting`, `disconnected`
4. Toast notifications for connection events
5. Automatic reconnection with backoff

**Hook Interface**:

```typescript
interface UseWebSocketOptions {
  topics?: string[]
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  connectionState: WebSocketState
  send: (data: any) => void
  disconnect: () => void
  reconnect: () => void
}
```

**URL Resolution**:

```typescript
const resolveWebSocketUrl = (topics?: string[]) => {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.env.VITE_WS_HOST?.trim() || window.location.hostname
  const path = import.meta.env.VITE_WS_PATH || '/ws'
  const port = window.location.port ? `:${window.location.port}` : ''

  let url = `${scheme}://${host}${port}${path}`
  if (topics && topics.length > 0) {
    url += `?topics=${topics.join(',')}`
  }
  return url
}
```

**Exponential Backoff**:

```typescript
const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current), 30000)
reconnectTimeoutRef.current = setTimeout(() => connect(), delay)
```

---

### WebSocket Integration with TanStack Query

**Pattern**: WebSocket messages trigger query invalidation for fresh data.

**Example** (`/pages/AnalysisRunsPage/index.tsx`):

```typescript
useEffect(() => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
  const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals`)

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message.topic === 'analysis') {
      switch (message.event) {
        case 'run_created':
          queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
          toast.success('New analysis run created')
          break
        case 'run_progress':
          queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
          break
        case 'run_completed':
          queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
          toast.success('Analysis run completed')
          break
        case 'run_failed':
          queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
          toast.error('Analysis run failed')
          break
      }
    }
  }

  return () => ws.close()
}, [queryClient])
```

**Benefits**:
- Real-time UI updates without polling
- TanStack Query handles data refetching
- Toast notifications for user feedback
- Clean separation: WebSocket events → query invalidation

---

### Environment Variables

**WebSocket Configuration**:

- `VITE_WS_URL`: Full WebSocket URL (e.g., `ws://localhost/ws`)
- `VITE_WS_HOST`: WebSocket host (e.g., `localhost`)
- `VITE_WS_PATH`: WebSocket path (default: `/ws`)

**API Configuration**:

- `VITE_API_BASE_URL` / `VITE_API_URL`: API base URL (default: relative for Nginx proxy)

---

## Build & Development

### Vite Configuration

**Location**: `/vite.config.ts`

**Server Configuration** (Docker-compatible):

```typescript
server: {
  port: 3000,
  host: true, // Listen on all addresses (0.0.0.0)
  strictPort: true,
  watch: {
    usePolling: true, // Required for Docker volume mounts
  },
}
```

**Build Optimization**:

```typescript
build: {
  outDir: 'dist',
  sourcemap: true,
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': [
          '@radix-ui/react-avatar',
          '@radix-ui/react-checkbox',
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          // ... all Radix UI packages
        ],
        'data-vendor': ['@tanstack/react-query', '@tanstack/react-table', 'axios'],
      },
    },
  },
}
```

**Manual Code Splitting Benefits**:
- Smaller initial bundle (React vendor chunk cached separately)
- UI components bundled together (shared across pages)
- Data libraries in separate chunk

---

### TypeScript Configuration

**Location**: `/tsconfig.json`

**Strict Mode Enabled**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "isolatedModules": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

**Strict Checks**:
- All strict TypeScript checks enabled
- Unused locals/parameters flagged
- No implicit any types
- Null/undefined safety enforced

---

## Code Organization

### Directory Naming Conventions

- **Folders**: lowercase with hyphens (`feature-name/`)
- **Components**: PascalCase (`AgentCard.tsx`)
- **Utilities**: camelCase (`dateUtils.ts`)
- **Types**: camelCase (`index.ts`)
- **Stores**: camelCase with suffix (`tasksStore.ts`)

### File Naming Patterns

- **Components**: `ComponentName.tsx`
- **Pages**: `index.tsx` (inside `PageName/` folder)
- **Services**: `{domain}Service.ts`
- **Stores**: `{domain}Store.ts`
- **Types**: `index.ts` (barrel export)
- **Hooks**: `use{HookName}.ts`

### Barrel Exports

Each feature module exports via `index.ts`:

```typescript
// features/agents/api/index.ts
export * from './agentService'
export * from './taskService'

// Usage
import { agentService, taskService } from '@features/agents/api'
```

---

## Project Statistics

| Metric | Count |
|--------|-------|
| **Feature Modules** | 15 |
| **Pages** | 14 |
| **Total TypeScript Files** | 205 |
| **Shared UI Components** | 33 |
| **Shared Components** | 15+ |
| **Radix UI Packages** | 16 |
| **Total Dependencies** | 53 |
| **Total DevDependencies** | 9 |
| **API Endpoints** | 30+ |
| **Zustand Stores** | 3 |
| **Custom Hooks** | 4 (shared) + feature-specific |
| **Total Lines of Code** | ~30,000+ (estimated) |

---

## Key Architectural Decisions

### Why Feature-Based Architecture?

**Chosen over FSD (Feature-Sliced Design)** for:

1. **Domain Complexity**: AI analysis, ML experiments, knowledge extraction require deep feature encapsulation
2. **Team Scalability**: Features can be developed independently
3. **Easier Navigation**: All code for a feature in one place
4. **Simpler Mental Model**: No layer abstraction (features, entities, shared)

### Why Zustand + TanStack Query?

**Zustand for Client State**:
- Minimal boilerplate
- No Provider wrapping
- TypeScript-first
- Small bundle size (1.2 KB)

**TanStack Query for Server State**:
- Automatic caching
- Background refetching
- Query invalidation
- Optimistic updates
- Loading/error states out of the box

### Why Native WebSocket over Socket.IO?

1. **Protocol Control**: Full control over WebSocket lifecycle
2. **Bundle Size**: Socket.IO client adds 60+ KB
3. **Simplicity**: Topic-based subscriptions via query params
4. **Backend Alignment**: Backend uses native WebSocket

### Why shadcn/ui over Component Libraries?

**Chosen over Material-UI, Ant Design, Chakra UI**:

1. **Copy, Don't Install**: Full control over component code
2. **Tailwind Integration**: Utility-first styling
3. **Accessibility**: Built on Radix UI primitives
4. **Customization**: Modify any component without fighting library defaults
5. **Bundle Size**: Only include components you use

---

## Known Issues & Tech Debt

### 1. Socket.IO Client Dependency

**Issue**: `socket.io-client@4.8.1` installed but never used.

**Impact**: +60 KB bundle size.

**Resolution**: Remove from `package.json`.

---

### 2. Mixed API Patterns

**Issue**: Some services use axios, others use native Fetch API.

**Impact**: Inconsistent error handling, no interceptor support for fetch.

**Resolution**: Standardize on axios for all API calls.

---

### 3. Missing Environment Variable Documentation

**Issue**: No `.env.example` file documenting required VITE_* variables.

**Resolution**: Create `.env.example` with:

```bash
VITE_API_BASE_URL=http://localhost/api/v1
VITE_WS_URL=ws://localhost/ws
VITE_WS_HOST=localhost
VITE_WS_PATH=/ws
```

---

## References

- **Investigation Report**: `.artifacts/.../frontend-investigation.md`
- **Quick Reference**: `frontend/CLAUDE.md`
- **Backend Architecture**: `docs/content/en/architecture/overview.md`
- **Event Flow**: `docs/content/en/event-flow.md`

---

**Last Updated**: 2025-10-26
**Total Lines**: 1200+
**Status**: Complete (Batch 2 of 6)
