"""Service for managing entity versions and diffs."""

from datetime import UTC, datetime
from typing import Any, Literal

from deepdiff import DeepDiff
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom import Atom
from app.models.atom_version import AtomVersion
from app.models.topic import Topic
from app.models.topic_version import TopicVersion

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
