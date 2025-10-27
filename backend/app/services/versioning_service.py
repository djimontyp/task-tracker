"""Service for managing entity versions and diffs."""

from datetime import UTC, datetime
from typing import Any, Literal

from deepdiff import DeepDiff
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom import Atom
from app.models.atom_version import AtomVersion
from app.models.topic import Topic
from app.models.topic_version import TopicVersion
from app.services.websocket_manager import websocket_manager

EntityType = Literal["topic", "atom"]


class VersioningService:
    """Service for managing entity versions and diffs."""

    async def create_topic_version(
        self,
        db: AsyncSession,
        topic_id: int,
        data: dict[str, Any],
        created_by: str | None = None,
    ) -> TopicVersion:
        """
        Create new version snapshot for topic.

        Args:
            db: Database session
            topic_id: ID of the topic being versioned
            data: Snapshot data (name, description, icon, color, etc.)
            created_by: User ID who triggered the change

        Returns:
            Created TopicVersion instance
        """
        latest_version = await self._get_latest_topic_version(db, topic_id)
        next_version = (latest_version.version + 1) if latest_version else 1

        version = TopicVersion(
            topic_id=topic_id,
            version=next_version,
            data=data,
            created_by=created_by,
            approved=False,
        )
        db.add(version)
        await db.commit()
        await db.refresh(version)
        return version

    async def create_atom_version(
        self,
        db: AsyncSession,
        atom_id: int,
        data: dict[str, Any],
        created_by: str | None = None,
    ) -> AtomVersion:
        """
        Create new version snapshot for atom.

        Args:
            db: Database session
            atom_id: ID of the atom being versioned
            data: Snapshot data (type, content, title, confidence, meta)
            created_by: User ID who triggered the change

        Returns:
            Created AtomVersion instance
        """
        latest_version = await self._get_latest_atom_version(db, atom_id)
        next_version = (latest_version.version + 1) if latest_version else 1

        version = AtomVersion(
            atom_id=atom_id,
            version=next_version,
            data=data,
            created_by=created_by,
            approved=False,
        )
        db.add(version)
        await db.commit()
        await db.refresh(version)
        return version

    async def get_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
    ) -> list[TopicVersion | AtomVersion]:
        """
        Get all versions for an entity, ordered by version descending.

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            entity_id: ID of the entity

        Returns:
            List of version records ordered by version (newest first)
        """
        if entity_type == "topic":
            stmt = select(TopicVersion).where(TopicVersion.topic_id == entity_id).order_by(desc(TopicVersion.version))
            result = await db.execute(stmt)
            return list(result.scalars().all())
        else:
            stmt = select(AtomVersion).where(AtomVersion.atom_id == entity_id).order_by(desc(AtomVersion.version))
            result = await db.execute(stmt)
            return list(result.scalars().all())

    async def get_version_diff(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version1: int,
        version2: int,
    ) -> dict[str, Any]:
        """
        Generate diff between two versions using deepdiff.

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            entity_id: ID of the entity
            version1: First version number (older)
            version2: Second version number (newer)

        Returns:
            Dict with from_version, to_version, changes, and summary

        Raises:
            ValueError: If versions not found
        """
        if entity_type == "topic":
            model = TopicVersion
            id_field = "topic_id"
        else:
            model = AtomVersion
            id_field = "atom_id"

        stmt = (
            select(model).where(getattr(model, id_field) == entity_id).where(model.version.in_([version1, version2]))  # type: ignore[attr-defined]
        )
        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        v1 = next((v for v in versions if v.version == version1), None)
        v2 = next((v for v in versions if v.version == version2), None)

        if not v1 or not v2:
            raise ValueError(f"Version not found: {version1} or {version2}")

        diff = DeepDiff(v1.data, v2.data, ignore_order=True, view="tree")

        return {
            "from_version": version1,
            "to_version": version2,
            "changes": self._format_diff(diff),
            "summary": self._generate_summary(diff),
        }

    async def approve_version(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version_number: int,
    ) -> TopicVersion | AtomVersion:
        """
        Approve a version and apply changes to main entity.

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            entity_id: ID of the entity
            version_number: Version number to approve

        Returns:
            Approved version record

        Raises:
            ValueError: If version not found or already approved
        """
        if entity_type == "topic":
            model = TopicVersion
            entity_model = Topic
            id_field = "topic_id"
        else:
            model = AtomVersion
            entity_model = Atom
            id_field = "atom_id"

        stmt = (
            select(model).where(getattr(model, id_field) == entity_id).where(model.version == version_number)  # type: ignore[attr-defined]
        )
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        if version.approved:
            raise ValueError("Version already approved")

        entity = await db.get(entity_model, entity_id)
        if entity:
            for key, value in version.data.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)

        version.approved = True
        version.approved_at = datetime.now(UTC)

        await db.commit()
        await db.refresh(version)

        await self._broadcast_pending_count_update(db)

        return version

    async def reject_version(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        entity_id: int,
        version_number: int,
    ) -> TopicVersion | AtomVersion:
        """
        Reject a version (mark as reviewed but not applied).

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            entity_id: ID of the entity
            version_number: Version number to reject

        Returns:
            Version record

        Raises:
            ValueError: If version not found
        """
        if entity_type == "topic":
            model = TopicVersion
            id_field = "topic_id"
        else:
            model = AtomVersion
            id_field = "atom_id"

        stmt = (
            select(model).where(getattr(model, id_field) == entity_id).where(model.version == version_number)  # type: ignore[attr-defined]
        )
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        await db.commit()

        await self._broadcast_pending_count_update(db)

        return version

    async def _get_latest_topic_version(self, db: AsyncSession, topic_id: int) -> TopicVersion | None:
        """Get the latest version for a topic."""
        stmt = (
            select(TopicVersion).where(TopicVersion.topic_id == topic_id).order_by(desc(TopicVersion.version)).limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_latest_atom_version(self, db: AsyncSession, atom_id: int) -> AtomVersion | None:
        """Get the latest version for an atom."""
        stmt = select(AtomVersion).where(AtomVersion.atom_id == atom_id).order_by(desc(AtomVersion.version)).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    def _format_diff(self, diff: DeepDiff) -> list[dict[str, Any]]:
        """
        Format deepdiff output for API response.

        Args:
            diff: DeepDiff result

        Returns:
            List of change dictionaries
        """
        changes: list[dict[str, Any]] = []

        if hasattr(diff, "tree") and diff.tree:
            for change_type, items in diff.tree.items():
                for item in items:
                    path = str(item.path(output_format="list"))
                    change: dict[str, Any] = {
                        "type": change_type,
                        "path": path,
                    }

                    if hasattr(item, "t1"):
                        change["old_value"] = item.t1
                    if hasattr(item, "t2"):
                        change["new_value"] = item.t2

                    changes.append(change)

        return changes

    def _generate_summary(self, diff: DeepDiff) -> str:
        """
        Generate human-readable summary of changes.

        Args:
            diff: DeepDiff result

        Returns:
            Summary string
        """
        if not diff:
            return "No changes detected"

        change_counts: dict[str, int] = {}
        for change_type in diff.tree.keys() if hasattr(diff, "tree") and diff.tree else []:
            change_counts[change_type] = len(diff.tree[change_type])

        parts: list[str] = []
        for change_type, count in change_counts.items():
            parts.append(f"{count} {change_type.replace('_', ' ')}")

        return f"Changes detected: {', '.join(parts)}"

    async def bulk_approve_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        version_ids: list[int],
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Approve multiple versions in a transaction-safe manner.

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            version_ids: List of version IDs to approve

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
        if entity_type == "topic":
            return await self._bulk_approve_topic_versions(db, version_ids)
        else:
            return await self._bulk_approve_atom_versions(db, version_ids)

    async def _bulk_approve_topic_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """Bulk approve topic versions."""
        model = TopicVersion

        success_count = 0
        failed_ids: list[int] = []
        errors: dict[int, str] = {}

        stmt = select(model).where(TopicVersion.id.in_(version_ids))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        version_map = {v.id: v for v in versions}

        for version_id in version_ids:
            version = version_map.get(version_id)
            if not version:
                failed_ids.append(version_id)
                errors[version_id] = "Version not found"
                continue

            if version.approved:
                failed_ids.append(version_id)
                errors[version_id] = "Version already approved"
                continue

            try:
                entity = await db.get(Topic, version.topic_id)

                if entity:
                    for key, value in version.data.items():
                        if hasattr(entity, key):
                            setattr(entity, key, value)

                version.approved = True
                version.approved_at = datetime.now(UTC)
                success_count += 1
            except Exception as e:
                failed_ids.append(version_id)
                errors[version_id] = str(e)

        await db.commit()

        await self._broadcast_pending_count_update(db)

        return success_count, failed_ids, errors

    async def _bulk_approve_atom_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """Bulk approve atom versions."""
        model = AtomVersion
        success_count = 0
        failed_ids: list[int] = []
        errors: dict[int, str] = {}

        stmt = select(model).where(AtomVersion.id.in_(version_ids))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        version_map = {v.id: v for v in versions}

        for version_id in version_ids:
            version = version_map.get(version_id)
            if not version:
                failed_ids.append(version_id)
                errors[version_id] = "Version not found"
                continue

            if version.approved:
                failed_ids.append(version_id)
                errors[version_id] = "Version already approved"
                continue

            try:
                entity = await db.get(Atom, version.atom_id)

                if entity:
                    for key, value in version.data.items():
                        if hasattr(entity, key):
                            setattr(entity, key, value)

                version.approved = True
                version.approved_at = datetime.now(UTC)
                success_count += 1
            except Exception as e:
                failed_ids.append(version_id)
                errors[version_id] = str(e)

        await db.commit()

        await self._broadcast_pending_count_update(db)

        return success_count, failed_ids, errors

    async def bulk_reject_versions(
        self,
        db: AsyncSession,
        entity_type: EntityType,
        version_ids: list[int],
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Reject multiple versions (mark as reviewed but not applied).

        Args:
            db: Database session
            entity_type: Type of entity ("topic" or "atom")
            version_ids: List of version IDs to reject

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
        if entity_type == "topic":
            return await self._bulk_reject_topic_versions(db, version_ids)
        else:
            return await self._bulk_reject_atom_versions(db, version_ids)

    async def _bulk_reject_topic_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """Bulk reject topic versions."""
        success_count = 0
        failed_ids: list[int] = []
        errors: dict[int, str] = {}

        stmt = select(TopicVersion).where(TopicVersion.id.in_(version_ids))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        version_map = {v.id: v for v in versions}

        for version_id in version_ids:
            version = version_map.get(version_id)
            if not version:
                failed_ids.append(version_id)
                errors[version_id] = "Version not found"
                continue

            success_count += 1

        await db.commit()

        await self._broadcast_pending_count_update(db)

        return success_count, failed_ids, errors

    async def _bulk_reject_atom_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """Bulk reject atom versions."""
        success_count = 0
        failed_ids: list[int] = []
        errors: dict[int, str] = {}

        stmt = select(AtomVersion).where(AtomVersion.id.in_(version_ids))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        versions = list(result.scalars().all())

        version_map = {v.id: v for v in versions}

        for version_id in version_ids:
            version = version_map.get(version_id)
            if not version:
                failed_ids.append(version_id)
                errors[version_id] = "Version not found"
                continue

            success_count += 1

        await db.commit()

        await self._broadcast_pending_count_update(db)

        return success_count, failed_ids, errors

    async def get_pending_versions_count(self, db: AsyncSession) -> int:
        """
        Get total count of pending (unapproved) versions across all entities.

        Args:
            db: Database session

        Returns:
            Total count of pending versions
        """
        topic_stmt = select(func.count()).select_from(TopicVersion).where(TopicVersion.approved == False)  # noqa: E712
        atom_stmt = select(func.count()).select_from(AtomVersion).where(AtomVersion.approved == False)  # noqa: E712

        topic_count = await db.scalar(topic_stmt) or 0
        atom_count = await db.scalar(atom_stmt) or 0

        return topic_count + atom_count

    async def get_pending_count(self, db: AsyncSession) -> dict[str, int]:
        """
        Get detailed count of pending (unapproved) versions by entity type.

        Args:
            db: Database session

        Returns:
            Dictionary with count, topics, atoms counts
        """
        topic_stmt = select(func.count()).select_from(TopicVersion).where(TopicVersion.approved == False)  # noqa: E712
        atom_stmt = select(func.count()).select_from(AtomVersion).where(AtomVersion.approved == False)  # noqa: E712

        topic_count = await db.scalar(topic_stmt) or 0
        atom_count = await db.scalar(atom_stmt) or 0

        return {
            "count": topic_count + atom_count,
            "topics": topic_count,
            "atoms": atom_count,
        }

    async def _broadcast_pending_count_update(self, db: AsyncSession) -> None:
        """
        Broadcast WebSocket event for pending version count update.

        Args:
            db: Database session
        """
        pending_count = await self.get_pending_versions_count(db)

        await websocket_manager.broadcast(
            "versions",
            {
                "event": "pending_count_updated",
                "count": pending_count,
                "last_updated": datetime.now(UTC).isoformat(),
            },
        )

    async def get_daily_stats(self, db: AsyncSession) -> dict[str, int]:
        """
        Get daily statistics for version approvals (last 24 hours).

        Args:
            db: Database session

        Returns:
            Dictionary with approved, rejected, pending counts and auto-approval rate
        """
        from datetime import timedelta

        twenty_four_hours_ago = datetime.now(UTC) - timedelta(days=1)

        topic_approved = (
            select(func.count())
            .select_from(TopicVersion)
            .where(TopicVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
            .where(TopicVersion.approved_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )
        atom_approved = (
            select(func.count())
            .select_from(AtomVersion)
            .where(AtomVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
            .where(AtomVersion.approved_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )

        approved_count = (await db.scalar(topic_approved) or 0) + (
            await db.scalar(atom_approved) or 0
        )

        topic_total = (
            select(func.count())
            .select_from(TopicVersion)
            .where(TopicVersion.created_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )
        atom_total = (
            select(func.count())
            .select_from(AtomVersion)
            .where(AtomVersion.created_at >= twenty_four_hours_ago)  # type: ignore[arg-type, operator]
        )

        total_count = (await db.scalar(topic_total) or 0) + (
            await db.scalar(atom_total) or 0
        )

        rejected_count = total_count - approved_count
        pending_count = await self.get_pending_versions_count(db)

        auto_approval_rate = (
            int((approved_count / total_count) * 100) if total_count > 0 else 0
        )

        return {
            "approved": approved_count,
            "rejected": rejected_count,
            "pending": pending_count,
            "auto_approval_rate": auto_approval_rate,
        }
