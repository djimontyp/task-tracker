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
