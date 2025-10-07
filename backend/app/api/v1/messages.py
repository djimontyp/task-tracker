import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Query
from sqlmodel import and_, func, select

from app.models import (
    SimpleMessage,
    SimpleSource,
)
from .response_models import (
    MessageCreateRequest,
    MessageFiltersResponse,
    MessageResponse,
    PaginatedMessagesResponse,
)
from ...webhook_service import telegram_webhook_service
from ...websocket import manager
from ...services.telegram_client_service import get_telegram_client_service
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
        telegram_user_id=db_message.telegram_user_id,
        telegram_username=db_message.telegram_username,
        first_name=db_message.first_name,
        last_name=db_message.last_name,
    )

    response_data = response.model_dump()
    response_data["sent_at"] = response_data["sent_at"].isoformat()
    await manager.broadcast({"type": "message.new", "data": response_data})

    return {"status": "message received", "id": db_message.id}


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
    author: Optional[str] = Query(None, description="Filter by message author"),
    source: Optional[str] = Query(None, description="Filter by message source"),
    date_from: Optional[date] = Query(
        None, description="Filter messages from this date"
    ),
    date_to: Optional[date] = Query(
        None, description="Filter messages until this date"
    ),
    sort_by: Optional[str] = Query(None, description="Column to sort by (author, source_name, analyzed, sent_at)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
) -> PaginatedMessagesResponse:
    """
    Retrieve messages with pagination and optional filtering.

    Supports filtering by author, source, and date range.
    Returns most recent messages first with pagination support.
    """
    # Build base query
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

    # Count total items
    count_statement = (
        select(func.count(SimpleMessage.id))
        .select_from(SimpleMessage)
        .join(SimpleSource, SimpleMessage.source_id == SimpleSource.id)
    )
    if filters:
        count_statement = count_statement.where(and_(*filters))

    count_result = await db.execute(count_statement)
    total = count_result.scalar() or 0

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size

    # Apply sorting
    sort_column = SimpleMessage.created_at  # default
    if sort_by:
        if sort_by == "author":
            sort_column = SimpleMessage.author
        elif sort_by == "source_name":
            sort_column = SimpleSource.name
        elif sort_by == "analyzed":
            sort_column = SimpleMessage.analyzed
        elif sort_by == "sent_at":
            sort_column = SimpleMessage.sent_at

    # Apply sort order
    if sort_order == "asc":
        statement = statement.order_by(sort_column.asc())
    else:
        statement = statement.order_by(sort_column.desc())

    # Fetch paginated data
    statement = statement.offset(offset).limit(page_size)

    result = await db.execute(statement)
    messages_with_sources = result.all()

    # Build response
    items = []
    for msg, source in messages_with_sources:
        items.append(
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
                telegram_user_id=msg.telegram_user_id,
                telegram_username=msg.telegram_username,
                first_name=msg.first_name,
                last_name=msg.last_name,
            )
        )

    return PaginatedMessagesResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


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


@router.post(
    "/update-authors",
    summary="Update message authors from Telegram",
    response_description="Result of author update operation",
)
async def update_message_authors(
    db: DatabaseDep,
    chat_id: int = Query(..., description="Telegram chat ID to fetch messages from")
):
    """
    Update author information for messages by re-fetching from Telegram chat.

    Fetches messages from Telegram chat and updates user data including
    first_name, last_name, telegram_username, telegram_user_id, and avatar.
    """
    try:
        # Get telegram client service
        client_service = get_telegram_client_service()

        # Connect to Telegram
        await client_service.connect()

        # Find messages from telegram source with missing user data
        telegram_source_stmt = select(SimpleSource).where(SimpleSource.name == "telegram")
        source_result = await db.execute(telegram_source_stmt)
        telegram_source = source_result.scalar_one_or_none()

        if not telegram_source:
            return {
                "success": False,
                "error": "Telegram source not found",
                "message": "No telegram source exists in database"
            }

        # Get messages that need updating (missing first_name or telegram_user_id)
        statement = select(SimpleMessage).where(
            and_(
                SimpleMessage.source_id == telegram_source.id,
                SimpleMessage.first_name.is_(None)
            )
        )
        result = await db.execute(statement)
        messages_to_update = result.scalars().all()

        logger.info(f"Found {len(messages_to_update)} messages to update")

        # Fetch messages from Telegram chat
        telegram_messages = await client_service.fetch_group_history(
            chat_id=chat_id,
            limit=1000  # Fetch up to 1000 recent messages
        )

        # Create mapping of external_message_id to telegram message data
        telegram_data_map = {
            str(msg.get("message_id")): msg
            for msg in telegram_messages
        }

        updated_count = 0
        failed_count = 0

        for message in messages_to_update:
            try:
                # Find corresponding telegram message
                telegram_msg = telegram_data_map.get(message.external_message_id)

                if not telegram_msg:
                    logger.warning(f"No telegram data found for message {message.external_message_id}")
                    failed_count += 1
                    continue

                # Extract user data
                from_user = telegram_msg.get("from", {})
                user_id = from_user.get("id")
                first_name = from_user.get("first_name", "")
                last_name = from_user.get("last_name", "")
                username = from_user.get("username")

                # Update message
                message.telegram_user_id = user_id
                message.first_name = first_name
                message.last_name = last_name
                message.telegram_username = username

                # Update display name
                display_name = f"{first_name} {last_name}".strip()
                message.author = display_name or username or "Unknown"

                # Fetch avatar
                if user_id:
                    try:
                        avatar_url = await telegram_webhook_service.get_user_avatar_url(user_id)
                        if avatar_url:
                            message.avatar_url = avatar_url
                    except Exception as avatar_exc:
                        logger.warning(f"Failed to fetch avatar for user {user_id}: {avatar_exc}")

                updated_count += 1
                logger.info(f"Updated message {message.id} with author: {message.author}")

            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to update message {message.id}: {e}")

        # Commit all updates
        await db.commit()

        # Disconnect from Telegram
        await client_service.disconnect()

        return {
            "success": True,
            "updated": updated_count,
            "failed": failed_count,
            "total": len(messages_to_update),
            "message": f"Updated {updated_count} messages, {failed_count} failed"
        }

    except Exception as e:
        logger.error(f"Error updating message authors: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update message authors"
        }
