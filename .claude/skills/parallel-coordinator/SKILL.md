---
name: parallel-coordinator
description: Coordinate 2-4 agents for Level 2 tasks (single feature, 1-8 hours, complexity 8-14). Triggered BY task-orchestrator or task-breakdown. Uses medium-sized batching (15-25min) with session checkpointing and pause/resume capability. Manages context sharing, prevents duplicate research, enables multi-day workflows. Supports /pause and /resume commands. NOT for Level 3 epics (use epic-orchestrator) or trivial tasks.
---

# Parallel Coordinator

## Overview

Orchestrate multiple specialized agents working concurrently or sequentially, ensuring efficient context sharing, preventing duplicate research, and maintaining quality through medium-sized task batching and frequent check-ins.

## Core Principle: Medium-Sized Batching

**Task sizing philosophy:**
- ❌ **Too small** (micro-tasks): Excessive overhead, context fragmentation
- ✅ **Medium** (15-25min chunks): Optimal balance of control and efficiency
- ❌ **Too large** (deep delegation): Loss of control, quality drift, late error detection

**Why medium-sized:**
- Sufficient scope for agent to demonstrate expertise
- Frequent enough check-ins to catch issues early
- Allows course correction without major rework
- Maintains main agent's situational awareness

## When to Use

Invoke this skill when:
- **Multiple agents planned**: 2+ specialized agents needed for a feature
- **Parallel execution potential**: Independent tasks can run concurrently
- **Context sharing critical**: Agents need to know what others discovered
- **Quality control needed**: Frequent validation points required
- **Coordination complexity**: Dependencies between agent outputs

**DO NOT use** when:
- Single agent handles entire task independently
- Tasks are purely sequential with no shared context
- Trivial coordination (user can track manually)
- Agents have no interdependencies

## Coordination Workflow

### Step 1: Analyze Parallelization Potential

Given a set of tasks (typically from `task-breakdown`), identify:

**Independence criteria:**
```
Task A || Task B (parallel) if:
✓ No shared files being modified
✓ No data dependencies (B doesn't need A's output)
✓ Different systems/domains
✓ Can validate independently

Task A → Task B (sequential) if:
✗ B needs A's output (API contract, type definitions)
✗ Shared file modifications (merge conflicts)
✗ Logical dependency (tests after implementation)
```

**Parallelization matrix:**
| Tasks | Backend API | Frontend UI | DB Migration | Tests | Docs |
|-------|-------------|-------------|--------------|-------|------|
| Backend API | - | ✓ (partial) | ✗ | ✗ | ✓ |
| Frontend UI | ✓ (partial) | - | ✓ | ✗ | ✓ |
| DB Migration | ✗ | ✓ | - | ✗ | ✓ |
| Tests | ✗ | ✗ | ✗ | - | ✓ |
| Docs | ✓ | ✓ | ✓ | ✓ | - |

✓ = Can run in parallel
✗ = Must be sequential
(partial) = Can overlap with coordination

### Step 2: Partition Shared Context

Agents run in **isolated contexts**—they don't see each other's work unless explicitly informed. Prevent duplicate research by:

**Context partitioning strategies:**

1. **Domain segmentation**: Assign non-overlapping file scopes
   ```
   Agent A: backend/app/api/*
   Agent B: frontend/src/components/*
   → No file overlap, minimal coordination needed
   ```

2. **Research pre-sharing**: Main agent does shared research ONCE, provides to all
   ```
   Main agent: "Current auth implementation uses JWT in auth.py:42"
   → Both backend and frontend agents receive this context
   → Prevents both agents from researching auth independently
   ```

3. **Artifact passing**: Sequential agents get predecessor outputs
   ```
   Backend agent outputs: API contract (Pydantic models)
   → Main agent extracts contract
   → Frontend agent receives: "Use this API contract: <models>"
   ```

4. **Conflict zones**: Identify shared files, assign ownership
   ```
   Shared: backend/app/models/user.py
   Strategy: Backend agent owns, frontend agent receives updates
   ```

