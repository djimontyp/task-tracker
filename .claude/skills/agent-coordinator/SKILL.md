---
name: agent-coordinator
description: Manage subagent delegation with automatic agentId tracking for resume capability. Use this skill when delegating tasks to subagents that may need to be resumed later (blocker workflows, multi-step tasks, parallel coordination). The skill generates unique markers, tracks agentId mappings via PostToolUse hook, and enables context-preserving resume across sessions.
---

# Agent Coordinator

## Overview

Manage subagent delegation with automatic tracking for resume capability. The skill solves the problem of losing agent context when blockers occur or tasks span multiple sessions.

**Core mechanism:** Generates unique markers (`agent-{8hex}`), includes them in Task descriptions, captures agentId via PostToolUse hook, enables resume with full context preservation.

## When to Use This Skill

Trigger this skill when:
- Delegating tasks that may encounter blockers (e.g., frontend needs backend API)
- Coordinating multiple dependent agents (workflow chains)
- Managing parallel agent execution (5+ simultaneous subagents)
- Resuming previous agent work after fixing blockers
- Tracking which agentId belongs to which delegated task

**Do NOT use for:**
- Simple one-off delegations with no resume needs
- Fire-and-forget tasks with no dependencies

## How to Use

**Step 1: Generate marker**
```bash
marker=$(uv run .claude/skills/agent-coordinator/scripts/generate_marker.py)
```

**Step 2: Delegate with marker in Task description**
```python
Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker}] Create authentication API",
    prompt="Implement POST /login endpoint with JWT..."
)
```

**Step 3: Resume later (if needed)**
```python
# Retrieve agentId from marker
agentId = Read(f".artifacts/coordination/{marker}.txt").strip()

# Resume with full context
Task(
    subagent_type="fastapi-backend-expert",
    resume=agentId,
    description=f"[{marker}] Continue auth work",
    prompt="Add refresh token support..."
)
```

## Quick Start (Alternative: Inline Python)

Generate marker directly in Python if needed:

```python
import uuid

# Generate marker
marker = f"agent-{uuid.uuid4().hex[:8]}"

# Delegate with marker in description
Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker}] Create authentication API",
    prompt="Implement POST /login endpoint with JWT..."
)

# After completion, retrieve agentId
agentId = Read(f".artifacts/coordination/{marker}.txt").strip()

# Resume if needed
Task(
    subagent_type="fastapi-backend-expert",
    resume=agentId,
    description=f"[{marker}] Continue auth work",
    prompt="Add refresh token support..."
)
```

## Core Operations

### 1. Delegate Task with Tracking

**Purpose:** Start a new subagent task with automatic agentId capture.

**Process:**
1. Generate unique marker: `marker = f"agent-{uuid.uuid4().hex[:8]}"`
2. Include marker in description: `description=f"[{marker}] Task name"`
3. Delegate via Task tool
4. Hook automatically captures agentId → `.artifacts/coordination/{marker}.txt`
5. Read agentId when needed

**Example:**

```python
import uuid

# Frontend delegation
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"

Task(
    subagent_type="React Frontend Expert (F1)",
    description=f"[{marker_fe}] Build login UI",
    prompt="Create login form with email/password fields, validation, submit button..."
)

# Store marker for later
# (In practice, coordinator remembers markers in conversation context)
```

**Output:**
- Marker file created: `.artifacts/coordination/{marker}.txt` contains agentId
- Session log updated: `.artifacts/coordination/agent-sessions.json`
- Tracking log: `.artifacts/coordination/agent-tracking.log`

### 2. Resume Agent

**Purpose:** Continue previous agent's work with full context preservation.

**When to use:**
- Blocker was fixed by another agent
- Adding to previous agent's work
- Iterative refinement across sessions

**Process:**
1. Retrieve agentId from marker
2. Call Task with `resume` parameter
3. Optionally use same marker for continuity

**Example:**

```python
# Retrieve agentId from marker
marker_fe = "agent-abc12345"  # From previous delegation
agentId = Read(f".artifacts/coordination/{marker_fe}.txt").strip()

# Resume with context
Task(
    subagent_type="React Frontend Expert (F1)",
    resume=agentId,
    description=f"[{marker_fe}] Resume: Backend API ready",
    prompt="Backend /login API is now available. Complete form integration..."
)
```

