# Task Tracker Specifications (SDD)

This directory contains Specification-Driven Development (SDD) artifacts for the Task Tracker project. Specs are the source of truth; implementation serves these specifications.

- See architecture: @ARCHITECTURE.md
- Tech plan: @TECH_PLAN.md
- API reference (legacy doc): @API_DOCUMENTATION.md

## Index

- System
  - Overview (PRD-level): @specs/system/overview.md
  - Implementation Plan: @specs/system/plan.md

 - Backend
  - Data Model: @specs/backend/data-model.md
  - API Contracts: @specs/backend/api-contracts.md
  - Realtime (WebSocket): @specs/backend/realtime.md
  - Webhook Management (Telegram): @specs/backend/webhook-management.md
  - AI/LLM Processing: @specs/backend/ai-processing.md
  - Worker & TaskIQ: @specs/backend/worker.md

- Frontend
  - Dashboard: @specs/frontend/dashboard.md

- Infrastructure
  - NATS and Compose services: @specs/infra/nats.md

- Quality
  - Testing Strategy: @specs/quality/testing.md

- Non-Functional
  - Security: @specs/non-functional/security.md
  - Development Workflow: @specs/non-functional/dev-workflow.md

## Notes
- Cross-file links use the format @path_in+project.
- Specs follow SDD principles (clarity, testability, [NEEDS CLARIFICATION] markers).
- Where implementation and docs diverge, specs capture the current code as truth and mark gaps for action.
