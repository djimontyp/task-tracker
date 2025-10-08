"""Analysis runs API endpoints"""

from datetime import datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter

from app.schemas.analysis import (
    AccuracyMetricsResponse,
    AnalysisRunListResponse,
    AnalysisRunResponse,
    ProposalStatus,
    RunStatus,
    TaskProposalResponse,
    TriggerType,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])


# Mock data for demonstration
def generate_mock_runs() -> list[AnalysisRunResponse]:
    """Generate mock analysis runs"""
    now = datetime.now()

    return [
        AnalysisRunResponse(
            id=UUID("550e8400-e29b-41d4-a716-446655440001"),
            status=RunStatus.CLOSED,
            trigger_type=TriggerType.MANUAL,
            time_window_start=now - timedelta(days=2),
            time_window_end=now - timedelta(days=1),
            created_at=now - timedelta(days=1, hours=2),
            started_at=now - timedelta(days=1, hours=2),
            completed_at=now - timedelta(days=1, hours=1),
            closed_at=now - timedelta(days=1, hours=1),
            proposals_total=8,
            proposals_approved=7,
            proposals_rejected=1,
            proposals_pending=0,
            total_messages_in_window=150,
            messages_after_prefilter=45,
            batches_created=3,
            llm_tokens_used=12500,
            cost_estimate=3.20,
            triggered_by="pm_user_123",
            accuracy_metrics=AccuracyMetricsResponse(
                total_proposals=8,
                approved_count=7,
                rejected_count=1,
                approval_rate=0.875,
                avg_confidence=0.89,
                high_confidence_approved=6,
                low_confidence_rejected=1,
                confidence_accuracy=0.92,
                duplicates_found=2,
                duplicates_correct=2,
                duplicates_incorrect=0,
                duplicate_detection_accuracy=1.0,
                projects_classified=7,
                projects_correct=6,
                projects_changed=1,
                project_classification_accuracy=0.85,
                avg_time_per_proposal=16.875,
                total_processing_time=135.0,
                cost_per_approved_task=0.46,
                manual_edits_count=1,
                quick_approvals=6,
            ),
        ),
        AnalysisRunResponse(
            id=UUID("550e8400-e29b-41d4-a716-446655440002"),
            status=RunStatus.COMPLETED,
            trigger_type=TriggerType.SCHEDULED,
            time_window_start=now - timedelta(days=1),
            time_window_end=now,
            created_at=now - timedelta(hours=3),
            started_at=now - timedelta(hours=3),
            completed_at=now - timedelta(hours=2),
            closed_at=None,
            proposals_total=12,
            proposals_approved=5,
            proposals_rejected=2,
            proposals_pending=5,
            total_messages_in_window=200,
            messages_after_prefilter=60,
            batches_created=4,
            llm_tokens_used=18000,
            cost_estimate=4.50,
            triggered_by=None,
            accuracy_metrics=None,
        ),
        AnalysisRunResponse(
            id=UUID("550e8400-e29b-41d4-a716-446655440003"),
            status=RunStatus.RUNNING,
            trigger_type=TriggerType.MANUAL,
            time_window_start=now - timedelta(hours=2),
            time_window_end=now,
            created_at=now - timedelta(minutes=10),
            started_at=now - timedelta(minutes=10),
            completed_at=None,
            closed_at=None,
            proposals_total=0,
            proposals_approved=0,
            proposals_rejected=0,
            proposals_pending=0,
            total_messages_in_window=85,
            messages_after_prefilter=30,
            batches_created=2,
            llm_tokens_used=5000,
            cost_estimate=1.25,
            triggered_by="pm_user_123",
            accuracy_metrics=None,
        ),
    ]


