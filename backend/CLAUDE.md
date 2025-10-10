# Backend: FastAPI + TaskIQ + Pydantic-AI

## Core Components
- **Main**: `backend/app/main.py` - FastAPI app, REST API, WebSocket
- **Telegram Bot**: `backend/app/telegram_bot.py` - aiogram 3, webhook integration
- **Background Jobs**: `backend/app/tasks.py` - TaskIQ + NATS broker
- **DB**: PostgreSQL (port 5555), SQLAlchemy, Alembic migrations

## Critical API Routes
### Phase 1: Analysis System (v1)
**Analysis Runs** `/api/v1/analysis/runs`:
- POST create (validates no unclosed runs, 409 if exists)
- POST `{id}/start` - trigger background job
- POST `{id}/close` - requires proposals_pending=0

**Proposals** `/api/v1/proposals`:
- PUT `{id}/approve|reject|merge` - decrements run.proposals_pending
- Filters: run_id, status, confidence (0.0-1.0)

**Projects** `/api/v1/projects`:
- Keywords REQUIRED (list[str]), auto-version on update

## Background Job Flow (`execute_analysis_run`)
```
1. fetch_messages(time_window) → prefilter(keywords/length/@mentions)
2. create_batches(10min windows, max 50 msgs)
3. FOR batch: LLMProposalService → save_proposals → broadcast WS
4. complete_run() or fail_run(error_log)
```

## Key Models
- **AnalysisRun**: 7-state lifecycle (pending→running→completed→reviewed→closed→failed→cancelled)
- **TaskProposal**: confidence (high>0.9, med 0.7-0.9, low<0.7), source_message_ids (JSONB)
- **ProjectConfig**: keywords (required), semantic versioning

## Validation Rules
- No new AnalysisRun if unclosed exists (409)
- Cannot close if proposals_pending > 0 (400)
- Approve/reject decrements proposals_pending

## WebSocket Events
Topic `analysis_runs`: run_started, progress_updated, proposals_created, run_completed, run_failed