### Step 3: Batch Tasks (Medium-Sized)

Break agent work into **medium-sized batches** (15-25min each):

**Batching heuristics:**

| Original Task | Batching Strategy |
|--------------|-------------------|
| "Implement full auth system" (90min) | Batch 1: Models & DB (20min)<br>Batch 2: Endpoints (25min)<br>Batch 3: Middleware (20min)<br>Batch 4: Tests (25min) |
| "Build dashboard UI" (60min) | Batch 1: Layout & routing (20min)<br>Batch 2: Data fetching (20min)<br>Batch 3: Components (20min) |
| "Add WebSocket support" (45min) | Batch 1: Server setup (20min)<br>Batch 2: Client integration (25min) |

**Batch boundaries:**
- Natural stopping points (endpoint complete, component renders)
- Independently testable units
- Clear acceptance criteria per batch

### Step 4: Launch Agents with Scoped Prompts

Delegate to agents using **scoped, context-aware prompts**:

**Prompt template:**
```markdown
**Batch**: [X of Y] - [Batch Name]
**Estimated Time**: [15-25min]
**Scope**: [Precisely what to implement]

**Context from previous work**:
- [Relevant findings from other agents or earlier batches]
- [Shared architectural decisions]
- [File paths and line numbers for integration points]

**Your task**:
1. [Specific deliverable 1]
2. [Specific deliverable 2]
3. [Specific deliverable 3]

**What NOT to do**:
- [Explicitly list out-of-scope items]
- [Areas another agent owns]

**Check-in criteria**:
- [How you'll verify this batch before next]

**Return**:
- Summary of changes (file:line format)
- Any blockers or questions for next batch
- Integration points for other agents
```

**Example:**
```markdown
**Batch**: 1 of 3 - Backend API Models

**Context from shared research**:
- Current User model at backend/app/models/user.py:12
- Using SQLAlchemy ORM with async sessions
- Frontend needs: user_id, email, created_at fields

**Your task**:
1. Add Notification model (user_id FK, message, read status, timestamp)
2. Add relationship to User model
3. Create Alembic migration

**What NOT to do**:
- Don't implement API endpoints (Batch 2)
- Don't touch frontend types (other agent)

**Check-in criteria**:
- Migration runs without errors
- Models pass mypy type checking

**Return**:
- Model schema for frontend agent
- Migration file path
```

### Step 5: Monitor Execution (Check-Ins)

Track progress with **frequent check-ins** between batches:

**Check-in workflow:**
```
Agent completes Batch 1
↓
Main agent validates output
├─ ✓ Meets acceptance criteria → Proceed to Batch 2
├─ ⚠ Minor issues → Quick fix, then Batch 2
└─ ✗ Major problems → Pause, reassess, adjust plan
```

**Validation checklist per batch:**
- [ ] Deliverables match specification
- [ ] Code quality (type hints, tests, no obvious bugs)
- [ ] Integration points documented
- [ ] No scope creep beyond batch boundaries
- [ ] Knowledge transfer to other agents if needed

**Red flags requiring intervention:**
- Agent exceeded batch time by >50%
- Output doesn't match prompt scope
- Quality degradation (missing types, no tests)
- Discovered blocking dependencies

### Step 6: Synchronize Agent Outputs

After each batch, **sync knowledge** across agents:

**Synchronization triggers:**
- Agent discovers architectural constraint (share with all)
- Agent modifies shared file (notify owners)
- Agent completes integration point (provide artifact to dependents)

**Sync mechanisms:**
1. **Broadcast updates**: "All agents: User model now has 'role' field"
2. **Targeted handoffs**: "Frontend agent: Here's the finalized API contract from backend"
3. **Conflict resolution**: "Both agents modified config.py—merging changes now"

**Example sync:**
```markdown
Agent A (backend) completed Batch 2: API endpoints

Sync to Frontend Agent:
- New endpoint: POST /api/notifications
- Request body: { message: string }
- Response: { id: number, created_at: string }
- Available at: backend/app/api/notifications.py:28

Frontend Agent Batch 2 updated scope:
- Use above endpoint (don't create your own mock)
- TypeScript types provided below: <contract>
```

