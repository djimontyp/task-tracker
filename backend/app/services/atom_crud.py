"""CRUD operations for Atom management."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import UTC
from enum import Enum
from typing import TYPE_CHECKING

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
from app.models.atom_version import AtomVersion
from app.services.base_crud import BaseCRUD

if TYPE_CHECKING:
    from app.services.embedding_service import EmbeddingService
    from app.services.semantic_search_service import SemanticSearchService

logger = logging.getLogger(__name__)


class DeduplicationAction(str, Enum):
    """Result of deduplication check."""

    CREATED_NEW = "created_new"  # New unique atom created
    CREATED_SIMILAR = "created_similar"  # New atom with similar_to reference
    CREATED_VERSION = "created_version"  # Created version of existing atom


@dataclass
class DeduplicationResult:
    """Result of create_with_dedup operation."""

    action: DeduplicationAction
    atom: AtomPublic
    similar_atom_id: uuid.UUID | None = None
    similarity_score: float | None = None
    version_id: int | None = None


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

    def _to_public(self, atom: Atom, pending_versions_count: int = 0) -> AtomPublic:
        """Convert Atom model to AtomPublic schema.

        Args:
            atom: Database atom instance
            pending_versions_count: Number of unapproved versions

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
            pending_versions_count=pending_versions_count,
            detected_language=getattr(atom, "detected_language", None),
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
        if not atom:
            return None

        # Count pending (unapproved) versions
        count_query = select(func.count()).select_from(AtomVersion).where(
            AtomVersion.atom_id == atom_id,
            AtomVersion.approved == False,  # noqa: E712
        )
        count_result = await self.session.execute(count_query)
        pending_count = count_result.scalar_one()

        return self._to_public(atom, pending_versions_count=pending_count)

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

        # Subquery for pending versions count per atom
        pending_subq = (
            select(
                AtomVersion.atom_id,
                func.count(AtomVersion.id).label("pending_count"),  # type: ignore[arg-type]
            )
            .where(AtomVersion.approved == False)  # noqa: E712
            .group_by(AtomVersion.atom_id)  # type: ignore[arg-type]
            .subquery()
        )

        # Main query with LEFT JOIN to get pending counts
        query = (
            select(Atom, func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"))
            .outerjoin(pending_subq, Atom.id == pending_subq.c.atom_id)  # type: ignore[arg-type]
            .offset(skip)
            .limit(limit)
            .order_by(desc(Atom.created_at))  # type: ignore[arg-type]
        )
        result = await self.session.execute(query)
        rows = result.all()

        return [self._to_public(row[0], pending_versions_count=row[1]) for row in rows], total

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
        # Subquery for pending versions count per atom
        pending_subq = (
            select(
                AtomVersion.atom_id,
                func.count(AtomVersion.id).label("pending_count"),  # type: ignore[arg-type]
            )
            .where(AtomVersion.approved == False)  # noqa: E712
            .group_by(AtomVersion.atom_id)  # type: ignore[arg-type]
            .subquery()
        )

        query = (
            select(Atom, func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"))
            .join(TopicAtom, TopicAtom.atom_id == Atom.id)  # type: ignore[arg-type]
            .outerjoin(pending_subq, Atom.id == pending_subq.c.atom_id)  # type: ignore[arg-type]
            .where(TopicAtom.topic_id == topic_id)
            .order_by(TopicAtom.position.asc().nulls_last(), desc(Atom.created_at))  # type: ignore[union-attr, arg-type]
        )

        result = await self.session.execute(query)
        rows = result.all()

        return [self._to_public(row[0], pending_versions_count=row[1]) for row in rows]

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

    async def create_with_dedup(
        self,
        atom_data: AtomCreate,
        embedding_service: "EmbeddingService",
        search_service: "SemanticSearchService",
        threshold_high: float = 0.95,
        threshold_mid: float = 0.85,
        created_by: str | None = None,
    ) -> DeduplicationResult:
        """Create atom with semantic deduplication.

        Checks for similar existing atoms using vector similarity:
        - >threshold_high (0.95): Creates AtomVersion for existing atom (pending approval)
        - threshold_mid to threshold_high (0.85-0.95): Creates new atom with similar_to metadata
        - <threshold_mid (0.85): Creates new unique atom

        Args:
            atom_data: Atom creation data
            embedding_service: Service for generating embeddings
            search_service: Service for semantic search
            threshold_high: Similarity threshold for version creation (default: 0.95)
            threshold_mid: Similarity threshold for similar_to reference (default: 0.85)
            created_by: User identifier for version attribution

        Returns:
            DeduplicationResult with action taken, atom, and similarity info

        Raises:
            ValueError: If embedding generation fails
            SQLAlchemyError: If database operation fails

        Example:
            >>> result = await atom_crud.create_with_dedup(
            ...     atom_data=AtomCreate(type="problem", title="Bug", content="..."),
            ...     embedding_service=embedding_svc,
            ...     search_service=search_svc,
            ... )
            >>> if result.action == DeduplicationAction.CREATED_VERSION:
            ...     print(f"Created version for existing atom {result.similar_atom_id}")
        """
        from app.services.versioning_service import VersioningService

        # 1. Generate embedding for new atom content
        text_for_embedding = f"{atom_data.title}\n\n{atom_data.content}"
        try:
            embedding = await embedding_service.generate_embedding(text_for_embedding)
        except Exception as e:
            logger.error(f"Failed to generate embedding for deduplication: {e}")
            raise ValueError(f"Embedding generation failed: {e}") from e

        # 2. Search for similar atoms using the embedding
        similar_atoms = await search_service.search_atoms_by_vector(
            session=self.session,
            embedding=embedding,
            limit=5,
            threshold=threshold_mid,  # Search with lower threshold to get candidates
        )

        # 3. Check similarity and decide action
        if similar_atoms:
            top_match, top_score = similar_atoms[0]

            if top_score > threshold_high:
                # High similarity: create version instead of new atom
                logger.info(
                    f"High similarity ({top_score:.3f}) found with atom {top_match.id}. "
                    f"Creating version instead of new atom."
                )

                versioning_service = VersioningService()
                version_data = {
                    "type": atom_data.type,
                    "title": atom_data.title,
                    "content": atom_data.content,
                    "confidence": atom_data.confidence,
                    "meta": atom_data.meta or {},
                }

                # Note: VersioningService has wrong type hint (int instead of UUID)
                version = await versioning_service.create_atom_version(
                    db=self.session,
                    atom_id=top_match.id,  # type: ignore[arg-type]
                    data=version_data,
                    created_by=created_by or "deduplication",
                )

                # Return the existing atom as the result
                atom_public = await self.get_atom(top_match.id)
                if atom_public is None:
                    # Should not happen, but handle gracefully
                    raise ValueError(f"Atom {top_match.id} not found after version creation")

                return DeduplicationResult(
                    action=DeduplicationAction.CREATED_VERSION,
                    atom=atom_public,
                    similar_atom_id=top_match.id,
                    similarity_score=top_score,
                    version_id=version.id,
                )

            elif top_score > threshold_mid:
                # Medium similarity: create new atom with similar_to reference
                logger.info(
                    f"Medium similarity ({top_score:.3f}) found with atom {top_match.id}. "
                    f"Creating new atom with similar_to reference."
                )

                # Merge similar_to into meta
                meta = atom_data.meta.copy() if atom_data.meta else {}
                meta["similar_to"] = str(top_match.id)
                meta["similarity_score"] = round(top_score, 4)

                # Create new atom with reference
                atom_dict = atom_data.model_dump()
                atom_dict["meta"] = meta
                atom_dict["embedding"] = embedding

                atom = await self.create(atom_dict)

                return DeduplicationResult(
                    action=DeduplicationAction.CREATED_SIMILAR,
                    atom=self._to_public(atom),
                    similar_atom_id=top_match.id,
                    similarity_score=top_score,
                )

        # 4. No significant similarity: create new unique atom
        logger.info("No similar atoms found. Creating new unique atom.")

        atom_dict = atom_data.model_dump()
        atom_dict["embedding"] = embedding

        atom = await self.create(atom_dict)

        return DeduplicationResult(
            action=DeduplicationAction.CREATED_NEW,
            atom=self._to_public(atom),
        )
