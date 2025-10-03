from datetime import date, datetime, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import and_, select

from ...models import SimpleMessage, SimpleSource, SimpleTask, StatsResponse
from ...websocket import manager
from ..deps import DatabaseDep
from .response_models import ActivityDataResponse, AnalyzeDayResponse

router = APIRouter(tags=["statistics"])


@router.get(
    "/activity",
    response_model=ActivityDataResponse,
    summary="Get activity data",
    response_description="Message activity grouped by hour and source",
)
async def get_activity_data(
    db: DatabaseDep,
    period: Literal["week", "month"] = Query(
        "week", description="Period type: 'week' or 'month'"
    ),
    month: Optional[int] = Query(None, description="Month (0-11, for month period)"),
    year: Optional[int] = Query(None, description="Year (for month period)"),
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
        select(SimpleMessage, SimpleSource)
        .join(SimpleSource, SimpleMessage.source_id == SimpleSource.id)
        .where(
            and_(
                SimpleMessage.sent_at >= start_date, SimpleMessage.sent_at <= end_date
            )
        )
        .order_by(SimpleMessage.sent_at)
    )

    result = await db.execute(statement)
    messages_with_sources = result.all()

    activity_data = []
    for message, source in messages_with_sources:
        activity_data.append(
            {
                "timestamp": message.sent_at.isoformat(),
                "source": source.name,
                "count": 1,
            }
        )

    from .response_models import ActivityDataPoint, ActivityPeriod

    return ActivityDataResponse(
        data=[
            ActivityDataPoint(
                timestamp=message.sent_at.isoformat(),
                source=source.name,
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
    "/stats",
    response_model=StatsResponse,
    summary="Get task statistics",
    response_description="Task counts by status, category, and priority",
)
async def get_stats(db: DatabaseDep) -> StatsResponse:
    """
    Get aggregated task statistics.

    Returns total, open, and completed task counts,
    plus breakdowns by category and priority.
    """
    statement = select(SimpleTask)
    result = await db.execute(statement)
    tasks = result.scalars().all()

    total_tasks = len(tasks)
    open_tasks = len([task for task in tasks if task.status == "open"])
    completed_tasks = len([task for task in tasks if task.status == "completed"])

    categories = {}
    priorities = {}

    for task in tasks:
        categories[task.category] = categories.get(task.category, 0) + 1
        priorities[task.priority] = priorities.get(task.priority, 0) + 1

    return StatsResponse(
        total_tasks=total_tasks,
        open_tasks=open_tasks,
        completed_tasks=completed_tasks,
        categories=categories,
        priorities=priorities,
    )


@router.post(
    "/analyze-day",
    response_model=AnalyzeDayResponse,
    summary="Analyze messages for a day",
    response_description="Analysis summary with tasks created",
)
async def analyze_day(
    db: DatabaseDep, target_date: Optional[str] = None
) -> AnalyzeDayResponse:
    """
    Analyze unanalyzed messages for a specific day and create summary task.

    Processes all unanalyzed messages for the target date (defaults to today),
    marks them as analyzed, and creates a summary task. Broadcasts task via WebSocket.
    """
    try:
        if target_date:
            analysis_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        else:
            analysis_date = date.today()

        start_datetime = datetime.combine(analysis_date, datetime.min.time())
        end_datetime = datetime.combine(analysis_date, datetime.max.time())

        statement = select(SimpleMessage).where(
            and_(
                SimpleMessage.sent_at >= start_datetime,
                SimpleMessage.sent_at <= end_datetime,
                ~SimpleMessage.analyzed,
            )
        )
        result = await db.execute(statement)
        unanalyzed_messages = result.scalars().all()

        if not unanalyzed_messages:
            return AnalyzeDayResponse(
                success=True,
                message=f"No unanalyzed messages found for {analysis_date}",
                messages_processed=0,
                tasks_created=0,
            )

        summary_content = f"Daily Analysis for {analysis_date}\n\n"
        summary_content += f"Processed {len(unanalyzed_messages)} messages:\n"
        for msg in unanalyzed_messages[:5]:
            summary_content += f"- {msg.author}: {msg.content[:50]}...\n"

        if len(unanalyzed_messages) > 5:
            summary_content += (
                f"... and {len(unanalyzed_messages) - 5} more messages"
            )

        summary_task = SimpleTask(
            title=f"Daily Summary - {analysis_date}",
            description=summary_content,
            status="open",
            priority="medium",
            category="summary",
            source="analysis",
            created_at=datetime.utcnow(),
        )
        db.add(summary_task)

        for message in unanalyzed_messages:
            message.analyzed = True
            db.add(message)

        await db.commit()
        await db.refresh(summary_task)

        task_data = {
            "id": summary_task.id,
            "title": summary_task.title,
            "description": summary_task.description,
            "status": summary_task.status,
            "priority": summary_task.priority,
            "category": summary_task.category,
            "created_at": summary_task.created_at.isoformat(),
        }
        await manager.broadcast({"type": "task_created", "data": task_data})

        return AnalyzeDayResponse(
            success=True,
            message=f"Successfully analyzed {len(unanalyzed_messages)} messages",
            messages_processed=len(unanalyzed_messages),
            tasks_created=1,
            date=str(analysis_date),
            summary_task_id=summary_task.id,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