### Step 7: Handle Dependencies & Blockers

When agents encounter blockers:

**Blocker types:**

1. **Hard dependency**: Agent B needs Agent A's output
   ```
   Solution: Pause B, prioritize completing A's batch, resume B
   ```

2. **Clarification needed**: Ambiguous requirement
   ```
   Solution: Main agent makes decision, broadcasts to all agents
   ```

3. **Technical issue**: Unexpected error or constraint
   ```
   Solution: Main agent investigates, provides workaround or pivots plan
   ```

4. **Scope conflict**: Two agents trying to do overlapping work
   ```
   Solution: Reassign ownership, cancel duplicate effort
   ```

**Blocker handling workflow:**
```
Agent reports blocker
↓
Main agent assesses severity
├─ Critical → Pause all, resolve immediately
├─ Moderate → Adjust batching, shift priorities
└─ Minor → Agent continues, resolve in next batch
```

## Parallelization Patterns

### Pattern 1: Full Parallel (Independent Domains)
```
Backend Agent (FastAPI)  ║  Frontend Agent (React)
   Batch 1: Models       ║     Batch 1: Layout
   Batch 2: Endpoints    ║     Batch 2: Components
   Batch 3: Tests        ║     Batch 3: Integration
                    ↓
            Sync & Integrate
```

### Pattern 2: Pipeline (Sequential with Handoffs)
```
Backend Agent          Frontend Agent        Testing Agent
Batch 1: API models →  Wait                  Wait
Batch 2: Endpoints  →  Batch 1: Types     →  Wait
Batch 3: Complete   →  Batch 2: UI        →  Batch 1: E2E tests
```

### Pattern 3: Hybrid (Parallel + Sync Points)
```
Backend ║ Frontend
Batch 1 ║ Batch 1 (parallel)
   ↓         ↓
  SYNC (share API contract)
   ↓         ↓
Batch 2 ║ Batch 2 (parallel, using contract)
   ↓         ↓
  SYNC (integration testing)
```

## Quality Control

**Maintain high output quality through:**

1. **Frequent validation**: After every batch (not just at end)
2. **Clear acceptance criteria**: Each batch has pass/fail tests
3. **Scope enforcement**: Agents stay within batch boundaries
4. **Knowledge capture**: Document decisions made during execution
5. **Integration testing**: Validate agent outputs work together

**Quality metrics:**
- Batch completion rate (target: >90% first-try acceptance)
- Rework percentage (target: <10% of batches need redo)
- Integration issues (target: <1 per feature)

## Session Continuity & Checkpointing

Enable pause/resume workflow for long-running or multi-day coordination:

### Session State Management

Track coordination state in `.artifacts/` session directory:

```
.artifacts/{feature-name}/
└── {timestamp}/
    ├── context.json (session metadata)
    ├── coordination-state.json (NEW: checkpoint data)
    ├── batch-progress.json (NEW: batch-level tracking)
    └── agent-reports/
```

**coordination-state.json structure:**
```json
{
  "status": "in_progress",
  "current_phase": "Phase 2",
  "active_batches": [
    {
      "agent": "fastapi-backend-expert",
      "batch_id": "batch-2",
      "status": "in_progress",
      "started_at": "2024-01-24T10:30:00Z"
    }
  ],
  "completed_batches": [
    {
      "agent": "fastapi-backend-expert",
      "batch_id": "batch-1",
      "status": "completed",
      "output": ".artifacts/feature/ts/agent-reports/backend-batch1.md"
    }
  ],
  "pending_batches": [...],
  "sync_points": {
    "api_contract_sync": {
      "status": "completed",
      "artifacts": ["backend/models/user.py"]
    }
  },
  "last_checkpoint": "2024-01-24T10:45:00Z"
}
```

### Checkpointing (/pause)

When user requests pause OR end of work day:

