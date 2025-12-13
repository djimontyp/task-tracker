"""Executive Summary API Router.

Phase 3 implementation (T024-T025):
- GET /executive-summary (T024)
- POST /executive-summary/export (T041 - Phase 4)
- GET /executive-summary/stats (T055 - Phase 6)
"""

import uuid
from enum import IntEnum

from fastapi import APIRouter, HTTPException, Query

from app.api.deps import DatabaseDep
from app.api.v1.schemas.executive_summary import (
    ExecutiveSummaryResponse,
    ExecutiveSummaryStatsResponse,
    ExportRequest,
    ExportResponse,
)
from app.services.executive_summary_service import ExecutiveSummaryService

router = APIRouter(prefix="/executive-summary", tags=["executive-summary"])


class PeriodDays(IntEnum):
    """Valid period options for executive summary."""

    WEEK = 7
    TWO_WEEKS = 14
    MONTH = 30


@router.get(
    "",
    response_model=ExecutiveSummaryResponse,
    summary="Get executive summary",
    response_description="Aggregated summary of decisions and blockers",
)
async def get_executive_summary(
    db: DatabaseDep,
    period_days: PeriodDays = Query(
        PeriodDays.WEEK,
        description="Number of days to include in summary (7, 14, or 30)",
    ),
    topic_id: uuid.UUID | None = Query(
        None,
        description="Optional: Filter by specific topic UUID",
    ),
) -> ExecutiveSummaryResponse:
    """
    Get executive summary with decisions and blockers.

    Returns aggregated data for the specified period:
    - **stats**: Count of decisions, blockers, active topics
    - **blockers**: BLOCKER atoms sorted by staleness
    - **decisions_by_topic**: Decisions grouped by topic
    - **uncategorized_decisions**: Decisions without topic

    **Filters applied:**
    - Only `user_approved=true` atoms
    - Only `archived=false` atoms
    - Only types: `decision`, `blocker`
    - Created within period_days from now
    """
    service = ExecutiveSummaryService(db)
    return await service.get_executive_summary(period_days, topic_id)


@router.get(
    "/stats",
    response_model=ExecutiveSummaryStatsResponse,
    summary="Get summary statistics only",
    response_description="Lightweight stats for dashboard widgets",
)
async def get_executive_summary_stats(
    db: DatabaseDep,
    period_days: PeriodDays = Query(
        PeriodDays.WEEK,
        description="Number of days to include (7, 14, or 30)",
    ),
) -> ExecutiveSummaryStatsResponse:
    """
    Get lightweight summary statistics.

    Returns only aggregate counts without full atom data.
    Useful for dashboard widgets and quick overviews.

    - **decisions_count**: Total DECISION atoms
    - **blockers_count**: Total BLOCKER atoms
    - **active_topics_count**: Topics with atoms in period
    - **stale_blockers_count**: Blockers older than 14 days
    """
    service = ExecutiveSummaryService(db)
    return await service.get_summary_stats(period_days)


@router.post(
    "/export",
    response_model=ExportResponse,
    summary="Export executive summary",
    response_description="Formatted report in markdown or plain text",
)
async def export_executive_summary(
    db: DatabaseDep,
    request: ExportRequest,
) -> ExportResponse:
    """
    Export executive summary as formatted report.

    Generates a human-readable report of the executive summary
    in the specified format (markdown or plain text).

    **Options:**
    - **period_days**: 7, 14, or 30 days
    - **format**: `markdown` or `plain_text`
    - **include_stats**: Include statistics section
    - **include_blockers**: Include blockers section
    - **include_decisions**: Include decisions section
    """
    # Validate period_days
    if request.period_days not in (7, 14, 30):
        raise HTTPException(
            status_code=400,
            detail="Period must be 7, 14, or 30 days",
        )

    service = ExecutiveSummaryService(db)
    return await service.export_summary(request)
