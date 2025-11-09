"""CRUD operations for Atom management."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC

from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.atom import (
    Atom,
    AtomCreate,
    AtomLink,
    AtomPublic,
    AtomUpdate,
    BulkApproveResponse,
    BulkArchiveResponse,
    BulkDeleteResponse,
    TopicAtom,
)
from app.services.base_crud import BaseCRUD

logger = logging.getLogger(__name__)


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
            archived=atom.archived,
            archived_at=atom.archived_at,
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

    async def bulk_approve_atoms(self, atom_ids: list[str]) -> BulkApproveResponse:
        """Bulk approve multiple atoms in a single transaction.

        This operation uses a partial success strategy: atoms that can be approved
        will be approved, while invalid/missing atoms will be reported in failed_ids.

        Args:
            atom_ids: List of atom ID strings (UUIDs) to approve

        Returns:
            BulkApproveResponse with counts and any failures

        Note:
            Uses database transaction for atomicity. Already-approved atoms
            are updated idempotently (re-approval is safe).
        """
        approved_count = 0
        failed_ids: list[str] = []
        errors: list[str] = []

        try:
            async with self.session.begin_nested():
                for atom_id_str in atom_ids:
                    try:
                        atom_id = uuid.UUID(atom_id_str)
                    except (ValueError, AttributeError) as e:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Invalid UUID format: {atom_id_str}")
                        logger.warning(f"Invalid atom UUID in bulk approve: {atom_id_str} - {e}")
                        continue

                    atom = await self.get(atom_id)
                    if not atom:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Atom not found: {atom_id_str}")
                        logger.warning(f"Atom not found in bulk approve: {atom_id_str}")
                        continue

                    atom.user_approved = True
                    self.session.add(atom)
                    approved_count += 1

                await self.session.commit()

        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error(f"Database error during bulk approve: {e}")
            raise

        return BulkApproveResponse(
            approved_count=approved_count,
            failed_ids=failed_ids,
            errors=errors,
        )

    async def bulk_archive_atoms(self, atom_ids: list[str]) -> BulkArchiveResponse:
        """Bulk archive multiple atoms in a single transaction.

        This operation uses a partial success strategy: atoms that can be archived
        will be archived, while invalid/missing atoms will be reported in failed_ids.

        Args:
            atom_ids: List of atom ID strings (UUIDs) to archive

        Returns:
            BulkArchiveResponse with counts and any failures

        Note:
            Uses database transaction for atomicity. Already-archived atoms
            are updated idempotently (re-archiving is safe).
        """
        from datetime import datetime

        archived_count = 0
        failed_ids: list[str] = []
        errors: list[str] = []

        try:
            async with self.session.begin_nested():
                for atom_id_str in atom_ids:
                    try:
                        atom_id = uuid.UUID(atom_id_str)
                    except (ValueError, AttributeError) as e:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Invalid UUID format: {atom_id_str}")
                        logger.warning(f"Invalid atom UUID in bulk archive: {atom_id_str} - {e}")
                        continue

                    atom = await self.get(atom_id)
                    if not atom:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Atom not found: {atom_id_str}")
                        logger.warning(f"Atom not found in bulk archive: {atom_id_str}")
                        continue

                    atom.archived = True
                    atom.archived_at = datetime.now(UTC)
                    self.session.add(atom)
                    archived_count += 1

                await self.session.commit()

        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error(f"Database error during bulk archive: {e}")
            raise

        return BulkArchiveResponse(
            archived_count=archived_count,
            failed_ids=failed_ids,
            errors=errors,
        )

    async def bulk_delete_atoms(self, atom_ids: list[str]) -> BulkDeleteResponse:
        """Bulk delete multiple atoms in a single transaction.

        This operation uses a partial success strategy: atoms that can be deleted
        will be deleted, while invalid/missing atoms will be reported in failed_ids.

        Cascade delete logic:
        - Deletes related atom_links (from_atom_id and to_atom_id)
        - Deletes related atom_versions
        - Deletes related topic_atoms relationships
        - Then deletes the atom itself

        Args:
            atom_ids: List of atom ID strings (UUIDs) to delete

        Returns:
            BulkDeleteResponse with counts and any failures

        Note:
            Uses database transaction for atomicity. Foreign key constraints
            (NO ACTION) require manual cascade delete of related records.
        """

        deleted_count = 0
        failed_ids: list[str] = []
        errors: list[str] = []

        try:
            async with self.session.begin_nested():
                for atom_id_str in atom_ids:
                    try:
                        atom_id = uuid.UUID(atom_id_str)
                    except (ValueError, AttributeError) as e:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Invalid UUID format: {atom_id_str}")
                        logger.warning(f"Invalid atom UUID in bulk delete: {atom_id_str} - {e}")
                        continue

                    atom = await self.get(atom_id)
                    if not atom:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Atom not found: {atom_id_str}")
                        logger.warning(f"Atom not found in bulk delete: {atom_id_str}")
                        continue

                    try:
                        await self._cascade_delete_atom_relations(atom_id)
                        await self.session.delete(atom)
                        deleted_count += 1
                    except SQLAlchemyError as e:
                        failed_ids.append(atom_id_str)
                        errors.append(f"Delete failed for {atom_id_str}: {str(e)}")
                        logger.error(f"Failed to delete atom {atom_id_str}: {e}")
                        continue

                await self.session.commit()

        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error(f"Database error during bulk delete: {e}")
            raise

        return BulkDeleteResponse(
            deleted_count=deleted_count,
            failed_ids=failed_ids,
            errors=errors,
        )

    async def _cascade_delete_atom_relations(self, atom_id: uuid.UUID) -> None:
        """Delete all related records before deleting an atom.

        Args:
            atom_id: Atom UUID whose relations should be deleted

        Raises:
            SQLAlchemyError: If deletion fails
        """
        from app.models.atom_version import AtomVersion

        delete_atom_links_from = select(AtomLink).where(AtomLink.from_atom_id == atom_id)
        result_from = await self.session.execute(delete_atom_links_from)
        for link in result_from.scalars().all():
            await self.session.delete(link)

        delete_atom_links_to = select(AtomLink).where(AtomLink.to_atom_id == atom_id)
        result_to = await self.session.execute(delete_atom_links_to)
        for link in result_to.scalars().all():
            await self.session.delete(link)

        delete_atom_versions = select(AtomVersion).where(AtomVersion.atom_id == atom_id)
        result_versions = await self.session.execute(delete_atom_versions)
        for version in result_versions.scalars().all():
            await self.session.delete(version)

        delete_topic_atoms = select(TopicAtom).where(TopicAtom.atom_id == atom_id)
        result_topic_atoms = await self.session.execute(delete_topic_atoms)
        for topic_atom in result_topic_atoms.scalars().all():
            await self.session.delete(topic_atom)

        await self.session.flush()