**Command:** `/pause` or "зупини роботу"

**Actions:**
1. **Finish active batch** (don't interrupt mid-work)
   ```
   Wait for current batch completion
   ├─ If batch nearly done → wait
   ├─ If batch just started → mark as pending, stop
   └─ If blocker encountered → document blocker
   ```

2. **Save coordination state**
   ```python
   coordination_state = {
       "status": "paused",
       "current_phase": "Phase 2 - Core Implementation",
       "last_completed_batch": "backend-batch-2",
       "next_pending_batch": "frontend-batch-1",
       "blockers": [],
       "context_notes": "API contract synced, ready for frontend work"
   }
   save_json(session_dir / "coordination-state.json", coordination_state)
   ```

3. **Create checkpoint summary**
   ```markdown
   # Session Checkpoint - {timestamp}

   ## Progress
   ✅ Completed: 3 batches (backend models, API endpoints, tests)
   🔄 Current: None (paused cleanly)
   ⏳ Pending: 2 batches (frontend UI, integration)

   ## Ready for Resume
   - API contract synced: backend/models/user.py
   - Tests passing: 12/12
   - Next: Frontend agent, Batch 1 (UI components)

   ## Context Notes
   - JWT implementation uses httpOnly cookies
   - User.role field added (enum: admin/user/guest)

   ## Resume Command
   /resume @.artifacts/profile-editing/{timestamp}
   ```

4. **Output to user**
   ```
   ✅ Session paused successfully

   Progress saved:
   - 3 batches completed
   - 2 batches pending

   To resume:
   /resume @.artifacts/profile-editing/20240124_103000

   OR (in new conversation):
   "продовжуємо @.artifacts/profile-editing/"
   ```

### Resumption (/resume)

When user requests resume:

**Command:** `/resume @.artifacts/{feature}/{timestamp}`

**Actions:**

1. **Load coordination state**
   ```python
   state = load_json(session_dir / "coordination-state.json")
   batch_progress = load_json(session_dir / "batch-progress.json")
   ```

2. **Restore context**
   ```
   Read checkpoint summary
   ├─ Completed batches → Skip
   ├─ Active batch → Check if partial work exists
   └─ Pending batches → Queue for execution
   ```

3. **Display resume info**
   ```markdown
   🔄 Resuming session: profile-editing/20240124_103000

   ## Previous Progress
   ✅ Completed (3):
      - Backend models (batch-1)
      - API endpoints (batch-2)
      - Unit tests (batch-3)

   ## Continuing From
   📍 Next: Frontend UI (batch-4)

   ## Context Loaded
   - API contract: backend/models/user.py
   - Authentication: JWT with httpOnly cookies
   - Database: User.role field added

   Ready to continue. Launching frontend agent...
   ```

4. **Continue orchestration**
   ```
   Pick up from next pending batch
   ├─ Use same session directory
   ├─ Append new agent reports
   └─ Update batch-progress.json
   ```

### Incremental Artifact Management

For Level 2+ orchestrations, use incremental reports:

**Instead of:**
```
summary.md (created at end, 1500 words)
```

**Use:**
```
.artifacts/{feature}/{timestamp}/
├── checkpoint-summary.md (updated after each pause)
├── phase-summaries/
│   ├── phase-1-foundation.md (after Phase 1)
│   ├── phase-2-implementation.md (after Phase 2)
│   └── ...
└── final-summary.md (aggregated at end)
```

**Benefits:**
- Progress visible at any checkpoint
- Team can review partial work
- Easier to resume (clear where you stopped)
- No loss of context if interrupted

### Multi-Day Workflow Example

**Day 1 (2 hours):**
```bash
# Morning: Start feature
User: "Implement user profile editing"
→ Level 2 orchestration
→ Phase 1: Backend (2 batches completed)
→ End of work: /pause

Output: checkpoint-summary.md (300 words)
```

**Day 2 (3 hours):**
```bash
# Morning: Resume
User: /resume @.artifacts/profile-editing/
→ Load state, continue Phase 2
→ Frontend agent (3 batches)
→ Integration testing
→ End of work: /pause

Output: Updated checkpoint-summary.md (600 words total)
```

**Day 3 (1 hour):**
```bash
# Morning: Final push
User: /resume @.artifacts/profile-editing/
→ Final validation
→ Aggregate all reports
→ Create final-summary.md

Output: final-summary.md (1200 words, comprehensive)
```

### State Persistence Guidelines

**Always save state after:**
- ✅ Batch completion
- ✅ Sync point reached
- ✅ Blocker encountered
- ✅ User requests pause

**Never save state during:**
- ❌ Mid-batch execution (wait for completion)
- ❌ Agent actively running (let finish)

**Checkpoint includes:**
- ✅ Completed work references (file:line)
- ✅ Context notes (decisions made)
- ✅ Integration artifacts (API contracts)
- ✅ Next steps (clear resume point)
- ❌ NOT full code diffs (too large)

## Anti-Patterns

- **Fire-and-forget delegation**: No check-ins until all agents done
- **Micro-management**: Batches <10 minutes, excessive overhead
- **Deep delegation**: >45min batches, lose control
- **Context silos**: Agents rediscover what others already found
- **Scope creep**: Agents expand beyond batch boundaries
- **Late integration**: Discover incompatibilities only at end

## Examples

### Example 1: Full-Stack Feature (Parallel)
**Feature**: Real-time notifications

**Coordination plan:**
```
Phase 1 (Parallel):
├─ Backend Agent: WebSocket server + models (Batch 1: 20min)
└─ Frontend Agent: Notification UI component (Batch 1: 20min)

Check-in: Validate models schema, share with frontend

Phase 2 (Parallel with sync):
├─ Backend Agent: Notification sending logic (Batch 2: 25min)
└─ Frontend Agent: WebSocket client (Batch 2: 20min)

Sync: Provide WebSocket message contract

Phase 3 (Sequential):
Testing Agent: E2E notification flow (Batch 1: 25min)
```

**Context sharing:**
- Main agent researches existing WebSocket setup ONCE
- Backend agent gets: "WebSocket server config at backend/app/websocket.py"
- Frontend agent gets: "Connect to ws://localhost:8000/ws"

### Example 2: Sequential Pipeline
**Feature**: OAuth2 authentication

**Coordination plan:**
```
Batch 1: Backend Agent - Pydantic models (20min)
  ↓ Output: Token model schema
Batch 2: Backend Agent - Auth endpoints (25min)
  ↓ Output: API contract
Batch 3: Frontend Agent - Login form (20min, uses contract)
  ↓ Output: Working login UI
Batch 4: Testing Agent - Auth flow tests (20min)
```

**Handoffs:**
- Batch 1→2: Internal backend, no handoff needed
- Batch 2→3: Main agent extracts API contract, provides to frontend
- Batch 3→4: Frontend completion triggers testing

### Example 3: Blocker Handling
**Scenario**: Frontend agent discovers API endpoint missing

**Handling:**
```
Batch 2 in progress: Frontend building user profile page
↓
Frontend Agent: "Blocker - no GET /users/{id} endpoint found"
↓
Main agent validates: True, backend missed this
↓
Decision: Pause frontend Batch 2, add backend micro-batch
↓
Backend Agent: Emergency Batch 2.5 - Add GET /users/{id} (15min)
↓
Sync: Provide endpoint details to frontend
↓
Frontend Agent: Resume Batch 2 with endpoint available
```

## Integration with Other Skills

- **task-breakdown**: Provides initial task list for coordination
- **agent-selector**: Assigns agents to batches
- **artifact-aggregator**: Collects final outputs after all batches
- **task-orchestrator**: Uses this skill for agent execution phase

## Notes

- Isolated agent contexts prevent automatic knowledge sharing
- Medium-sized batching (15-25min) balances control and efficiency
- Frequent check-ins enable early error detection and course correction
- Context pre-sharing by main agent eliminates duplicate research
- Quality maintained through batch validation, not just final review