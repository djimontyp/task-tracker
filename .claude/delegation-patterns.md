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
✅ DO: Task(subagent_type=Plan) → fastapi-backend-expert + react-frontend-architect
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

## Quick Reference: Delegation Cheatsheet

### Common User Requests → Correct Response

| User Says                 | ❌ DON'T                   | ✅ DO                                           |
|---------------------------|---------------------------|------------------------------------------------|
| "What's in TODO?"         | Read NEXT_SESSION_TODO.md | `Task(subagent_type=Explore)`                  |
| "Where is X implemented?" | Grep/Read files           | `Task(subagent_type=Explore)`                  |
| "Add feature Y"           | Start coding              | `Task(subagent_type=Plan)` → specialized agent |
| "Fix bug Z"               | Debug directly            | `task-breakdown` → specialist                  |
| "How does X work?"        | Read multiple files       | `Task(subagent_type=Explore)`                  |
| "Review this code"        | Read and review           | `architecture-guardian` agent                  |
| "Optimize performance"    | Profile and fix           | Specialist agent (database/vector/llm)         |
| "Add tests"               | Write tests               | `pytest-test-master` agent                     |
| "Update docs"             | Edit docs                 | `documentation-expert` agent                   |

### Agent Quick Reference

- **Exploration**: `Task(subagent_type=Explore, thoroughness="medium")`
- **Planning**: `Task(subagent_type=Plan)`
- **Backend**: `fastapi-backend-expert`
- **Frontend**: `react-frontend-architect`
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
