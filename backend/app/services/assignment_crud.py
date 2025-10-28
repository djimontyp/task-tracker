"""CRUD operations for Agent-Task Assignment management.

Provides operations for managing assignments between agents and tasks,
ensuring proper M2M relationship handling.
"""

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AgentTaskAssignmentCreate,
    AgentTaskAssignmentPublic,
    LLMProvider,
    TaskConfig,
)
from app.models.agent_task_assignment import AgentTaskAssignmentWithDetails
from app.services.base_crud import BaseCRUD


class AssignmentCRUD:
    """CRUD service for Agent-Task Assignment operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session
        self._base_crud = BaseCRUD(AgentTaskAssignment, session)

    async def create(self, assignment_data: AgentTaskAssignmentCreate) -> AgentTaskAssignmentPublic:
        """Create new agent-task assignment.

        Args:
            assignment_data: Assignment creation data

        Returns:
            Created assignment with public fields

        Raises:
            ValueError: If agent or task not found, or assignment already exists
        """
        agent_result = await self.session.execute(select(AgentConfig).where(AgentConfig.id == assignment_data.agent_id))
        agent = agent_result.scalar_one_or_none()
        if not agent:
            raise ValueError(f"Agent with ID '{assignment_data.agent_id}' not found")

        task_result = await self.session.execute(select(TaskConfig).where(TaskConfig.id == assignment_data.task_id))
        task = task_result.scalar_one_or_none()
        if not task:
            raise ValueError(f"Task with ID '{assignment_data.task_id}' not found")

        try:
            assignment = await self._base_crud.create(assignment_data.model_dump())
        except IntegrityError as e:
            await self.session.rollback()
            error_str = str(e)
            # Check for duplicate assignment (PostgreSQL uses constraint name, SQLite describes the columns)
            if "uq_agent_task" in error_str or "agent_task_assignments.agent_id" in error_str:
                raise ValueError(
                    f"Assignment between agent '{assignment_data.agent_id}' "
                    f"and task '{assignment_data.task_id}' already exists"
                ) from e
            raise

        return AgentTaskAssignmentPublic.model_validate(assignment)

    async def get(self, assignment_id: UUID) -> AgentTaskAssignmentPublic | None:
        """Get assignment by ID.

        Args:
            assignment_id: Assignment UUID

        Returns:
            Assignment if found, None otherwise
        """
        assignment = await self._base_crud.get(assignment_id)

        if assignment:
            return AgentTaskAssignmentPublic.model_validate(assignment)
        return None

    async def get_by_agent_and_task(self, agent_id: UUID, task_id: UUID) -> AgentTaskAssignmentPublic | None:
        """Get assignment by agent and task IDs.

        Args:
            agent_id: Agent UUID
            task_id: Task UUID

        Returns:
            Assignment if found, None otherwise
        """
        result = await self.session.execute(
            select(AgentTaskAssignment)
            .where(AgentTaskAssignment.agent_id == agent_id)
            .where(AgentTaskAssignment.task_id == task_id)
        )
        assignment = result.scalar_one_or_none()

        if assignment:
            return AgentTaskAssignmentPublic.model_validate(assignment)
        return None

    async def list_by_agent(
        self,
        agent_id: UUID,
        active_only: bool = False,
    ) -> list[AgentTaskAssignmentPublic]:
        """List all task assignments for an agent.

        Args:
            agent_id: Agent UUID
            active_only: Filter for active assignments only

        Returns:
            List of assignments
        """
        query = select(AgentTaskAssignment).where(AgentTaskAssignment.agent_id == agent_id)

        if active_only:
            query = query.where(AgentTaskAssignment.is_active == True)  # noqa: E712

        result = await self.session.execute(query)
        assignments = result.scalars().all()

        return [AgentTaskAssignmentPublic.model_validate(a) for a in assignments]

    async def list_by_task(
        self,
        task_id: UUID,
        active_only: bool = False,
    ) -> list[AgentTaskAssignmentPublic]:
        """List all agent assignments for a task.

        Args:
            task_id: Task UUID
            active_only: Filter for active assignments only

        Returns:
            List of assignments
        """
        query = select(AgentTaskAssignment).where(AgentTaskAssignment.task_id == task_id)

        if active_only:
            query = query.where(AgentTaskAssignment.is_active == True)  # noqa: E712

        result = await self.session.execute(query)
        assignments = result.scalars().all()

        return [AgentTaskAssignmentPublic.model_validate(a) for a in assignments]

    async def list_assignments(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> list[AgentTaskAssignmentPublic]:
        """List all assignments with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            active_only: Filter for active assignments only

        Returns:
            List of assignments
        """
        if active_only:
            query = select(AgentTaskAssignment).where(AgentTaskAssignment.is_active == True)  # noqa: E712
            query = query.offset(skip).limit(limit)
            result = await self.session.execute(query)
            assignments = list(result.scalars().all())
        else:
            assignments = await self._base_crud.get_multi(skip=skip, limit=limit)

        return [AgentTaskAssignmentPublic.model_validate(a) for a in assignments]

    async def update_status(
        self,
        assignment_id: UUID,
        is_active: bool,
    ) -> AgentTaskAssignmentPublic | None:
        """Update assignment active status.

        Args:
            assignment_id: Assignment UUID
            is_active: New active status

        Returns:
            Updated assignment if found, None otherwise
        """
        result = await self.session.execute(select(AgentTaskAssignment).where(AgentTaskAssignment.id == assignment_id))
        assignment = result.scalar_one_or_none()

        if not assignment:
            return None

        assignment.is_active = is_active
        await self.session.commit()
        await self.session.refresh(assignment)

        return AgentTaskAssignmentPublic.model_validate(assignment)

    async def delete(self, assignment_id: UUID) -> bool:
        """Delete assignment.

        Args:
            assignment_id: Assignment UUID

        Returns:
            True if deleted, False if not found
        """
        return await self._base_crud.delete(assignment_id)

    async def list_with_details(
        self,
        active_only: bool = False,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AgentTaskAssignmentWithDetails]:
        """List assignments with detailed information from joined tables.

        Performs JOIN queries to fetch agent, task, and provider details
        in a single database query for optimal performance.

        Args:
            active_only: Filter for active assignments only
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of assignments with detailed information including:
            - agent_name: Name of the assigned agent
            - task_name: Name of the assigned task
            - provider_name: Name of the LLM provider
            - provider_type: Type of the LLM provider (ollama/openai)
        """
        # Build query with JOINs
        query = (
            select(  # type: ignore[call-overload]
                AgentTaskAssignment.id,
                AgentTaskAssignment.agent_id,
                AgentTaskAssignment.task_id,
                AgentTaskAssignment.is_active,
                AgentTaskAssignment.assigned_at,
                AgentConfig.name.label("agent_name"),  # type: ignore[attr-defined]
                TaskConfig.name.label("task_name"),  # type: ignore[attr-defined]
                LLMProvider.name.label("provider_name"),  # type: ignore[attr-defined]
                LLMProvider.type.label("provider_type"),  # type: ignore[attr-defined]
            )
            .join(AgentConfig, AgentTaskAssignment.agent_id == AgentConfig.id)
            .join(TaskConfig, AgentTaskAssignment.task_id == TaskConfig.id)
            .join(LLMProvider, AgentConfig.provider_id == LLMProvider.id)
        )

        # Apply active filter if requested
        if active_only:
            query = query.where(AgentTaskAssignment.is_active == True)  # noqa: E712

        # Apply pagination
        query = query.offset(skip).limit(limit)

        # Execute query
        result = await self.session.execute(query)
        rows = result.all()

        # Convert rows to response models
        assignments = [
            AgentTaskAssignmentWithDetails(
                id=row.id,
                agent_id=row.agent_id,
                task_id=row.task_id,
                is_active=row.is_active,
                assigned_at=row.assigned_at,
                agent_name=row.agent_name,
                task_name=row.task_name,
                provider_name=row.provider_name,
                provider_type=row.provider_type,
            )
            for row in rows
        ]

        return assignments
