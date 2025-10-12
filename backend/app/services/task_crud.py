"""CRUD operations for Task Configuration management.

Provides create, read, update, delete operations for task configurations
with schema validation support.
"""

from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import TaskConfig, TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate
from app.services.schema_generator import SchemaGenerator


class TaskCRUD:
    """CRUD service for Task Configuration operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session
        self.schema_generator = SchemaGenerator()

    async def create(self, task_data: TaskConfigCreate) -> TaskConfigPublic:
        """Create new task configuration.

        Args:
            task_data: Task creation data

        Returns:
            Created task with public fields

        Raises:
            ValueError: If task name already exists or schema is invalid
        """
        # Check name uniqueness
        existing = await self.get_by_name(task_data.name)
        if existing:
            raise ValueError(f"Task with name '{task_data.name}' already exists")

        # Validate response schema
        try:
            self.schema_generator.validate_schema(task_data.response_schema)
        except ValueError as e:
            raise ValueError(f"Invalid response schema: {e}") from e

        # Create task record
        task = TaskConfig(
            name=task_data.name,
            description=task_data.description,
            response_schema=task_data.response_schema,
            is_active=task_data.is_active,
        )

        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)

        return TaskConfigPublic.model_validate(task)

    async def get(self, task_id: UUID) -> TaskConfigPublic | None:
        """Get task by ID.

        Args:
            task_id: Task UUID

        Returns:
            Task if found, None otherwise
        """
        result = await self.session.execute(select(TaskConfig).where(TaskConfig.id == task_id))
        task = result.scalar_one_or_none()

        if task:
            return TaskConfigPublic.model_validate(task)
        return None

    async def get_by_name(self, name: str) -> TaskConfigPublic | None:
        """Get task by name.

        Args:
            name: Task name

        Returns:
            Task if found, None otherwise
        """
        result = await self.session.execute(select(TaskConfig).where(TaskConfig.name == name))
        task = result.scalar_one_or_none()

        if task:
            return TaskConfigPublic.model_validate(task)
        return None

    async def list(
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

        return [TaskConfigPublic.model_validate(t) for t in tasks]

    async def update(
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
        result = await self.session.execute(select(TaskConfig).where(TaskConfig.id == task_id))
        task = result.scalar_one_or_none()

        if not task:
            return None

        # Get update dict excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)

        # Validate new response schema if provided
        if "response_schema" in update_dict:
            try:
                self.schema_generator.validate_schema(update_dict["response_schema"])
            except ValueError as e:
                raise ValueError(f"Invalid response schema: {e}") from e

        # Apply updates
        for field, value in update_dict.items():
            setattr(task, field, value)

        await self.session.commit()
        await self.session.refresh(task)

        return TaskConfigPublic.model_validate(task)

    async def delete(self, task_id: UUID) -> bool:
        """Delete task configuration.

        Args:
            task_id: Task UUID

        Returns:
            True if deleted, False if not found

        Note:
            Will cascade delete agent_task_assignments due to FK constraint.
        """
        result = await self.session.execute(select(TaskConfig).where(TaskConfig.id == task_id))
        task = result.scalar_one_or_none()

        if not task:
            return False

        await self.session.delete(task)
        await self.session.commit()
        return True
