---
name: epic-orchestrator
description: Manage Level 3 epics ONLY (5+ features, 1+ weeks, complexity 15-20). Triggered BY task-breakdown when score ≥15. Breaks epics into sub-features, delegates each to parallel-coordinator (Level 2), tracks overall progress across weeks. Creates epic.md roadmap, progress.md tracking, feature-level artifact organization. Supports pause/resume per feature. NOT for single features (use parallel-coordinator instead).
---

# ⚠️ DEPRECATED - Use session-manager instead

**This skill has been replaced by `session-manager` (`.claude/skills/session-manager/`)**

**Why deprecated:**
- 560 lines of epic coordination → session-manager handles multi-day sessions naturally
- Manual progress.md updates → Auto-save session state with progress tracking
- Git-centric team workflows → Simplified personal session management
- Mirrored parallel-coordinator patterns → Single unified skill

**Migration guide**: See `.claude/MIGRATION.md`

**When this was moved**: 2025-10-30

---

# Epic Orchestrator

## Overview

Manage long-term, multi-feature development (Level 3) with session continuity across days/weeks. Coordinate multiple features, track epic-level progress, and enable team handoffs for large-scale work.

**Core principle:** Orchestrate features via parallel-coordinator, NEVER implement code directly. Act as epic-level coordinator managing multiple Level 2 feature sessions.

## ⚠️ CRITICAL RULES - READ FIRST ⚠️

**You are an EPIC ORCHESTRATOR, not an IMPLEMENTER. Your job is to COORDINATE FEATURES, not to write code.**

### MANDATORY RULES:

1. **NEVER write code yourself** - Delegate features to parallel-coordinator
2. **NEVER implement features directly** - Use parallel-coordinator (Level 2) per feature
3. **NEVER skip epic initialization** - Always create epic.md and progress.md first
4. **ALWAYS update progress.md** - After every feature checkpoint
5. **ALWAYS track feature dependencies** - Document handoffs between features
6. **ALWAYS create TodoWrite** - Epic-level task tracking

### Before EVERY action, ask yourself:

```
❓ Am I about to implement a feature myself?
   → YES: STOP! Delegate to parallel-coordinator instead
   → NO: Proceed with epic coordination

❓ Is this a feature-level task?
   → YES: MUST delegate to parallel-coordinator (Level 2)
   → NO: Only if epic-level tracking/coordination

❓ Have I initialized epic structure?
   → NO: Create epic.md + progress.md FIRST
   → YES: Proceed with feature coordination
```

### Your ONLY allowed actions:

✅ Create epic.md roadmap
✅ Initialize/update progress.md
✅ Create TodoWrite for epic-level tracking
✅ Delegate features to parallel-coordinator (Level 2)
✅ Track cross-feature dependencies
✅ Aggregate feature summaries into epic-summary.md
✅ Present epic status to user

❌ Write code
❌ Implement features directly
❌ Skip progress tracking
❌ Forget to update progress.md
❌ Nest epics (one epic at a time)

## When to Use

Invoke this skill when:
- **task-breakdown** determined Level 3 (score 15-20)
- Epic spans multiple features (5+ distinct features)
- Timeline exceeds 1 week (multi-day/week effort)
- Multiple developers working in parallel
- Need progress tracking across features

**DO NOT use** when:
- Single feature (use parallel-coordinator instead)
- Short timeline (under 1 week)
- Already within a feature session (no nesting)

## Epic Structure

### Artifact Organization

```
.artifacts/{epic-name}/
├── epic.md (high-level roadmap, updated)
├── progress.md (overall tracking across features)
├── features/
│   ├── feature-1-{name}/
│   │   ├── tasks.md
│   │   └── sessions/
│   │       ├── 20240124_100000/ (day 1)
│   │       │   ├── coordination-state.json
│   │       │   ├── checkpoint-summary.md
│   │       │   └── agent-reports/
│   │       └── 20240125_090000/ (day 2)
│   ├── feature-2-{name}/
│   └── feature-3-{name}/
└── epic-summary.md (final aggregation)
```

## Workflow

### Step 1: Create Epic Roadmap

Generate `epic.md` with high-level breakdown:

