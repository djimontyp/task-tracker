import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Query
from sqlmodel import and_, func, select

from ...models import (
    MessageCreateRequest,
    MessageFiltersResponse,
    MessageResponse,
    SimpleMessage,
    SimpleSource,
)
from ...webhook_service import telegram_webhook_service
from ...websocket import manager
from ..deps import DatabaseDep

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["messages"])


@router.post(
    "",
    summary="Create a new message",
    response_description="Confirmation with created message ID",
    status_code=201,
)
async def create_message(message: MessageCreateRequest, db: DatabaseDep):
    """
    Create a new message from external API source.

    Automatically resolves avatar URL for Telegram users if not provided.
    Broadcasts created message to WebSocket clients in real-time.
    """
    source_statement = select(SimpleSource).where(SimpleSource.name == "api")
    result = await db.execute(source_statement)
    source = result.scalar_one_or_none()

    if not source:
        source = SimpleSource(name="api", created_at=datetime.utcnow())
        db.add(source)
        await db.commit()
        await db.refresh(source)

    avatar_url = message.avatar_url

    if not avatar_url and message.user_id:
        try:
            avatar_url = await telegram_webhook_service.get_user_avatar_url(
                message.user_id
            )
        except Exception as exc:
            logger.warning("Failed to resolve avatar for %s: %s", message.user_id, exc)

    db_message = SimpleMessage(
        external_message_id=message.id,
        content=message.content,
        author=message.author,
        sent_at=datetime.fromisoformat(
            message.timestamp.replace("Z", "+00:00")
        ).replace(tzinfo=None),
        source_id=source.id,
        created_at=datetime.utcnow(),
        avatar_url=avatar_url,
    )

    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)

    response = MessageResponse(
        id=db_message.id,
        external_message_id=db_message.external_message_id,
        content=db_message.content,
        author=db_message.author,
        sent_at=db_message.sent_at,
        source_name=source.name,
        analyzed=db_message.analyzed,
        avatar_url=avatar_url,
        persisted=True,
    )

    response_data = response.model_dump()
    response_data["sent_at"] = response_data["sent_at"].isoformat()
    await manager.broadcast({"type": "message.new", "data": response_data})

    return {"status": "message received", "id": db_message.id}


@router.get(
    "",
    response_model=List[MessageResponse],
    summary="Get messages list",
    response_description="List of messages with optional filters applied",
)
async def get_messages(
    db: DatabaseDep,
    limit: int = 50,
    author: Optional[str] = Query(None, description="Filter by message author"),
    source: Optional[str] = Query(None, description="Filter by message source"),
    date_from: Optional[date] = Query(
        None, description="Filter messages from this date"
    ),
    date_to: Optional[date] = Query(
        None, description="Filter messages until this date"
    ),
) -> List[MessageResponse]:
    """
    Retrieve messages with optional filtering.

    Supports filtering by author, source, and date range.
    Returns most recent messages first, limited to specified count.
    """
    statement = select(SimpleMessage, SimpleSource).join(
        SimpleSource, SimpleMessage.source_id == SimpleSource.id
    )

    filters = []

    if author:
        filters.append(SimpleMessage.author.ilike(f"%{author}%"))

    if source:
        filters.append(SimpleSource.name.ilike(f"%{source}%"))

    if date_from:
        filters.append(
            SimpleMessage.sent_at >= datetime.combine(date_from, datetime.min.time())
        )

    if date_to:
        filters.append(
            SimpleMessage.sent_at <= datetime.combine(date_to, datetime.max.time())
        )

    if filters:
        statement = statement.where(and_(*filters))

    statement = statement.order_by(SimpleMessage.created_at.desc()).limit(limit)

    result = await db.execute(statement)
    messages_with_sources = result.all()

    response_list = []
    for msg, source in messages_with_sources:
        response_list.append(
            MessageResponse(
                id=msg.id,
                external_message_id=msg.external_message_id,
                content=msg.content,
                author=msg.author,
                sent_at=msg.sent_at,
                source_name=source.name,
                analyzed=msg.analyzed,
                avatar_url=msg.avatar_url,
                persisted=True,
            )
        )

    return response_list


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
    authors_statement = (
        select(SimpleMessage.author).distinct().where(SimpleMessage.author.isnot(None))
    )
    authors_result = await db.execute(authors_statement)
    authors = [author for author in authors_result.scalars().all() if author]

    sources_statement = select(SimpleSource.name).distinct()
    sources_result = await db.execute(sources_statement)
    sources = [source for source in sources_result.scalars().all() if source]

    count_statement = select(func.count(SimpleMessage.id))
    count_result = await db.execute(count_statement)
    total_messages = count_result.scalar() or 0

    date_range_statement = select(
        func.min(SimpleMessage.sent_at), func.max(SimpleMessage.sent_at)
    )
    date_range_result = await db.execute(date_range_statement)
    min_date, max_date = date_range_result.one()

    date_range = {
        "earliest": min_date.date().isoformat() if min_date else None,
        "latest": max_date.date().isoformat() if max_date else None,
    }

    return MessageFiltersResponse(
        authors=sorted(authors),
        sources=sorted(sources),
        total_messages=total_messages,
        date_range=date_range,
    )
