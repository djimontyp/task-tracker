# Orchestration Patterns

This document describes the coordination patterns available in the Task Orchestrator.

## Pattern 1: Parallel Independent

**When to use:** Tasks with no dependencies that can execute simultaneously.

**Example:** Backend API implementation + Frontend component development

```
Task: Implement user profile editing

┌─────────────────────────────┐
│  fastapi-backend-expert     │ ─┐
│  - Create API endpoints     │  │
│  - Add validation           │  │  Execute in parallel
│  - Update models            │  │
└─────────────────────────────┘  │
                                 │
┌─────────────────────────────┐  │
│  react-frontend-architect   │ ─┘
│  - Create ProfileEditor     │
│  - Add form validation      │
│  - Update state management  │
└─────────────────────────────┘

Result: Both agents work simultaneously, reducing total time
```

**Configuration:**
```yaml
parallel_execution: true
max_concurrent: 2
```

---

## Pattern 2: Sequential Handoff

**When to use:** Tasks where output of one step is required input for the next.

**Example:** Database migration → API update → Frontend update

```
Task: Add new user role field

Step 1: Database Migration
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  - Create Alembic migration │
│  - Add role column          │
│  - Seed default roles       │
└─────────────────────────────┘
              ↓
Step 2: API Update
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  - Update User model        │
│  - Add role endpoints       │
│  - Update validation        │
└─────────────────────────────┘
              ↓
Step 3: Frontend Integration
┌─────────────────────────────┐
│  react-frontend-architect   │
│  - Update User types        │
│  - Add role selector        │
│  - Update permissions       │
└─────────────────────────────┘

Result: Each step completes before next begins
```

**Configuration:**
```yaml
parallel_execution: false
handoff_artifacts:
  - "migration_script"
  - "updated_schema"
  - "api_contract"
```

---

## Pattern 3: Parallel with Sync Points

**When to use:** Mostly parallel work with occasional synchronization requirements.

**Example:** Full-stack feature with API contract agreement

```
Task: Implement real-time notifications

Phase 1: Design (Sync Point)
┌─────────────────────────────┐
│  Define API Contract        │
│  - WebSocket events         │
│  - Message format           │
│  - Error handling           │
└─────────────────────────────┘
              ↓
Phase 2: Parallel Implementation
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  fastapi-backend-expert     │  │  react-frontend-architect   │
│  - WebSocket endpoint       │  │  - WebSocket client         │
│  - Event broadcaster        │  │  - Notification UI          │
│  - NATS integration         │  │  - State management         │
└─────────────────────────────┘  └─────────────────────────────┘
              ↓                               ↓
Phase 3: Integration Testing (Sync Point)
┌─────────────────────────────────────────────┐
│  pytest-test-master                         │
│  - End-to-end WebSocket tests               │
│  - Message delivery verification            │
└─────────────────────────────────────────────┘

Result: Synchronize at key milestones, parallel in between
```

**Configuration:**
```yaml
parallel_execution: true
sync_points:
  - "API contract definition"
  - "Type synchronization"
  - "Integration testing"
```

---

## Pattern 4: Primary with Reviewers

**When to use:** One agent does implementation, others provide review/validation.

**Example:** Backend implementation with architecture review

```
Task: Implement payment processing

Primary Implementation
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  - Payment API endpoints    │
│  - Stripe integration       │
│  - Transaction models       │
└─────────────────────────────┘
              ↓
Parallel Reviews
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  architecture-guardian      │  │  pytest-test-master         │
│  - Check compliance         │  │  - Verify test coverage     │
│  - Review patterns          │  │  - Check edge cases         │
│  - Security analysis        │  │  - Validate error handling  │
└─────────────────────────────┘  └─────────────────────────────┘

Result: Implementation validated by multiple experts
```

**Configuration:**
```yaml
primary_agent: "fastapi-backend-expert"
reviewer_agents:
  - "architecture-guardian"
  - "pytest-test-master"
parallel_execution: true  # Reviews happen in parallel
```

---

