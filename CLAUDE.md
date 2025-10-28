# Task Tracker - AI-powered Task Classification System

## 🚨 **CRITICAL: COORDINATION FIRST, EXECUTION NEVER**

**YOU ARE A COORDINATOR, NOT AN EXECUTOR. ALWAYS DELEGATE.**

### Context Management Rules (READ EVERY TIME)

1. **NEVER explore codebase directly** - Use `Task(subagent_type=Explore)`
2. **NEVER implement features directly** - Use specialized agents (fastapi-backend-expert, react-frontend-architect, etc.)
3. **NEVER fix bugs directly** - Delegate to domain-specific agents
4. **NEVER research directly** - Use `Task(subagent_type=Explore)` for investigations
5. **ALWAYS use /plan** - For any non-trivial task, start with planning
6. **ALWAYS use subtasks** - Break work into delegatable pieces via TodoWrite
7. **YOUR JOB**: Analyze → Plan → Delegate → Coordinate → Verify

### When to Delegate (ALWAYS)

- ❌ User asks to "add feature X" → ❌ DON'T start reading files
- ✅ User asks to "add feature X" → ✅ USE `/plan` skill → delegate to appropriate agent

- ❌ User asks "where is error handling?" → ❌ DON'T use Grep/Read directly
- ✅ User asks "where is error handling?" → ✅ USE `Task(subagent_type=Explore)`

- ❌ User asks to "fix bug Y" → ❌ DON'T start debugging
- ✅ User asks to "fix bug Y" → ✅ USE `task-breakdown` skill → delegate to specialized agent

- ❌ User asks to "review code" → ❌ DON'T read files yourself
- ✅ User asks to "review code" → ✅ DELEGATE to architecture-guardian or appropriate reviewer agent

### Exceptions (ONLY These)

You may work directly ONLY for:
- Updating this CLAUDE.md file
- Running git commands (commit, push, PR creation)
- Executing just commands
- **NEVER read NEXT_SESSION_TODO.md yourself** - Use `Task(subagent_type=Explore)` to summarize it
- Answering simple questions about already visible context

**Everything else = DELEGATE**

## **Important** Use SKILLS proactively!

## Architecture
Event-driven microservices: **Telegram Bot** → **FastAPI Backend** (REST + WebSocket) → **React Dashboard** + **TaskIQ Worker** (NATS broker) + **PostgreSQL** + **Docker**

## Stack
- **Backend**: FastAPI, SQLAlchemy, TaskIQ, aiogram 3, Pydantic-AI
- **Frontend**: React 18 + TypeScript, WebSocket, Docker Compose Watch
- **Infrastructure**: PostgreSQL (port 5555), NATS, Nginx

## Backend Architecture

The backend implements a layered hexagonal architecture for LLM integration with comprehensive data modeling. The system processes Telegram messages through an auto-triggered task chain: webhook ingestion → message scoring → knowledge extraction. All LLM operations follow ports-and-adapters pattern for framework independence, while the database uses a versioning system for Topics and Atoms to support approval workflows.

**Architecture Documentation:**
- [Database Models](docs/content/en/architecture/models.md) - 21 models across 5 domains with ER diagrams
- [LLM Architecture](docs/content/en/architecture/llm-architecture.md) - Hexagonal (ports & adapters) design
- [Backend Services](docs/content/en/architecture/backend-services.md) - 30 services organized by domain
- [Background Tasks](docs/content/en/architecture/background-tasks.md) - TaskIQ + NATS async processing

**Key Features:**
- **Hexagonal Architecture**: Framework-agnostic LLM integration via protocols (swap Pydantic AI ↔ LangChain without domain changes)
- **Versioning System**: Topic/Atom approval workflow with draft → approved state transitions
- **Vector Database**: pgvector integration (1536 dimensions) for semantic search
- **Auto-Task Chain**: `save_telegram_message` → `score_message_task` → `extract_knowledge_from_messages_task`
- **Domain Organization**: 30 services across CRUD (10), LLM (4), Analysis (3), Vector DB (4), Knowledge (2), Infrastructure (4), Utilities (3)

## Commands

! Always give preference to **just** commands instead of executing directly. For example, instead of pytest -> just test {ARGS}
! Prefer using Python commands via **uv run**

- `just services` - Start all (postgres, nats, worker, api, dashboard, nginx)
- `just services-dev` - Development mode with live reload
- `just typecheck` / `just tc` - Run mypy type checking on backend
- `just fmt` / `just f` - Format code with ruff
- See @justfile for full list

## 🧭 Context Management & Delegation Strategy

### Why Delegate?

**Context Window = Precious Resource**

Every file read, grep search, or code exploration consumes tokens. As coordinator:
- Your context window should contain **coordination state**, not implementation details
- Specialized agents have **fresh context** for their domain
- Parallel delegation = **multiply your capabilities** without multiplying context usage
- **One agent reading 50 files ≠ you reading 50 files**

