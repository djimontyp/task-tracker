import logging
import uuid
from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import and_, func, select
from pydantic import BaseModel

from app.api.v1.response_models import PaginatedMessagesResponse
from app.dependencies import DatabaseDep
from app.models import Message, Source, Topic, User
from app.schemas.messages import (
    MessageCreateRequest,
    MessageFiltersResponse,
    MessageResponse,
)
from app.services.message_inspect_service import (
    MessageInspectResponse,
    MessageInspectService,
)
from app.services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["messages"])


class ReassignRequest(BaseModel):
    """Request schema for topic reassignment."""

    new_topic_id: str
    reason: str | None = None


class RejectRequest(BaseModel):
    """Request schema for message rejection."""

    reason: Literal["wrong_topic", "noise", "duplicate", "other"]
    comment: str | None = None


@router.post(
    "",
    summary="Create a new message",
    response_description="Confirmation with created message ID",
    status_code=201,
)
async def create_message(message: MessageCreateRequest, db: DatabaseDep) -> dict[str, str | int]:
    """
    Create a new message.

    Requires author_id (User.id) and source_id.
    Broadcasts created message to WebSocket clients in real-time.
    """
    # Verify source exists
    source = await db.get(Source, message.source_id)
    if not source:
        raise HTTPException(status_code=404, detail=f"Source {message.source_id} not found")

    # Verify user exists
    user = await db.get(User, message.author_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {message.author_id} not found")

    # Create message
    db_message = Message(
        external_message_id=message.external_message_id,
        content=message.content,
        sent_at=message.sent_at,
        source_id=message.source_id,
        author_id=message.author_id,
        telegram_profile_id=message.telegram_profile_id,
        avatar_url=message.avatar_url or user.avatar_url,
    )

    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)

    # Fetch topic if assigned
    topic_name = None
    if db_message.topic_id:
        topic = await db.get(Topic, db_message.topic_id)
        topic_name = topic.name if topic else None

    # Build response
    response = MessageResponse(
        id=db_message.id or 0,
        external_message_id=db_message.external_message_id,
        content=db_message.content,
        sent_at=db_message.sent_at,
        source_id=source.id or 0,
        source_name=source.name,
        author_id=user.id or 0,
        author_name=user.full_name,
        avatar_url=db_message.avatar_url,
        telegram_profile_id=db_message.telegram_profile_id,
        topic_id=db_message.topic_id,
        topic_name=topic_name,
        classification=db_message.classification,
        confidence=db_message.confidence,
        analyzed=db_message.analyzed,
        importance_score=db_message.importance_score,
        noise_classification=db_message.noise_classification,
        noise_factors=db_message.noise_factors,
        created_at=db_message.created_at,
        updated_at=db_message.updated_at,
    )

    # Broadcast via WebSocket
    response_data = response.model_dump()
    response_data["sent_at"] = response_data["sent_at"].isoformat()
    if response_data.get("created_at"):
        response_data["created_at"] = response_data["created_at"].isoformat()
    await websocket_manager.broadcast("messages", {"type": "message.new", "data": response_data})

    return {"status": "message received", "id": db_message.id or 0}


