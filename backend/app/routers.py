from datetime import datetime, date, timedelta
import json
import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from sqlmodel import select, and_, func

logger = logging.getLogger(__name__)

from .dependencies import SettingsDep, DatabaseDep
from .websocket import manager
from core.crypto import encrypt_sensitive_data, decrypt_sensitive_data
from core.telegram import telegram_webhook_manager
from .models import (
    TaskCreateRequest,
    TaskResponse,
    MessageCreateRequest,
    MessageResponse,
    StatsResponse,
    MessageFiltersResponse,
    SimpleTask,
    SimpleMessage,
    SimpleSource,
    # Settings,
    # SettingsRequest,
    # SettingsResponse,
)
from .schemas import (
    WebhookConfigResponse,
    TelegramWebhookConfig,
    SetWebhookRequest,
    SetWebhookResponse,
    UpdateTelegramGroupIdsRequest,
    AddTelegramGroupRequest,
    RemoveTelegramGroupRequest,
)
from .tasks import save_telegram_message
from .webhook_service import telegram_webhook_service, webhook_settings_service

router = APIRouter()
api_router = APIRouter(prefix="/api")


# ~~~~~~~~~~~~~~~~ Основні роути ~~~~~~~~~~~~~~~~


@router.get("/")
async def root():
    return {"message": "Task Tracker API", "status": "running"}


@router.post("/")
async def root_post(request: Request):
    """Handle unexpected POST requests to root - likely misconfigured webhook"""
    try:
        body = await request.body()
        print(f"⚠️ Unexpected POST to root endpoint. Body: {body.decode()[:200]}...")
        return {
            "status": "redirect",
            "message": "Use /webhook/telegram for Telegram webhooks",
        }
    except Exception as e:
        print(f"⚠️ Error handling POST to root: {e}")
        return {"status": "error", "message": "Invalid request to root endpoint"}


# ~~~~~~~~~~~~~~~~ API роути для конфігурації та перевірки здоров'я ~~~~~~~~~~~~~~~~


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


@api_router.get("/config")
async def get_client_config(settings: SettingsDep):
    """Get client-side configuration"""
    base_url = settings.api_base_url.replace("http://", "").replace("https://", "")
    return {"wsUrl": f"ws://{base_url}/ws", "apiBaseUrl": f"http://{base_url}"}


# ~~~~~~~~~~~~~~~~ API роути для налаштувань ~~~~~~~~~~~~~~~~


# @api_router.get("/settings", response_model=SettingsResponse)
# async def get_settings(db: DatabaseDep, settings: SettingsDep):
#     """
#     Get current application settings with decrypted sensitive data
#
#     Returns decrypted Telegram bot token and webhook configuration.
#     If no settings exist, returns defaults from environment.
#     """
#     # Try to get settings from database
#     statement = select(Settings).where(Settings.id == 1)
#     result = await db.execute(statement)
#     db_settings = result.scalar_one_or_none()
#
#     if db_settings:
#         # Decrypt sensitive data
#         try:
#             decrypted_token = ""
#             if db_settings.telegram_bot_token_encrypted:
#                 decrypted_token = decrypt_sensitive_data(
#                     db_settings.telegram_bot_token_encrypted
#                 )
#                 # Truncate token for security in response
#                 if len(decrypted_token) > 10:
#                     decrypted_token = decrypted_token[:10] + "...[truncated]"
#         except Exception as e:
#             print(f"Warning: Could not decrypt bot token: {e}")
#             decrypted_token = "[encrypted - cannot decrypt]"
#
#         return SettingsResponse(
#             telegram={
#                 "bot_token": decrypted_token,
#                 "webhook_base_url": db_settings.telegram_webhook_base_url
#                 or settings.webhook_base_url,
#             },
#             updated_at=db_settings.updated_at,
#         )
#     else:
#         # Return defaults from environment
#         env_token = settings.telegram_bot_token
#         if env_token and len(env_token) > 10:
#             env_token = env_token[:10] + "...[truncated]"
#
#         return SettingsResponse(
#             telegram={
#                 "bot_token": env_token,
#                 "webhook_base_url": settings.webhook_base_url,
#             },
#             updated_at=None,
#         )


