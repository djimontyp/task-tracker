# Frontend: React 18 + TypeScript + Native WebSocket

## Architecture Overview

**Pattern**: Feature-based architecture (domain-driven)
**Build Tool**: Vite 7.1.9
**TypeScript**: 5.9.3 (strict mode enabled)
**Real-time**: Native WebSocket (NOT Socket.IO)

```
src/
├── app/                    # App configuration (routes, providers)
├── features/              # 14 domain modules (agents, analysis, atoms...)
│   └── {domain}/
│       ├── api/           # Service class + TanStack Query hooks
│       ├── components/    # Domain-specific components
│       ├── types/         # TypeScript interfaces
│       ├── store/         # Zustand store (optional)
│       └── hooks/         # Custom hooks (optional)
├── pages/                 # 14 pages with lazy loading
├── shared/
│   ├── ui/               # 33 Radix-based components (shadcn/ui)
│   ├── components/       # 15+ business components
│   ├── layouts/          # MainLayout wrapper
│   ├── hooks/            # Reusable hooks (4)
│   ├── store/            # UI store (sidebar, theme)
│   ├── config/           # API endpoints
│   └── lib/api/          # Axios client
```

---

## Technology Stack

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| **react** | 18.3.1 | UI library |
| **react-dom** | 18.3.1 | React DOM renderer |
| **typescript** | 5.9.3 | Type system (strict mode) |
| **vite** | 7.1.9 | Build tool (dev server, bundler) |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| **zustand** | 5.0.8 | Client state (UI, tasks, messages) |
| **@tanstack/react-query** | 5.90.2 | Server state (caching, invalidation) |

### Routing & HTTP
| Package | Version | Purpose |
|---------|---------|---------|
| **react-router-dom** | 7.9.3 | Client-side routing with lazy loading |
| **axios** | 1.12.2 | HTTP client for API calls |
| ~~socket.io-client~~ | ~~4.8.1~~ | **DEAD DEPENDENCY** (remove - native WebSocket used) |

### UI Components (Radix UI)
16 packages: dialog, dropdown-menu, select, tabs, tooltip, checkbox, switch, popover, etc.

### Styling
| Package | Version | Purpose |
|---------|---------|---------|
| **tailwindcss** | 3.4.17 | Utility-first CSS framework |
| **class-variance-authority** | 0.7.1 | Component variants |
| **tailwind-merge** | 3.3.1 | Merge Tailwind classes |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| **react-hook-form** | 7.63.0 | Form state management |
| **zod** | 3.25.76 | Schema validation |

### Data Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| **recharts** | 2.15.4 | Charts library |
| **@tanstack/react-table** | 8.21.3 | Table utilities |

### Other UI
- **lucide-react** - Icon library (SVG icons)
- **react-colorful** 5.6.1 - Color picker
- **react-hot-toast** 2.6.0 / **sonner** 2.0.7 - Toast notifications
- **next-themes** 0.4.6 - Theme switching

---

## Feature Modules Catalog

**Location**: `/src/features/`

| # | Module | Purpose | Key Files |
|---|--------|---------|-----------|
| 1 | **agents** | AI agent config, testing, task assignment | AgentCard, AgentForm, AgentList, TaskAssignment (17 files) |
| 2 | **analysis** | Analysis run lifecycle, WebSocket updates | RunCard, CreateRunModal, TimeWindowSelector (6 files) |
| 3 | **atoms** | Knowledge atoms CRUD | AtomCard, CreateAtomDialog (7 files) |
| 4 | **experiments** | Topic classification experiments, ML metrics | ClassificationExperimentsPanel, ConfusionMatrixHeatmap (9 files) |
| 5 | **knowledge** | Knowledge extraction, version history, diffs | KnowledgeExtractionPanel, VersionHistoryList, VersionDiffViewer (11 files) |
| 6 | **messages** | Message feed, error boundary, WebSocket | MessagesErrorBoundary, useMessagesFeed (5 files) |
| 7 | **noise** | Noise filtering API | noiseService.ts (2 files) |
| 8 | **onboarding** | User onboarding wizard | OnboardingWizard (3 files) |
| 9 | **projects** | Project CRUD, keyword management | ProjectCard, ProjectForm (5 files) |
| 10 | **proposals** | Task proposal review, batch actions | ProposalCard, RejectProposalDialog (5 files) |
| 11 | **providers** | LLM provider config, Ollama models | ValidationStatus, useOllamaModels (8 files) |
| 12 | **tasks** | Task state management | tasksStore.ts (1 file) |
| 13 | **topics** | Topic management (icons, colors) | HexColorPicker, renderIcon (6 files) |
| 14 | **websocket** | WebSocket connection, service status | useWebSocket, useServiceStatus (2 files) |