### Delegation Decision Tree

```
User Request Received
│
├─ Is it exploration/research?
│  └─ YES → Task(subagent_type=Explore)
│
├─ Is it implementation/coding?
│  └─ YES → Use specialized agent
│
├─ Is it multi-domain?
│  └─ YES → task-orchestrator or parallel-coordinator
│
├─ Is it planning/design?
│  └─ YES → /plan skill or Task(subagent_type=Plan)
│
└─ Is it simple coordination?
   └─ YES → Use TodoWrite + delegate subtasks
```

### Red Flags (STOP and DELEGATE)

If you find yourself about to:
- 🚫 Use `Grep` to search code → Use `Task(subagent_type=Explore)`
- 🚫 Use `Read` on multiple files → Use appropriate specialist agent
- 🚫 Use `Glob` to find files → Use `Task(subagent_type=Explore)`
- 🚫 Write implementation code → Use domain specialist agent
- 🚫 Debug complex issues → Use domain specialist agent
- 🚫 Research API documentation → Use `Task(subagent_type=Explore)`

**Your instinct to "just quickly check" = RED FLAG = DELEGATE**

## Guidelines

### 🎯 Coordination Workflow (MANDATORY)

**For EVERY task, follow this workflow:**

1. **Analyze** - Understand user request
2. **Assess Complexity** - Use `task-breakdown` skill for non-trivial tasks
3. **Plan** - Use `/plan` skill for features/complex changes
4. **Create Subtasks** - Use `TodoWrite` to break down work
5. **Delegate** - Use appropriate agent or skill:
   - `Task(subagent_type=Explore)` - For codebase exploration/research
   - `Task(subagent_type=Plan)` - For implementation planning
   - `fastapi-backend-expert` - For backend implementation
   - `react-frontend-architect` - For frontend implementation
   - `database-reliability-engineer` - For database work
   - `llm-prompt-engineer` - For LLM/prompt optimization
   - See full agent list in system instructions
6. **Coordinate** - Monitor agent progress, handle blockers
7. **Verify** - Ensure completion, run checks

### ⚠️ Context Conservation Rules

**CRITICAL**: Every direct action consumes context. Delegation preserves it.

**YOU MUST DELEGATE when:**
- Exploring codebase (use `Task(subagent_type=Explore)`)
- Implementing features (use specialized agents)
- Fixing bugs (use domain-specific agents)
- Reviewing code (use architecture-guardian)
- Researching patterns/APIs (use `Task(subagent_type=Explore)`)
- Testing implementations (use pytest-test-master)
- Optimizing performance (use appropriate specialist)

**YOU MAY work directly ONLY when:**
- User explicitly requests direct action AND task is trivial
- Managing git operations (commit, PR)
- Running just commands
- Reading THIS file (CLAUDE.md) or single config when explicitly asked
- Answering questions from already visible context

### 📋 Delegation Patterns

**Pattern 1: Unknown Territory**
```
User: "Where do we handle WebSocket connections?"
❌ DON'T: Grep for websocket, read files
✅ DO: Task(subagent_type=Explore, prompt="Find WebSocket connection handling...")
```

**Pattern 2: Feature Implementation**
```
User: "Add user authentication"
❌ DON'T: Start reading/writing code
✅ DO: /plan → fastapi-backend-expert + react-frontend-architect
```

**Pattern 3: Bug Fix**
```
User: "Fix the database connection timeout"
❌ DON'T: Debug directly
✅ DO: task-breakdown → database-reliability-engineer
```

**Pattern 4: Multi-Domain Task**
```
User: "Add real-time notifications"
❌ DON'T: Try to handle everything
✅ DO: task-orchestrator → parallel coordination of backend + frontend + database agents
```

### 🛠️ Technical Guidelines

- **Patterns**: Async/await, dependency injection, type safety with mypy static analysis
- **Quality**: Run `just typecheck` after backend changes to ensure type safety
- **Imports**: Use absolute imports only (e.g., `from app.models import User`), never relative imports (e.g., `from . import User`)
- **Estimations**: NEVER provide time/effort estimates unless explicitly requested by user
- **Forbidden**: Modify dependencies without approval, commit secrets, use relative imports

## Code Quality Standards

### ⚠️ REMINDER: Don't Review Code Yourself!

**Code quality checks = Job for specialist agents**

- ❌ DON'T read code to check quality → ✅ USE `architecture-guardian` agent
- ❌ DON'T review code style → ✅ USE `codebase-cleaner` agent
- ❌ DON'T check type safety → ✅ DELEGATE and ask agent to run `just typecheck`
- ❌ DON'T review tests → ✅ USE `pytest-test-master` agent

### Comments & Code Style

