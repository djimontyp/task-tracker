# Frontend Documentation

## Architecture Overview

A modern, responsive React TypeScript dashboard for real-time task tracking and management.

## Technology Stack
- React 18.3.1
- TypeScript
- WebSocket for real-time updates
- CSS with adaptive design
- Docker-based development workflow

## Key Features

### UI/UX Design
- **Responsive Layout**: Adaptive design for 2K+ monitors
- **Tab Navigation**:
  - Centered tabs with professional design
  - Adaptive sizing (1.5rem - 2.5rem)
  - Hover animations
  - Mobile-friendly bottom navigation bar

### Dashboard Components
- Real-time task and message display
- WebSocket connection status
- Flexible, expandable message container
- Optimized content hierarchy

## Development Workflow

### Docker Compose Watch
- Live CSS/JS synchronization
- No rebuild required during development
- Automatic file sync from `./frontend/src` to container

### Build Process
- `react-scripts` 5.0.1
- TypeScript compilation
- Static file generation
- Nginx-based production serving

## Development Commands

### Local Development
- `npm start`: Start development server
- `npm run build`: Create production build
- `npm test`: Run test suite

### Docker-specific
- `just services-dev`: Start with live reload
- `just dev dashboard`: Watch frontend service

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API endpoint
- `REACT_APP_WS_URL`: WebSocket connection URL

## WebSocket Integration
- Real-time message and task updates
- Automatic reconnection
- Connection status tracking

## UI Breakpoints
- Base: Default mobile design
- 2K: Enhanced layout, larger components
- 4K: Ultra-high resolution optimizations

## Current Status

### ✅ Working Components
- Responsive dashboard
- WebSocket connectivity
- Docker watch integration
- Basic task management UI

### 🔄 Planned Improvements
- Enhanced filtering
- More interactive components
- Advanced state management

## Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Implement prop types
- Write unit tests for components
- Follow React best practices

### Performance Optimization
- Lazy loading of components
- Minimal re-renders
- Efficient state management
- Optimized state updates for agent management

## Agent Management Features

### Agent Management UI
- **Location**: `/pages/AgentsPage`
- Full CRUD interface for AI agent configurations
- Real-time agent testing with custom prompts

#### Components
- `/features/agents/components/AgentList.tsx` - Main list view with cards
- `/features/agents/components/AgentForm.tsx` - Create/Edit dialog
- `/features/agents/components/AgentCard.tsx` - Individual agent card
- `/features/agents/components/AgentTestDialog.tsx` - Testing interface
- `/features/agents/components/TaskAssignment.tsx` - Task assignment UI

#### Agent Testing Interface
- Custom prompt input (50-2000 characters)
- Character count validation
- Example prompts for quick testing
- Real-time execution time display
- Formatted response display
- Error handling with toast notifications
- Model and provider information display

#### API Integration
- **Service**: `/features/agents/api/agentService.ts`
- Methods:
  - `listAgents`
  - `createAgent`
  - `updateAgent`
  - `deleteAgent`
  - `testAgent`
- TanStack Query for state management
- Optimistic updates for better UX

## Troubleshooting

### Common Issues
- Ensure backend API is running
- Check WebSocket connection
- Verify environment variables
- Agent testing error handling
  - Verify provider status
  - Check API key configuration
  - Validate LLM provider connectivity

## Navigation Structure

### Sidebar Sections
```
WORKSPACE
├── Dashboard (/)
├── Messages (/messages)
├── Topics (/topics) - research topics
└── Tasks (/tasks) - TaskEntity results

AI ANALYSIS
├── Analysis Runs (/analysis)
└── Task Proposals (/proposals) - AI-generated proposals

AI CONFIGURATION
├── Agents (/agents)
├── Agent Tasks (/agent-tasks) - Pydantic schemas
├── Providers (/providers) - OpenAI, Ollama
└── Projects (/projects) - classification config

INSIGHTS
└── Analytics (/analytics)

FOOTER
├── Settings (/settings)
└── User (Account, Logout)
```

### Page Structure
- `/pages/DashboardPage` - main dashboard
- `/pages/MessagesPage` - messages list
- `/pages/TopicsPage` - research topics (renamed from TasksPage)
- `/pages/TasksPage` - TaskEntity results from analysis
- `/pages/AnalysisRunsPage` - analysis runs
- `/pages/ProposalsPage` - TaskProposal review
- `/pages/AgentsPage` - AI agents (no tabs)
- `/pages/AgentTasksPage` - Task Configs with schemas
- `/pages/ProvidersPage` - LLM providers
- `/pages/ProjectsPage` - classification projects
- `/pages/AnalyticsPage` - analytics
- `/pages/SettingsPage` - settings

## Last Updated
October 2025