def generate_mock_proposals() -> list[TaskProposalResponse]:
    """Generate mock task proposals"""
    now = datetime.now()

    return [
        TaskProposalResponse(
            id=UUID("650e8400-e29b-41d4-a716-446655440001"),
            analysis_run_id=UUID("550e8400-e29b-41d4-a716-446655440002"),
            proposed_title="Фамішний сервіс падає при великому навантаженні",
            proposed_description="За логами видно що при >100 запитах/сек сервіс починає падати з OOM errors. Потрібно оптимізувати використання пам'яті.",
            proposed_priority="high",
            proposed_category="bug",
            proposed_project_id=UUID("750e8400-e29b-41d4-a716-446655440001"),
            source_message_ids=[1001, 1002, 1005],
            message_count=3,
            similar_task_id=None,
            similarity_score=None,
            similarity_type=None,
            llm_recommendation="new_task",
            confidence=0.92,
            reasoning="Чітко описаний баг з конкретними симптомами (OOM при навантаженні). Згадується у 3 повідомленнях з різних часових проміжків.",
            status=ProposalStatus.PENDING,
            reviewed_by=None,
            reviewed_at=None,
            created_at=now - timedelta(hours=2),
        ),
        TaskProposalResponse(
            id=UUID("650e8400-e29b-41d4-a716-446655440002"),
            analysis_run_id=UUID("550e8400-e29b-41d4-a716-446655440002"),
            proposed_title="Додати healthcheck для моніторингу",
            proposed_description="Налаштувати healthcheck endpoint для фамішного сервісу, щоб можна було відстежувати доступність через моніторинг систему.",
            proposed_priority="medium",
            proposed_category="feature",
            proposed_project_id=UUID("750e8400-e29b-41d4-a716-446655440001"),
            source_message_ids=[1010, 1011],
            message_count=2,
            similar_task_id=UUID("850e8400-e29b-41d4-a716-446655440001"),
            similarity_score=0.78,
            similarity_type="semantic",
            llm_recommendation="merge",
            confidence=0.85,
            reasoning="Схожа задача вже існує (ID: 850e8400...), але ця пропозиція має додаткові деталі про інтеграцію з моніторингом.",
            status=ProposalStatus.PENDING,
            reviewed_by=None,
            reviewed_at=None,
            created_at=now - timedelta(hours=2),
        ),
        TaskProposalResponse(
            id=UUID("650e8400-e29b-41d4-a716-446655440003"),
            analysis_run_id=UUID("550e8400-e29b-41d4-a716-446655440002"),
            proposed_title="Оптимізація запитів до БД",
            proposed_description="Додати індекси для часто використовуваних запитів у таблиці tasks. Це покращить швидкість відповіді API.",
            proposed_priority="medium",
            proposed_category="improvement",
            proposed_project_id=UUID("750e8400-e29b-41d4-a716-446655440002"),
            source_message_ids=[1020],
            message_count=1,
            similar_task_id=None,
            similarity_score=None,
            similarity_type=None,
            llm_recommendation="new_task",
            confidence=0.72,
            reasoning="Технічна пропозиція з одного повідомлення. Не дуже впевнений чи це окрема задача чи частина іншої роботи.",
            status=ProposalStatus.PENDING,
            reviewed_by=None,
            reviewed_at=None,
            created_at=now - timedelta(hours=2),
        ),
    ]


@router.get("/runs", response_model=AnalysisRunListResponse)
async def get_analysis_runs(page: int = 1, page_size: int = 10):
    """
    Get list of analysis runs with pagination

    Returns mock data for demonstration purposes.
    """
    runs = generate_mock_runs()

    return AnalysisRunListResponse(
        runs=runs, total=len(runs), page=page, page_size=page_size
    )


@router.get("/proposals", response_model=list[TaskProposalResponse])
async def get_task_proposals(run_id: UUID | None = None):
    """
    Get task proposals, optionally filtered by run_id

    Returns mock data for demonstration purposes.
    """
    proposals = generate_mock_proposals()

    if run_id:
        proposals = [p for p in proposals if p.analysis_run_id == run_id]

    return proposals


@router.get("/runs/{run_id}", response_model=AnalysisRunResponse)
async def get_analysis_run(run_id: UUID):
    """
    Get specific analysis run by ID

    Returns mock data for demonstration purposes.
    """
    runs = generate_mock_runs()

    # Find matching run or return first one
    for run in runs:
        if run.id == run_id:
            return run

    return runs[0]
