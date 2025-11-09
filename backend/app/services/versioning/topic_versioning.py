"""Topic versioning service."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.topic import Topic
from app.models.topic_version import TopicVersion


class TopicVersioningService:
    """Service for managing topic versions."""

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

    async def get_topic_versions(
        self,
        db: AsyncSession,
        topic_id: int,
    ) -> list[TopicVersion]:
        """
        Get all versions for a topic, ordered by version descending.

        Args:
            db: Database session
            topic_id: ID of the topic

        Returns:
            List of version records ordered by version (newest first)
        """
        stmt = select(TopicVersion).where(TopicVersion.topic_id == topic_id).order_by(desc(TopicVersion.version))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def approve_topic_version(
        self,
        db: AsyncSession,
        topic_id: int,
        version_number: int,
    ) -> TopicVersion:
        """
        Approve a topic version and apply changes to main entity.

        Args:
            db: Database session
            topic_id: ID of the topic
            version_number: Version number to approve

        Returns:
            Approved version record

        Raises:
            ValueError: If version not found or already approved
        """
        stmt = (
            select(TopicVersion).where(TopicVersion.topic_id == topic_id).where(TopicVersion.version == version_number)
        )
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        if version.approved:
            raise ValueError("Version already approved")

        entity = await db.get(Topic, topic_id)
        if entity:
            for key, value in version.data.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)

        version.approved = True
        version.approved_at = datetime.now(UTC)

        await db.commit()
        await db.refresh(version)

        return version

    async def reject_topic_version(
        self,
        db: AsyncSession,
        topic_id: int,
        version_number: int,
    ) -> TopicVersion:
        """
        Reject a topic version (mark as reviewed but not applied).

        Args:
            db: Database session
            topic_id: ID of the topic
            version_number: Version number to reject

        Returns:
            Version record

        Raises:
            ValueError: If version not found
        """
        stmt = (
            select(TopicVersion).where(TopicVersion.topic_id == topic_id).where(TopicVersion.version == version_number)
        )
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        await db.commit()

        return version

    async def bulk_approve_topic_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Bulk approve topic versions.

        Args:
            db: Database session
            version_ids: List of version IDs to approve

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
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

        return success_count, failed_ids, errors

    async def bulk_reject_topic_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Bulk reject topic versions.

        Args:
            db: Database session
            version_ids: List of version IDs to reject

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
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

        return success_count, failed_ids, errors

    async def _get_latest_topic_version(self, db: AsyncSession, topic_id: int) -> TopicVersion | None:
        """Get the latest version for a topic."""
        stmt = (
            select(TopicVersion).where(TopicVersion.topic_id == topic_id).order_by(desc(TopicVersion.version)).limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