```markdown
# Epic: {Name}

## Goal
{1-2 sentences: what and why}

## Scope
- Feature 1: {Name} - {brief description}
- Feature 2: {Name} - {brief description}
- Feature 3: {Name} - {brief description}

## Timeline
- Week 1: Features 1-2
- Week 2: Features 3-4
- Week 3: Integration & testing

## Success Criteria
1. {Measurable outcome}
2. {Measurable outcome}

## Dependencies
- External: {APIs, services, etc.}
- Internal: {Prerequisites}
```

### Step 2: Initialize Progress Tracking

Create `progress.md`:

```markdown
# Epic Progress: {Name}

**Started:** {date}
**Target Completion:** {date}
**Status:** In Progress

## Feature Status

| Feature | Status | Sessions | Last Updated |
|---------|--------|----------|--------------|
| Feature 1 | ✅ Complete | 2 | 2024-01-25 |
| Feature 2 | 🔄 In Progress | 1 | 2024-01-26 |
| Feature 3 | ⏳ Pending | 0 | - |

## Overall Progress
- Completed: 1/5 features (20%)
- In Progress: 1/5 features
- Blocked: 0/5 features

## Blockers
- None currently

## Next Up
- Complete Feature 2 (ETA: 2 days)
- Start Feature 3
```

### Step 3: Execute Features Sequentially

For each feature:

**Create feature directory:**
```bash
.artifacts/{epic-name}/features/feature-{n}-{name}/
├── tasks.md (feature breakdown)
└── sessions/ (will contain timestamped sessions)
```

**Delegate to parallel-coordinator:**
- Use Level 2 orchestration for feature
- Create session per work day
- Save checkpoints after each day
- Update epic progress.md after completion

### Step 4: Session Management Per Feature

**Starting feature work:**
```
User: "Implement Feature 2"
→ Create tasks.md for Feature 2
→ Delegate to parallel-coordinator (Level 2)
→ Create session: features/feature-2/sessions/{timestamp}/
```

**End of day:**
```
User: /pause
→ parallel-coordinator saves checkpoint
→ Update epic progress.md
→ Return: "Feature 2: 40% complete, resume: .artifacts/epic/features/feature-2/"
```

**Next day:**
```
User: /resume @.artifacts/epic-name/features/feature-2/
→ Load latest session in feature-2/sessions/
→ Continue with parallel-coordinator
```

### Step 5: Cross-Feature Coordination

Track dependencies between features:

```markdown
## Feature Dependencies

Feature 1 (User Model) → Feature 2 (Auth API)
  └─ Outputs: User model schema

Feature 2 (Auth API) → Feature 3 (Login UI)
  └─ Outputs: API contract, endpoints

Feature 3 (Login UI) ⊥ Feature 4 (Dashboard)
  └─ Independent, can parallelize
```

**Handoffs:**
1. Feature 1 completes → document outputs
2. Share artifacts with Feature 2
3. Feature 2 starts with context from Feature 1

### Step 6: Epic Aggregation

After all features complete, aggregate:

```bash
Create epic-summary.md:
- Executive summary (for stakeholders)
- Feature summaries (link to individual summaries)
- Overall architecture changes
- Integration points across features
- Migration/deployment strategy
- Epic-level metrics (LOC, tests, time spent)
```

## Commands

### /epic-start {epic-name}

Initialize epic structure:
- Create .artifacts/{epic-name}/
- Generate epic.md from user input
- Create progress.md
- Output: "Epic initialized. Start first feature with: /feature-start {name}"

### /feature-start {feature-name}

Start new feature within epic:
- Create features/{feature-name}/ directory
- Generate tasks.md
- Delegate to parallel-coordinator (Level 2)
- Update progress.md

### /epic-status

Display current epic progress:
- Show feature completion status
- List active sessions
- Display blockers
- Show next steps

### /epic-pause

Pause entire epic (all features):
- Checkpoint active feature sessions
- Update progress.md
- Output resume instructions

### /epic-resume

Resume epic work:
- Load progress.md
- Show feature status
- Offer to continue in-progress feature or start new

## Multi-Developer Workflow