# @api_router.post("/settings", response_model=SettingsResponse)
# async def update_settings(
#     request: SettingsRequest, db: DatabaseDep, settings: SettingsDep
# ):
#     """
#     Update application settings and automatically configure Telegram webhook
#
#     This endpoint:
#     1. Validates the Telegram bot token
#     2. Encrypts and saves settings to database
#     3. Automatically sets up the Telegram webhook
#     4. Returns the updated settings
#     """
#     telegram_config = request.telegram
#     bot_token = telegram_config.get("bot_token", "").strip()
#     webhook_base_url = telegram_config.get("webhook_base_url", "").strip()
#
#     # Use fallback webhook URL if not provided
#     if not webhook_base_url:
#         webhook_base_url = settings.webhook_base_url
#
#     # Validate bot token if provided
#     if bot_token:
#         print("🔍 Validating Telegram bot token...")
#         validation_result = await telegram_webhook_manager.validate_bot_token(bot_token)
#
#         if not validation_result["valid"]:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Invalid Telegram bot token: {validation_result['error']}",
#             )
#
#         print(f"✅ Bot token validated. Bot info: {validation_result['bot_info']}")
#
#     # Get or create settings record
#     statement = select(Settings).where(Settings.id == 1)
#     result = await db.execute(statement)
#     db_settings = result.scalar_one_or_none()
#
#     if db_settings:
#         # Update existing settings
#         if bot_token:
#             db_settings.telegram_bot_token_encrypted = encrypt_sensitive_data(bot_token)
#         db_settings.telegram_webhook_base_url = webhook_base_url
#     else:
#         # Create new settings record
#         db_settings = Settings(
#             id=1,  # Singleton pattern
#             telegram_bot_token_encrypted=encrypt_sensitive_data(bot_token)
#             if bot_token
#             else None,
#             telegram_webhook_base_url=webhook_base_url,
#         )
#         db.add(db_settings)
#
#     await db.commit()
#     await db.refresh(db_settings)
#
#     # Set up Telegram webhook if bot token is provided
#     webhook_result = None
#     if bot_token:
#         print("🔧 Setting up Telegram webhook...")
#         webhook_result = await telegram_webhook_manager.setup_webhook(
#             bot_token, webhook_base_url
#         )
#
#         if not webhook_result["success"]:
#             print(f"⚠️  Webhook setup failed: {webhook_result['error']}")
#             # We don't fail the entire request if webhook setup fails
#             # Settings are still saved, but we include the webhook error info
#         else:
#             print(f"✅ Webhook configured: {webhook_result['webhook_url']}")
#
#     # Prepare response (truncate token for security)
#     response_token = ""
#     if bot_token and len(bot_token) > 10:
#         response_token = bot_token[:10] + "...[truncated]"
#     elif bot_token:
#         response_token = bot_token
#
#     response = SettingsResponse(
#         telegram={"bot_token": response_token, "webhook_base_url": webhook_base_url},
#         updated_at=db_settings.updated_at,
#     )
#
#     # Add webhook setup result to response if attempted
#     if webhook_result:
#         webhook_status = "configured" if webhook_result["success"] else "failed"
#         print(f"📡 Webhook status: {webhook_status}")
#
#     return response


