"""CRUD operations for Task Configuration management.

Provides create, read, update, delete operations for task configurations
with schema validation support.
"""

from uuid import UUID

from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentTaskAssignment,
    TaskConfig,
    TaskConfigCreate,
    TaskConfigPublic,
    TaskConfigUpdate,
)
from app.services.base_crud import BaseCRUD
from app.services.schema_generator import SchemaGenerator


class TaskCRUD(BaseCRUD[TaskConfig]):
    """CRUD service for Task Configuration operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    task-specific business logic for schema validation and cascade deletes.
    """

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        super().__init__(TaskConfig, session)
        self.schema_generator = SchemaGenerator()

    def _to_public(self, task: TaskConfig) -> TaskConfigPublic:
        """Convert TaskConfig model to TaskConfigPublic schema.

        Args:
            task: Database task config instance

        Returns:
            Public task config schema
        """
        return TaskConfigPublic.model_validate(task)

    async def create_task(self, task_data: TaskConfigCreate) -> TaskConfigPublic:
        """Create new task configuration.

        Args:
            task_data: Task creation data

        Returns:
            Created task with public fields

        Raises:
            ValueError: If task name already exists or schema is invalid
        """
        existing = await self.get_task_by_name(task_data.name)
        if existing:
            raise ValueError(f"Task with name '{task_data.name}' already exists")

        try:
            self.schema_generator.validate_schema(task_data.response_schema)
        except ValueError as e:
            raise ValueError(f"Invalid response schema: {e}") from e

        task = await super().create(task_data.model_dump())
        return self._to_public(task)

    async def get_task(self, task_id: UUID) -> TaskConfigPublic | None:
        """Get task by ID.

        Args:
            task_id: Task UUID

        Returns:
            Task if found, None otherwise
        """
        task = await super().get(task_id)
        return self._to_public(task) if task else None

    async def get_task_by_name(self, name: str) -> TaskConfigPublic | None:
        """Get task by name.

        Args:
            name: Task name

        Returns:
            Task if found, None otherwise
        """
        result = await self.session.execute(select(TaskConfig).where(TaskConfig.name == name))
        task = result.scalar_one_or_none()
        return self._to_public(task) if task else None

    async def list_tasks(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
    ) -> list[TaskConfigPublic]:
        """List tasks with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            active_only: Filter for active tasks only

        Returns:
            List of tasks
        """
        query = select(TaskConfig)

        if active_only:
            query = query.where(TaskConfig.is_active == True)  # noqa: E712

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        tasks = result.scalars().all()

        return [self._to_public(task) for task in tasks]

    async def update_task(
        self,
        task_id: UUID,
        update_data: TaskConfigUpdate,
    ) -> TaskConfigPublic | None:
        """Update task configuration.

        Args:
            task_id: Task UUID
            update_data: Fields to update

        Returns:
            Updated task if found, None otherwise

        Raises:
            ValueError: If new response_schema is invalid
        """
        task = await super().get(task_id)
        if not task:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)

        if "response_schema" in update_dict:
            try:
                self.schema_generator.validate_schema(update_dict["response_schema"])
            except ValueError as e:
                raise ValueError(f"Invalid response schema: {e}") from e

        updated_task = await super().update(task, update_dict)
        return self._to_public(updated_task)

    async def delete_task(self, task_id: UUID) -> bool:
        """Delete task configuration.

        Args:
            task_id: Task UUID

        Returns:
            True if deleted, False if not found

        Note:
            Cascade deletes agent_task_assignments before deleting task.
        """
        await self.session.execute(
            delete(AgentTaskAssignment).where(AgentTaskAssignment.task_id == task_id)  # type: ignore[arg-type]
        )
        return await super().delete(task_id)
