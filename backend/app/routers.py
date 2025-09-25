from datetime import datetime
import json
from typing import List

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlmodel import select

from .dependencies import SettingsDep, DatabaseDep
from .websocket import manager
from .api_schemas import (
    TaskCreateRequest,
    TaskResponse,
    MessageCreateRequest,
    MessageResponse,
    StatsResponse,
    SimpleTask,
    SimpleMessage,
    SimpleSource,
)
from .tasks import save_telegram_message

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
        source = SimpleSource(name="api", created_at=datetime.now())
        db.add(source)
        await db.commit()
        await db.refresh(source)

    db_message = SimpleMessage(
        external_message_id=message.id,
        content=message.content,
        author=message.author,
        sent_at=datetime.fromisoformat(message.timestamp.replace("Z", "+00:00")),
        source_id=source.id,
        created_at=datetime.now(),
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
async def get_messages(db: DatabaseDep, limit: int = 50):
    statement = (
        select(SimpleMessage).order_by(SimpleMessage.created_at.desc()).limit(limit)
    )
    result = await db.execute(statement)
    messages = result.scalars().all()

    result = []
    for msg in messages:
        result.append(
            MessageResponse(
                id=msg.id,
                external_message_id=msg.external_message_id,
                content=msg.content,
                author=msg.author,
                sent_at=msg.sent_at,
                source_name="api",  # Default for now
            )
        )

    return result


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
        created_at=datetime.now(),
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


# Include the API router
router.include_router(api_router)
