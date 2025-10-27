"""Service for automated version approval based on configurable rules."""

from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval_rule import ApprovalRule, AutoAction

AutoApprovalDecision = Literal["approve", "reject", "manual_review"]


class AutoApprovalService:
    """
    Service for evaluating versions against approval rules.

    Provides automated decision-making for Topic/Atom version proposals
    based on confidence and similarity thresholds.
    """

    async def evaluate_version(
        self,
        session: AsyncSession,
        version_data: dict,
    ) -> AutoApprovalDecision:
        """
        Evaluate a version against active approval rules.

        Args:
            session: Database session
            version_data: Version data containing confidence and similarity scores

        Returns:
            Decision: "approve", "reject", or "manual_review"

        Example:
            version_data = {
                "confidence": 85.5,
                "similarity": 92.3,
                "name": "Updated topic name"
            }
            decision = await service.evaluate_version(session, version_data)
        """
        active_rule = await self._get_active_rule(session)

        if not active_rule:
            return "manual_review"

        confidence = version_data.get("confidence", 0.0)
        similarity = version_data.get("similarity", 0.0)

        if (
            confidence >= active_rule.confidence_threshold
            and similarity >= active_rule.similarity_threshold
        ):
            if active_rule.auto_action == AutoAction.approve:
                return "approve"
            elif active_rule.auto_action == AutoAction.reject:
                return "reject"

        return "manual_review"

    async def _get_active_rule(self, session: AsyncSession) -> ApprovalRule | None:
        """
        Fetch the currently active approval rule.

        Args:
            session: Database session

        Returns:
            Active ApprovalRule or None if no active rule exists
        """
        stmt = select(ApprovalRule).where(ApprovalRule.is_active == True).limit(1)  # noqa: E712
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


auto_approval_service = AutoApprovalService()
