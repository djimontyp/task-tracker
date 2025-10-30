# Changelog

All notable changes to the Task Orchestrator agent configuration will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-10-18

### Added

- Initial agent configuration with 9 task types
- Backend task type with fastapi-backend-expert agent
- Frontend task type with react-frontend-architect agent
- Full-stack task type with parallel backend + frontend execution
- Testing task type with pytest-test-master agent
- Quality task type with codebase-cleaner and comment-cleaner agents
- DevOps task type with devops-expert agent
- Architecture task type with architecture-guardian agent
- Documentation task type with documentation-expert agent
- Exploration task type with Explore agent and thoroughness levels
- Execution rules with max 4 parallel agents
- Fallback strategy for agent unavailability and errors
- 7 coordination patterns (parallel_independent, sequential_handoff, etc.)
- Artifact management configuration with retention policy
- Report standards with 9 required sections
- Experimental features support (disabled by default)
- Deprecation tracking mechanism
- JSON Schema validation for configuration
- Python scripts for init, validate, update, and aggregate operations
- Comprehensive orchestration patterns documentation
- Artifact standards and report templates
- User confirmation requirement for artifact cleanup

### Configuration Details

**Task Types:**
- backend: Python/FastAPI backend development
- frontend: React/TypeScript frontend development
- full_stack: Combined backend + frontend features
- testing: Test creation and validation
- quality: Code cleanup and refactoring
- devops: CI/CD and infrastructure
- architecture: Architecture review and compliance
- documentation: Documentation creation
- exploration: Codebase exploration and search

**Execution Rules:**
- Maximum 4 parallel agents globally
- Graceful degradation with fallback agents
- Unknown tasks route to general-purpose agent

**Artifact Management:**
- Base directory: `.artifacts`
- Session structure: `{feature-name}/{timestamp}`
- Default retention: 7 days
- **Required user confirmation for cleanup** (never auto-delete)

### Security

- Artifact cleanup requires explicit user confirmation
- No automatic deletion of files
- Interactive and dry-run modes for safe cleanup

---

## Version History Guidelines

### Version Bumping Rules

- **Major (X.0.0)**: Breaking changes to configuration structure
  - Example: Removing required fields, changing schema fundamentally

- **Minor (x.X.0)**: New features, new agents, new task types
  - Example: Adding new coordination pattern, new agent type

- **Patch (x.x.X)**: Bug fixes, documentation updates, minor improvements
  - Example: Fixing trigger keyword conflicts, updating descriptions

### Changelog Entry Format

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- New features, new agents, new task types

### Changed
- Changes to existing functionality

### Deprecated
- Features marked for removal in future versions

### Removed
- Removed features (breaking change)

### Fixed
- Bug fixes

### Security
- Security-related changes
```

### Migration Guide Template

When deprecating agents or making breaking changes:

```markdown
## Migration Guide: [OLD_VERSION] to [NEW_VERSION]

### Breaking Changes

1. **Agent Renamed**: `old-agent-name` → `new-agent-name`
   - Update all references in custom configurations
   - Old agent will be removed in version X.X.X

2. **Task Type Removed**: `removed_task_type`
   - Use `replacement_task_type` instead
   - Migration script: `python scripts/migrate_config.py`

### Deprecation Notices

- `deprecated-agent`: Will be removed in version X.X.X
  - Use `replacement-agent` instead
  - See documentation: [link]
```

---

## Maintenance Notes

This changelog is automatically updated by `scripts/update_agents_config.py` when configuration changes are made.

Manual updates should follow the format above and maintain chronological order (newest first).
