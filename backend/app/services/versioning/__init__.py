"""Versioning service package with backward compatibility."""

from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom_version import AtomVersion
from app.models.topic_version import TopicVersion
from app.services.versioning.atom_versioning import AtomVersioningService
from app.services.versioning.diff_service import DiffService, EntityType
from app.services.versioning.topic_versioning import TopicVersioningService
from app.services.versioning.versioning_base import BaseVersioningService

__all__ = [
    "VersioningService",
    "TopicVersioningService",
    "AtomVersioningService",
    "DiffService",
    "BaseVersioningService",
    "EntityType",
]


class VersioningService:
    """Unified versioning service maintaining backward compatibility."""

    def __init__(self) -> None:
        """Initialize versioning service with all sub-services."""
        self._topic_service = TopicVersioningService()
        self._atom_service = AtomVersioningService()
        self._diff_service = DiffService()
        self._base_service = BaseVersioningService()

    async def create_topic_version(
        self,
        db: AsyncSession,
        topic_id: int,
        data: dict[str, Any],
        created_by: str | None = None,
    ) -> TopicVersion:
        """Create new version snapshot for topic."""
        return await self._topic_service.create_topic_version(db, topic_id, data, created_by)

    async def create_atom_version(
        self,
        db: AsyncSession,
        atom_id: int,
        data: dict[str, Any],
        created_by: str | None = None,
    ) -> AtomVersion:
        """Create new version snapshot for atom."""
        return await self._atom_service.create_atom_version(db, atom_id, data, created_by)

    async def get_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
    ) -> list[TopicVersion | AtomVersion]:
        """Get all versions for an entity, ordered by version descending."""
        if entity_type == "topic":
            return await self._topic_service.get_topic_versions(db, entity_id)
        else:
            return await self._atom_service.get_atom_versions(db, entity_id)

    async def get_version_diff(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version1: int,
        version2: int,
    ) -> dict[str, Any]:
        """Generate diff between two versions using deepdiff."""
        return await self._diff_service.get_version_diff(db, entity_type, entity_id, version1, version2)

    async def approve_version(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version_number: int,
    ) -> TopicVersion | AtomVersion:
        """Approve a version and apply changes to main entity."""
        if entity_type == "topic":
            result = await self._topic_service.approve_topic_version(db, entity_id, version_number)
        else:
            result = await self._atom_service.approve_atom_version(db, entity_id, version_number)

        await self._base_service.broadcast_pending_count_update(db)
        return result

    async def reject_version(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version_number: int,
    ) -> TopicVersion | AtomVersion:
        """Reject a version (mark as reviewed but not applied)."""
        if entity_type == "topic":
            result = await self._topic_service.reject_topic_version(db, entity_id, version_number)
        else:
            result = await self._atom_service.reject_atom_version(db, entity_id, version_number)

        await self._base_service.broadcast_pending_count_update(db)
        return result

    async def bulk_approve_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        version_ids: list[int],
    ) -> tuple[int, list[int], dict[int, str]]:
        """Approve multiple versions in a transaction-safe manner."""
        if entity_type == "topic":
            result = await self._topic_service.bulk_approve_topic_versions(db, version_ids)
        else:
            result = await self._atom_service.bulk_approve_atom_versions(db, version_ids)

        await self._base_service.broadcast_pending_count_update(db)
        return result

    async def bulk_reject_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        version_ids: list[int],
    ) -> tuple[int, list[int], dict[int, str]]:
        """Reject multiple versions (mark as reviewed but not applied)."""
        if entity_type == "topic":
            result = await self._topic_service.bulk_reject_topic_versions(db, version_ids)
        else:
            result = await self._atom_service.bulk_reject_atom_versions(db, version_ids)

        await self._base_service.broadcast_pending_count_update(db)
        return result

    async def get_pending_versions_count(self, db: AsyncSession) -> int:
        """Get total count of pending (unapproved) versions across all entities."""
        return await self._base_service.get_pending_versions_count(db)

    async def get_pending_count(self, db: AsyncSession) -> dict[str, int]:
        """Get detailed count of pending (unapproved) versions by entity type."""
        return await self._base_service.get_pending_count(db)

    async def get_daily_stats(self, db: AsyncSession) -> dict[str, int]:
        """Get daily statistics for version approvals (last 24 hours)."""
        return await self._base_service.get_daily_stats(db)

    async def _broadcast_pending_count_update(self, db: AsyncSession) -> None:
        """Broadcast WebSocket event for pending version count update."""
        await self._base_service.broadcast_pending_count_update(db)
