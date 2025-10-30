# Task Orchestrator Skill

Transform Claude Code into an orchestration agent that delegates 80-90% of work to specialized sub-agents.

## Overview

The Task Orchestrator skill changes Claude Code's behavior from direct execution to intelligent coordination. Instead of implementing features directly, Claude analyzes tasks, selects appropriate specialized agents, manages their parallel or sequential execution, and aggregates their results into comprehensive reports.

## Features

- **Intelligent Agent Selection** - Automatically selects the right specialized agent(s) based on task analysis
- **Parallel Execution** - Runs independent tasks simultaneously for faster completion
- **Versioned Configuration** - Agent delegation map with semantic versioning and CHANGELOG
- **Structured Artifacts** - Creates organized session directories with individual agent reports
- **Report Aggregation** - Combines multiple agent reports into executive summaries
- **Self-Maintaining** - Interactive configuration updates with validation
- **7 Coordination Patterns** - From parallel independent to conditional branching
- **Safe Cleanup** - Artifact retention with required user confirmation

## When to Use

The orchestrator activates for:

- Multi-domain tasks (backend + frontend)
- Complex features requiring 3+ agents
- Full-stack implementations
- Quality improvement workflows
- Explicit orchestration requests ("orchestrate", "delegate", "coordinate")

## Structure

```
task-orchestrator/
├── SKILL.md                          # Main orchestration logic
├── config/
│   ├── agents.yaml                   # Versioned agent delegation map
│   └── agents.schema.json            # JSON Schema validation
├── scripts/
│   ├── init_orchestration.py         # Initialize sessions
│   ├── validate_agents.py            # Validate configuration
│   ├── update_agents_config.py       # Update configuration
│   ├── aggregate_reports.py          # Combine reports
│   └── cleanup_artifacts.py          # Manage artifacts (requires confirmation)
├── references/
│   ├── orchestration-patterns.md     # 7 coordination patterns
│   ├── artifact-standards.md         # Report formatting standards
│   └── CHANGELOG.md                  # Configuration version history
└── assets/report-templates/
    ├── implementation-report.md      # For *-expert agents
    ├── test-results.md               # For pytest-test-master
    └── architecture-review.md        # For architecture-guardian
```

## Quick Start

Once installed, the skill activates automatically for appropriate tasks:

```
User: "Implement user profile editing with avatar upload"

Claude:
1. Analyzes task → full_stack type
2. Creates TodoWrite breakdown
3. Initializes artifact session
4. Launches fastapi-backend-expert + react-frontend-architect in parallel
5. Monitors progress
6. Aggregates reports
7. Presents summary to user
```

## Configuration

The skill uses a versioned agent configuration in `config/agents.yaml`:

```yaml
version: "1.0.0"

task_types:
  backend:
    primary_agent: "fastapi-backend-expert"
    trigger_keywords: ["backend", "fastapi", "api endpoint", ...]

  full_stack:
    primary_agent: ["fastapi-backend-expert", "react-frontend-architect"]
    parallel_execution: true
    sync_points: ["API contract definition", ...]
```

### Updating Configuration

When agents change:

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

## Coordination Patterns

The skill includes 7 battle-tested orchestration patterns:

1. **Parallel Independent** - Tasks with no dependencies
2. **Sequential Handoff** - Output feeds into next step
3. **Parallel with Sync** - Synchronization at key milestones
4. **Primary with Reviewers** - Implementation + validation
5. **Incremental Validation** - Phased with validation gates
6. **Fan-Out / Fan-In** - Multiple parallel → aggregation
7. **Conditional Branching** - Dynamic agent selection

Each pattern documented in `references/orchestration-patterns.md` with diagrams and examples.

## Artifact Management

Sessions create organized artifact directories:

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

### Cleanup Policy

**IMPORTANT:** The skill NEVER auto-deletes artifacts. Cleanup requires explicit user confirmation:

```bash
# List old sessions
python scripts/cleanup_artifacts.py

# Interactive cleanup (confirm each session)
python scripts/cleanup_artifacts.py --interactive

# Dry run
python scripts/cleanup_artifacts.py --dry-run
```

## Scripts Reference

### init_orchestration.py

Initialize orchestration session:

```bash
python scripts/init_orchestration.py <feature-name>
```

### validate_agents.py

Validate agent configuration:

```bash
python scripts/validate_agents.py --strict
```

### aggregate_reports.py

Combine agent reports into summary:

```bash
python scripts/aggregate_reports.py .artifacts/{feature-name}/{timestamp}
```

## Best Practices

**DO:**
- ✅ Create TodoWrite breakdown before delegating
- ✅ Initialize artifact session before launching agents
- ✅ Provide agents with explicit report instructions
- ✅ Use parallel execution when possible
- ✅ Aggregate reports before presenting to user

**DON'T:**
- ❌ Execute tasks directly - always delegate
- ❌ Auto-delete artifacts - require confirmation
- ❌ Skip task breakdown
- ❌ Launch agents without report instructions

## Requirements

- Python 3.10+
- PyYAML
- jsonschema

Install requirements:

```bash
pip install pyyaml jsonschema
```

## Version History

Current version: **1.0.0**

See `references/CHANGELOG.md` for full version history.

## License

MIT License - See LICENSE file for details.

## Contributing

This skill is part of a Task Tracker project. Configuration updates should use the built-in update script to maintain versioning and CHANGELOG.

## Support

For issues or questions:
1. Check `references/` documentation
2. Validate configuration: `python scripts/validate_agents.py`
3. Review CHANGELOG for recent changes