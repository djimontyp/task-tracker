from datetime import datetime

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
        schema_extra = {"example": {"wsUrl": "ws://localhost/ws", "apiBaseUrl": "http://localhost"}}


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
        schema_extra = {"example": {"message": "Task status updated", "task_id": 1, "status": "completed"}}


class ActivityDataPoint(BaseModel):
    timestamp: str
    source: str
    count: int


class ActivityPeriod(BaseModel):
    type: str
    start: str
    end: str
    month: int | None = None
    year: int | None = None


class ActivityDataResponse(BaseModel):
    data: list[ActivityDataPoint]
    period: ActivityPeriod
    total_messages: int


class AnalyzeDayResponse(BaseModel):
    success: bool
    message: str
    messages_processed: int
    tasks_created: int
    date: str | None = None
    summary_task_id: int | None = None

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
    ip_address: str | None = None
    last_error_date: int | None = None
    last_error_message: str | None = None
    max_connections: int | None = None
    allowed_updates: list[str] | None = None


class WebhookInfoResponse(BaseModel):
    success: bool
    webhook_info: WebhookInfo | None = None
    error: str | None = None


# ---------------------
# Messages API Schemas
# ---------------------

from app.schemas.messages import MessageResponse


class DateRange(BaseModel):
    earliest: str | None = None
    latest: str | None = None


class MessageFiltersResponse(BaseModel):
    authors: list[str]
    sources: list[str]
    total_messages: int
    date_range: DateRange


class PaginatedMessagesResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ------------------
# Tasks API Schemas
# ------------------


class TaskCreateRequest(BaseModel):
    title: str
    description: str | None = None
    category: str
    priority: str
    source: str | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: str
    priority: str
    category: str
    source: str | None = None
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


class SidebarCountsResponse(BaseModel):
    """Response model for sidebar notification counts."""

    unclosed_runs: int  # Analysis runs not closed (pending/running/completed/reviewed)
    pending_proposals: int  # Task proposals awaiting review

    class Config:
        schema_extra = {
            "example": {
                "unclosed_runs": 3,
                "pending_proposals": 12,
            }
        }
