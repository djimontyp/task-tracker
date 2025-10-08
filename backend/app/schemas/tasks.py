"""Task request/response schemas"""

from datetime import datetime
from pydantic import BaseModel


class TaskCreateRequest(BaseModel):
    """Request schema for creating a task"""

    title: str
    description: str
    category: str
    priority: str
    source_message_ids: list[int]


class TaskResponse(BaseModel):
    """Response schema for task"""

    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    source_message_ids: list[int]
    created_at: datetime
    updated_at: datetime | None = None


class TaskUpdateStatusRequest(BaseModel):
    """Request schema for updating task status"""

    status: str
