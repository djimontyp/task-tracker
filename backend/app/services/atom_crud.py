"""CRUD operations for Atom management."""

from __future__ import annotations

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.atom import (
    Atom,
    AtomCreate,
    AtomPublic,
    AtomUpdate,
    TopicAtom,
)


class AtomCRUD:
    """CRUD service for Atom operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session

    async def get(self, atom_id: int) -> AtomPublic | None:
        """Get atom by ID.

        Args:
            atom_id: Atom ID to retrieve

        Returns:
            Atom or None if not found
        """
        query = select(Atom).where(Atom.id == atom_id)
        result = await self.session.execute(query)
        atom = result.scalar_one_or_none()

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

    async def list(
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

        query = select(Atom).offset(skip).limit(limit).order_by(Atom.created_at.desc())
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
                created_at=atom.created_at.isoformat(),
                updated_at=atom.updated_at.isoformat(),
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
        atom = Atom(
            type=atom_data.type,
            title=atom_data.title,
            content=atom_data.content,
            confidence=atom_data.confidence,
            user_approved=atom_data.user_approved,
            meta=atom_data.meta,
        )

        self.session.add(atom)
        await self.session.commit()
        await self.session.refresh(atom)

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

    async def update(self, atom_id: int, atom_data: AtomUpdate) -> AtomPublic | None:
        """Update an existing atom.

        Args:
            atom_id: Atom ID to update
            atom_data: Atom update data

        Returns:
            Updated atom or None if not found
        """
        query = select(Atom).where(Atom.id == atom_id)
        result = await self.session.execute(query)
        atom = result.scalar_one_or_none()

        if not atom:
            return None

        if atom_data.type is not None:
            atom.type = atom_data.type
        if atom_data.title is not None:
            atom.title = atom_data.title
        if atom_data.content is not None:
            atom.content = atom_data.content
        if atom_data.confidence is not None:
            atom.confidence = atom_data.confidence
        if atom_data.user_approved is not None:
            atom.user_approved = atom_data.user_approved
        if atom_data.meta is not None:
            atom.meta = atom_data.meta

        await self.session.commit()
        await self.session.refresh(atom)

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

    async def delete(self, atom_id: int) -> bool:
        """Delete an atom.

        Args:
            atom_id: Atom ID to delete

        Returns:
            True if deleted, False if not found
        """
        query = select(Atom).where(Atom.id == atom_id)
        result = await self.session.execute(query)
        atom = result.scalar_one_or_none()

        if not atom:
            return False

        await self.session.delete(atom)
        await self.session.commit()

        return True

    async def link_to_topic(
        self, atom_id: int, topic_id: int, position: int | None = None, note: str | None = None
    ) -> bool:
        """Link an atom to a topic.

        Args:
            atom_id: Atom ID
            topic_id: Topic ID
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

    async def list_by_topic(self, topic_id: int) -> list[AtomPublic]:
        """Get all atoms for a specific topic.

        Args:
            topic_id: Topic ID

        Returns:
            List of atoms belonging to the topic
        """
        query = (
            select(Atom)
            .join(TopicAtom, Atom.id == TopicAtom.atom_id)
            .where(TopicAtom.topic_id == topic_id)
            .order_by(TopicAtom.position.asc().nulls_last(), Atom.created_at.desc())
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
                created_at=atom.created_at.isoformat(),
                updated_at=atom.updated_at.isoformat(),
            )
            for atom in atoms
        ]
