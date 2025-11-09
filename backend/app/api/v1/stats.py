from datetime import datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Query
from sqlmodel import and_, select

from app.api.deps import DatabaseDep
from app.api.v1.response_models import (
    ActivityDataResponse,
    SidebarCountsResponse,
    TrendData,
)
from app.models import Message, Source

# from app.models.enums import AnalysisRunStatus, ProposalStatus

router = APIRouter(tags=["statistics"])


def calculate_trend(current: int, previous: int) -> TrendData:
    """
    Calculate trend comparison between current and previous period.

    Args:
        current: Count from current period
        previous: Count from previous period

    Returns:
        TrendData with percentage change and direction
    """
    if previous == 0:
        change_percent = 100.0 if current > 0 else 0.0
        direction = "up" if current > 0 else "neutral"
    else:
        change_percent = ((current - previous) / previous) * 100
        if change_percent > 0:
            direction = "up"
        elif change_percent < 0:
            direction = "down"
        else:
            direction = "neutral"

    return TrendData(
        current=current,
        previous=previous,
        change_percent=abs(change_percent),
        direction=direction,
    )


@router.get(
    "/activity",
    response_model=ActivityDataResponse,
    summary="Get activity data",
    response_description="Message activity grouped by hour and source",
)
async def get_activity_data(
    db: DatabaseDep,
    period: Literal["week", "month"] = Query("week", description="Period type: 'week' or 'month'"),
    month: int | None = Query(None, description="Month (0-11, for month period)"),
    year: int | None = Query(None, description="Year (for month period)"),
) -> ActivityDataResponse:
    """
    Get message activity data for heatmap visualization.

    Returns activity data points with timestamp, source, and count,
    grouped by hour and day for the specified period.
    """
    if period == "month":
        target_month = month if month is not None else datetime.utcnow().month - 1
        target_year = year if year is not None else datetime.utcnow().year

        start_date = datetime(target_year, target_month + 1, 1)
        if target_month == 11:
            end_date = datetime(target_year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(target_year, target_month + 2, 1) - timedelta(seconds=1)
    else:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)

    statement = (
        select(Message, Source)
        .join(Source)
        .where(
            and_(
                Message.source_id == Source.id,
                Message.sent_at >= start_date,
                Message.sent_at <= end_date,
            )
        )
        .order_by(Message.sent_at)  # type: ignore[arg-type]
    )

    result = await db.execute(statement)
    messages_with_sources = result.all()

    activity_data = []
    for message, source in messages_with_sources:
        activity_data.append({
            "timestamp": message.sent_at.isoformat(),
            "source": source.type.value,
            "count": 1,
        })

    from .response_models import ActivityDataPoint, ActivityPeriod

    return ActivityDataResponse(
        data=[
            ActivityDataPoint(
                timestamp=message.sent_at.isoformat(),
                source=source.type.value,
                count=1,
            )
            for message, source in messages_with_sources
        ],
        period=ActivityPeriod(
            type=period,
            start=start_date.isoformat(),
            end=end_date.isoformat(),
            month=target_month if period == "month" else None,
            year=target_year if period == "month" else None,
        ),
        total_messages=len(activity_data),
    )


@router.get(
    "/sidebar-counts",
    response_model=SidebarCountsResponse,
    summary="Get sidebar notification counts",
    response_description="Counts of unclosed runs and pending proposals for sidebar badges",
)
async def get_sidebar_counts(db: DatabaseDep) -> SidebarCountsResponse:
    """
    Get notification counts for sidebar badges.

    Returns:
    - unclosed_runs: Count of analysis runs with status != 'closed'
      (pending, running, completed, reviewed)
    - pending_proposals: Count of task proposals with status = 'pending'

    These counts are used to display notification badges in the sidebar
    navigation to alert the PM about items requiring attention.
    """
    # NOTE: Task classification removed in nuclear cleanup
    # unclosed_runs and pending_proposals always 0
    unclosed_runs_count = 0
    pending_proposals_count = 0

    return SidebarCountsResponse(
        unclosed_runs=unclosed_runs_count,
        pending_proposals=pending_proposals_count,
    )
