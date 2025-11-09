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

---

## Remember

**Your value = Coordination, not execution**

- Conducting 5 parallel agents = 5x productivity
- Reading 50 files yourself = context exhaustion
- **Delegate early, delegate often, delegate always**
