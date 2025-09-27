from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TextClassification(BaseModel):
    is_issue: bool
    category: Literal["bug", "feature", "improvement", "question", "chore"]
    priority: Literal["low", "medium", "high", "critical"]
    confidence: float = Field(..., ge=0.0, le=1.0)


class EntityExtraction(BaseModel):
    projects: list[Literal["agroserver", "fms"]] | None
    components: list[str] | None
    technologies: list[str] | None
    mentions: list[str] | None = Field(description="Імена згадуваних людей")
    dates: list[datetime] | None
    versions: list[str] | None


class EntityStructured(BaseModel):
    short: str = Field(
        description="Коротка примітка (1-2 речення) українською мовою. Це має бути підсумок повідомлення."
    )


class TelegramWebhookConfig(BaseModel):
    """Schema for Telegram webhook configuration"""
    protocol: Literal["http", "https"] = Field(default="https", description="Protocol for webhook URL")
    host: str = Field(..., description="Host for webhook URL (e.g., 'example.ngrok.io')")
    webhook_url: str | None = Field(default=None, description="Complete webhook URL (computed)")
    is_active: bool = Field(default=False, description="Whether webhook is active")
    last_set_at: datetime | None = Field(default=None, description="When webhook was last set")


class WebhookConfigResponse(BaseModel):
    """Response schema for webhook configuration"""
    telegram: TelegramWebhookConfig | None = None
    default_protocol: str = Field(description="Default protocol from backend config")
    default_host: str = Field(description="Default host from backend config")


class SetWebhookRequest(BaseModel):
    """Request schema for setting webhook"""
    protocol: Literal["http", "https"] = Field(..., description="Protocol for webhook URL")
    host: str = Field(..., description="Host for webhook URL")


class SetWebhookResponse(BaseModel):
    """Response schema for webhook setting operation"""
    success: bool = Field(description="Whether operation was successful")
    webhook_url: str | None = Field(default=None, description="Set webhook URL")
    message: str = Field(description="Operation result message")
    error: str | None = Field(default=None, description="Error message if failed")
