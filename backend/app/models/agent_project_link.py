"""AgentProjectLink model for Agent-Project M:N relationship."""

from uuid import UUID

from sqlmodel import Field, SQLModel

from .base import TimestampMixin


class AgentProjectLink(TimestampMixin, SQLModel, table=True):
    """
    Many-to-many relationship: Agents <-> Projects.

    Enables injecting project context into agent prompts.
    An agent can work with multiple projects, and a project
    can have multiple agents assigned.
    """

    __tablename__ = "agent_project_links"

    agent_id: UUID = Field(
        foreign_key="agent_configs.id",
        primary_key=True,
        description="Agent configuration ID",
    )
    project_id: UUID = Field(
        foreign_key="project_configs.id",
        primary_key=True,
        description="Project configuration ID",
    )


class AgentProjectLinkPublic(SQLModel):
    """Public schema for agent-project link responses."""

    agent_id: UUID
    project_id: UUID


class AgentProjectLinkCreate(SQLModel):
    """Schema for creating a new agent-project link."""

    agent_id: UUID = Field(description="Agent configuration ID")
    project_id: UUID = Field(description="Project configuration ID")
