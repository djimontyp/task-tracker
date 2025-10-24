---
name: agent-selector
description: SECOND STEP (after task-breakdown) - Match tasks to domain specialists based on orchestration level. Routes Level 0 (direct), Level 1 (single agent), Level 2 (parallel-coordinator), Level 3 (epic-orchestrator). Calculates delegation ROI (quality + context savings - overhead). Provides file paths and clear scope in delegation prompts. NOT for complexity analysis (use task-breakdown first) or recursive delegation.
---

# Agent Selector

## Overview

Intelligently route tasks to the most appropriate executor—either handle directly (main Claude Code) or delegate to specialized agents based on task characteristics, available expertise, and context efficiency.

## When to Use

Invoke this skill when:
- **Before starting any non-trivial task**: Proactively assess delegation potential
- **Research tasks**: Investigation may consume significant context
- **Specialized domains**: Backend, frontend, DevOps, testing, documentation
- **Quality-critical work**: Specialized agents have domain-specific best practices
- **Context preservation**: Main agent needs to stay focused on coordination

**DO NOT use** when:
- Already executing within a specialized agent (no recursive delegation)
- Task is trivial (<5 minutes, no domain expertise needed)
- User explicitly requested main agent to handle it
- Delegation overhead exceeds execution time

## Decision Framework

### Step 0: Check Orchestration Level (NEW)

**If task-breakdown already determined level, use it:**

- **Level 0** → Skip delegation entirely (execute directly)
- **Level 1** → Single agent delegation (proceed to Step 1)
- **Level 2** → Multi-agent orchestration (delegate to parallel-coordinator)
- **Level 3** → Epic workflow (delegate to epic-orchestrator)

**If no level provided, assess characteristics:**

### Step 1: Assess Task Characteristics

Analyze the task across these dimensions:

```
Orchestration Level: [0/1/2/3] (if from task-breakdown)
- Level 0: Direct execution, no delegation
- Level 1: Single agent
- Level 2: Multi-agent coordination
- Level 3: Epic multi-session

Domain Complexity: [Low/Medium/High]
- Low: Generic operations (file reading, simple edits)
- Medium: Domain knowledge helpful but not critical
- High: Requires specialized expertise (async patterns, React hooks, Docker configs)

Context Consumption: [Low/Medium/High]
- Low: <500 tokens (single file, targeted search)
- Medium: 500-2000 tokens (multi-file analysis, small research)
- High: >2000 tokens (architecture exploration, large codebases)

Quality Impact: [Low/Medium/High]
- Low: Internal scripts, temporary changes
- Medium: Production code, user-facing features
- High: Security, performance, architecture decisions

Time Estimate: [<5min / 5-15min / 15-30min / >30min]
```

### Step 2: Match Task to Agent Domain

Map task characteristics to agent specializations. Agents are known through:
1. **System context**: Built-in agents (fastapi-backend-expert, react-frontend-architect, etc.)
2. **Project agents**: Custom agents in `.claude/agents/` directory
3. **Tool descriptions**: Task tool provides agent metadata

**Domain mapping heuristics:**

| Task Indicator | Suggested Agent(s) |
|----------------|-------------------|
| Python/FastAPI/async/Pydantic | `fastapi-backend-expert` |
| React/TypeScript/hooks/components | `react-frontend-architect` |
| Docker/CI/GitHub Actions/deployment | `devops-expert` |
| pytest/testing/coverage | `pytest-test-master` |
| Code quality/refactoring/cleanup | `codebase-cleaner`, `architecture-guardian` |
| Markdown/README/docs | `documentation-expert` |
| UX/UI/accessibility/design | `ux-ui-design-expert` |
| Codebase exploration/research | `Explore` (fast, specialized for discovery) |
| Complex multi-step coordination | `task-orchestrator` |
| Specifications/requirements | `spec-driven-dev-specialist` |

**Dynamic agent discovery:**
```bash
# Check for project-specific custom agents
ls .claude/agents/*.md
```

### Step 3: Calculate Delegation ROI

Compare execution approaches:

**Delegation value = (Quality gain + Context savings) - (Overhead cost)**

Where:
- **Quality gain**: Domain expertise improves output (0-10 scale)
- **Context savings**: Tokens freed for main agent (0-10 scale)
- **Overhead cost**: Communication, setup, result integration (0-10 scale)

**Decision thresholds:**
- **Value > 5**: Delegate (clear benefit)
- **Value 2-5**: Consider delegation (marginal)
- **Value < 2**: Execute directly (overhead too high)

**Examples:**

```
Task: "Fix typo in README"
- Quality gain: 1 (no expertise needed)
- Context savings: 1 (tiny file)
- Overhead: 3 (delegation setup)
→ Value = -1 → Execute directly

Task: "Implement OAuth2 flow in FastAPI"
- Quality gain: 9 (security-critical, async patterns)
- Context savings: 7 (complex research)
- Overhead: 4 (result integration needed)
→ Value = 12 → Delegate to fastapi-backend-expert

Task: "Explore authentication implementation across codebase"
- Quality gain: 6 (systematic exploration)
- Context savings: 9 (would consume huge context)
- Overhead: 3 (minimal, just collect findings)
→ Value = 12 → Delegate to Explore agent
```

### Step 4: Select Optimal Agent

Based on scores and mapping, choose:

