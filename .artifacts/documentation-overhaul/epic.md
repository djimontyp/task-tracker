# Epic: Documentation Overhaul

## Goal

Eliminate all gaps and discrepancies identified in October 2025 audit. Synchronize en/uk documentation to accurately reflect current implementation without verbosity or duplication.

## Audit Context

**Overall Score:** 7.5/10 (Code: 9.2/10, Docs: 5.3/10)
**Source:** docs/audit-2025-10-24/

## Scope

### Feature 1: API Documentation Fix (Critical)
- Fix parameter naming: `provider_id` → `agent_config_id`
- Document period-based message selection
- Correct WebSocket endpoint structure
- Update all code examples (TypeScript, Python, cURL)
- Fix versioning system events
- **Priority:** P1 (Critical)
- **Estimate:** 6-8 hours

### Feature 2: Frontend Architecture Documentation
- Document 17 feature modules (agents, analysis, atoms, experiments, knowledge, messages, noise, onboarding, projects, proposals, providers, tasks, topics, websocket)
- Create architecture diagrams
- Document React 18.3.1 + TypeScript + Zustand + TanStack Query
- Describe Radix UI component usage
- Clarify Socket.IO vs WebSocket usage
- **Priority:** P1 (Critical)
- **Estimate:** 8-12 hours

### Feature 3: Backend Architecture Documentation
- Create ER diagram for 25+ database models
- Document LLM hexagonal architecture (domain/infrastructure/application layers)
- Catalog 30+ backend services (CRUD, LLM, Analysis, Vector DB, Infrastructure)
- Update CLAUDE.md with backend structure overview
- **Priority:** P1 (Critical)
- **Estimate:** 12-16 hours

### Feature 4: System Documentation
- Document versioning system (TopicVersion, AtomVersion)
- Document Agent System (AgentConfig, AgentTaskAssignment)
- Document 12+ background tasks with TaskIQ
- Fix AnalysisRun state machine (7 states vs 4 states discrepancy)
- Document classification experiments
- **Priority:** P2 (High)
- **Estimate:** 12-16 hours

### Feature 5: Operational Documentation
- Create operational runbooks
- Document configuration management (move hardcoded thresholds to config)
- Document environment variables comprehensively
- Add performance benchmarks
- Security and privacy documentation
- **Priority:** P3 (Medium)
- **Estimate:** 12-20 hours

## Timeline

**Week 1: Critical Foundation (Features 1-3 start)**
- Feature 1: API Documentation Fix (complete)
- Feature 2: Frontend Architecture (start)
- Feature 3: Backend Architecture (start)

**Week 2-3: Complete High Priority (Features 2-4)**
- Feature 2: Frontend Architecture (complete)
- Feature 3: Backend Architecture (complete)
- Feature 4: System Documentation (complete)

**Week 3+: Operations (Feature 5)**
- Feature 5: Operational Documentation

## Success Criteria

1. All API documentation examples are functional
2. Frontend architecture fully documented (17 modules visible)
3. Database ER diagram created and accurate
4. LLM hexagonal architecture explained
5. All 30+ backend services cataloged
6. Versioning and agent systems documented
7. Background tasks comprehensively explained
8. State machine discrepancies resolved
9. Operational runbooks created
10. All documentation synchronized en/uk (no cross-references)

## Format Requirements

- **Style:** Hybrid (tables + diagrams, NO code examples)
- **Languages:** English + Ukrainian synchronized (full translation, no shortcuts)
- **Tone:** Concise, no fluff, no duplication - for working professionals
- **Discrepancies:** Ask user when code/docs conflict

## Dependencies

**External:**
- Audit reports in `docs/audit-2025-10-24/`
- Existing codebase as source of truth

**Internal:**
- Feature 1 → Feature 2 (API contracts inform frontend)
- Feature 3 → Feature 4 (backend models inform system docs)
- All features → Feature 5 (operations references all systems)

## Artifacts Structure

```
.artifacts/documentation-overhaul/
├── epic.md (this file)
├── progress.md (tracking)
├── features/
│   ├── 1-api-docs-fix/
│   ├── 2-frontend-architecture/
│   ├── 3-backend-architecture/
│   ├── 4-system-documentation/
│   └── 5-operational-docs/
└── epic-summary.md (final aggregation)
```

## Notes

- User requires parallel execution with multiple agents
- Use specialized agents: documentation-expert, fastapi-backend-expert, react-frontend-architect, architecture-guardian
- Clean local context - delegate research, don't explore directly
- Proactively use skills as per CLAUDE.md instructions
