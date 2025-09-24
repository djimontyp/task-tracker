import json
from datetime import datetime
from typing import Dict, List, Set

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.config import settings

app = FastAPI(
    title="Task Tracker API",
    description="Backend API for Task Tracker dashboard",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str
    source: str


class Task(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    source: str
    created_at: datetime
    status: str = "open"


class Message(BaseModel):
    id: str
    content: str
    author: str
    timestamp: str
    chat_id: str


class Stats(BaseModel):
    total_tasks: int
    open_tasks: int
    completed_tasks: int
    categories: Dict[str, int]
    priorities: Dict[str, int]


# In-memory storage (replace with database in production)
tasks_db: List[Task] = []
messages_db: List[Message] = []
task_id_counter = 1


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.add(connection)

        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@app.get("/")
async def root():
    return {"message": "Task Tracker API", "status": "running"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


@app.get("/api/config")
async def get_client_config():
    """Get client-side configuration"""
    # For local development, use localhost URLs through nginx proxy
    # ngrok is only needed for Telegram webhook, not internal communication
    return {
        "wsUrl": "ws://localhost/ws",
        "apiBaseUrl": "http://localhost"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send recent messages to new connection
        recent_messages = messages_db[-10:] if len(messages_db) > 10 else messages_db
        for msg in recent_messages:
            await websocket.send_text(
                json.dumps({"type": "message", "data": msg.dict()})
            )

        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/messages")
async def create_message(message: Message):
    messages_db.append(message)

    # Broadcast to all connected clients
    await manager.broadcast({"type": "message", "data": message.dict()})

    return {"status": "message received", "id": message.id}


@app.get("/api/messages", response_model=List[Message])
async def get_messages(limit: int = 50):
    return messages_db[-limit:]


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """Handle Telegram webhook updates"""
    try:
        update_data = await request.json()

        # Process message from webhook
        if "message" in update_data:
            message = update_data["message"]

            message_data = Message(
                id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=message.get("from", {}).get("first_name", "Unknown"),
                timestamp=datetime.fromtimestamp(message["date"]).isoformat(),
                chat_id=str(message["chat"]["id"]),
            )

            messages_db.append(message_data)

            # Broadcast to WebSocket clients
            await manager.broadcast({"type": "message", "data": message_data.dict()})

        return {"status": "ok"}

    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/tasks", response_model=List[Task])
async def get_tasks():
    return tasks_db


@app.post("/api/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    global task_id_counter

    new_task = Task(
        id=task_id_counter,
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        source=task.source,
        created_at=datetime.now(),
    )

    tasks_db.append(new_task)
    task_id_counter += 1

    # Broadcast task creation to WebSocket clients
    await manager.broadcast({"type": "task_created", "data": new_task.dict()})

    return new_task


@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: int):
    task = next((task for task in tasks_db if task.id == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/api/tasks/{task_id}/status")
async def update_task_status(task_id: int, status: str):
    task = next((task for task in tasks_db if task.id == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = status
    return {"message": "Task status updated", "task_id": task_id, "status": status}


@app.get("/api/stats", response_model=Stats)
async def get_stats():
    total_tasks = len(tasks_db)
    open_tasks = len([task for task in tasks_db if task.status == "open"])
    completed_tasks = len([task for task in tasks_db if task.status == "completed"])

    categories = {}
    priorities = {}

    for task in tasks_db:
        categories[task.category] = categories.get(task.category, 0) + 1
        priorities[task.priority] = priorities.get(task.priority, 0) + 1

    return Stats(
        total_tasks=total_tasks,
        open_tasks=open_tasks,
        completed_tasks=completed_tasks,
        categories=categories,
        priorities=priorities,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
