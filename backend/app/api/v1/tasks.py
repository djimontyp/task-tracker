from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.v1.response_models import TaskStatusUpdateResponse
from app.dependencies import DatabaseDep
from app.models import Task
from app.schemas.tasks import TaskCreateRequest, TaskResponse
from app.services.websocket_manager import websocket_manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get(
    "",
    response_model=list[TaskResponse],
    summary="Get all tasks",
    response_description="List of all tasks ordered by creation date",
)
async def get_tasks(db: DatabaseDep) -> list[TaskResponse]:
    """
    Retrieve all tasks ordered by most recent first.

    Returns complete task information including status, priority, and metadata.
    """
    from sqlalchemy import desc as sa_desc

    statement = select(Task).order_by(sa_desc(Task.created_at))  # type: ignore[arg-type]
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
    from app.models.enums import TaskStatus

    db_task = Task(
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        source_id=1,  # Default source ID for manually created tasks
        status=TaskStatus.open,
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
async def update_task_status(task_id: int, status: str, db: DatabaseDep) -> TaskStatusUpdateResponse:
    """
    Update the status of a specific task.

    Allows changing task status (e.g., from 'open' to 'completed').
    Raises 404 error if task doesn't exist.
    """
    from app.models.enums import TaskStatus

    statement = select(Task).where(Task.id == task_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = TaskStatus(status)
    db.add(task)
    await db.commit()

    return TaskStatusUpdateResponse(message="Task status updated", task_id=task_id, status=status)
