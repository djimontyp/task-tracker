from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

    class Config:
        schema_extra = {"example": {"status": "healthy", "timestamp": "2025-10-04T12:00:00"}}


class ConfigResponse(BaseModel):
    wsUrl: str
    apiBaseUrl: str

    class Config:
        schema_extra = {
            "example": {"wsUrl": "ws://localhost/ws", "apiBaseUrl": "http://localhost"}
        }


class MessageCreateResponse(BaseModel):
    status: str
    id: int

    class Config:
        schema_extra = {"example": {"status": "message received", "id": 1}}


class TaskStatusUpdateResponse(BaseModel):
    message: str
    task_id: int
    status: str

    class Config:
        schema_extra = {
            "example": {"message": "Task status updated", "task_id": 1, "status": "completed"}
        }


class ActivityDataPoint(BaseModel):
    timestamp: str
    source: str
    count: int


class ActivityPeriod(BaseModel):
    type: str
    start: str
    end: str
    month: Optional[int] = None
    year: Optional[int] = None


class ActivityDataResponse(BaseModel):
    data: List[ActivityDataPoint]
    period: ActivityPeriod
    total_messages: int


class AnalyzeDayResponse(BaseModel):
    success: bool
    message: str
    messages_processed: int
    tasks_created: int
    date: Optional[str] = None
    summary_task_id: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Successfully analyzed 10 messages",
                "messages_processed": 10,
                "tasks_created": 1,
                "date": "2025-10-04",
                "summary_task_id": 5,
            }
        }


class WebhookInfo(BaseModel):
    url: str
    has_custom_certificate: bool
    pending_update_count: int
    ip_address: Optional[str] = None
    last_error_date: Optional[int] = None
    last_error_message: Optional[str] = None
    max_connections: Optional[int] = None
    allowed_updates: Optional[List[str]] = None


class WebhookInfoResponse(BaseModel):
    success: bool
    webhook_info: Optional[WebhookInfo] = None
    error: Optional[str] = None

# ---------------------
# Messages API Schemas
# ---------------------

class MessageCreateRequest(BaseModel):
    id: str
    content: str
    author: str
    timestamp: str  # ISO 8601 string
    chat_id: Optional[str] = None
    user_id: Optional[int] = None
    avatar_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    external_message_id: str
    content: str
    author: str  # Display name (first_name + last_name)
    sent_at: datetime
    source_name: str
    analyzed: Optional[bool] = None
    avatar_url: Optional[str] = None
    persisted: bool = True

    # Telegram user identification
    telegram_user_id: Optional[int] = None
    telegram_username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class DateRange(BaseModel):
    earliest: Optional[str] = None
    latest: Optional[str] = None


class MessageFiltersResponse(BaseModel):
    authors: List[str]
    sources: List[str]
    total_messages: int
    date_range: DateRange


class PaginatedMessagesResponse(BaseModel):
    items: List['MessageResponse']
    total: int
    page: int
    page_size: int
    total_pages: int


# ------------------
# Tasks API Schemas
# ------------------

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str
    source: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    category: str
    source: Optional[str] = None
    created_at: datetime

    class Config:
        # Pydantic v2: allow attribute-based validation for ORM objects
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):  # Backward-compat shim (v1-style API)
        return cls.model_validate(obj, from_attributes=True)


# ----------------------
# Statistics API Schemas
# ----------------------

class StatsResponse(BaseModel):
    total_tasks: int
    open_tasks: int
    completed_tasks: int
    categories: dict
    priorities: dict