**Total**: 14 modules (87 files)

---

## Pages & Routing

**Location**: `/src/pages/`

| Page | Route | Purpose |
|------|-------|---------|
| **DashboardPage** | `/` | Dashboard with recent topics, stats |
| **MessagesPage** | `/messages` | Message feed with filters, importance scores |
| **TopicsPage** | `/topics` | Topic list with faceted filters |
| **TopicDetailPage** | `/topics/:topicId` | Topic details with messages and atoms |
| **TasksPage** | `/tasks` | Task management (analysis results) |
| **AnalysisRunsPage** | `/analysis` | Analysis run lifecycle (real-time updates) |
| **ProposalsPage** | `/proposals` | Task proposal review with batch actions |
| **AgentsPage** | `/agents` | Agent configuration, testing, CRUD |
| **AgentTasksPage** | `/agent-tasks` | Task assignment to agents |
| **ProvidersPage** | `/providers` | LLM provider management |
| **ProjectsPage** | `/projects` | Project CRUD with keyword versioning |
| **NoiseFilteringDashboard** | `/noise-filtering` | Noise filtering statistics |
| **AnalyticsPage** | `/analytics` | Analytics and insights |
| **SettingsPage** | `/settings` | Settings with plugin architecture (Telegram) |

**Total**: 14 pages (34 files)
**Pattern**: All pages lazy-loaded via React.lazy() + Suspense

---

## State Management

### Zustand Stores (3 total)

**Pattern**: Feature-scoped stores with immutable updates

| Store | Location | Purpose | Key State |
|-------|----------|---------|-----------|
| **tasksStore** | `/features/tasks/store/` | Task state | `tasks[]`, `selectedTask`, `filterStatus`, loading/error |
| **messagesStore** | `/features/messages/store/` | Message feed | (feature-specific) |
| **uiStore** | `/shared/store/` | UI state | `sidebarOpen`, `theme` (light/dark) |

**Pattern**: Store created with Zustand's create function, defining state properties (tasks array, selectedTask, loading/error flags) and actions (setTasks, addTask, updateTask) using immutable updates with spread syntax.

### TanStack Query (Server State)

**Configuration** (`/app/providers.tsx`):
- `staleTime`: 5 minutes
- `refetchOnWindowFocus`: false
- `retry`: 1 attempt

**Patterns**:
1. **Inline queryFn** in components
2. **Custom hooks** in service files (`useExperiments`, `useStartExperiment`)
3. **Mutations** with `queryClient.invalidateQueries()`

**WebSocket Integration**: WebSocket message handler parses incoming events, checks message topic, and calls queryClient.invalidateQueries with appropriate queryKey to trigger background refetch.

---

## Component Architecture

### Shared UI Components (shadcn/ui)

**Location**: `/shared/ui/` (33 components)

Based on **Radix UI** primitives with **Tailwind CSS** styling.

**Categories**:
- **Dialogs**: alert-dialog, dialog, sheet
- **Inputs**: input, textarea, checkbox, switch, slider, select, radio-group
- **Overlays**: popover, tooltip, dropdown-menu
- **Layout**: card, separator, tabs, sidebar
- **Feedback**: badge, spinner, skeleton, progress, sonner (toasts)
- **Data**: table, chart (recharts wrapper)
- **Navigation**: breadcrumb, pagination
- **Utilities**: button, label, command (palette)

