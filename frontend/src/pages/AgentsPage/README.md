# LLM Agent Management Page

## Overview

AgentsPage provides a comprehensive UI for managing AI agents, task configurations, and LLM providers in the Task Tracker system.

## Components Structure

### Main Page
- **AgentsPage/index.tsx** - Main page with 3 tabs (Agents, Tasks, Providers)

### Provider Components
- **ProviderList** - Grid display of LLM providers with Edit/Delete actions
- **ProviderForm** - Dialog form with conditional fields based on provider type
- **ValidationStatus** - Badge component showing provider validation status

### Agent Components
- **AgentList** - Grid display of AI agents
- **AgentCard** - Single agent display card with actions
- **AgentForm** - Dialog form with provider dropdown and configuration
- **TaskAssignment** - Modal for managing agent-task assignments

### Task Components
- **TaskList** - Grid display of task configurations
- **TaskForm** - Dialog form with schema editor
- **SchemaEditor** - Card-based JSON schema builder (no code editor)

## Features

### Provider Management
- Create/Edit/Delete LLM providers (Ollama, OpenAI)
- Conditional form fields based on provider type
- Validation status tracking with color-coded badges
- Support for base_url (Ollama) and api_key (OpenAI)

### Agent Management
- Create/Edit/Delete AI agents
- Configure model name, system prompt, temperature, max_tokens
- Manage task assignments per agent
- Active/Inactive status toggle

### Task Configuration
- Create/Edit/Delete task configurations
- Visual schema builder with field types
- JSON schema preview
- Support for multiple data types (string, number, boolean, array, object, date, email, url)

## Tech Stack
- React Query for data fetching
- shadcn/ui components (Card, Button, Dialog, Badge, etc.)
- sonner for toast notifications
- TypeScript with strict types
- Path aliases (@shared/ui, @/types, @/services)

## API Integration

All components use services from:
- `@/services/agentService` - Agent CRUD and task assignment
- `@/services/taskService` - Task CRUD operations
- `@/services/providerService` - Provider CRUD operations

Types imported from:
- `@/types/agent` - AgentConfig, AgentConfigCreate, AgentConfigUpdate
- `@/types/task` - TaskConfig, TaskConfigCreate, AgentTaskAssignment
- `@/types/provider` - LLMProvider, ProviderType, ValidationStatus

## Navigation

Access the page at `/agents` route. The page is integrated into the main navigation via routes.tsx.