@router.get(
    "",
    response_model=PaginatedMessagesResponse,
    summary="Get messages list with pagination",
    response_description="Paginated list of messages with optional filters applied",
)
async def get_messages(
    db: DatabaseDep,
    page: int = Query(1, ge=1, description="Page number (starting from 1)"),
    page_size: int = Query(50, ge=1, le=1000, description="Number of items per page"),
    author: str | None = Query(None, description="Filter by author name"),
    source: str | None = Query(None, description="Filter by source name"),
    topic_id: uuid.UUID | None = Query(None, description="Filter by topic ID"),
    date_from: date | None = Query(None, description="Filter messages from this date"),
    date_to: date | None = Query(None, description="Filter messages until this date"),
    importance_min: float | None = Query(None, ge=0.0, le=1.0, description="Filter by importance score >= min"),
    importance_max: float | None = Query(None, ge=0.0, le=1.0, description="Filter by importance score <= max"),
    classification: list[str] | None = Query(
        None, description="Filter by noise classification (signal, noise, spam, low_quality, high_quality)"
    ),
    sort_by: str | None = Query(None, description="Column to sort by (author_name, source_name, analyzed, sent_at)"),
    sort_order: str | None = Query("desc", description="Sort order (asc or desc)"),
) -> PaginatedMessagesResponse:
    """
    Retrieve messages with pagination and optional filtering.

    Supports filtering by author, source, topic, date range, and noise classification.
    Importance score filtering allows finding high-signal messages (>0.7) or noise (<0.3).
    Returns most recent messages first with pagination support.
    """
    # Build base query with joins
    from sqlalchemy import column, or_

    statement = select(Message, User, Source, Topic).join(User).join(Source).outerjoin(Topic)

    filters = []

    if author:
        # Search in User first_name or last_name
        filters.append(or_(column("first_name").ilike(f"%{author}%"), column("last_name").ilike(f"%{author}%")))

    if source:
        filters.append(column("name").ilike(f"%{source}%"))

    if topic_id is not None:
        filters.append(Message.topic_id == topic_id)  # type: ignore[arg-type]

    if date_from:
        filters.append(Message.sent_at >= datetime.combine(date_from, datetime.min.time()))  # type: ignore[arg-type]

    if date_to:
        filters.append(Message.sent_at <= datetime.combine(date_to, datetime.max.time()))  # type: ignore[arg-type]

    if importance_min is not None:
        filters.append(Message.importance_score >= importance_min)  # type: ignore[arg-type,operator]

    if importance_max is not None:
        filters.append(Message.importance_score <= importance_max)  # type: ignore[arg-type,operator]

    if classification:
        filters.append(Message.noise_classification.in_(classification))  # type: ignore[union-attr]

    if filters:
        statement = statement.where(and_(*filters))

    # Count total items
    count_statement = select(func.count()).select_from(Message).join(User).join(Source)
    if filters:
        count_statement = count_statement.where(and_(*filters))

    count_result = await db.execute(count_statement)
    total = count_result.scalar() or 0

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size

    # Apply sorting
    from typing import Any

    from sqlalchemy import ColumnElement, asc, desc

    sort_column: ColumnElement[Any]
    if sort_by == "author_name":
        sort_column = column("first_name")
    elif sort_by == "source_name":
        sort_column = column("name")
    elif sort_by == "analyzed":
        sort_column = column("analyzed")
    elif sort_by == "sent_at":
        sort_column = column("sent_at")
    else:
        # Default: sort by sent_at (when message was actually sent)
        sort_column = column("sent_at")

    # Apply sort order
    if sort_order == "asc":
        statement = statement.order_by(asc(sort_column))
    else:
        statement = statement.order_by(desc(sort_column))

    # Fetch paginated data
    statement = statement.offset(offset).limit(page_size)

    result = await db.execute(statement)
    messages_data = result.all()

    # Build response
    items = []
    for msg, user, source_item, topic_item in messages_data:
        # Type assertion: we know source_item is Source from our query
        source_obj = source_item if isinstance(source_item, Source) else Source()
        topic_obj = topic_item if isinstance(topic_item, Topic) else None
        items.append(
            MessageResponse(
                id=msg.id or 0,
                external_message_id=msg.external_message_id,
                content=msg.content,
                sent_at=msg.sent_at,
                source_id=source_obj.id or 0,
                source_name=source_obj.name,
                author_id=user.id or 0,
                author_name=user.full_name,
                avatar_url=msg.avatar_url,
                telegram_profile_id=msg.telegram_profile_id,
                topic_id=msg.topic_id,
                topic_name=topic_obj.name if topic_obj else None,
                classification=msg.classification,
                confidence=msg.confidence,
                analyzed=msg.analyzed,
                importance_score=msg.importance_score,
                noise_classification=msg.noise_classification,
                noise_factors=msg.noise_factors,
                created_at=msg.created_at,
                updated_at=msg.updated_at,
            )
        )

    return PaginatedMessagesResponse.model_validate({
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    })


@router.get(
    "/filters",
    response_model=MessageFiltersResponse,
    summary="Get message filter options",
    response_description="Available filter values and message statistics",
)
async def get_message_filters(db: DatabaseDep) -> MessageFiltersResponse:
    """
    Get available filter options for messages.

    Returns unique authors, sources, date range, and total message count
    for building filter UI components.
    """
    # Get unique authors (User full names)
    from sqlalchemy import column

    authors_statement = select(User.first_name, User.last_name).distinct().join(Message)
    authors_result = await db.execute(authors_statement)
    authors_data = authors_result.all()

    # Build full names
    authors = []
    for first_name, last_name in authors_data:
        if last_name:
            authors.append(f"{first_name} {last_name}".strip())
        else:
            authors.append(first_name)

    # Get unique sources
    from typing import Any

    from sqlalchemy.sql import Select

    sources_statement: Select[Any] = select(column("id"), column("name")).select_from(Source).distinct().join(Message)
    sources_result = await db.execute(sources_statement)
    sources: list[dict[str, int | str]] = [
        {"id": int(source_id) if source_id else 0, "name": str(source_name)}
        for source_id, source_name in sources_result.all()
    ]

    # Total messages count
    count_statement = select(func.count())
    count_result = await db.execute(count_statement)
    total_messages = count_result.scalar() or 0

    # Date range
    date_range_statement = select(func.min(Message.sent_at), func.max(Message.sent_at))
    date_range_result = await db.execute(date_range_statement)
    min_date, max_date = date_range_result.one()

    date_range = {
        "min": min_date,
        "max": max_date,
    }

    return MessageFiltersResponse(
        authors=sorted(authors),
        sources=sources,
        date_range=date_range,
    )


