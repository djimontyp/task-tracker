"""ProjectConfig model for project classification configurations."""
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ProjectConfig(SQLModel, table=True):
    """
    ProjectConfig - classification project configurations.

    Stores project-specific keywords, glossary, components, and team settings.
    Used for AI-driven project classification during analysis.
    """

    __tablename__ = "project_configs"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Project identity
    name: str = Field(
        unique=True,
        index=True,
        max_length=200,
        description="Project name (unique)",
    )
    description: str = Field(
        sa_type=Text,
        description="Project description",
    )

    # Classification keywords/phrases
    keywords: list[str] = Field(
        sa_type=JSONB,
        description="Keywords for project detection",
    )
    glossary: dict = Field(
        sa_type=JSONB,
        description="Domain-specific terminology {term: definition}",
    )

    # Components/modules
    components: list[dict] = Field(
        sa_type=JSONB,
        description="Components/modules [{name, keywords}]",
    )

    # Team
    default_assignee_ids: list[int] = Field(
        sa_type=JSONB,
        description="Default assignee user IDs",
    )
    pm_user_id: int = Field(
        foreign_key="users.id",
        description="Project manager user ID",
    )

    # Settings
    is_active: bool = Field(
        default=True,
        description="Project is active",
    )
    priority_rules: dict = Field(
        sa_type=JSONB,
        description="Rules for priority assignment",
    )

    # Versioning
    version: str = Field(
        max_length=50,
        description="Semantic version (e.g., 1.0.0)",
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
        },
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "name": "Task Tracker Backend",
                "description": "Backend API and worker services",
                "keywords": ["backend", "api", "fastapi", "worker"],
                "glossary": {
                    "TaskIQ": "Async task queue framework",
                    "NATS": "Message broker for distributed systems",
                },
                "components": [
                    {"name": "API", "keywords": ["endpoint", "route", "handler"]},
                    {"name": "Worker", "keywords": ["task", "job", "queue"]},
                ],
                "default_assignee_ids": [1, 2],
                "pm_user_id": 1,
                "is_active": True,
                "priority_rules": {
                    "critical_keywords": ["crash", "security", "data loss"],
                    "high_keywords": ["bug", "error", "broken"],
                },
                "version": "1.0.0",
            }
        }


# API Schemas
class ProjectConfigCreate(SQLModel):
    """Schema for creating new project config."""

    name: str
    description: str
    keywords: list[str]
    glossary: dict = {}
    components: list[dict] = []
    default_assignee_ids: list[int] = []
    pm_user_id: int
    is_active: bool = True
    priority_rules: dict = {}
    version: str = "1.0.0"


class ProjectConfigUpdate(SQLModel):
    """Schema for updating project config (partial)."""

    name: str | None = None
    description: str | None = None
    keywords: list[str] | None = None
    glossary: dict | None = None
    components: list[dict] | None = None
    default_assignee_ids: list[int] | None = None
    pm_user_id: int | None = None
    is_active: bool | None = None
    priority_rules: dict | None = None
    version: str | None = None


class ProjectConfigPublic(SQLModel):
    """Public schema for project config responses."""

    id: UUID
    name: str
    description: str
    keywords: list[str]
    glossary: dict
    components: list[dict]
    default_assignee_ids: list[int]
    is_active: bool
    priority_rules: dict
    version: str
    created_at: datetime
    updated_at: datetime


class ProjectConfigListResponse(SQLModel):
    """Paginated response schema for project configurations."""

    items: list[ProjectConfigPublic]
    total: int
    page: int
    page_size: int
