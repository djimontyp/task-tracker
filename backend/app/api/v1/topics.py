"""API endpoints for Topic management.

Provides endpoints for managing topics including CRUD operations and icon listing.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import (
    TOPIC_ICONS,
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
from app.services import AtomCRUD, TopicCRUD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/topics", tags=["topics"])


@router.get(
    "",
    response_model=TopicListResponse,
    summary="List topics",
    description="Get list of all topics with pagination.",
)
async def list_topics(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session),
) -> TopicListResponse:
    """List all topics with pagination.

    Returns topics sorted by creation date (newest first).
    Topics are used for categorizing messages and tasks.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        session: Database session

    Returns:
        List of topics with pagination metadata
    """
    crud = TopicCRUD(session)
    topics, total = await crud.list(skip=skip, limit=limit)
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
    "/{topic_id}",
    response_model=TopicPublic,
    summary="Get topic by ID",
    description="Retrieve a specific topic by its ID.",
)
async def get_topic(
    topic_id: int,
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
    return await crud.create(topic_data)


@router.patch(
    "/{topic_id}",
    response_model=TopicPublic,
    summary="Update topic",
    description="Update an existing topic by ID.",
)
async def update_topic(
    topic_id: int,
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

    return topic


@router.get(
    "/{topic_id}/suggest-color",
    summary="Suggest color for topic",
    description="Auto-suggest color based on topic name and icon",
)
async def suggest_topic_color(
    topic_id: int,
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
    topic_id: int,
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
    topic_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[MessageResponse]:
    """Get all messages belonging to a topic.

    Returns messages ordered by sent date (newest first).
    Useful for viewing conversation threads or message collections
    organized under a specific topic.

    Args:
        topic_id: Topic ID to retrieve messages for
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

    # TODO: Implement proper message-topic relationship
    # Currently messages are not directly linked to topics in the database.
    # Future implementation should either:
    # 1. Add topic_id field to messages table, OR
    # 2. Create atom_messages relationship table (Message -> Atom -> Topic)
    #
    # For now, return empty list to avoid SQL errors
    return []
