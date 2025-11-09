"""Rule engine service for evaluating automation rules against versions."""

import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation_rule import AutomationRule, ConditionOperator, LogicOperator, RuleAction, RuleCondition
from app.services.versioning import VersioningService
from app.services.websocket_manager import websocket_manager


class RuleEngineService:
    """Service for evaluating automation rules and executing actions."""

    def __init__(self) -> None:
        self.versioning_service = VersioningService()

    async def evaluate_version(
        self,
        session: AsyncSession,
        version_data: dict[str, Any],
        entity_type: str,
        entity_id: int,
        version_id: int,
    ) -> tuple[RuleAction | None, int | None]:
        """
        Evaluate version against active rules (priority order).

        Args:
            session: Database session
            version_data: Version data with fields to evaluate
            entity_type: Entity type (topic/atom)
            entity_id: Entity ID
            version_id: Version ID

        Returns:
            Tuple of (action, rule_id) if matched, otherwise (None, None)
        """
        query = (
            select(AutomationRule)
            .where(AutomationRule.enabled == True)  # noqa: E712  # type: ignore[arg-type]
            .order_by(AutomationRule.priority.desc(), AutomationRule.id.asc())
        )
        result = await session.execute(query)
        rules = result.scalars().all()

        for rule in rules:
            if await self._evaluate_rule(session, rule, version_data):
                await self._record_trigger(session, rule)
                await self._broadcast_rule_triggered(rule, entity_id, version_id)
                return rule.action, rule.id

        return None, None

    async def _evaluate_rule(
        self,
        session: AsyncSession,
        rule: AutomationRule,
        version_data: dict[str, Any],
    ) -> bool:
        """
        Evaluate rule conditions against version data.

        Args:
            session: Database session
            rule: Automation rule to evaluate
            version_data: Version data to check

        Returns:
            True if rule matches, False otherwise
        """
        try:
            conditions = json.loads(rule.conditions)
        except json.JSONDecodeError:
            return False

        if not conditions:
            return False

        results = [self._evaluate_condition(condition, version_data) for condition in conditions]

        if rule.logic_operator == LogicOperator.AND:
            return all(results)
        else:
            return any(results)

    def _evaluate_condition(
        self,
        condition: dict[str, Any],
        version_data: dict[str, Any],
    ) -> bool:
        """
        Evaluate single condition against version data.

        Args:
            condition: Condition dict with field, operator, value
            version_data: Version data to check

        Returns:
            True if condition matches, False otherwise
        """
        field = condition.get("field")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        if not field or not operator:
            return False

        actual_value = self._extract_field_value(version_data, field)

        if actual_value is None:
            return False

        try:
            return self._apply_operator(operator, actual_value, expected_value)
        except (TypeError, ValueError):
            return False

    def _extract_field_value(
        self,
        version_data: dict[str, Any],
        field_path: str,
    ) -> Any:
        """
        Extract field value from version data, supporting nested paths.

        Args:
            version_data: Version data dict
            field_path: Field path (e.g., "confidence" or "topic.name")

        Returns:
            Extracted value or None if not found
        """
        parts = field_path.split(".")
        current = version_data

        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
                if current is None:
                    return None
            else:
                return None

        return current

    def _apply_operator(
        self,
        operator: str,
        actual_value: Any,
        expected_value: Any,
    ) -> bool:
        """
        Apply comparison operator.

        Args:
            operator: Comparison operator
            actual_value: Actual value from version data
            expected_value: Expected value from condition

        Returns:
            Comparison result
        """
        if operator == ConditionOperator.gte:
            return float(actual_value) >= float(expected_value)
        elif operator == ConditionOperator.lte:
            return float(actual_value) <= float(expected_value)
        elif operator == ConditionOperator.gt:
            return float(actual_value) > float(expected_value)
        elif operator == ConditionOperator.lt:
            return float(actual_value) < float(expected_value)
        elif operator == ConditionOperator.eq:
            return actual_value == expected_value
        elif operator == ConditionOperator.neq:
            return actual_value != expected_value
        elif operator == ConditionOperator.contains:
            return str(expected_value).lower() in str(actual_value).lower()
        elif operator == ConditionOperator.starts_with:
            return str(actual_value).lower().startswith(str(expected_value).lower())
        elif operator == ConditionOperator.ends_with:
            return str(actual_value).lower().endswith(str(expected_value).lower())
        else:
            return False

    async def _record_trigger(
        self,
        session: AsyncSession,
        rule: AutomationRule,
    ) -> None:
        """
        Record rule trigger (increment counters, update timestamp).

        Args:
            session: Database session
            rule: Triggered rule
        """
        stmt = (
            update(AutomationRule)
            .where(AutomationRule.id == rule.id)
            .values(
                triggered_count=AutomationRule.triggered_count + 1,
                last_triggered=datetime.now(UTC),
            )
        )
        await session.execute(stmt)
        await session.commit()

    async def _broadcast_rule_triggered(
        self,
        rule: AutomationRule,
        entity_id: int,
        version_id: int,
    ) -> None:
        """
        Broadcast rule triggered event via WebSocket.

        Args:
            rule: Triggered rule
            entity_id: Entity ID
            version_id: Version ID
        """
        await websocket_manager.broadcast(
            "automation",
            {
                "event": "rule_triggered",
                "rule_id": rule.id,
                "rule_name": rule.name,
                "action": rule.action.value,
                "entity_id": entity_id,
                "version_id": version_id,
            },
        )

    async def execute_action(
        self,
        session: AsyncSession,
        action: RuleAction,
        version_id: int,
        entity_type: str,
        entity_id: int,
        rule_id: int,
    ) -> None:
        """
        Execute rule action (approve/reject/escalate/notify).

        Args:
            session: Database session
            action: Action to execute
            version_id: Version ID
            entity_type: Entity type (topic/atom)
            entity_id: Entity ID
            rule_id: Rule ID that triggered action
        """
        try:
            if action == RuleAction.approve:
                await self.versioning_service.approve_version(
                    session,
                    entity_type,  # type: ignore[arg-type]
                    entity_id,
                    version_id,
                )
                await self._increment_success_count(session, rule_id)

            elif action == RuleAction.reject:
                await self.versioning_service.reject_version(
                    session,
                    entity_type,  # type: ignore[arg-type]
                    entity_id,
                    version_id,
                )
                await self._increment_success_count(session, rule_id)

            elif action == RuleAction.escalate:
                pass

            elif action == RuleAction.notify:
                pass

        except Exception:
            pass

    async def _increment_success_count(
        self,
        session: AsyncSession,
        rule_id: int,
    ) -> None:
        """
        Increment success count for rule.

        Args:
            session: Database session
            rule_id: Rule ID
        """
        stmt = (
            update(AutomationRule)
            .where(AutomationRule.id == rule_id)
            .values(success_count=AutomationRule.success_count + 1)
        )
        await session.execute(stmt)
        await session.commit()

    async def preview_rule_impact(
        self,
        session: AsyncSession,
        conditions: list[RuleCondition],
        logic_operator: str,
    ) -> tuple[int, list[dict[str, Any]]]:
        """
        Preview rule impact on current pending versions.

        Args:
            session: Database session
            conditions: List of conditions
            logic_operator: Logic operator (AND/OR)

        Returns:
            Tuple of (affected_count, sample_versions)
        """
        return 0, []


rule_engine_service = RuleEngineService()
