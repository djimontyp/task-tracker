"""Atom versioning service."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom import Atom
from app.models.atom_version import AtomVersion


class AtomVersioningService:
    """Service for managing atom versions."""

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

    async def get_atom_versions(
        self,
        db: AsyncSession,
        atom_id: int,
    ) -> list[AtomVersion]:
        """
        Get all versions for an atom, ordered by version descending.

        Args:
            db: Database session
            atom_id: ID of the atom

        Returns:
            List of version records ordered by version (newest first)
        """
        stmt = select(AtomVersion).where(AtomVersion.atom_id == atom_id).order_by(desc(AtomVersion.version))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def approve_atom_version(
        self,
        db: AsyncSession,
        atom_id: int,
        version_number: int,
    ) -> AtomVersion:
        """
        Approve an atom version and apply changes to main entity.

        Args:
            db: Database session
            atom_id: ID of the atom
            version_number: Version number to approve

        Returns:
            Approved version record

        Raises:
            ValueError: If version not found or already approved
        """
        stmt = select(AtomVersion).where(AtomVersion.atom_id == atom_id).where(AtomVersion.version == version_number)
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        if version.approved:
            raise ValueError("Version already approved")

        entity = await db.get(Atom, atom_id)
        if entity:
            for key, value in version.data.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)

        version.approved = True
        version.approved_at = datetime.now(UTC)

        await db.commit()
        await db.refresh(version)

        return version

    async def reject_atom_version(
        self,
        db: AsyncSession,
        atom_id: int,
        version_number: int,
    ) -> AtomVersion:
        """
        Reject an atom version (mark as reviewed but not applied).

        Args:
            db: Database session
            atom_id: ID of the atom
            version_number: Version number to reject

        Returns:
            Version record

        Raises:
            ValueError: If version not found
        """
        stmt = select(AtomVersion).where(AtomVersion.atom_id == atom_id).where(AtomVersion.version == version_number)
        result = await db.execute(stmt)
        version = result.scalar_one_or_none()

        if not version:
            raise ValueError(f"Version {version_number} not found")

        await db.commit()

        return version

    async def bulk_approve_atom_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Bulk approve atom versions.

        Args:
            db: Database session
            version_ids: List of version IDs to approve

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
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

        return success_count, failed_ids, errors

    async def bulk_reject_atom_versions(
        self, db: AsyncSession, version_ids: list[int]
    ) -> tuple[int, list[int], dict[int, str]]:
        """
        Bulk reject atom versions.

        Args:
            db: Database session
            version_ids: List of version IDs to reject

        Returns:
            Tuple of (success_count, failed_ids, error_messages)
        """
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

        return success_count, failed_ids, errors

    async def _get_latest_atom_version(self, db: AsyncSession, atom_id: int) -> AtomVersion | None:
        """Get the latest version for an atom."""
        stmt = select(AtomVersion).where(AtomVersion.atom_id == atom_id).order_by(desc(AtomVersion.version)).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