Epic orchestrator enables team collaboration:

**Developer A (Day 1):**
```
/epic-start "OAuth2 Migration"
/feature-start "Backend JWT Implementation"
→ Works on Feature 1
→ /pause at end of day
→ Commits .artifacts/ to git
```

**Developer B (Day 2):**
```
git pull
/epic-status
→ Sees Feature 1 complete
/feature-start "Frontend Login UI"
→ Works on Feature 2 (uses Feature 1 outputs)
→ /pause
→ Commits
```

**Developer A (Day 3):**
```
git pull
/epic-resume
/feature-start "Integration Testing"
→ Feature 3 uses both previous features
```

## Progress Tracking Automation

Auto-update progress.md after:
- Feature starts: Add row, status=In Progress
- Session pause: Update "Last Updated"
- Feature completes: Status=Complete, increment counters
- Blocker encountered: Add to blockers list

## Examples

### Example 1: GraphQL Migration Epic

```
Epic: REST to GraphQL Migration
Timeline: 3 weeks
Features:
  1. GraphQL Schema Design (3 days)
  2. Resolver Implementation (5 days)
  3. Client Migration (4 days)
  4. Deprecate REST Endpoints (2 days)
  5. Performance Optimization (2 days)

Week 1:
  - Developer A: Feature 1 (schema)
  - Developer B: Research & setup

Week 2:
  - Developer A: Feature 2 (resolvers)
  - Developer B: Feature 3 (client migration)

Week 3:
  - Both: Feature 4 + 5 (deprecation, optimization)
```

### Example 2: New Dashboard Epic

```
Epic: Admin Dashboard
Timeline: 2 weeks
Features:
  1. User Management (3 days, 6 sessions)
  2. Analytics Charts (2 days, 4 sessions)
  3. Settings Panel (2 days, 3 sessions)
  4. Notifications (1 day, 2 sessions)

Progress tracking shows:
- User Management: 100% (all sessions complete)
- Analytics Charts: 60% (2/4 sessions done)
- Settings Panel: Not started
- Notifications: Not started
```

## Integration with Other Skills

- **task-breakdown**: Routes Level 3 tasks to this skill
- **agent-selector**: Delegates epic management here
- **parallel-coordinator**: Used per-feature (Level 2)
- **artifact-aggregator**: Creates epic-summary.md (Tier 3)

## Best Practices

✅ **Break into features** - Each feature = independently valuable
✅ **Daily checkpoints** - Pause at end of each work day
✅ **Commit artifacts** - Share progress via git
✅ **Document handoffs** - Clear outputs per feature
✅ **Track blockers** - Visible in progress.md
✅ **Limit scope** - 5-10 features max per epic

❌ **Don't nest epics** - One epic at a time
❌ **Don't skip checkpoints** - Always pause before stopping
❌ **Don't ignore dependencies** - Document feature order
❌ **Don't forget aggregation** - Final epic-summary required

## Git Continuity & Team Collaboration

### IMPORTANT: Git Configuration

**DO NOT add `.artifacts/` to `.gitignore` for epic orchestration**

Epic artifacts are designed for multi-developer collaboration:
- All paths are **relative** (work across machines)
- Epic.md and progress.md should be committed (team visibility)
- Feature sessions can be resumed by any team member
- Cross-feature handoffs require shared artifacts

**Only gitignore `.artifacts/` if working solo and want local-only sessions**

### Session Resumption Across Team

**Scenario 1: Developer B continues Developer A's work**
```bash
# Developer A (Day 1)
/feature-start "Backend Implementation"
→ Works for 3 hours
→ /pause
→ git commit -m "Epic: feature 1 checkpoint"
→ git push

# Developer B (Day 2)
git pull
/epic-status
→ Sees Feature 1 in progress
/resume @.artifacts/oauth-migration/features/backend-impl/
→ Continues from last checkpoint
```

**Scenario 2: Parallel feature development**
```bash
# Developer A: Feature 1
/feature-start "Backend API"

# Developer B: Feature 2 (simultaneously)
git pull  # Gets epic structure
/feature-start "Frontend UI"

# Both work in parallel, independent features
# Both commit their sessions
# Epic progress.md tracks both
```

