"""Generic CRUD operations base class.

Provides type-safe generic CRUD operations for SQLModel entities,
reducing code duplication across service layer.
"""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseCRUD(Generic[T]):
    """Generic CRUD operations for SQLModel entities.

    Provides standard create, read, update, delete operations with type safety.
    Designed to be inherited by specific CRUD services that add business logic.

    Type parameter T must be a SQLModel with an 'id' field of type UUID.
    """

    def __init__(self, model: type[T], session: AsyncSession) -> None:
        """Initialize CRUD service.

        Args:
            model: SQLModel class to perform operations on
            session: Async database session for executing queries
        """
        self.model = model
        self.session = session

    async def create(self, obj_in: dict[str, Any]) -> T:
        """Create new entity from dictionary.

        Args:
            obj_in: Dictionary containing entity fields

        Returns:
            Created entity instance

        Note:
            Caller is responsible for validation before passing obj_in.
            Use Pydantic models (e.g., *Create schemas) for validation.
        """
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def get(self, id: UUID) -> T | None:
        """Get entity by ID.

        Args:
            id: Entity UUID

        Returns:
            Entity if found, None otherwise
        """
        result = await self.session.execute(select(self.model).where(self.model.id == id))  # type: ignore[attr-defined]
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[T]:
        """Get multiple entities with pagination.

        Args:
            skip: Number of records to skip (pagination offset)
            limit: Maximum number of records to return

        Returns:
            List of entities (may be empty)
        """
        query = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, db_obj: T, update_data: dict[str, Any]) -> T:
        """Update entity with new values.

        Args:
            db_obj: Existing entity to update
            update_data: Dictionary of fields to update (should exclude unset fields)

        Returns:
            Updated entity instance

        Note:
            Only fields present in update_data will be modified.
            Use Pydantic's model_dump(exclude_unset=True) to get update_data.
        """
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: UUID) -> bool:
        """Delete entity by ID.

        Args:
            id: Entity UUID

        Returns:
            True if entity was deleted, False if not found
        """
        result = await self.session.execute(select(self.model).where(self.model.id == id))  # type: ignore[attr-defined]
        db_obj = result.scalar_one_or_none()

        if not db_obj:
            return False

        await self.session.delete(db_obj)
        await self.session.commit()
        return True