**Context preserved:**
- All previous file reads
- Previous analysis and findings
- Conversation history
- Partial work completed

### 3. Check Status

**Purpose:** View all tracked agents and their markers.

**Process:**
1. List marker files
2. Read agentIds
3. Check metadata

**Example:**

```python
# List all tracked agents
markers = Glob(".artifacts/coordination/agent-*.txt")

# For each marker, show status
for marker_file in markers:
    marker = marker_file.split('/')[-1].replace('.txt', '')
    agentId = Read(marker_file).strip()

    # Optionally read metadata
    metadata = Read(f".artifacts/coordination/{marker}.json")
    print(f"{marker}: {agentId}")
```

**Output structure:**
```
agent-abc12345: f3a2b1c4 (fastapi-backend-expert) - completed
agent-def67890: 9a8b7c6d (React Frontend Expert (F1)) - completed
```

## Blocker Workflow Patterns

### Pattern 1: Frontend Blocked → Backend Fix → Resume

**Scenario:** Frontend agent needs backend API that doesn't exist yet.

**Workflow:**

```python
import uuid

# Step 1: Delegate frontend
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="React Frontend Expert (F1)",
    description=f"[{marker_fe}] Build login UI",
    prompt="Create login form..."
)

# Frontend returns: Status: Blocked - POST /login API missing

# Step 2: Store frontend agentId
fe_agentId = Read(f".artifacts/coordination/{marker_fe}.txt").strip()

# Step 3: Delegate backend fix
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker_be}] Create login API",
    prompt="Implement POST /login endpoint..."
)

# Backend returns: Status: Complete

# Step 4: Resume frontend with context
Task(
    resume=fe_agentId,
    description=f"[{marker_fe}] Resume: API ready",
    prompt="Backend POST /login API created. Complete form integration."
)
```

**Key benefit:** Frontend agent resumes with all context about UI components, partial work, research done.

### Pattern 2: Database Approval → Resume After Fix

**Scenario:** Database agent needs user approval for migration.

**Workflow:**

```python
# Step 1: Delegate database work
marker_db = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="Database Engineer (D1)",
    description=f"[{marker_db}] Add user table index",
    prompt="Create index on users.email for faster lookups"
)

# Returns: Status: Blocked - Migration locks table 2 minutes

# Step 2: Get approval
AskUserQuestion("Migration will lock table for 2min. Approve?")
# User approves

# Step 3: Resume database agent
db_agentId = Read(f".artifacts/coordination/{marker_db}.txt").strip()
Task(
    resume=db_agentId,
    description=f"[{marker_db}] Resume: Approved",
    prompt="User approved downtime. Apply migration."
)
```

### Pattern 3: Multi-Step Feature Pipeline

**Scenario:** Spec → Architecture → Implementation chain.

**Workflow:**

```python
# Step 1: Spec
marker_spec = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="Product Designer (P2)",
    description=f"[{marker_spec}] Auth feature spec",
    prompt="Document requirements for user authentication..."
)

# Step 2: Architecture (uses spec context)
marker_arch = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="Plan",
    description=f"[{marker_arch}] Auth architecture",
    prompt="Design authentication system architecture based on spec"
)

# Step 3: Parallel implementation
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"

Task(subagent_type="fastapi-backend-expert", description=f"[{marker_be}] Backend auth", ...)
Task(subagent_type="React Frontend Expert (F1)", description=f"[{marker_fe}] Frontend auth", ...)

# If either blocks, resume with fix
```

### Pattern 4: Agent Requests Cross-Domain Context

**Scenario:** Product Designer needs technical context from backend/frontend experts to complete strategic spec.

**Workflow:**