## Pattern 5: Incremental with Validation

**When to use:** Large refactoring or migration requiring validation between phases.

**Example:** Migrate from REST to GraphQL endpoints

```
Task: GraphQL migration (multi-phase)

Phase 1: Users Module
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  - GraphQL schema for users │
│  - Resolvers                │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  pytest-test-master         │
│  - Test new GraphQL API     │
└─────────────────────────────┘
              ↓
Phase 2: Tasks Module (if tests pass)
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  - GraphQL schema for tasks │
│  - Resolvers                │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  pytest-test-master         │
│  - Test task GraphQL API    │
└─────────────────────────────┘

Result: Validated incremental progress
```

**Configuration:**
```yaml
phases:
  - name: "users_module"
    agent: "fastapi-backend-expert"
    validator: "pytest-test-master"
  - name: "tasks_module"
    agent: "fastapi-backend-expert"
    validator: "pytest-test-master"
sequential: true  # Only proceed if validation passes
```

---

## Pattern 6: Fan-Out / Fan-In

**When to use:** Multiple independent work items that need aggregation.

**Example:** Microservices updates with integration testing

```
Task: Update authentication across services

Fan-Out: Parallel Updates
┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  Service 1: API Gateway     │
└─────────────────────────────┘

┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  Service 2: User Service    │
└─────────────────────────────┘

┌─────────────────────────────┐
│  fastapi-backend-expert     │
│  Service 3: Task Service    │
└─────────────────────────────┘
              ↓
Fan-In: Integration
┌─────────────────────────────┐
│  pytest-test-master         │
│  - Integration tests        │
│  - Auth flow validation     │
│  - Service communication    │
└─────────────────────────────┘

Result: Parallel work aggregated for validation
```

**Configuration:**
```yaml
fan_out:
  agent: "fastapi-backend-expert"
  tasks:
    - "api_gateway"
    - "user_service"
    - "task_service"
  parallel: true
fan_in:
  agent: "pytest-test-master"
  task: "integration_testing"
```

---

## Pattern 7: Conditional Branching

**When to use:** Agent selection depends on runtime conditions.

**Example:** Code quality improvement with conditional cleanup

```
Task: Improve code quality

Step 1: Analysis
┌─────────────────────────────┐
│  architecture-guardian      │
│  - Analyze codebase         │
│  - Identify issues          │
└─────────────────────────────┘
              ↓
Step 2: Conditional Execution
        ┌───────┐
        │ IF    │ High complexity?
        └───┬───┘
            │ YES                    NO
            ↓                        ↓
┌─────────────────────────────┐  ┌────────────────────┐
│  codebase-cleaner           │  │  comment-cleaner   │
│  - Refactor complex code    │  │  - Clean comments  │
│  - Remove dead code         │  │  - Format code     │
└─────────────────────────────┘  └────────────────────┘

Result: Different agents based on analysis
```

**Configuration:**
```yaml
conditional_logic:
  analyzer: "architecture-guardian"
  branches:
    - condition: "high_complexity"
      agent: "codebase-cleaner"
    - condition: "simple_cleanup"
      agent: "comment-cleaner"
```

---

## Choosing the Right Pattern

| Pattern | Use When | Parallelization | Complexity |
|---------|----------|----------------|------------|
| Parallel Independent | No dependencies | High | Low |
| Sequential Handoff | Strong dependencies | None | Medium |
| Parallel with Sync | Mostly independent | Medium | Medium |
| Primary with Reviewers | Need validation | Medium | Low |
| Incremental Validation | Large migration | None | High |
| Fan-Out / Fan-In | Multiple similar tasks | High | Medium |
| Conditional Branching | Dynamic routing | Varies | High |

## Pattern Combinations

Patterns can be combined for complex orchestrations:

**Example:** Full-stack feature with quality checks

```
1. Parallel Independent (backend + frontend)
   ↓
2. Primary with Reviewers (architecture check)
   ↓
3. Sequential Handoff (testing → deployment)
```

This combines multiple patterns for robust feature delivery.
