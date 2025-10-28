"""Agent Configuration model for managing AI agent definitions."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlmodel import Field, SQLModel


class AgentConfig(SQLModel, table=True):
    """
    Agent Configuration.

    Defines an AI agent with its prompt, model, and provider association.
    One agent can be assigned to multiple tasks, creating separate instances.
    """

    __tablename__ = "agent_configs"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Core Fields
    name: str = Field(
        sa_type=Text,
        unique=True,
        index=True,
        description="Unique agent name",
    )
    description: str | None = Field(
        default=None,
        sa_type=Text,
        description="Agent description",
    )

    # LLM Configuration
    provider_id: UUID = Field(
        foreign_key="llm_providers.id",
        description="Reference to LLM provider",
    )
    model_name: str = Field(
        sa_type=Text,
        description="Model name (e.g., 'llama3', 'gpt-4')",
    )
    system_prompt: str = Field(
        sa_type=Text,
        description="System prompt for the agent",
    )

    # Agent Behavior
    temperature: float | None = Field(
        default=0.7,
        description="Model temperature (0.0-1.0)",
    )
    max_tokens: int | None = Field(
        default=None,
        description="Maximum tokens for response",
    )

    # Status
    is_active: bool = Field(default=True, description="Agent is active")

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "name": "Message Classifier",
                "description": "Classifies messages into categories",
                "model_name": "llama3",
                "system_prompt": "You are a message classification assistant.",
                "temperature": 0.7,
            }
        }


# API Schemas
class AgentConfigCreate(SQLModel):
    """Schema for creating new agent configuration."""

    name: str = Field(min_length=1, description="Agent name (required, non-empty)")
    description: str | None = None
    provider_id: UUID
    model_name: str = Field(min_length=1, description="Model name (required, non-empty)")
    system_prompt: str = Field(min_length=1, description="System prompt (required, non-empty)")
    temperature: float | None = Field(default=0.7, ge=0.0, le=1.0, description="Temperature (0.0-1.0)")
    max_tokens: int | None = Field(default=None, gt=0, description="Maximum tokens (must be positive)")
    is_active: bool = True


class AgentConfigUpdate(SQLModel):
    """Schema for updating agent configuration."""

    name: str | None = Field(default=None, min_length=1, description="Agent name (non-empty if provided)")
    description: str | None = None
    provider_id: UUID | None = None
    model_name: str | None = Field(default=None, min_length=1, description="Model name (non-empty if provided)")
    system_prompt: str | None = Field(default=None, min_length=1, description="System prompt (non-empty if provided)")
    temperature: float | None = Field(default=None, ge=0.0, le=1.0, description="Temperature (0.0-1.0 if provided)")
    max_tokens: int | None = Field(default=None, gt=0, description="Maximum tokens (positive if provided)")
    is_active: bool | None = None


class AgentConfigPublic(SQLModel):
    """Public schema for agent configuration responses."""

    id: UUID
    name: str
    description: str | None = None
    provider_id: UUID
    model_name: str
    system_prompt: str
    temperature: float | None = None
    max_tokens: int | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
