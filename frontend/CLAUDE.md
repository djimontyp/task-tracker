# Frontend: React 18 + TypeScript + WebSocket

## Stack
React 18.3.1, TypeScript, WebSocket, TanStack Query, Docker Compose Watch (live reload)

## Key Pages
### Phase 1 Complete
- **AnalysisRunsPage** `/analysis` - lifecycle visualization, WS updates, run management
- **ProposalsPage** `/proposals` - review workflow, batch actions, confidence filters
- **ProjectsPage** `/projects` - CRUD, keyword management, versioning
- **AgentsPage** `/agents` - CRUD, agent testing (50-2000 chars), real-time execution

## Feature Structure
```
/features/{domain}/
  ├── api/{domain}Service.ts  - API client, TanStack Query hooks
  ├── components/             - React components
  └── types/index.ts          - TypeScript interfaces
```

## Navigation
```
WORKSPACE: Dashboard, Messages, Tasks
AI ANALYSIS: Analysis Runs, Task Proposals
AI CONFIG: Agents, Providers, Projects
INSIGHTS: Analytics
```

## Development
- `just services-dev` - Docker watch mode (live CSS/JS sync)
- `just dev dashboard` - Watch frontend only
- Env: `REACT_APP_API_URL`, `REACT_APP_WS_URL`

## Guidelines
- TypeScript strict mode, lazy loading, minimal re-renders
- Optimistic updates for better UX
