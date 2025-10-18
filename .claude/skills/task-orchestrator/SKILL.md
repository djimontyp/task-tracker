---
name: task-orchestrator
description: This skill transforms Claude Code into an orchestrator that delegates 80-90% of work to specialized agents, managing task breakdown, parallel execution, artifact collection, and report aggregation. Use this skill for complex multi-step tasks, full-stack features, or when coordination of multiple specialized agents is needed. The skill triggers automatically for multi-domain requests (e.g., backend + frontend), complex features requiring multiple agents, or when the user explicitly requests orchestration with keywords like "orchestrate", "delegate", or "coordinate".
---

# Task Orchestrator

## Overview

Transform into an orchestration agent that delegates 80-90% of work to specialized sub-agents, collects structured artifacts, and aggregates results into comprehensive reports.

**Core principle:** Act as a coordinator, not an executor. Analyze tasks, select appropriate agents, manage their execution, and synthesize their outputs.

## When to Use This Skill

Trigger this skill for:

1. **Multi-domain tasks** - Features spanning backend + frontend, or multiple technology areas
2. **Complex features** - Work requiring 3+ agents or multiple phases
3. **Full-stack implementation** - End-to-end features from database to UI
4. **Quality workflows** - Code cleanup, testing, architecture review combinations
5. **Explicit orchestration requests** - User says "orchestrate", "delegate", "coordinate"

**Example triggers:**
- "Implement user profile editing with avatar upload"
- "Create a real-time notification system"
- "Refactor authentication system for better security"
- "Build a dashboard with charts and data filtering"

## Orchestration Workflow

Follow this workflow for EVERY orchestration task:

### Step 1: Task Analysis

Analyze the user's request to determine:

1. **Task type** - Load `config/agents.yaml` and match trigger keywords
2. **Complexity** - How many agents needed?
3. **Dependencies** - Can agents run in parallel or sequentially?
4. **Coordination pattern** - Which pattern from `references/orchestration-patterns.md`?

**Example analysis:**

```
User request: "Implement user profile editing with avatar upload"

Analysis:
- Task type: full_stack (triggers: "implement", "user")
- Agents needed: fastapi-backend-expert + react-frontend-architect
- Pattern: parallel_with_sync (API contract synchronization needed)
- Complexity: Medium (2 agents, 1 sync point)
```

### Step 2: Create Task Breakdown

Use TodoWrite to create a detailed task breakdown:

```
1. Initialize orchestration session
2. Backend implementation (agent: fastapi-backend-expert)
3. Frontend implementation (agent: react-frontend-architect)
4. Aggregate reports
5. Present summary to user
```

Mark the first task as `in_progress`.

### Step 3: Initialize Artifact Session

Run the initialization script to create artifact structure:

```bash
python scripts/init_orchestration.py <feature-name>
```

This creates:
```
.artifacts/{feature-name}/{timestamp}/
├── context.json
├── task-breakdown.md
└── agent-reports/
```

### Step 4: Delegate to Agents

Use the Task tool to launch specialized agents WITH EXPLICIT INSTRUCTIONS to write reports.

**Critical:** Always instruct agents to write reports to the artifact directory.

**For parallel execution:**

```
Launch multiple agents in a SINGLE message with multiple Task tool calls:

Task 1: Backend Implementation
- Agent: fastapi-backend-expert
- Instruction: "Implement user profile editing API. After completion, write a report to .artifacts/profile-editing/{timestamp}/agent-reports/backend-report.md following the template in .claude/skills/task-orchestrator/assets/report-templates/implementation-report.md"

Task 2: Frontend Implementation
- Agent: react-frontend-architect
- Instruction: "Implement user profile editing UI. After completion, write a report to .artifacts/profile-editing/{timestamp}/agent-reports/frontend-report.md following the template"
```

**For sequential execution:**

Launch one agent, wait for completion and report, then launch the next.