### Conflict Resolution

**If two developers modify same feature:**
1. Git will show conflict in `progress.md`
2. Resolve by keeping latest status
3. Coordinate who continues feature work
4. Other dev starts different feature

**Best practice:** One feature = one developer at a time

## Anti-Patterns

### ⚠️ CRITICAL VIOLATIONS

❌ **Implementing code directly** - NEVER write code yourself, delegate to parallel-coordinator
❌ **Skipping epic initialization** - Must create epic.md + progress.md first
❌ **Forgetting progress updates** - Update progress.md after EVERY feature checkpoint
❌ **Nesting epics** - One epic at a time, no epic-within-epic
❌ **Ignoring dependencies** - Track feature order, document handoffs
❌ **Over-scoping epics** - Max 3 weeks, 10 features; larger = split into multiple epics

### Common Mistakes

❌ **Not using parallel-coordinator** - Don't implement features yourself
   ```
   BAD:  Read feature files → Edit directly → Write code
   GOOD: Delegate to parallel-coordinator (Level 2)
   ```

❌ **Forgetting TodoWrite** - Epic-level task tracking disappears
   ```
   BAD:  Start features without overall tracking
   GOOD: TodoWrite with epic-level tasks (Feature 1, Feature 2, etc.)
   ```

❌ **Not documenting handoffs** - Next feature doesn't know what previous output
   ```
   BAD:  Feature 1 completes, Feature 2 starts blind
   GOOD: Feature 1 checkpoint-summary.md documents outputs for Feature 2
   ```

❌ **Skipping aggregation** - No final epic-summary.md
   ```
   BAD:  Features done, epic just stops
   GOOD: Create epic-summary.md with overall achievements
   ```

## Troubleshooting

### Epic Won't Resume

**Problem:** `/epic-resume` can't find epic

**Solution:**
```bash
# Check if epic directory exists
ls .artifacts/

# If missing, epic was never initialized
# Start over with /epic-start

# If exists, check progress.md
cat .artifacts/{epic-name}/progress.md
```

### Feature Session Lost

**Problem:** Can't resume feature, session not found

**Solution:**
```bash
# List feature sessions
ls .artifacts/{epic}/features/{feature}/sessions/

# If empty, feature never started
# Use /feature-start to begin

# If sessions exist, resume latest:
/resume @.artifacts/{epic}/features/{feature}/
```

### Progress.md Out of Sync

**Problem:** progress.md shows wrong status

**Solution:**
1. Manually inspect feature sessions (ls sessions/)
2. Count completed sessions
3. Edit progress.md to reflect reality
4. Commit corrected version

### Git Conflicts in Artifacts

**Problem:** Two devs committed different progress.md

**Solution:**
1. Check both versions
2. Keep version with most recent timestamps
3. Merge feature statuses manually
4. Commit resolved version

## Self-Monitoring Checklist

**Before starting feature, ask:**
- ✅ Have I initialized epic structure? (epic.md + progress.md)
- ✅ Is this feature in epic scope? (check epic.md)
- ✅ Did I update progress.md to show feature In Progress?
- ✅ Am I delegating to parallel-coordinator (Level 2)?

**After completing feature, ask:**
- ✅ Did feature create checkpoint-summary.md?
- ✅ Did I update progress.md to mark feature Complete?
- ✅ Did I document handoff outputs for next feature?
- ✅ Did I commit artifacts to git (if team workflow)?

**At epic completion, ask:**
- ✅ Are ALL features marked Complete in progress.md?
- ✅ Did I create epic-summary.md (Tier 3 report)?
- ✅ Did I aggregate all feature summaries?
- ✅ Did I document overall architecture changes?
- ✅ Did I commit final epic artifacts?

## Notes

- Epic artifacts designed for multi-developer git workflow
- All paths relative (work across machines)
- **Progress.md is source of truth** for feature status
- Features executed via parallel-coordinator (reuse Level 2)
- Maximum recommended epic size: **3 weeks, 10 features**
- One epic at a time (no nesting)
- Each feature should be independently valuable
- Daily checkpoints preserve progress
- Git commits enable team handoffs