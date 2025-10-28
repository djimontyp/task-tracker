"""Agent-Task Assignment model for linking agents to tasks."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, UniqueConstraint, func
from sqlmodel import Field, SQLModel


class AgentTaskAssignment(SQLModel, table=True):
    """
    Agent-Task Assignment.

    Links an agent configuration to a task configuration.
    Each assignment creates an independent agent instance in the registry.
    """

    __tablename__ = "agent_task_assignments"
    __table_args__ = (UniqueConstraint("agent_id", "task_id", name="uq_agent_task"),)

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Foreign Keys
    agent_id: UUID = Field(
        foreign_key="agent_configs.id",
        description="Reference to agent configuration",
    )
    task_id: UUID = Field(
        foreign_key="task_configs.id",
        description="Reference to task configuration",
    )

    # Status
    is_active: bool = Field(default=True, description="Assignment is active")

    # Timestamps
    assigned_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "agent_id": "123e4567-e89b-12d3-a456-426614174000",
                "task_id": "123e4567-e89b-12d3-a456-426614174001",
                "is_active": True,
            }
        }


# API Schemas
class AgentTaskAssignmentCreate(SQLModel):
    """Schema for creating new agent-task assignment."""

    agent_id: UUID | None = None  # Optional: will be set from URL path in /agents/{agent_id}/tasks endpoint
    task_id: UUID
    is_active: bool = True


class AgentTaskAssignmentPublic(SQLModel):
    """Public schema for agent-task assignment responses."""

    id: UUID
    agent_id: UUID
    task_id: UUID
    is_active: bool
    assigned_at: datetime


class AgentTaskAssignmentWithDetails(SQLModel):
    """Extended assignment schema with JOIN details from related entities."""

    id: UUID
    agent_id: UUID
    task_id: UUID
    is_active: bool
    assigned_at: datetime
    # Joined fields from related tables
    agent_name: str
    task_name: str
    provider_name: str
    provider_type: str