### Step 5: Monitor Progress

Update TodoWrite as agents complete:

```
✅ Initialize orchestration session - COMPLETED
✅ Backend implementation - COMPLETED
→ Frontend implementation - IN_PROGRESS
  Aggregate reports - PENDING
  Present summary - PENDING
```

### Step 6: Aggregate Reports

After all agents complete, run the aggregation script:

```bash
python scripts/aggregate_reports.py .artifacts/{feature-name}/{timestamp}
```

This creates `summary.md` combining all agent reports.

### Step 7: Present Summary to User

Read the summary.md and present key findings to the user:

```
✅ User profile editing feature complete!

**Agents Executed:**
- Backend: fastapi-backend-expert
- Frontend: react-frontend-architect

**Summary:**
[Key points from summary]

**Files Changed:**
- Backend: X files modified, Y files created
- Frontend: Z files modified, W files created

**Next Steps:**
1. Review individual reports in .artifacts/profile-editing/{timestamp}/
2. Test the feature end-to-end
3. Run quality checks

Full details: .artifacts/profile-editing/{timestamp}/summary.md
```

## Agent Selection

Load `config/agents.yaml` to select agents based on task type.

### Configuration Structure

```yaml
task_types:
  backend:
    primary_agent: "fastapi-backend-expert"
    fallback_agent: "general-purpose"
    trigger_keywords: ["backend", "fastapi", "api endpoint", ...]

  full_stack:
    primary_agent: ["fastapi-backend-expert", "react-frontend-architect"]
    parallel_execution: true
    sync_points: ["API contract definition", ...]
```

### Selection Algorithm

1. **Analyze user request** - Extract keywords
2. **Match task type** - Find matching trigger keywords
3. **Select primary agent(s)** - From config
4. **Determine execution mode** - Parallel or sequential
5. **Check for sync points** - If parallel_with_sync pattern

### Fallback Strategy

From `config/agents.yaml`:

```yaml
fallback_strategy:
  on_agent_unavailable: "use_fallback"
  on_agent_error: "retry_once_then_fallback"
  on_unknown_task: "use_general_purpose"
```

If primary agent fails, gracefully degrade to fallback agent.

## Coordination Patterns

Load detailed patterns from `references/orchestration-patterns.md`.

### Pattern Summary

1. **Parallel Independent** - Tasks with no dependencies (backend + frontend)
2. **Sequential Handoff** - Output of one step feeds into next (DB → API → UI)
3. **Parallel with Sync** - Mostly parallel with synchronization points (API contract)
4. **Primary with Reviewers** - One implements, others review (implementation + architecture)
5. **Incremental Validation** - Phased work with validation between phases (migration)
6. **Fan-Out / Fan-In** - Multiple parallel tasks aggregated (microservices)
7. **Conditional Branching** - Agent selection depends on runtime conditions (analysis-driven)

### Pattern Selection

Choose pattern based on:
- **Dependencies:** Are tasks independent?
- **Synchronization:** Do agents need to coordinate?
- **Validation:** Is step-by-step validation needed?
- **Complexity:** How many agents and phases?

## Artifact Management

### Directory Structure

```
.artifacts/
└── {feature-name}/
    └── {timestamp}/
        ├── context.json              # Session metadata
        ├── task-breakdown.md         # TodoWrite tasks
        ├── agent-reports/            # Individual reports
        │   ├── backend-report.md
        │   ├── frontend-report.md
        │   └── test-results.md
        └── summary.md               # Aggregated summary
```

### Report Standards

All agent reports MUST follow standards from `references/artifact-standards.md`.

**Required sections:**
1. Summary
2. Changes Made
3. Implementation Details
4. Technical Decisions
5. Testing Results
6. Issues Encountered
7. Dependencies
8. Next Steps
9. Completion Checklist

### Report Templates

Provide agents with the appropriate template:

