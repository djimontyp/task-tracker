"""CRUD operations for Atom management."""

from __future__ import annotations

import uuid

from sqlalchemy import desc
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.atom import (
    Atom,
    AtomCreate,
    AtomPublic,
    AtomUpdate,
    TopicAtom,
)
from app.services.base_crud import BaseCRUD


class AtomCRUD(BaseCRUD[Atom]):
    """CRUD service for Atom operations.

    Inherits standard CRUD operations from BaseCRUD and adds
    atom-specific business logic for topic relationships.
    """

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        super().__init__(Atom, session)

    def _to_public(self, atom: Atom) -> AtomPublic:
        """Convert Atom model to AtomPublic schema.

        Args:
            atom: Database atom instance

        Returns:
            Public atom schema
        """
        return AtomPublic(
            id=str(atom.id),
            type=atom.type,
            title=atom.title,
            content=atom.content,
            confidence=atom.confidence,
            user_approved=atom.user_approved,
            meta=atom.meta,
            embedding=atom.embedding,
            has_embedding=atom.embedding is not None,
            created_at=atom.created_at,
            updated_at=atom.updated_at,
        )

    async def get_atom(self, atom_id: uuid.UUID) -> AtomPublic | None:
        """Get atom by ID.

        Args:
            atom_id: Atom UUID to retrieve

        Returns:
            AtomPublic or None if not found
        """
        atom = await self.get(atom_id)
        return self._to_public(atom) if atom else None

    async def list_atoms(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[AtomPublic], int]:
        """List atoms with pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (list of atoms, total count)
        """
        count_query = select(func.count()).select_from(Atom)
        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = select(Atom).offset(skip).limit(limit).order_by(desc(Atom.created_at))  # type: ignore[arg-type]
        result = await self.session.execute(query)
        atoms = result.scalars().all()

        return [self._to_public(atom) for atom in atoms], total

    async def create_atom(self, atom_data: AtomCreate) -> AtomPublic:
        """Create a new atom.

        Args:
            atom_data: Atom creation data

        Returns:
            Created atom
        """
        atom = await self.create(atom_data.model_dump())
        return self._to_public(atom)

    async def update_atom(self, atom_id: uuid.UUID, atom_data: AtomUpdate) -> AtomPublic | None:
        """Update an existing atom.

        Args:
            atom_id: Atom UUID to update
            atom_data: Atom update data

        Returns:
            Updated atom or None if not found
        """
        atom = await self.get(atom_id)
        if not atom:
            return None

        update_data = atom_data.model_dump(exclude_unset=True)
        updated_atom = await self.update(atom, update_data)
        return self._to_public(updated_atom)

    async def link_to_topic(
        self, atom_id: uuid.UUID, topic_id: uuid.UUID, position: int | None = None, note: str | None = None
    ) -> bool:
        """Link an atom to a topic.

        Args:
            atom_id: Atom UUID
            topic_id: Topic UUID
            position: Optional display order
            note: Optional contextual note

        Returns:
            True if linked successfully, False if link already exists
        """
        existing_query = select(TopicAtom).where(
            TopicAtom.topic_id == topic_id,
            TopicAtom.atom_id == atom_id,
        )
        existing_result = await self.session.execute(existing_query)
        existing_link = existing_result.scalar_one_or_none()

        if existing_link:
            return False

        topic_atom = TopicAtom(
            topic_id=topic_id,
            atom_id=atom_id,
            position=position,
            note=note,
        )

        self.session.add(topic_atom)
        await self.session.commit()

        return True

    async def list_by_topic(self, topic_id: uuid.UUID) -> list[AtomPublic]:
        """Get all atoms for a specific topic.

        Args:
            topic_id: Topic UUID

        Returns:
            List of atoms belonging to the topic
        """
        query = (
            select(Atom)
            .join(TopicAtom, TopicAtom.atom_id == Atom.id)  # type: ignore[arg-type]
            .where(TopicAtom.topic_id == topic_id)
            .order_by(TopicAtom.position.asc().nulls_last(), desc(Atom.created_at))  # type: ignore[union-attr, arg-type]
        )

        result = await self.session.execute(query)
        atoms = result.scalars().all()

        return [self._to_public(atom) for atom in atoms]