@router.get(
    "/{message_id}/inspect",
    response_model=MessageInspectResponse,
    summary="Get full message inspection details",
    response_description="Complete message inspection data for MessageInspectModal",
)
async def inspect_message(
    message_id: uuid.UUID,
    db: DatabaseDep,
) -> MessageInspectResponse:
    """
    Get full inspection details for a message.

    Returns comprehensive data for MessageInspectModal:
    - Message metadata (content, source, timestamp)
    - Classification details (confidence, reasoning, topic)
    - Extracted atoms (entities, keywords, embeddings)
    - Classification history (reassignments, approvals)
    """
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    service = MessageInspectService(db)

    message_detail = await service.get_message_detail(message)
    classification = await service.get_classification_detail(message)
    atoms = await service.get_atoms_detail(message_id)
    history = await service.get_message_history(message_id)

    return MessageInspectResponse(
        message=message_detail,
        classification=classification,
        atoms=atoms,
        history=history,
    )


@router.put(
    "/{message_id}/reassign",
    summary="Reassign message to different topic",
    response_description="Success confirmation with updated message",
)
async def reassign_message_topic(
    message_id: uuid.UUID,
    data: ReassignRequest,
    db: DatabaseDep,
) -> dict[str, bool | str]:
    """
    Reassign message to a different topic.

    Steps:
    1. Validate message exists
    2. Validate new topic exists
    3. Update message.topic_id
    4. Log history event (reassignment)
    5. Broadcast WebSocket update
    6. Return updated message
    """
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    try:
        new_topic_uuid = uuid.UUID(data.new_topic_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid topic ID format")

    topic = await db.get(Topic, new_topic_uuid)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    old_topic_id = message.topic_id

    message.topic_id = new_topic_uuid
    db.add(message)

    service = MessageInspectService(db)
    await service.create_history_event(
        message_id=message_id,
        action="reassigned",
        from_topic=old_topic_id,
        to_topic=new_topic_uuid,
        reason=data.reason,
    )

    await db.commit()
    await db.refresh(message)

    await websocket_manager.broadcast(
        "messages",
        {
            "type": "message.reassigned",
            "data": {
                "id": str(message_id),
                "old_topic": str(old_topic_id) if old_topic_id else None,
                "new_topic": str(new_topic_uuid),
            },
        },
    )

    return {"success": True, "message_id": str(message_id)}


@router.post(
    "/{message_id}/approve",
    summary="Approve message classification",
    response_description="Success confirmation with approval status",
)
async def approve_message_classification(
    message_id: uuid.UUID,
    db: DatabaseDep,
) -> dict[str, bool | str]:
    """
    Approve message classification as correct.

    Steps:
    1. Update message.status = "approved"
    2. Log history event
    3. Store feedback for model retraining
    4. Broadcast WebSocket update
    """
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.status = "approved"
    message.approved_at = datetime.utcnow()
    db.add(message)

    service = MessageInspectService(db)
    await service.create_history_event(
        message_id=message_id,
        action="approved",
    )

    await service.store_classification_feedback(
        message_id=message_id,
        is_correct=True,
        confidence=message.confidence,
        topic_id=message.topic_id,
    )

    await db.commit()

    await websocket_manager.broadcast(
        "messages",
        {
            "type": "message.approved",
            "data": {"id": str(message_id), "status": "approved"},
        },
    )

    return {"success": True, "status": "approved"}


@router.post(
    "/{message_id}/reject",
    summary="Reject message classification",
    response_description="Success confirmation with rejection status",
)
async def reject_message_classification(
    message_id: uuid.UUID,
    data: RejectRequest,
    db: DatabaseDep,
) -> dict[str, bool | str]:
    """
    Reject message classification as incorrect.

    Steps:
    1. Update message.status = "rejected"
    2. Store rejection reason
    3. Log history event
    4. Store feedback for model retraining (negative sample)
    5. Broadcast WebSocket update
    """
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.status = "rejected"
    message.rejected_at = datetime.utcnow()
    message.rejection_reason = data.reason
    message.rejection_comment = data.comment
    db.add(message)

    service = MessageInspectService(db)
    await service.create_history_event(
        message_id=message_id,
        action="rejected",
        reason=data.reason,
    )

    await service.store_classification_feedback(
        message_id=message_id,
        is_correct=False,
        reason=data.reason,
        comment=data.comment,
        confidence=message.confidence,
        topic_id=message.topic_id,
    )

    await db.commit()

    await websocket_manager.broadcast(
        "messages",
        {
            "type": "message.rejected",
            "data": {"id": str(message_id), "status": "rejected", "reason": data.reason},
        },
    )

    return {"success": True, "status": "rejected"}