- **Implementation work:** `assets/report-templates/implementation-report.md`
- **Testing work:** `assets/report-templates/test-results.md`
- **Architecture review:** `assets/report-templates/architecture-review.md`

### Artifact Lifecycle

1. **Creation:** `scripts/init_orchestration.py` creates session
2. **Active:** Agents write individual reports
3. **Completion:** `scripts/aggregate_reports.py` creates summary
4. **Retention:** User manages cleanup with `scripts/cleanup_artifacts.py`

**CRITICAL:** NEVER auto-delete artifacts. The cleanup script requires explicit user confirmation.

## Configuration Management

### Validation

Validate configuration before orchestration:

```bash
python scripts/validate_agents.py --strict
```

This checks:
- Schema compliance
- Trigger keyword conflicts
- Agent references validity
- Version staleness

### Updating Configuration

When agents change, update configuration:

```bash
# Interactive mode
python scripts/update_agents_config.py --interactive

# Command-line mode
python scripts/update_agents_config.py \
  --add-agent "ml-expert" \
  --type "ml_inference" \
  --triggers "ml" "machine learning" \
  --bump minor
```

This automatically:
- Updates `config/agents.yaml`
- Updates `references/CHANGELOG.md`
- Validates changes
- Bumps version

### Self-Maintaining System

The configuration is **self-documenting** and **versioned**:

- `config/agents.yaml` - Current agent configuration (versioned)
- `config/agents.schema.json` - Validation schema
- `references/CHANGELOG.md` - Version history and migration guides

When agents are added, removed, or changed:
1. Validation detects unknown agents (warnings)
2. User can update config interactively
3. CHANGELOG tracks changes
4. Version bumps appropriately

## Example Orchestrations

### Example 1: Full-Stack Feature

**Request:** "Implement user profile editing with avatar upload"

**Orchestration:**

```
1. Task Analysis:
   - Type: full_stack
   - Pattern: parallel_with_sync
   - Agents: fastapi-backend-expert + react-frontend-architect

2. Task Breakdown (TodoWrite):
   ✅ Initialize session
   → Backend: Profile API + avatar upload
   → Frontend: ProfileEditor component
     Aggregate reports
     Present summary

3. Initialize:
   python scripts/init_orchestration.py profile-editing

4. Delegate (parallel):
   Task tool → fastapi-backend-expert:
     "Implement profile editing API with avatar upload.
      Write report to .artifacts/profile-editing/{ts}/agent-reports/backend-report.md"

   Task tool → react-frontend-architect:
     "Implement ProfileEditor UI with avatar upload.
      Write report to .artifacts/profile-editing/{ts}/agent-reports/frontend-report.md"

5. Monitor: TodoWrite updates as agents complete

6. Aggregate:
   python scripts/aggregate_reports.py .artifacts/profile-editing/{ts}

7. Present: Summary to user with key findings
```

### Example 2: Code Quality Workflow

**Request:** "Clean up and improve code quality in authentication module"

**Orchestration:**

```
1. Task Analysis:
   - Type: quality
   - Pattern: primary_with_reviewers
   - Agents: architecture-guardian (primary) → codebase-cleaner + comment-cleaner

2. Sequential execution:
   a. architecture-guardian analyzes code
   b. Based on findings, launch appropriate cleaners
   c. pytest-test-master validates no regressions

3. Reports collected from each agent

4. Summary presents quality improvements
```

### Example 3: Testing Campaign

**Request:** "Add comprehensive tests for the new notification system"

**Orchestration:**

```
1. Task Analysis:
   - Type: testing
   - Pattern: incremental_validation
   - Agent: pytest-test-master

2. Phased approach:
   Phase 1: Unit tests for notification service
   Phase 2: Integration tests for WebSocket delivery
   Phase 3: End-to-end tests

3. Each phase validated before proceeding

4. Final report shows complete test coverage
```

## Best Practices

### DO

