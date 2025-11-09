# Delegation Patterns

> **Context**: Every direct action (Read, Grep, Glob) consumes precious context tokens. Delegation to specialized agents preserves context and multiplies capabilities.

---

## Delegation Decision Tree

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
│  └─ YES → session-manager or task-breakdown
│
├─ Is it planning/design?
│  └─ YES → Task(subagent_type=Plan)
│
└─ Is it simple coordination?
   └─ YES → Use TodoWrite + delegate subtasks
```

---

## Red Flags (STOP and DELEGATE)

If you find yourself about to:
- 🚫 Use `Grep` to search code → Use `Task(subagent_type=Explore)`
- 🚫 Use `Read` on multiple files → Use appropriate specialist agent
- 🚫 Use `Glob` to find files → Use `Task(subagent_type=Explore)`
- 🚫 Write implementation code → Use domain specialist agent
- 🚫 Debug complex issues → Use domain specialist agent
- 🚫 Research API documentation → Use `Task(subagent_type=Explore)`

**Your instinct to "just quickly check" = RED FLAG = DELEGATE**

---

## Delegation Patterns

### Pattern 1: Unknown Territory
```
User: "Where do we handle WebSocket connections?"
❌ DON'T: Grep for websocket, read files
✅ DO: Task(subagent_type=Explore, prompt="Find WebSocket connection handling...")
```

### Pattern 2: Feature Implementation
```
User: "Add user authentication"
❌ DON'T: Start reading/writing code
✅ DO: Task(subagent_type=Plan) → fastapi-backend-expert + react-frontend-expert
```

### Pattern 3: Bug Fix
```
User: "Fix the database connection timeout"
❌ DON'T: Debug directly
✅ DO: task-breakdown → database-reliability-engineer
```

### Pattern 4: Multi-Domain Task
```
User: "Add real-time notifications"
❌ DON'T: Try to handle everything
✅ DO: session-manager or task-breakdown → coordinate specialists
```

---

## Example: Successful Delegation with Result Handling

**ВАЖЛИВО:** Після кожного Task tool виконання координатор ОБОВ'ЯЗКОВО обробляє результат.

### Scenario 1: Backend Implementation

**User Request:**
```
User: "Create authentication API with JWT"
```

**Coordinator Response:**
```
Координатор: Делегую backend implementation → fastapi-backend-expert

[Task tool call...]
```

**Agent Output (Task tool result):**
```
✅ Authentication API implemented

**Changes:**
- POST /api/v1/auth/login (JWT token generation)
- POST /api/v1/auth/register (user creation)
- Middleware for protected routes

**Files:** backend/app/api/v1/auth.py, backend/app/middleware/auth.py

**Status:** Complete
```

**Coordinator Next Step:**
```
Координатор: ✅ Backend ready. Переходжу до frontend integration.

[TodoWrite: mark backend task complete, create frontend task]
[Delegate to react-frontend-expert...]
```

### Scenario 2: Blocked Task

**User Request:**
```
User: "Fix database slow queries"
```

**Coordinator Response:**
```
Координатор: Делегую database optimization → database-reliability-engineer

[Task tool call...]
```

**Agent Output (Task tool result):**
```
✅ Database performance analysis complete

**Changes:**
- Identified N+1 query in Message loading
- Missing index on foreign key

**Files:** backend/app/services/message_service.py:45

**Status:** Blocked - Need approval to add index (will lock table for 2 minutes on 1M rows)
```

**Coordinator Next Step:**
```
Координатор: ⚠️ Database optimization blocked.

[AskUserQuestion: "Database index creation will lock table for 2 minutes. Proceed?"]
```

### Scenario 3: Partial Results

**User Request:**
```
User: "Find all WebSocket-related code"
```

**Coordinator Response:**
```
Координатор: Досліджую WebSocket код через Explore agent

[Task(subagent_type=Explore)...]
```

**Agent Output (Task tool result):**
```
✅ WebSocket code locations identified

**Changes:**
- Backend: backend/app/websocket.py (connection handling)
- Frontend: frontend/src/hooks/useWebSocket.ts (client implementation)
- Shared types: backend/app/schemas/websocket.py

**Files:** backend/app/websocket.py, frontend/src/hooks/useWebSocket.ts, backend/app/schemas/websocket.py

