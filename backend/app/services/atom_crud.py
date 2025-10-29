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


class AtomCRUD:
    """CRUD service for Atom operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session
        self._base_crud = BaseCRUD(Atom, session)

    async def get(self, atom_id: uuid.UUID) -> AtomPublic | None:
        """Get atom by ID.

        Args:
            atom_id: Atom UUID to retrieve

        Returns:
            Atom or None if not found
        """
        atom = await self._base_crud.get(atom_id)

        if not atom:
            return None

        return AtomPublic(
            id=atom.id,
            type=atom.type,
            title=atom.title,
            content=atom.content,
            confidence=atom.confidence,
            user_approved=atom.user_approved,
            meta=atom.meta,
            created_at=atom.created_at.isoformat(),
            updated_at=atom.updated_at.isoformat(),
        )

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

        public_atoms = [
            AtomPublic(
                id=atom.id,
                type=atom.type,
                title=atom.title,
                content=atom.content,
                confidence=atom.confidence,
                user_approved=atom.user_approved,
                meta=atom.meta,
                created_at=atom.created_at.isoformat() if atom.created_at else "",
                updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
            )
            for atom in atoms
        ]

        return public_atoms, total

    async def create(self, atom_data: AtomCreate) -> AtomPublic:
        """Create a new atom.

        Args:
            atom_data: Atom creation data

        Returns:
            Created atom
        """
        atom = await self._base_crud.create(atom_data.model_dump())

        return AtomPublic(
            id=atom.id,
            type=atom.type,
            title=atom.title,
            content=atom.content,
            confidence=atom.confidence,
            user_approved=atom.user_approved,
            meta=atom.meta,
            created_at=atom.created_at.isoformat() if atom.created_at else "",
            updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
        )

    async def update(self, atom_id: uuid.UUID, atom_data: AtomUpdate) -> AtomPublic | None:
        """Update an existing atom.

        Args:
            atom_id: Atom UUID to update
            atom_data: Atom update data

        Returns:
            Updated atom or None if not found
        """
        atom = await self._base_crud.get(atom_id)

        if not atom:
            return None

        update_data = atom_data.model_dump(exclude_unset=True)
        atom = await self._base_crud.update(atom, update_data)

        return AtomPublic(
            id=atom.id,
            type=atom.type,
            title=atom.title,
            content=atom.content,
            confidence=atom.confidence,
            user_approved=atom.user_approved,
            meta=atom.meta,
            created_at=atom.created_at.isoformat() if atom.created_at else "",
            updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
        )

    async def delete(self, atom_id: uuid.UUID) -> bool:
        """Delete an atom.

        Args:
            atom_id: Atom UUID to delete

        Returns:
            True if deleted, False if not found
        """
        return await self._base_crud.delete(atom_id)

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

        return [
            AtomPublic(
                id=atom.id,
                type=atom.type,
                title=atom.title,
                content=atom.content,
                confidence=atom.confidence,
                user_approved=atom.user_approved,
                meta=atom.meta,
                created_at=atom.created_at.isoformat() if atom.created_at else "",
                updated_at=atom.updated_at.isoformat() if atom.updated_at else "",
            )
            for atom in atoms
        ]