```python
import uuid

# Step 1: Delegate Product Designer
marker_pd = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="Product Designer (P2)",
    description=f"[{marker_pd}] Auth feature spec",
    prompt="Create product spec for authentication feature"
)

# Product Designer returns:
# Status: Blocked
# Domain: Backend + Frontend
# Required: "Current auth patterns, API design, state management"

# Step 2: Store Product Designer agentId
pd_agentId = Read(f".artifacts/coordination/{marker_pd}.txt").strip()

# Step 3: Gather context from specialists
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker_be}] Survey backend auth patterns",
    prompt="Document current backend auth approach for product spec context"
)

marker_fe = f"agent-{uuid.uuid4().hex[:8]}"
Task(
    subagent_type="React Frontend Expert (F1)",
    description=f"[{marker_fe}] Survey frontend auth patterns",
    prompt="Document current frontend auth approach for product spec context"
)

# Step 4: Resume Product Designer with gathered context
Task(
    resume=pd_agentId,
    description=f"[{marker_pd}] Resume: Technical context ready",
    prompt="""
    Technical context from specialists:

    **Backend:** JWT tokens via POST /login, bcrypt hashing
    **Frontend:** Zustand authStore, protected routes, axios client

    Complete product spec with this technical context.
    """
)
```

**Key benefit:** Agent doesn't waste context reading cross-domain files. Coordinator orchestrates specialists, agent gets curated context via resume.

## Advanced Usage

### Parallel Agent Coordination

**Managing 5+ simultaneous agents:**

```python
import uuid

# Launch 5 parallel agents
markers = {}

tasks = [
    ("backend", "fastapi-backend-expert", "Create API endpoints"),
    ("frontend", "React Frontend Expert (F1)", "Build UI components"),
    ("database", "Database Engineer (D1)", "Schema design"),
    ("tests", "Pytest Master (T1)", "E2E test suite"),
    ("docs", "Docs Expert (D2)", "API documentation")
]

for name, agent_type, task_desc in tasks:
    marker = f"agent-{uuid.uuid4().hex[:8]}"
    markers[name] = marker

    Task(
        subagent_type=agent_type,
        description=f"[{marker}] {task_desc}",
        prompt=f"Complete {task_desc} for authentication feature"
    )

# After completion, check which completed vs blocked
for name, marker in markers.items():
    agentId = Read(f".artifacts/coordination/{marker}.txt").strip()
    metadata = Read(f".artifacts/coordination/{marker}.json")
    print(f"{name}: {agentId} - {metadata['status']}")

# Resume any blocked agents after fixing blockers
```

### Session-Safe Coordination

**The marker system is session-safe:**
- Multiple coordinator sessions can run simultaneously
- Each generates unique markers
- No race conditions or ID collisions
- Markers persist across coordinator restarts

### Cleanup

**After resume or task completion:**

```bash
# Optional: Clean up marker files
rm .artifacts/coordination/{marker}.txt
rm .artifacts/coordination/{marker}.json
```

**Session log cleanup:**
- `.artifacts/coordination/agent-sessions.json` - auto-grows, safe to truncate periodically
- `.artifacts/coordination/agent-tracking.log` - auto-grows, safe to rotate

## Technical Details

### Marker Format

- Pattern: `agent-{8 hex chars}`
- Example: `agent-a3f4b2c1`
- Generated: `uuid.uuid4().hex[:8]`
- Extracted by hook: `grep -oE 'agent-[a-f0-9]{8}'`

### Hook Integration

**PostToolUse hook** (`.claude/hooks/capture-subagent-id.sh`):
1. Triggers after every Task tool execution
2. Extracts marker from description
3. Captures agentId from `tool_response.agentId`
4. Writes mapping: `.artifacts/coordination/{marker}.txt`
5. Logs to audit trail

### Storage Structure

```
.artifacts/coordination/
├── agent-abc12345.txt          # Marker → agentId (plain text)
├── agent-abc12345.json         # Structured metadata
├── agent-def67890.txt
├── agent-def67890.json
├── agent-sessions.json         # All sessions log (backward compat)
└── agent-tracking.log          # Human-readable audit trail
```

### Metadata Schema

**File:** `.artifacts/coordination/{marker}.json`

```json
{
  "marker": "agent-abc12345",
  "agentId": "f3a2b1c4",
  "subagentType": "fastapi-backend-expert",
  "description": "[agent-abc12345] Create authentication API",
  "completedAt": "2025-11-09T19:30:00Z",
  "status": "completed"
}
```