1. **Primary agent**: Best domain match
2. **Fallback agent**: If primary unavailable (shouldn't happen with built-ins)
3. **Main agent**: If delegation value < 2

**Multi-agent considerations:**
- If task spans multiple domains, use `task-breakdown` first
- If coordination needed, consider `task-orchestrator`
- Sequential delegation allowed: Main → task-breakdown → agent-selector → specialized agent

### Step 5: Prepare Delegation

When delegating, craft effective Task tool invocation:

```python
Task(
    subagent_type="fastapi-backend-expert",
    description="Implement OAuth2 authentication",  # Short, 3-5 words
    prompt="""
    Implement OAuth2 password flow for user authentication:

    Requirements:
    - Use FastAPI OAuth2PasswordBearer
    - JWT tokens with 30min expiry
    - Refresh token mechanism
    - Integrate with existing User model

    Deliverables:
    - /auth/login endpoint
    - /auth/refresh endpoint
    - JWT verification dependency for protected routes
    - Tests for auth flow

    Context:
    - User model at backend/app/models/user.py
    - Existing DB session in backend/app/database.py
    """
)
```

**Delegation best practices:**
- **Clear scope**: Precisely define boundaries
- **Explicit deliverables**: What artifacts to return
- **Context pointers**: Provide file paths, not full code
- **Acceptance criteria**: How to verify success

## Agent Selection Matrix

Use this reference for common scenarios:

### Backend Development
- **Python/FastAPI general**: `fastapi-backend-expert`
- **Database migrations**: Consider `migration-database` skill
- **API testing**: `pytest-test-master`

### Frontend Development
- **React/TypeScript**: `react-frontend-architect`
- **UX review**: `ux-ui-design-expert`
- **Component testing**: Frontend testing agent (if available)

### Infrastructure & DevOps
- **Docker/compose**: `devops-expert`
- **CI/CD pipelines**: `devops-expert`
- **Deployment**: `devops-expert`

### Quality & Maintenance
- **Code review**: `architecture-guardian`
- **Cleanup/refactor**: `codebase-cleaner`
- **Comment cleanup**: `comment-cleaner`
- **Type checking**: Handle directly (just run `mypy`)

### Documentation & Planning
- **User docs**: `documentation-expert`
- **Specifications**: `spec-driven-dev-specialist`
- **Project status**: `project-status-analyzer`

### Research & Exploration
- **Codebase discovery**: `Explore` (fast, context-efficient)
- **Architecture analysis**: `architecture-guardian`
- **General research**: `general-purpose`

## Decision Trees

### Tree 1: Should I delegate?

```
Is task trivial (<5min, no expertise)?
├─ Yes → Execute directly
└─ No → Continue

Will task consume >1000 tokens context?
├─ Yes → Strong delegation candidate
└─ No → Continue

Does specialized agent exist for domain?
├─ Yes → Calculate delegation ROI
└─ No → Execute directly

Is delegation ROI > 5?
├─ Yes → DELEGATE
└─ No → Execute directly or ask user
```

### Tree 2: Which agent to use?

```
What's the primary domain?
├─ Backend/API → fastapi-backend-expert
├─ Frontend/React → react-frontend-architect
├─ Infrastructure → devops-expert
├─ Testing → pytest-test-master
├─ Documentation → documentation-expert
├─ Research → Explore (fast) or general-purpose
├─ Multi-domain → task-orchestrator
└─ Unclear → Use task-breakdown first
```

## Anti-Patterns

- **Over-delegation**: Don't delegate trivial tasks (reading single file, small edits)
- **Under-delegation**: Don't hoard complex work that would benefit from specialization
- **Wrong agent**: Match domain precisely (don't use backend agent for React)
- **Vague prompts**: Delegation without clear scope/deliverables
- **Recursive loops**: Agent delegates to another agent endlessly
- **Ignoring custom agents**: Check `.claude/agents/` for project-specific agents

## Examples

### Example 1: Clear Delegation
**Task:** "Add WebSocket support to FastAPI backend"
**Analysis:**
- Domain: Backend/FastAPI (High complexity)
- Context: Medium (need to read existing API structure)
- Quality: High (real-time critical)
**Decision:** Delegate to `fastapi-backend-expert`
**Reason:** Specialized async patterns, WebSocket expertise

### Example 2: Execute Directly
**Task:** "Fix import statement in utils.py"
**Analysis:**
- Domain: Generic (Low complexity)
- Context: Low (single file)
- Quality: Low (internal utility)
**Decision:** Execute directly
**Reason:** Trivial change, delegation overhead not justified

### Example 3: Research Delegation
**Task:** "How does task classification work in this codebase?"
**Analysis:**
- Domain: Research/exploration
- Context: High (need to explore multiple files)
- Quality: Medium (understanding for future work)
**Decision:** Delegate to `Explore` agent with thoroughness="medium"
**Reason:** Systematic exploration, context preservation

### Example 4: Multi-Agent Coordination
**Task:** "Implement full-stack notification feature"
**Analysis:**
- Domain: Multi-domain (backend + frontend + testing)
- Context: High
- Quality: High
**Decision:** Delegate to `task-breakdown` → outputs plan → `agent-selector` picks agents per task
**Reason:** Too complex for single agent, needs decomposition first

### Example 5: Custom Agent
**Task:** "Generate Alembic migration for User model changes"
**Analysis:**
- Check `.claude/agents/` → no custom migration agent
- Check skills → found `migration-database` skill
**Decision:** Invoke `migration-database` skill (NOT agent)
**Reason:** Skills are procedural workflows, not agents

## Integration with Other Skills

- **task-breakdown**: Often calls agent-selector for each decomposed task
- **parallel-coordinator**: Uses agent-selector to assign agents to parallel work
- **task-orchestrator**: Delegates agent selection to this skill
- **Standalone**: Can be invoked independently for any delegation decision

## Notes

- Agent metadata is provided by system context (Task tool descriptions)
- Custom project agents in `.claude/agents/` augment built-in agents
- Always prefer specialized agents for their domain over general-purpose
- When in doubt about delegation, bias toward delegating (expertise > speed)
- Track delegation decisions to learn patterns over time
