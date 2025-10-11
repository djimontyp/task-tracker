"""Agent Configuration model for managing AI agent definitions."""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Text, func
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
    description: Optional[str] = Field(
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
    temperature: Optional[float] = Field(
        default=0.7,
        description="Model temperature (0.0-1.0)",
    )
    max_tokens: Optional[int] = Field(
        default=None,
        description="Maximum tokens for response",
    )

    # Status
    is_active: bool = Field(default=True, description="Agent is active")

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
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

    name: str
    description: Optional[str] = None
    provider_id: UUID
    model_name: str
    system_prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    is_active: bool = True


class AgentConfigUpdate(SQLModel):
    """Schema for updating agent configuration."""

    name: Optional[str] = None
    description: Optional[str] = None
    provider_id: Optional[UUID] = None
    model_name: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_active: Optional[bool] = None


class AgentConfigPublic(SQLModel):
    """Public schema for agent configuration responses."""

    id: UUID
    name: str
    description: Optional[str] = None
    provider_id: UUID
    model_name: str
    system_prompt: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
