"""Dashboard metrics endpoints for Daily Review Epic."""

from typing import Literal

from fastapi import APIRouter, Query

from app.api.deps import DatabaseDep
from app.api.v1.schemas.dashboard import DashboardMetricsResponse
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