✅ Always create TodoWrite task breakdown before delegating
✅ Initialize artifact session before launching agents
✅ Provide agents with explicit report writing instructions
✅ Use parallel execution when possible (faster)
✅ Load `config/agents.yaml` for agent selection
✅ Follow artifact standards for consistency
✅ Aggregate reports before presenting to user
✅ Update configuration when agents change

### DON'T

❌ Never execute tasks yourself - always delegate to specialized agents
❌ Never auto-delete artifacts - require user confirmation
❌ Never skip task breakdown - it provides structure
❌ Never forget to aggregate reports - user needs summary
❌ Never ignore agent reports - synthesize them for user
❌ Never modify config files directly - use update script
❌ Never launch agents without report instructions

## Troubleshooting

### Agent Unavailable

If primary agent fails:
1. Check `config/agents.yaml` for fallback
2. Use fallback agent
3. Document degradation in summary

### Reports Missing

If agent doesn't write report:
1. Check artifact directory exists
2. Verify agent received report instructions
3. Manually request report from agent

### Configuration Issues

If agent selection fails:
1. Validate config: `python scripts/validate_agents.py`
2. Check CHANGELOG for recent changes
3. Update config if needed: `python scripts/update_agents_config.py --interactive`

## Scripts Reference

### init_orchestration.py

**Purpose:** Initialize orchestration session

**Usage:**
```bash
python scripts/init_orchestration.py <feature-name> [--base-dir DIR] [--working-dir DIR]
```

**Output:** Creates `.artifacts/{feature-name}/{timestamp}/` with context.json

### validate_agents.py

**Purpose:** Validate agent configuration

**Usage:**
```bash
python scripts/validate_agents.py [--strict]
```

**Checks:**
- Schema compliance
- Trigger keyword conflicts
- Agent reference validity
- Version staleness

### update_agents_config.py

**Purpose:** Update agent configuration

**Usage:**
```bash
# Interactive
python scripts/update_agents_config.py --interactive

# Add agent
python scripts/update_agents_config.py \
  --add-agent "new-agent" \
  --type "task_type" \
  --triggers "keyword1" "keyword2" \
  --bump minor
```

**Updates:**
- `config/agents.yaml`
- `references/CHANGELOG.md`

### aggregate_reports.py

**Purpose:** Combine agent reports into summary

**Usage:**
```bash
python scripts/aggregate_reports.py .artifacts/{feature-name}/{timestamp}
```

**Output:** Creates `summary.md` with aggregated findings

### cleanup_artifacts.py

**Purpose:** List and optionally clean up old artifacts

**IMPORTANT:** Requires explicit user confirmation

**Usage:**
```bash
# List candidates
python scripts/cleanup_artifacts.py

# Interactive cleanup
python scripts/cleanup_artifacts.py --interactive

# Dry run
python scripts/cleanup_artifacts.py --dry-run

# With confirmation
python scripts/cleanup_artifacts.py --confirm
```

## Resources

### Configuration (`config/`)

- `agents.yaml` - Versioned agent delegation map
- `agents.schema.json` - JSON Schema for validation

### References (`references/`)

- `orchestration-patterns.md` - Detailed coordination patterns
- `artifact-standards.md` - Report formatting standards
- `CHANGELOG.md` - Configuration version history

### Templates (`assets/report-templates/`)

- `implementation-report.md` - For backend/frontend agents
- `test-results.md` - For pytest-test-master
- `architecture-review.md` - For architecture-guardian

### Scripts (`scripts/`)

- `init_orchestration.py` - Initialize sessions
- `validate_agents.py` - Validate configuration
- `update_agents_config.py` - Update configuration
- `aggregate_reports.py` - Combine reports
- `cleanup_artifacts.py` - Manage artifact lifecycle

---

**Remember:** Act as an orchestrator 80-90% of the time. Delegate to specialized agents, collect their work, and synthesize comprehensive summaries. Focus on coordination, not execution.
