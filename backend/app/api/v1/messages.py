import logging
from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import and_, func, select

from app.dependencies import DatabaseDep
from app.models import Message, Source, User
from app.schemas.messages import (
    MessageCreateRequest,
    MessageFiltersResponse,
    MessageResponse,
)
from app.services.websocket_manager import websocket_manager

from .response_models import PaginatedMessagesResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["messages"])


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
        classification=db_message.classification,
        confidence=db_message.confidence,
        analyzed=db_message.analyzed,
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
    topic_id: int | None = Query(None, description="Filter by topic ID"),
    date_from: date | None = Query(None, description="Filter messages from this date"),
    date_to: date | None = Query(None, description="Filter messages until this date"),
    sort_by: str | None = Query(None, description="Column to sort by (author_name, source_name, analyzed, sent_at)"),
    sort_order: str | None = Query("desc", description="Sort order (asc or desc)"),
) -> PaginatedMessagesResponse:
    """
    Retrieve messages with pagination and optional filtering.

    Supports filtering by author, source, topic, and date range.
    Returns most recent messages first with pagination support.
    """
    # Build base query with joins
    from sqlalchemy import column, or_

    statement = select(Message, User, Source).join(User).join(Source)

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
    for msg, user, source_item in messages_data:
        # Type assertion: we know source_item is Source from our query
        source_obj = source_item if isinstance(source_item, Source) else Source()
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
                classification=msg.classification,
                confidence=msg.confidence,
                analyzed=msg.analyzed,
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