**Status:** Complete
```

**Coordinator Next Step:**
```
Координатор: ✅ WebSocket код знайдено в 3 файлах:
- Backend connection: backend/app/websocket.py
- Frontend hook: frontend/src/hooks/useWebSocket.ts
- Shared types: backend/app/schemas/websocket.py

Що саме потрібно зробити з цим кодом?
```

**Key Insight:** Координатор не просто передає результат, а **summарує та запитує наступні кроки**.

---

## Quick Reference: Delegation Cheatsheet

### Common User Requests → Correct Response

| User Says                 | ❌ DON'T                   | ✅ DO                                           |
|---------------------------|---------------------------|------------------------------------------------|
| "What's in TODO?"         | Read NEXT_SESSION_TODO.md | `Task(subagent_type=Explore)`                  |
| "Where is X implemented?" | Grep/Read files           | `Task(subagent_type=Explore)`                  |
| "Add feature Y"           | Start coding              | `Task(subagent_type=Plan)` → specialized agent |
| "Fix bug Z"               | Debug directly            | `task-breakdown` → specialist                  |
| "How does X work?"        | Read multiple files       | `Task(subagent_type=Explore)`                  |
| "Review this code"        | Read and review           | `code-reviewer` agent                          |
| "Optimize performance"    | Profile and fix           | Specialist agent (database/vector/llm)         |
| "Add tests"               | Write tests               | `pytest-test-master` agent                     |
| "Update docs"             | Edit docs                 | `documentation-expert` agent                   |

### Agent Quick Reference

- **Exploration**: `Task(subagent_type=Explore, thoroughness="medium")`
- **Planning**: `Task(subagent_type=Plan)`
- **Backend**: `fastapi-backend-expert`
- **Frontend**: `react-frontend-expert`
- **Database**: `database-reliability-engineer`
- **LLM/Prompts**: `llm-prompt-engineer`
- **Cost**: `llm-cost-optimizer`
- **Tests**: `pytest-test-master`
- **Docs**: `documentation-expert`
- **Session**: `session-manager` (pause/resume workflow)

### Skills Quick Reference

- **Task Analysis**: `task-breakdown` (assess complexity)
- **Session Management**: `session-manager` (pause/resume/auto-save)
- **Planning**: `Task(subagent_type=Plan)`
- **Git**: `smart-commit` skill
- **Documentation**: `sync-docs-structure` skill
- **Database**: `migration-database` skill
- **Agent Coordination**: `agent-coordinator` (marker-based resume)

---

## Marker-Based Agent Coordination

**Purpose:** Track subagent delegations with resume capability for blocker workflows, parallel coordination, and multi-session work.

**Core Mechanism:** Unique markers (`agent-{8hex}`) → PostToolUse hook captures agentId → Resume with full context preservation.

### When to Use Marker-Based Coordination

Use markers when:
- **Blocker workflows** - Agent blocked, needs another agent to fix, then resume
- **Parallel tracking** - 5+ agents simultaneously, need to track which is which
- **Multi-session work** - Pause agent, fix blocker hours/days later, resume with context
- **Iterative refinement** - Agent does partial work, you review, resume for adjustments

**Do NOT use markers for:**
- Simple one-off delegations with no resume needs
- Fire-and-forget tasks with no dependencies

### Pattern 5: Blocker Workflow with Resume

**Scenario:** Frontend agent blocked on missing backend API

```python
import uuid

# Step 1: Delegate frontend
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="react-frontend-expert",
    description=f"[{marker_fe}] Build login UI",
    prompt="Create login form with email/password, call POST /api/auth/login"
)

# Frontend returns: Status: Blocked - API endpoint missing

# Step 2: Capture frontend agentId
fe_agentId = Read(f".artifacts/coordination/{marker_fe}.txt").strip()

# Step 3: Delegate backend fix
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker_be}] Create login API",
    prompt="Implement POST /api/auth/login endpoint"
)

# Backend returns: Status: Complete

# Step 4: Resume frontend with full context
Task(
    resume=fe_agentId,
    description=f"[{marker_fe}] Resume: API ready",
    prompt="Backend API now available. Complete form integration."
)

# Frontend resumes with:
# - Remembers UI components created
# - Remembers validation logic implemented
# - Continues from where it left off
```

**Key Benefit:** Frontend agent doesn't start from scratch - all context preserved.

### Pattern 6: Parallel Agent Coordination

**Scenario:** Launch 5 agents, track separately, resume if blocked

```python
import uuid

