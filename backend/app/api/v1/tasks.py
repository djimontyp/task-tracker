from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from ...models import Task
from app.schemas.tasks import TaskCreateRequest, TaskResponse
from ...services.websocket_manager import websocket_manager
from ..deps import DatabaseDep
from .response_models import TaskStatusUpdateResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get(
    "",
    response_model=List[TaskResponse],
    summary="Get all tasks",
    response_description="List of all tasks ordered by creation date",
)
async def get_tasks(db: DatabaseDep) -> List[TaskResponse]:
    """
    Retrieve all tasks ordered by most recent first.

    Returns complete task information including status, priority, and metadata.
    """
    statement = select(Task).order_by(Task.created_at.desc())
    result = await db.execute(statement)
    tasks = result.scalars().all()

    return [TaskResponse.from_orm(task) for task in tasks]


@router.post(
    "",
    response_model=TaskResponse,
    summary="Create a new task",
    response_description="Created task with generated ID",
    status_code=status.HTTP_201_CREATED,
)
async def create_task(task: TaskCreateRequest, db: DatabaseDep) -> TaskResponse:
    """
    Create a new task from provided data.

    Automatically sets status to 'open' and broadcasts to WebSocket clients.
    """
    db_task = Task(
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        source_id=task.source_id,
        status=task.status,
    )

    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)

    response = TaskResponse.from_orm(db_task)

    response_data = response.model_dump()
    response_data["created_at"] = response_data["created_at"].isoformat()
    await websocket_manager.broadcast("tasks", {"type": "task_created", "data": response_data})

    return response


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task by ID",
    response_description="Task details for specified ID",
    responses={404: {"description": "Task not found"}},
)
async def get_task(task_id: int, db: DatabaseDep) -> TaskResponse:
    """
    Retrieve a specific task by its ID.

    Raises 404 error if task with given ID doesn't exist.
    """
    statement = select(Task).where(Task.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse.from_orm(task)


@router.put(
    "/{task_id}/status",
    response_model=TaskStatusUpdateResponse,
    summary="Update task status",
    response_description="Confirmation of status update",
    responses={404: {"description": "Task not found"}},
)
async def update_task_status(
    task_id: int, status: str, db: DatabaseDep
) -> TaskStatusUpdateResponse:
    """
    Update the status of a specific task.

    Allows changing task status (e.g., from 'open' to 'completed').
    Raises 404 error if task doesn't exist.
    """
    statement = select(Task).where(Task.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = status
    db.add(task)
    await db.commit()

    return TaskStatusUpdateResponse(
        message="Task status updated", task_id=task_id, status=status
    )
