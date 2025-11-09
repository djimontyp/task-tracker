"""API endpoints for Topic management.

Provides endpoints for managing topics including CRUD operations and icon listing.
"""

import logging
import uuid
from datetime import datetime
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import (
    TOPIC_ICONS,
    RecentTopicsResponse,
    Topic,
    TopicCreate,
    TopicListResponse,
    TopicPublic,
    TopicUpdate,
    auto_select_color,
    auto_select_icon,
)
from app.models.atom import AtomPublic
from app.schemas.messages import MessageResponse
from app.services import AtomCRUD, MessageCRUD, TopicCRUD
from app.services.metrics_broadcaster import metrics_broadcaster

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/topics", tags=["topics"])


class TimePeriod(str, Enum):
    """Time period filter for recent topics."""

    today = "today"
    yesterday = "yesterday"
    week = "week"
    month = "month"


@router.get(
    "",
    response_model=TopicListResponse,
    summary="List topics",
    description="Get list of all topics with pagination, search, and sorting.",
)
async def list_topics(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    search: str | None = Query(None, description="Search by name or description"),
    sort_by: str | None = Query(
        "created_desc",
        description="Sort criteria: name_asc, name_desc, created_desc, created_asc, updated_desc",
    ),
    session: AsyncSession = Depends(get_session),
) -> TopicListResponse:
    """List all topics with pagination, search, and sorting.

    Returns topics with optional search filtering and customizable sorting.
    Topics are used for categorizing messages and tasks.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        search: Optional search query for name or description
        sort_by: Sort order (default: created_desc)
        session: Database session

    Returns:
        List of topics with pagination metadata
    """
    crud = TopicCRUD(session)
    topics, total = await crud.list(
        skip=skip,
        limit=limit,
        search=search,
        sort_by=sort_by,
    )
    page = (skip // limit) + 1 if limit else 1
    return TopicListResponse(
        items=topics,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/icons",
    summary="List available icons",
    description="Get list of all available Heroicons that can be used for topics.",
)
async def list_available_icons() -> dict[str, list[str]]:
    """Get list of available Heroicons for topics.

    Returns all unique icon names that can be assigned to topics,
    extracted from the TOPIC_ICONS mapping dictionary.

    Returns:
        Dictionary with 'icons' key containing list of unique icon names
    """
    unique_icons = sorted(set(TOPIC_ICONS.values()))
    return {"icons": unique_icons}


@router.get(
    "/recent",
    response_model=RecentTopicsResponse,
    summary="Get recent topics",
    description="Retrieve topics ordered by last message activity with filtering by time period.",
)
async def get_recent_topics(
    period: TimePeriod | None = Query(None, description="Time period filter (today, yesterday, week, month)"),
    start_date: datetime | None = Query(None, description="Custom start date for filtering (ISO 8601)"),
    end_date: datetime | None = Query(None, description="Custom end date for filtering (ISO 8601)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of topics to return"),
    session: AsyncSession = Depends(get_session),
) -> RecentTopicsResponse:
    """Get recent topics ordered by last message timestamp.

    Filters topics by message activity within specified time period or custom date range.
    Returns topics with message count, atoms count, and last message timestamp.

    Args:
        period: Predefined time period (today, yesterday, week, month)
        start_date: Custom start date (used if period not specified)
        end_date: Custom end date (used if period not specified)
        limit: Maximum number of topics to return
        session: Database session

    Returns:
        List of recent topics with activity metrics

    Raises:
        HTTPException: 400 if both period and custom dates are provided
    """
    crud = TopicCRUD(session)
    return await crud.get_recent_topics(
        period=period,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )


@router.get(
    "/{topic_id}",
    response_model=TopicPublic,
    summary="Get topic by ID",
    description="Retrieve a specific topic by its ID.",
)
async def get_topic(
    topic_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> TopicPublic:
    """Get a specific topic by ID.

    Args:
        topic_id: Topic ID to retrieve
        session: Database session

    Returns:
        Topic details with hex color format

    Raises:
        HTTPException: 404 if topic not found
    """
    crud = TopicCRUD(session)
    topic = await crud.get(topic_id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic with ID {topic_id} not found",
        )

    return topic


@router.post(
    "",
    response_model=TopicPublic,
    status_code=201,
    summary="Create topic",
    description="Create a new topic. Icon is auto-selected if not provided.",
)
async def create_topic(
    topic_data: TopicCreate,
    session: AsyncSession = Depends(get_session),
) -> TopicPublic:
    """Create a new topic.

    If icon is not provided, it will be automatically selected based on
    keywords in the topic name and description.

    Args:
        topic_data: Topic creation data
        session: Database session

    Returns:
        Created topic with auto-selected or provided icon
    """
    crud = TopicCRUD(session)
    topic = await crud.create(topic_data)

    # Broadcast metrics update to WebSocket clients
    await metrics_broadcaster.broadcast_on_topic_change(session)

    return topic


@router.patch(
    "/{topic_id}",
    response_model=TopicPublic,
    summary="Update topic",
    description="Update an existing topic by ID.",
)
async def update_topic(
    topic_id: uuid.UUID,
    topic_data: TopicUpdate,
    session: AsyncSession = Depends(get_session),
) -> TopicPublic:
    """Update an existing topic.

    Args:
        topic_id: Topic ID to update
        topic_data: Topic update data (all fields optional)
        session: Database session

    Returns:
        Updated topic

    Raises:
        HTTPException: 404 if topic not found
    """
    crud = TopicCRUD(session)
    topic = await crud.update(topic_id, topic_data)

    if not topic:
        raise HTTPException(status_code=404, detail=f"Topic with id {topic_id} not found")

    # Broadcast metrics update to WebSocket clients
    await metrics_broadcaster.broadcast_on_topic_change(session)

    return topic


@router.get(
    "/{topic_id}/suggest-color",
    summary="Suggest color for topic",
    description="Auto-suggest color based on topic name and icon",
)
async def suggest_topic_color(
    topic_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Suggest color for topic based on its icon.

    Returns auto-selected color that can be applied to the topic.
    """
    query = select(Topic).where(Topic.id == topic_id)
    result = await session.execute(query)
    topic = result.scalar_one_or_none()

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic with ID {topic_id} not found",
        )

    icon = topic.icon or auto_select_icon(topic.name, topic.description)
    suggested_color = auto_select_color(icon)

    return {
        "topic_id": topic_id,
        "suggested_color": suggested_color,
        "icon": icon,
    }


@router.get(
    "/{topic_id}/atoms",
    response_model=list[AtomPublic],
    summary="Get atoms for topic",
    description="Retrieve all atoms associated with a specific topic.",
)
async def get_topic_atoms(
    topic_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> list[AtomPublic]:
    """Get all atoms belonging to a topic.

    Returns atoms ordered by their position within the topic (if set),
    then by creation date (newest first).

    Args:
        topic_id: Topic ID to retrieve atoms for
        session: Database session

    Returns:
        List of atoms associated with the topic

    Raises:
        HTTPException: 404 if topic not found
    """
    topic = await session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic with ID {topic_id} not found",
        )

    crud = AtomCRUD(session)
    return await crud.list_by_topic(topic_id)


@router.get(
    "/{topic_id}/messages",
    response_model=list[MessageResponse],
    summary="Get messages for topic",
    description="Retrieve all messages associated with a specific topic.",
)
async def get_topic_messages(
    topic_id: uuid.UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session),
) -> list[MessageResponse]:
    """Get all messages belonging to a topic.

    Returns messages ordered by sent date (newest first).
    Useful for viewing conversation threads or message collections
    organized under a specific topic.

    Args:
        topic_id: Topic ID to retrieve messages for
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        session: Database session

    Returns:
        List of messages associated with the topic

    Raises:
        HTTPException: 404 if topic not found
    """
    topic = await session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic with ID {topic_id} not found",
        )

    crud = MessageCRUD(session)
    return await crud.list_by_topic(topic_id, skip=skip, limit=limit)
