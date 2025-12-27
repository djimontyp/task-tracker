"""Dashboard metrics endpoints for Daily Review Epic."""

from typing import Literal

from fastapi import APIRouter, Query

from app.api.deps import DatabaseDep
from app.api.v1.schemas.dashboard import DashboardMetricsResponse, TrendsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/metrics",
    response_model=DashboardMetricsResponse,
    summary="Get dashboard metrics",
    response_description="Aggregated metrics for messages, atoms, and topics",
)
async def get_dashboard_metrics(
    db: DatabaseDep,
    period: Literal["auto", "today", "yesterday"] = Query(
        "auto",
        description="Time period: 'auto' (detect), 'today', or 'yesterday'",
    ),
) -> DashboardMetricsResponse:
    """
    Get aggregated dashboard metrics.

    Returns:
    - **messages**: Total count, signal/noise breakdown, signal ratio
    - **atoms**: Total count, pending review, approved, by type
    - **topics**: Total count, active today count
    - **trends**: Comparison with previous period

    The 'auto' period uses yesterday's data if:
    - No messages today AND
    - Current time is before noon
    """
    service = DashboardService(db)
    return await service.get_metrics(period)


@router.get(
    "/trends",
    response_model=TrendsResponse,
    summary="Get trending keywords/topics",
    response_description="List of trending keywords based on message activity",
)
async def get_dashboard_trends(
    db: DatabaseDep,
    period: Literal["today", "week", "month"] = Query(
        "week",
        description="Time period for trends",
    ),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of trends to return"),
) -> TrendsResponse:
    """
    Get trending keywords/topics for the dashboard.

    Returns:
    - **trends**: List of trending keywords with counts and deltas
    - **period**: The time period used for analysis

    Note: Currently returns topic names as trending keywords.
    Full keyword extraction from message content is planned for future.
    """
    service = DashboardService(db)
    return await service.get_trends(period, limit)