# ~~~~~~~~~~~~~~~~ Роути для WebSocket з'єднань ~~~~~~~~~~~~~~~~


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates only (no history)"""
    await manager.connect(websocket)
    try:
        # Send connection confirmation
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection",
                    "data": {
                        "status": "connected",
                        "message": "Ready for real-time updates",
                    },
                }
            )
        )

        # Keep connection alive for real-time messages only
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ~~~~~~~~~~~~~~~~ API роути для повідомлень ~~~~~~~~~~~~~~~~


@api_router.post("/messages")
async def create_message(message: MessageCreateRequest, db: DatabaseDep):
    source_statement = select(SimpleSource).where(SimpleSource.name == "api")
    result = await db.execute(source_statement)
    source = result.scalar_one_or_none()

    if not source:
        source = SimpleSource(name="api", created_at=datetime.utcnow())
        db.add(source)
        await db.commit()
        await db.refresh(source)

    db_message = SimpleMessage(
        external_message_id=message.id,
        content=message.content,
        author=message.author,
        sent_at=datetime.fromisoformat(
            message.timestamp.replace("Z", "+00:00")
        ).replace(tzinfo=None),
        source_id=source.id,
        created_at=datetime.utcnow(),
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
    )

    # Fix datetime serialization for WebSocket
    response_data = response.model_dump()
    response_data["sent_at"] = response_data["sent_at"].isoformat()
    await manager.broadcast({"type": "message", "data": response_data})

    return {"status": "message received", "id": db_message.id}


@api_router.get("/messages", response_model=List[MessageResponse])
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
):
    # Start with base query joining message and source tables
    statement = select(SimpleMessage, SimpleSource).join(
        SimpleSource, SimpleMessage.source_id == SimpleSource.id
    )

    # Build filter conditions
    filters = []

    if author:
        filters.append(SimpleMessage.author.ilike(f"%{author}%"))

    if source:
        filters.append(SimpleSource.name.ilike(f"%{source}%"))

    if date_from:
        # Convert date to datetime for comparison (start of day)
        filters.append(
            SimpleMessage.sent_at >= datetime.combine(date_from, datetime.min.time())
        )

    if date_to:
        # Convert date to datetime for comparison (end of day)
        filters.append(
            SimpleMessage.sent_at <= datetime.combine(date_to, datetime.max.time())
        )

    # Apply filters if any exist
    if filters:
        statement = statement.where(and_(*filters))

    # Add ordering and limit
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
                source_name=source.name,  # Actual source name from database
                analyzed=msg.analyzed,
            )
        )

    return response_list


@api_router.get("/messages/filters", response_model=MessageFiltersResponse)
async def get_message_filters(db: DatabaseDep):
    """Get metadata for message filtering (authors, sources, date range)"""

    # Get unique authors
    authors_statement = (
        select(SimpleMessage.author).distinct().where(SimpleMessage.author.isnot(None))
    )
    authors_result = await db.execute(authors_statement)
    authors = [author for author in authors_result.scalars().all() if author]

    # Get unique sources
    sources_statement = select(SimpleSource.name).distinct()
    sources_result = await db.execute(sources_statement)
    sources = [source for source in sources_result.scalars().all() if source]

    # Get total message count
    count_statement = select(func.count(SimpleMessage.id))
    count_result = await db.execute(count_statement)
    total_messages = count_result.scalar() or 0

    # Get date range (earliest and latest message dates)
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
        authors=sorted(authors),  # Sort alphabetically for better UX
        sources=sorted(sources),
        total_messages=total_messages,
        date_range=date_range,
    )


# ~~~~~~~~~~~~~~~~ Роути для вебхуків ~~~~~~~~~~~~~~~~


@router.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """Handle Telegram webhook updates with instant response"""
    try:
        update_data = await request.json()

        if "message" in update_data:
            message = update_data["message"]

            # Create instant response for WebSocket (no DB required)
            live_response = MessageResponse(
                id=0,  # Temporary ID for live display
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=message.get("from", {}).get("first_name", "Unknown"),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_name="telegram",
            )

            # Instant WebSocket broadcast (no waiting for DB)
            message_data = live_response.model_dump()
            message_data["sent_at"] = message_data[
                "sent_at"
            ].isoformat()  # Convert datetime to string
            await manager.broadcast({"type": "message", "data": message_data})

            # Schedule background database save
            try:
                await save_telegram_message.kiq(update_data)
                print(
                    f"✅ TaskIQ завдання відправлено для повідомлення {message['message_id']}"
                )
            except Exception as e:
                print(f"❌ TaskIQ помилка: {e}")
                # Не блокуємо webhook через TaskIQ помилки

            print(f"⚡ Instant Telegram message broadcast: {message['message_id']}")

        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


# ~~~~~~~~~~~~~~~~ API роути для завдань ~~~~~~~~~~~~~~~~


@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(db: DatabaseDep):
    statement = select(SimpleTask).order_by(SimpleTask.created_at.desc())
    result = await db.execute(statement)
    tasks = result.scalars().all()

    return [TaskResponse.from_orm(task) for task in tasks]


@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreateRequest, db: DatabaseDep):
    db_task = SimpleTask(
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        source=task.source,
        status="open",
        created_at=datetime.utcnow(),
    )

    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    response = TaskResponse.from_orm(db_task)

    # Fix datetime serialization for WebSocket
    response_data = response.model_dump()
    response_data["created_at"] = response_data["created_at"].isoformat()
    await manager.broadcast({"type": "task_created", "data": response_data})

    return response


@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DatabaseDep):
    statement = select(SimpleTask).where(SimpleTask.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse.from_orm(task)


@api_router.put("/tasks/{task_id}/status")
async def update_task_status(task_id: int, status: str, db: DatabaseDep):
    statement = select(SimpleTask).where(SimpleTask.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = status
    db.add(task)
    await db.commit()

    return {"message": "Task status updated", "task_id": task_id, "status": status}


# ~~~~~~~~~~~~~~~~ API роути для статистики ~~~~~~~~~~~~~~~~


@api_router.get("/activity")
async def get_activity_data(
    db: DatabaseDep,
    period: str = Query("week", description="Period type: 'week' or 'month'"),
    month: Optional[int] = Query(None, description="Month (0-11, for month period)"),
    year: Optional[int] = Query(None, description="Year (for month period)"),
):
    """
    Get message activity data grouped by hour and day for heatmap visualization

    Returns activity data points with timestamp, source, and count
    """
    # Calculate date range based on period
    if period == "month":
        # Use provided month/year or current
        target_month = month if month is not None else datetime.utcnow().month - 1
        target_year = year if year is not None else datetime.utcnow().year

        # First day of month
        start_date = datetime(target_year, target_month + 1, 1)
        # Last day of month
        if target_month == 11:
            end_date = datetime(target_year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(target_year, target_month + 2, 1) - timedelta(seconds=1)
    else:
        # Week period (default)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)

    # Query messages within date range
    statement = (
        select(SimpleMessage, SimpleSource)
        .join(SimpleSource, SimpleMessage.source_id == SimpleSource.id)
        .where(
            and_(
                SimpleMessage.sent_at >= start_date,
                SimpleMessage.sent_at <= end_date
            )
        )
        .order_by(SimpleMessage.sent_at)
    )

    result = await db.execute(statement)
    messages_with_sources = result.all()

    # Group by hour and source
    activity_data = []
    for message, source in messages_with_sources:
        activity_data.append({
            "timestamp": message.sent_at.isoformat(),
            "source": source.name,
            "count": 1  # Each message counts as 1
        })

    return {
        "data": activity_data,
        "period": {
            "type": period,
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "month": target_month if period == "month" else None,
            "year": target_year if period == "month" else None,
        },
        "total_messages": len(activity_data)
    }


@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(db: DatabaseDep):
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


@api_router.post("/analyze-day")
async def analyze_day(db: DatabaseDep, target_date: str = None):
    """Analyze messages for a specific day and create tasks"""
    try:
        # Use today if no date provided
        if target_date:
            analysis_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        else:
            analysis_date = date.today()

        # Get unanalyzed messages for the day
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
            return {
                "success": True,
                "message": f"No unanalyzed messages found for {analysis_date}",
                "messages_processed": 0,
                "tasks_created": 0,
            }

        # For now, create a summary task based on message count
        # TODO: Replace with actual AI analysis
        summary_content = f"Daily Analysis for {analysis_date}\n\n"
        summary_content += f"Processed {len(unanalyzed_messages)} messages:\n"
        for msg in unanalyzed_messages[:5]:  # Show first 5 messages
            summary_content += f"- {msg.author}: {msg.content[:50]}...\n"

        if len(unanalyzed_messages) > 5:
            summary_content += f"... and {len(unanalyzed_messages) - 5} more messages"

        # Create a summary task
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

        # Mark messages as analyzed
        for message in unanalyzed_messages:
            message.analyzed = True
            db.add(message)

        await db.commit()
        await db.refresh(summary_task)

        # Broadcast the new task via WebSocket
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

        return {
            "success": True,
            "message": f"Successfully analyzed {len(unanalyzed_messages)} messages",
            "messages_processed": len(unanalyzed_messages),
            "tasks_created": 1,
            "date": str(analysis_date),
            "summary_task_id": summary_task.id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ~~~~~~~~~~~~~~~~ API роути для webhook management ~~~~~~~~~~~~~~~~


@api_router.get("/webhook-settings", response_model=WebhookConfigResponse)
async def get_webhook_settings(db: DatabaseDep, settings: SettingsDep):
    """Get current webhook configuration"""
    # Get Telegram config from database
    telegram_config = await webhook_settings_service.get_telegram_config(db)

    # Extract default values from settings
    api_base_url = settings.api_base_url
    default_protocol = "https" if api_base_url.startswith("https") else "http"
    default_host = (
        api_base_url.replace("http://", "").replace("https://", "").split(":")[0]
    )

    return WebhookConfigResponse(
        telegram=telegram_config,
        default_protocol=default_protocol,
        default_host=default_host,
    )


@api_router.post("/webhook-settings", response_model=TelegramWebhookConfig)
async def save_webhook_settings(request: SetWebhookRequest, db: DatabaseDep):
    """Save webhook configuration (without setting it in Telegram)"""
    host = request.host.strip()
    if not host:
        raise HTTPException(status_code=400, detail="Host must not be empty")
    if "://" in host:
        raise HTTPException(
            status_code=400,
            detail="Host should not include protocol. Provide only host name or host:port.",
        )

    try:
        return await webhook_settings_service.save_telegram_config(
            db=db,
            protocol=request.protocol,
            host=host,
            is_active=False,  # Not active until webhook is actually set
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save webhook settings: {str(e)}"
        )


@api_router.post("/webhook-settings/telegram/set", response_model=SetWebhookResponse)
async def set_telegram_webhook(request: SetWebhookRequest, db: DatabaseDep):
    """Set Telegram webhook URL via Bot API"""
    host = request.host.strip()
    if not host:
        raise HTTPException(status_code=400, detail="Host must not be empty")
    if "://" in host:
        raise HTTPException(
            status_code=400,
            detail="Host should not include protocol. Provide only host name or host:port.",
        )

    webhook_url = f"{request.protocol}://{host}/webhook/telegram"

    try:
        # Call Telegram API to set webhook
        result = await telegram_webhook_service.set_webhook(webhook_url)

        if result["success"]:
            # Save configuration with active status
            await webhook_settings_service.save_telegram_config(
                db=db, protocol=request.protocol, host=host, is_active=True
            )

            return SetWebhookResponse(
                success=True,
                webhook_url=webhook_url,
                message="Webhook set successfully",
            )
        else:
            return SetWebhookResponse(
                success=False,
                webhook_url=webhook_url,
                message="Failed to set webhook",
                error=result.get("error", "Unknown error"),
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set webhook: {str(e)}")


@api_router.delete("/webhook-settings/telegram", response_model=SetWebhookResponse)
async def delete_telegram_webhook(db: DatabaseDep):
    """Remove Telegram webhook"""
    try:
        # Call Telegram API to delete webhook
        result = await telegram_webhook_service.delete_webhook()

        if result["success"]:
            # Update database to mark as inactive
            config = await webhook_settings_service.set_telegram_webhook_active(
                db, False
            )

            return SetWebhookResponse(
                success=True,
                webhook_url=config.webhook_url if config else None,
                message="Webhook deleted successfully",
            )
        else:
            return SetWebhookResponse(
                success=False,
                webhook_url=None,
                message="Failed to delete webhook",
                error=result.get("error", "Unknown error"),
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete webhook: {str(e)}",
        )


@api_router.get("/webhook-settings/telegram/info")
async def get_telegram_webhook_info():
    """Get current webhook information from Telegram"""
    try:
        result = await telegram_webhook_service.get_webhook_info()

        if result["success"]:
            return {"success": True, "webhook_info": result["data"]}
        else:
            return {"success": False, "error": result.get("error", "Unknown error")}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get webhook info: {str(e)}"
        )


@api_router.put("/webhook-settings/telegram/group-ids", response_model=TelegramWebhookConfig)
async def update_telegram_group_ids(
    request: UpdateTelegramGroupIdsRequest, db: DatabaseDep
):
    """Update Telegram group IDs to monitor (legacy endpoint)"""
    try:
        # Convert old format to new format with groups
        groups = [{"id": gid, "name": None} for gid in request.group_ids]

        # Get current config and update groups
        config = await webhook_settings_service.get_telegram_config(db)
        if config:
            # Clear and add all groups
            for gid in request.group_ids:
                group_info = {"id": gid, "name": None}
                await webhook_settings_service.add_telegram_group(db, group_info)

            updated_config = await webhook_settings_service.get_telegram_config(db)
            if updated_config:
                return updated_config

        raise HTTPException(status_code=404, detail="Webhook settings not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update group IDs: {str(e)}"
        )


@api_router.post("/webhook-settings/telegram/groups", response_model=TelegramWebhookConfig)
async def add_telegram_group(request: AddTelegramGroupRequest, db: DatabaseDep):
    """Add a Telegram group to monitor"""
    try:
        # Try to fetch group info from Telegram
        chat_info = await telegram_webhook_service.get_chat_info(request.group_id)

        if chat_info["success"]:
            group_info = {
                "id": chat_info["data"]["id"],
                "name": chat_info["data"]["name"],
            }
        else:
            # If fetch fails, add group without name
            logger.warning(
                f"Failed to fetch chat info for {request.group_id}: {chat_info.get('error')}"
            )
            group_info = {
                "id": request.group_id,
                "name": None,
            }

        config = await webhook_settings_service.add_telegram_group(db, group_info)

        if config:
            return config
        else:
            raise HTTPException(
                status_code=500, detail="Failed to add group"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to add group: {str(e)}"
        )


@api_router.delete("/webhook-settings/telegram/groups/{group_id}", response_model=TelegramWebhookConfig)
async def remove_telegram_group(group_id: int, db: DatabaseDep):
    """Remove a Telegram group from monitoring"""
    try:
        config = await webhook_settings_service.remove_telegram_group(db, group_id)

        if config:
            return config
        else:
            raise HTTPException(
                status_code=404, detail="Webhook settings not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to remove group: {str(e)}"
        )


@api_router.post("/webhook-settings/telegram/groups/refresh-names", response_model=TelegramWebhookConfig)
async def refresh_telegram_group_names(db: DatabaseDep):
    """Refresh all Telegram group names"""
    try:
        config = await webhook_settings_service.update_group_names(
            db, telegram_webhook_service
        )

        if config:
            return config
        else:
            raise HTTPException(
                status_code=404, detail="Webhook settings not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to refresh group names: {str(e)}"
        )


# Include the API router
router.include_router(api_router)