## Troubleshooting

### Marker not found after delegation

**Issue:** `.artifacts/coordination/{marker}.txt` doesn't exist

**Causes:**
1. Hook not configured (check `.claude/settings.local.json`)
2. Marker pattern incorrect (must be exact `agent-{8hex}`)
3. Description missing marker

**Fix:**
```python
# Ensure marker in description
description=f"[{marker}] Task name"  # ✅ Correct
description=f"{marker} Task name"    # ❌ Wrong - missing brackets
```

### Wrong agent resumed

**Issue:** Resumed agent doesn't have expected context

**Causes:**
1. Wrong marker used (copy-paste error)
2. AgentId from different task

**Fix:**
```python
# Double-check marker matches delegation
marker_fe = "agent-abc12345"  # From frontend delegation
agentId = Read(f".artifacts/coordination/{marker_fe}.txt").strip()

# Verify agentId before resume
print(f"Resuming frontend agent: {agentId}")
```

### Parallel agents mixing context

**Issue:** Multiple agents with similar markers

**Prevention:**
```python
# Always generate fresh UUID for each task
marker1 = f"agent-{uuid.uuid4().hex[:8]}"  # Unique
marker2 = f"agent-{uuid.uuid4().hex[:8]}"  # Unique, different from marker1

# NEVER reuse markers
marker1 = "agent-abc12345"
marker2 = "agent-abc12345"  # ❌ WRONG - collision risk
```

## Best Practices

1. **Always generate unique markers** - Use `uuid.uuid4().hex[:8]` for each delegation
2. **Include marker in description** - Pattern: `f"[{marker}] Task name"`
3. **Store markers** - Keep markers in coordinator context for resume
4. **Read agentId after completion** - Don't assume, always verify file exists
5. **Clean up optionally** - Marker files are small, cleanup not required but optional
6. **Use meaningful task names** - Helps debugging and audit trail
7. **Check metadata for debugging** - `{marker}.json` has full context

## Example: Complete Blocker Workflow

Full end-to-end example of frontend blocked on backend:

```python
import uuid

# === Frontend Delegation ===
marker_fe = f"agent-{uuid.uuid4().hex[:8]}"
print(f"Frontend marker: {marker_fe}")

Task(
    subagent_type="React Frontend Expert (F1)",
    description=f"[{marker_fe}] Build authentication UI",
    prompt="""
Create login page with:
- Email and password inputs
- Validation (email format, password min length)
- Submit button calling POST /api/auth/login
- Error handling and loading states
"""
)

# Frontend returns:
# Status: Blocked
# Issue: POST /api/auth/login returns 404
# Domain: backend

# === Capture Frontend AgentId ===
fe_agentId = Read(f".artifacts/coordination/{marker_fe}.txt").strip()
print(f"Frontend agentId: {fe_agentId}")

# === Backend Fix Delegation ===
marker_be = f"agent-{uuid.uuid4().hex[:8]}"
print(f"Backend marker: {marker_be}")

Task(
    subagent_type="fastapi-backend-expert",
    description=f"[{marker_be}] Create login API endpoint",
    prompt="""
Implement POST /api/auth/login endpoint:
- Accept email + password
- Validate credentials
- Return JWT token on success
- Return 401 on invalid credentials
- Include proper error handling
"""
)

# Backend returns:
# Status: Complete
# Files: backend/app/api/v1/auth.py

# === Resume Frontend ===
Task(
    resume=fe_agentId,
    description=f"[{marker_fe}] Resume: Backend API ready",
    prompt="""
Backend has implemented POST /api/auth/login endpoint.

Complete the login form integration:
- Update API client to call /api/auth/login
- Handle JWT token storage
- Redirect to dashboard on success
- Display backend error messages
"""
)

# Frontend resumes with full context:
# - Remembers UI components created
# - Remembers validation logic implemented
# - Continues from where it left off

print("✅ Blocker workflow complete")
```

---

**Hook Setup Verification:**

Ensure PostToolUse hook is configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/capture-subagent-id.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Hook script location: `.claude/hooks/capture-subagent-id.sh` (must be executable)