### Shared Components (Business Logic)

**Location**: `/shared/components/` (15+ components)

- **Navigation**: AppSidebar, NavUser
- **Data Display**: DataTable, DataTableToolbar, DataTablePagination, DataTableFacetedFilter
- **Visuals**: MetricCard, TrendChart, ActivityHeatmap, AvatarGroup
- **Utilities**: ColorPickerPopover, EmptyState, SaveStatusIndicator, AutoSaveToggle
- **Theme**: ThemeProvider

### Import Aliases

**Configuration** (`tsconfig.json`, `vite.config.ts`): Path mappings configured with @ prefix for clean imports - @/* maps to src root, @app/* to app directory, @pages/* to pages, @features/* to features, @shared/* to shared.

**Usage**: Import shared UI components, API client, config from @/shared paths. Import pages from @pages prefix. Cleaner than relative paths like ../../../shared/ui.

---

## Data Fetching Patterns

### API Service Pattern

**Axios Client** (`/shared/lib/api/client.ts`): Configured with baseURL from environment variable VITE_API_BASE_URL (defaults to empty for relative URLs) and JSON content-type header.

**Service Class** (example: `analysisService.ts`): Service class defines async methods for API operations (listRuns, createRun, getRunDetails, closeRun). Methods use apiClient to make HTTP calls, extract data from response, and return typed results. Exported as singleton instance.

**Alternative**: Some services use native **Fetch API** (e.g., `messageService.ts`)

### API Endpoints Configuration

**Location**: `/shared/config/api.ts`

**Structure**: Object with endpoint paths organized by domain - health check, messages, tasks at root level. Nested objects for complex domains (analysis with runs and run detail). Factory functions for parameterized endpoints (run by runId). WebSocket endpoint at /ws.

**Total**: 30+ endpoints

---

## Real-time Communication

### Native WebSocket (NOT Socket.IO)

**Important**: `socket.io-client` is installed but **NOT USED** - remove from package.json.

**Implementation**: Native WebSocket API with custom hook

**Hook** (`/features/websocket/hooks/useWebSocket.ts`):

**Features**:
- Topic-based subscriptions via query params: `ws://host/ws?topics=analysis,proposals`
- Exponential backoff reconnection (max 5 attempts)
- Connection states: `connecting`, `connected`, `reconnecting`, `disconnected`
- Integration with TanStack Query via `queryClient.invalidateQueries()`

**Usage Pattern**: WebSocket created in useEffect with topic subscriptions via query params. Message handler parses events, checks topic, and uses switch statement on event type to invalidate specific queries and show toast notifications. Cleanup function closes WebSocket connection.

**Environment Variables**:
- `VITE_WS_URL`: Full WebSocket URL (e.g., `ws://localhost/ws`)
- `VITE_WS_HOST`: WebSocket host (e.g., `localhost`)
- `VITE_WS_PATH`: WebSocket path (default: `/ws`)

---

## Build & Development

### Vite Configuration

**Location**: `/vite.config.ts`

**Server** (Docker-compatible): Configured to listen on port 3000, bind to all addresses (host: true for Docker), enforce strict port, and use polling for file watching (required for Docker volume mounts).

**Build Optimization**:
- Manual code splitting (3 vendor chunks):
  - `react-vendor`: React, React DOM, React Router
  - `ui-vendor`: All Radix UI packages
  - `data-vendor`: TanStack Query, Axios
- Source maps enabled in production
- Chunk size warning limit: 1000 KB

### TypeScript Configuration

**Strict Mode**: ✅ Enabled - All strict TypeScript checks active, flags unused locals and parameters, prevents fallthrough in switch statements.

**Target**: ES2020, ESNext modules
**JSX**: react-jsx (React 17+ transform)

---

## Development Commands

**Start Services**:
- `just services-dev` - Docker watch mode (live CSS/JS sync)
- `just dev dashboard` - Watch frontend only

**Environment Variables**:
- `VITE_API_BASE_URL` / `VITE_API_URL` - API base URL (default: relative for Nginx proxy)
- `VITE_WS_URL` - WebSocket URL (e.g., `ws://localhost/ws`)
- `VITE_WS_HOST` - WebSocket host (e.g., `localhost`)
- `VITE_WS_PATH` - WebSocket path (default: `/ws`)

**Testing**:
- React Testing Library 14.3.1
- Jest DOM matchers 6.9.1
- User event simulation 14.6.1

---

## Code Quality Guidelines

### TypeScript
- Strict mode enabled - all type checks enforced
- Use import aliases (`@/shared`, `@features`, etc.)
- Define types in `types/index.ts` per feature

### State Management
- **Client state** → Zustand (UI, local data)
- **Server state** → TanStack Query (API caching)
- **Real-time** → WebSocket → query invalidation

### Components
- Feature components in `features/{domain}/components/`
- Shared UI in `shared/ui/` (Radix-based)
- Business components in `shared/components/`
- Lazy load all pages

### Data Fetching
- Service classes with typed methods
- TanStack Query hooks for API calls
- Optimistic updates for mutations
- Query invalidation on WebSocket events

### Styling
- Tailwind CSS utility classes
- CVA (class-variance-authority) for variants
- `tailwind-merge` for conditional classes
- Next Themes for dark mode

---

## Navigation Structure

```
WORKSPACE
├── Dashboard
├── Messages
└── Tasks

AI ANALYSIS
├── Analysis Runs
└── Task Proposals

AI CONFIG
├── Agents
├── Providers
└── Projects

INSIGHTS
└── Analytics

SETTINGS
└── General, Sources (Telegram)
```

---

## Project Statistics

| Metric | Count |
|--------|-------|
| Feature Modules | 14 |
| Pages | 14 |
| TypeScript Files | 205 |
| Shared UI Components | 33 |
| Shared Components | 15+ |
| Radix UI Packages | 16 |
| Dependencies | 53 |
| API Endpoints | 30+ |
| Zustand Stores | 3 |

---

## Key Patterns

1. **Feature-based architecture** - domain-driven organization, not FSD
2. **Lazy loading** - all pages via React.lazy() + Suspense
3. **Type safety** - TypeScript strict mode enforced
4. **State separation** - Zustand (client) + TanStack Query (server)
5. **Real-time sync** - WebSocket → query invalidation
6. **Component composition** - Radix primitives + business logic
7. **Import aliases** - clean imports via `@/` prefixes
8. **Service classes** - typed API methods with axios

---

## Common Tasks

**Add New Feature**:
1. Create `features/{domain}/` directory
2. Add `api/{domain}Service.ts` (service class)
3. Add `components/` (React components)
4. Add `types/index.ts` (TypeScript interfaces)
5. Add `store/` if client state needed (Zustand)
6. Export custom hooks in `api/` file

**Add New Page**:
1. Create `pages/{PageName}/index.tsx`
2. Add route in `app/routes.tsx` with lazy loading
3. Wrap in MainLayout
4. Add to navigation in `shared/components/AppSidebar.tsx`

**Add WebSocket Updates**:
1. Subscribe to topic in `useEffect`: `?topics=analysis,proposals`
2. Parse messages in `ws.onmessage`
3. Invalidate queries: `queryClient.invalidateQueries({ queryKey: [...] })`
4. Show toast notifications for user feedback

**Add New Component**:
- **Shared UI**: Use shadcn CLI: `npx shadcn add {component}`
- **Business Logic**: Create in `shared/components/` or `features/{domain}/components/`

---

## Known Issues

1. **Socket.IO Client**: Installed but not used - remove from package.json
2. **Mixed API Pattern**: Some services use axios, others use fetch API
3. **Environment Variables**: Document all VITE_* vars in .env.example

---

## References

- **Investigation Report**: `.artifacts/.../frontend-investigation.md`
- **MkDocs Documentation**: `docs/content/en/frontend/architecture.md`
- **Backend Guidelines**: `backend/CLAUDE.md`
