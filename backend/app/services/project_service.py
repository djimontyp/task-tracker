"""ProjectConfig service for CRUD operations.

Provides database operations for project configuration management.
"""

from datetime import datetime
from uuid import UUID

from packaging.version import Version
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    ProjectConfig,
    ProjectConfigCreate,
    ProjectConfigPublic,
    ProjectConfigUpdate,
)
from app.services.base_crud import BaseCRUD


class ProjectConfigCRUD:
    """CRUD service for ProjectConfig operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session
        self._base_crud = BaseCRUD(ProjectConfig, session)

    async def create(self, project_data: ProjectConfigCreate) -> ProjectConfigPublic:
        """Create new project configuration.

        Args:
            project_data: Project creation data

        Returns:
            Created project configuration with public fields

        Raises:
            ValueError: If project name already exists or keywords empty
        """
        # Check name uniqueness
        existing = await self.get_by_name(project_data.name)
        if existing:
            raise ValueError(f"Project with name '{project_data.name}' already exists")

        # Validate keywords not empty
        if not project_data.keywords or len(project_data.keywords) == 0:
            raise ValueError("Project keywords cannot be empty")

        # Create project record
        project = ProjectConfig(**project_data.model_dump())

        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)

        return ProjectConfigPublic.model_validate(project)

    async def get(self, project_id: UUID) -> ProjectConfigPublic | None:
        """Get project configuration by ID.

        Args:
            project_id: Project UUID

        Returns:
            Project configuration if found, None otherwise
        """
        project = await self._base_crud.get(project_id)

        if project:
            return ProjectConfigPublic.model_validate(project)
        return None

    async def get_by_name(self, name: str) -> ProjectConfigPublic | None:
        """Get project configuration by name.

        Args:
            name: Project name

        Returns:
            Project configuration if found, None otherwise
        """
        result = await self.session.execute(select(ProjectConfig).where(ProjectConfig.name == name))
        project = result.scalar_one_or_none()

        if project:
            return ProjectConfigPublic.model_validate(project)
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
    ) -> tuple[list[ProjectConfigPublic], int]:
        """List project configurations with pagination and filters.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            is_active: Filter by active status (None = all)

        Returns:
            List of project configurations
        """
        query = select(ProjectConfig)
        count_query = select(func.count()).select_from(ProjectConfig)

        # Apply filters
        if is_active is not None:
            condition = ProjectConfig.is_active == is_active
            query = query.where(condition)
            count_query = count_query.where(condition)

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        projects = result.scalars().all()

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        return [ProjectConfigPublic.model_validate(p) for p in projects], total

    async def update(
        self,
        project_id: UUID,
        update_data: ProjectConfigUpdate,
    ) -> ProjectConfigPublic | None:
        """Update project configuration with version increment.

        Args:
            project_id: Project UUID
            update_data: Fields to update

        Returns:
            Updated project configuration if found, None otherwise
        """
        project = await self._base_crud.get(project_id)

        if not project:
            return None

        # Get update dict excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)

        # Increment version if config changes (semantic versioning)
        if any(key in update_dict for key in ["keywords", "glossary", "components", "priority_rules"]):
            current_version = Version(project.version)
            # Increment minor version for config changes
            new_version = f"{current_version.major}.{current_version.minor + 1}.0"
            update_dict["version"] = new_version

        # Update updated_at timestamp
        update_dict["updated_at"] = datetime.utcnow()

        # Apply updates
        for field, value in update_dict.items():
            setattr(project, field, value)

        await self.session.commit()
        await self.session.refresh(project)

        return ProjectConfigPublic.model_validate(project)

    async def delete(self, project_id: UUID) -> bool:
        """Delete project configuration.

        Args:
            project_id: Project UUID

        Returns:
            True if deleted, False if not found
        """
        return await self._base_crud.delete(project_id)
