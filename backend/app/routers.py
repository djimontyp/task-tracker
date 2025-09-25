import json
from datetime import datetime
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
    SimpleSource
)

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Task Tracker API", "status": "running"}


@router.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


@router.get("/api/config")
async def get_client_config(settings: SettingsDep):
    """Get client-side configuration"""
    base_url = settings.api_base_url.replace("http://", "").replace("https://", "")
    return {
        "wsUrl": f"ws://{base_url}/ws",
        "apiBaseUrl": f"http://{base_url}"
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: DatabaseDep):
    await manager.connect(websocket)
    try:
        statement = select(SimpleMessage).order_by(SimpleMessage.created_at.desc()).limit(10)
        result = await db.execute(statement)
        recent_messages = result.scalars().all()

        for msg in recent_messages:
            response = MessageResponse(
                id=msg.id,
                external_message_id=msg.external_message_id,
                content=msg.content,
                author=msg.author,
                sent_at=msg.sent_at,
                source_name="api"
            )
            await websocket.send_text(
                json.dumps({"type": "message", "data": response.dict()})
            )

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/api/messages")
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
        sent_at=datetime.fromisoformat(message.timestamp.replace('Z', '+00:00')),
        source_id=source.id,
        created_at=datetime.now()
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
        source_name=source.name
    )

    await manager.broadcast({"type": "message", "data": response.dict()})

    return {"status": "message received", "id": db_message.id}


@router.get("/api/messages", response_model=List[MessageResponse])
async def get_messages(db: DatabaseDep, limit: int = 50):
    statement = select(SimpleMessage).order_by(SimpleMessage.created_at.desc()).limit(limit)
    result = await db.execute(statement)
    messages = result.scalars().all()

    result = []
    for msg in messages:
        result.append(MessageResponse(
            id=msg.id,
            external_message_id=msg.external_message_id,
            content=msg.content,
            author=msg.author,
            sent_at=msg.sent_at,
            source_name="api"  # Default for now
        ))

    return result


@router.post("/webhook/telegram")
async def telegram_webhook(request: Request, db: DatabaseDep):
    """Handle Telegram webhook updates"""
    try:
        update_data = await request.json()

        if "message" in update_data:
            message = update_data["message"]

            source_statement = select(SimpleSource).where(SimpleSource.name == "telegram")
            result = await db.execute(source_statement)
            source = result.scalar_one_or_none()

            if not source:
                source = SimpleSource(name="telegram", created_at=datetime.now())
                db.add(source)
                await db.commit()
                await db.refresh(source)

            db_message = SimpleMessage(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=message.get("from", {}).get("first_name", "Unknown"),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_id=source.id,
                created_at=datetime.now()
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
                source_name=source.name
            )

            await manager.broadcast({"type": "message", "data": response.dict()})

        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(db: DatabaseDep):
    statement = select(SimpleTask).order_by(SimpleTask.created_at.desc())
    result = await db.execute(statement)
    tasks = result.scalars().all()

    return [TaskResponse.from_orm(task) for task in tasks]


@router.post("/api/tasks", response_model=TaskResponse)
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

    await manager.broadcast({"type": "task_created", "data": response.dict()})

    return response


@router.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: DatabaseDep):
    statement = select(SimpleTask).where(SimpleTask.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse.from_orm(task)


@router.put("/api/tasks/{task_id}/status")
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


@router.get("/api/stats", response_model=StatsResponse)
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