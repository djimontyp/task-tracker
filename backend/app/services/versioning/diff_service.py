"""Diff service for version comparison."""

from typing import Any, Literal

from deepdiff import DeepDiff
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.atom_version import AtomVersion
from app.models.topic_version import TopicVersion

EntityType = Literal["topic", "atom"]


class DiffService:
    """Service for calculating diffs between entity versions."""

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