# Launch 5 parallel agents with markers
markers = {}

tasks = [
    ("backend", "fastapi-backend-expert", "Create API endpoints"),
    ("frontend", "react-frontend-expert", "Build UI components"),
    ("database", "database-reliability-engineer", "Schema design"),
    ("tests", "pytest-test-master", "E2E test suite"),
    ("docs", "documentation-expert", "API documentation")
]

# Delegate all in parallel
for name, agent_type, task_desc in tasks:
    marker = f"agent-{uuid.uuid4().hex[:8]}"
    markers[name] = marker

    Task(
        subagent_type=agent_type,
        description=f"[{marker}] {task_desc}",
        prompt=f"Complete {task_desc} for authentication feature"
    )

# After all complete, check status
for name, marker in markers.items():
    agentId = Read(f".artifacts/coordination/{marker}.txt").strip()
    metadata = Read(f".artifacts/coordination/{marker}.json")
    print(f"{name}: {agentId} - {metadata['status']}")

# Resume any blocked agents after fixing blockers
if metadata['status'] == 'blocked':
    Task(
        resume=agentId,
        description=f"[{marker}] Resume: Blocker fixed",
        prompt="Continue work, blocker resolved"
    )
```

**Key Benefit:** No context mixing - each agent tracked separately, resume with correct context.

### Pattern 7: Multi-Step Feature Pipeline

**Scenario:** Spec → Architecture → Parallel Implementation with blocker handling

```python
import uuid

# Step 1: Spec (optional marker if might need resume)
marker_spec = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="product-designer",
    description=f"[{marker_spec}] Auth feature spec",
    prompt="Document requirements for user authentication"
)

# Step 2: Architecture
marker_arch = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="Plan",
    description=f"[{marker_arch}] Auth architecture",
    prompt="Design authentication system architecture based on spec"
)

# Step 3: Parallel implementation
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"

Task(subagent_type="fastapi-backend-expert",
     description=f"[{marker_be}] Backend auth",
     prompt="Implement backend per architecture")

Task(subagent_type="react-frontend-expert",
     description=f"[{marker_fe}] Frontend auth",
     prompt="Implement frontend per architecture")

# If frontend blocks on backend:
# 1. Capture fe_agentId from marker_fe
# 2. Resume frontend after backend completes
```

### Marker Best Practices

**Generation:**
```python
import uuid
marker = f"agent-{uuid.uuid4().hex[:8]}"  # ✅ Unique every time
```

**Description Format:**
```python
description = f"[{marker}] Task name"  # ✅ Correct - hook extracts this
description = f"{marker} Task name"    # ❌ Wrong - missing brackets
```

**AgentId Retrieval:**
```python
# After delegation completes
agentId = Read(f".artifacts/coordination/{marker}.txt").strip()

# Verify before resume
if agentId:
    Task(resume=agentId, ...)
```

**Storage:**
- `.artifacts/coordination/{marker}.txt` - Plain agentId
- `.artifacts/coordination/{marker}.json` - Metadata (status, timestamp, description)
- `.artifacts/coordination/agent-sessions.json` - Audit trail

### Common Mistakes

**❌ Reusing markers:**
```python
marker = "agent-abc12345"  # Static
Task(..., description=f"[{marker}] Task 1")
Task(..., description=f"[{marker}] Task 2")  # ❌ Same marker - collision
```

**✅ Always generate fresh:**
```python
marker1 = f"agent-{uuid.uuid4().hex[:8]}"  # Unique
marker2 = f"agent-{uuid.uuid4().hex[:8]}"  # Different
```

**❌ Wrong pattern:**
```python
description = f"agent-abc12345 Task name"  # Missing brackets
```

**✅ Correct pattern:**
```python
description = f"[agent-abc12345] Task name"  # ✅ Hook finds this
```

### Detailed Documentation

See `.claude/skills/agent-coordinator/SKILL.md` for:
- Full hook integration details
- Troubleshooting guide
- Advanced patterns (session-safe coordination, cleanup)
- Metadata schema

---

## Remember

**Your value = Coordination, not execution**

- Conducting 5 parallel agents = 5x productivity
- Reading 50 files yourself = context exhaustion
- **Delegate early, delegate often, delegate always**