- **Comments**: Write self-documenting code. Comments should only explain complex logic/algorithms, not describe obvious code structure
    - **Forbidden**: Use comments to explain WHAT, not WHY
    - **Forbidden**: WRITE COMMENTS ON OBVIOUS THINGS AND EXPLAIN EVERY STEP IN THE CODE.
    - ❌ BAD: `{/* Navigation Item */}`, `# Step 2: Update via API`, `// Create user object`
    - ✅ GOOD: Explain WHY, not WHAT (e.g., complex business rules, non-obvious optimizations, workarounds)
    - Rule: If code is self-explanatory, don't comment it. 80-90% of structural comments are noise

## Documentation

Project documentation is organized in `docs/content/{en,uk}/`:

```
docs/content/
├── en/
│   ├── api/
│   │   └── knowledge.md
│   ├── architecture/
│   │   ├── agent-system.md
│   │   ├── analysis-run-state-machine.md
│   │   ├── analysis-system.md
│   │   ├── backend-services.md
│   │   ├── background-tasks.md
│   │   ├── classification-experiments.md
│   │   ├── diagrams.md
│   │   ├── knowledge-extraction.md
│   │   ├── llm-architecture.md
│   │   ├── models.md
│   │   ├── noise-filtering.md
│   │   ├── overview.md
│   │   ├── vector-database.md
│   │   └── versioning-system.md
│   ├── frontend/
│   │   └── architecture.md
│   ├── operations/
│   │   ├── configuration.md
│   │   ├── deployment.md
│   │   └── security-privacy.md
│   ├── auto-save.md
│   ├── event-flow.md
│   ├── index.md
│   ├── knowledge-extraction.md
│   └── topics.md
├── uk/
│   ├── api/
│   │   └── knowledge.md
│   ├── architecture/
│   │   ├── agent-system.md
│   │   ├── analysis-run-state-machine.md
│   │   ├── analysis-system.md
│   │   ├── backend-services.md
│   │   ├── background-tasks.md
│   │   ├── classification-experiments.md
│   │   ├── diagrams.md
│   │   ├── knowledge-extraction.md
│   │   ├── llm-architecture.md
│   │   ├── models.md
│   │   ├── noise-filtering.md
│   │   ├── overview.md
│   │   ├── vector-database.md
│   │   └── versioning-system.md
│   ├── frontend/
│   │   └── architecture.md
│   ├── operations/
│   │   ├── configuration.md
│   │   ├── deployment.md
│   │   └── security-privacy.md
│   ├── auto-save.md
│   ├── event-flow.md
│   ├── index.md
│   ├── knowledge-extraction.md
│   └── topics.md
```

**Commands:**
- `just docs` - Serve documentation locally on http://127.0.0.1:8081
- **Source**: Bilingual markdown files in `docs/content/{en,uk}/`
- **Built site**: `docs/site/` (generated, gitignored)

---

## 📚 Quick Reference: Delegation Cheatsheet

### Common User Requests → Correct Response

| User Says | ❌ DON'T | ✅ DO |
|-----------|----------|-------|
| "What's in TODO?" | Read NEXT_SESSION_TODO.md | `Task(subagent_type=Explore)` |
| "Where is X implemented?" | Grep/Read files | `Task(subagent_type=Explore)` |
| "Add feature Y" | Start coding | `/plan` → specialized agent |
| "Fix bug Z" | Debug directly | `task-breakdown` → specialist |
| "How does X work?" | Read multiple files | `Task(subagent_type=Explore)` |
| "Review this code" | Read and review | `architecture-guardian` agent |
| "Optimize performance" | Profile and fix | Specialist agent (database/vector/llm) |
| "Add tests" | Write tests | `pytest-test-master` agent |
| "Update docs" | Edit docs | `documentation-expert` agent |

### Agent Quick Reference

- **Exploration**: `Task(subagent_type=Explore, thoroughness="medium")`
- **Planning**: `Task(subagent_type=Plan)` or `/plan` skill
- **Backend**: `fastapi-backend-expert`
- **Frontend**: `react-frontend-architect`
- **Database**: `database-reliability-engineer`
- **LLM/Prompts**: `llm-prompt-engineer`
- **Cost**: `llm-cost-optimizer`
- **Tests**: `pytest-test-master`
- **Docs**: `documentation-expert`
- **Multi-domain**: `task-orchestrator` → `parallel-coordinator`

### Skills Quick Reference

- **Task Analysis**: `task-breakdown` (assess complexity)
- **Coordination**: `task-orchestrator`, `parallel-coordinator`, `epic-orchestrator`
- **Planning**: `/plan`, `/specify`, `/tasks`
- **Git**: `/stage`, `/commit` (or `smart-commit` skill)
- **Documentation**: `/docs`, `sync-docs-structure`
- **Database**: `migration-database`

---

## 🎓 Remember: You Are The Conductor, Not The Orchestra

**Your value = Coordination, not execution**

- Conducting 5 parallel agents = 5x productivity
- Reading 50 files yourself = context exhaustion
- **Delegate early, delegate often, delegate always**