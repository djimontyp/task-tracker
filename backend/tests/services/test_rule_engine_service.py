"""Tests for RuleEngineService automation rule evaluation."""

import json
from unittest.mock import AsyncMock, patch

import pytest
from app.models.automation_rule import AutomationRule, LogicOperator, RuleAction
from app.services.rule_engine_service import RuleEngineService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def rule_engine_service() -> RuleEngineService:
    """Create rule engine service instance."""
    return RuleEngineService()


@pytest.fixture(autouse=True)
def mock_broadcast_rule_triggered():
    """Mock _broadcast_rule_triggered method for all tests in this module."""
    with patch.object(RuleEngineService, "_broadcast_rule_triggered", new=AsyncMock()):
        yield


@pytest.fixture
async def sample_rule_approve(db_session: AsyncSession) -> AutomationRule:
    """Create a sample auto-approve rule."""
    rule = AutomationRule(
        name="High Confidence Auto-Approve",
        description="Approve versions with high confidence",
        enabled=True,
        priority=90,
        action=RuleAction.approve,
        conditions=json.dumps([{"field": "confidence", "operator": "gte", "value": 90}]),
        logic_operator=LogicOperator.AND,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)
    return rule


@pytest.fixture
async def sample_rule_reject(db_session: AsyncSession) -> AutomationRule:
    """Create a sample auto-reject rule."""
    rule = AutomationRule(
        name="Low Confidence Auto-Reject",
        description="Reject versions with low confidence",
        enabled=True,
        priority=50,
        action=RuleAction.reject,
        conditions=json.dumps([{"field": "confidence", "operator": "lt", "value": 50}]),
        logic_operator=LogicOperator.AND,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)
    return rule


class TestRuleEvaluation:
    """Test rule evaluation logic."""

    @pytest.mark.asyncio
    async def test_evaluate_version_single_condition_gte(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
        sample_rule_approve: AutomationRule,
    ):
        """Test single condition with gte operator."""
        version_data = {"confidence": 95}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve
        assert rule_id == sample_rule_approve.id

    @pytest.mark.asyncio
    async def test_evaluate_version_single_condition_lt(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
        sample_rule_reject: AutomationRule,
    ):
        """Test single condition with lt operator."""
        version_data = {"confidence": 45}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.reject
        assert rule_id == sample_rule_reject.id

    @pytest.mark.asyncio
    async def test_evaluate_version_multiple_conditions_and(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test multiple conditions with AND logic."""
        rule = AutomationRule(
            name="High Quality Approve",
            enabled=True,
            priority=90,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "confidence", "operator": "gte", "value": 90},
                {"field": "similarity", "operator": "gte", "value": 85},
            ]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()
        await db_session.refresh(rule)

        version_data = {"confidence": 92, "similarity": 87}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve
        assert rule_id == rule.id

    @pytest.mark.asyncio
    async def test_evaluate_version_multiple_conditions_or(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test multiple conditions with OR logic."""
        rule = AutomationRule(
            name="Flexible Approve",
            enabled=True,
            priority=70,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "confidence", "operator": "lt", "value": 50},
                {"field": "similarity", "operator": "gte", "value": 95},
            ]),
            logic_operator=LogicOperator.OR,
        )
        db_session.add(rule)
        await db_session.commit()
        await db_session.refresh(rule)

        version_data = {"confidence": 45, "similarity": 96}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve
        assert rule_id == rule.id

    @pytest.mark.asyncio
    async def test_evaluate_version_and_logic_fails(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test AND logic when one condition fails."""
        rule = AutomationRule(
            name="Strict Approve",
            enabled=True,
            priority=90,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "confidence", "operator": "gte", "value": 90},
                {"field": "similarity", "operator": "gte", "value": 85},
            ]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()

        version_data = {"confidence": 92, "similarity": 80}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action is None
        assert rule_id is None

    @pytest.mark.asyncio
    async def test_evaluate_version_or_logic_succeeds(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test OR logic when one condition passes."""
        rule = AutomationRule(
            name="Flexible Approve",
            enabled=True,
            priority=70,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "confidence", "operator": "lt", "value": 50},
                {"field": "similarity", "operator": "gte", "value": 95},
            ]),
            logic_operator=LogicOperator.OR,
        )
        db_session.add(rule)
        await db_session.commit()

        version_data = {"confidence": 40, "similarity": 96}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve

    @pytest.mark.asyncio
    async def test_evaluate_version_nested_field(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test nested field extraction."""
        rule = AutomationRule(
            name="Urgent Topic Approve",
            enabled=True,
            priority=80,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "topic.name", "operator": "contains", "value": "urgent"},
            ]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()
        await db_session.refresh(rule)

        version_data = {"topic": {"name": "Urgent Issue"}}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve
        assert rule_id == rule.id

    @pytest.mark.asyncio
    async def test_evaluate_version_operator_contains(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test contains operator."""
        rule = AutomationRule(
            name="Contains Test",
            enabled=True,
            priority=70,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "name", "operator": "contains", "value": "urgent"},
            ]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()

        version_data = {"name": "This is urgent"}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve

    @pytest.mark.asyncio
    async def test_evaluate_version_operator_starts_with(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test starts_with operator."""
        rule = AutomationRule(
            name="Starts With Test",
            enabled=True,
            priority=70,
            action=RuleAction.approve,
            conditions=json.dumps([
                {"field": "name", "operator": "starts_with", "value": "Urgent"},
            ]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()

        version_data = {"name": "Urgent: Fix bug"}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve

    @pytest.mark.asyncio
    async def test_evaluate_version_priority_order(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test that higher priority rules evaluated first."""
        rule_low = AutomationRule(
            name="Low Priority",
            enabled=True,
            priority=50,
            action=RuleAction.reject,
            conditions=json.dumps([{"field": "confidence", "operator": "gte", "value": 80}]),
            logic_operator=LogicOperator.AND,
        )
        rule_high = AutomationRule(
            name="High Priority",
            enabled=True,
            priority=90,
            action=RuleAction.approve,
            conditions=json.dumps([{"field": "confidence", "operator": "gte", "value": 80}]),
            logic_operator=LogicOperator.AND,
        )
        rule_mid = AutomationRule(
            name="Mid Priority",
            enabled=True,
            priority=70,
            action=RuleAction.notify,
            conditions=json.dumps([{"field": "confidence", "operator": "gte", "value": 80}]),
            logic_operator=LogicOperator.AND,
        )

        db_session.add_all([rule_low, rule_high, rule_mid])
        await db_session.commit()
        await db_session.refresh(rule_high)

        version_data = {"confidence": 85}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action == RuleAction.approve
        assert rule_id == rule_high.id

    @pytest.mark.asyncio
    async def test_evaluate_version_no_match_returns_none(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
        sample_rule_approve: AutomationRule,
    ):
        """Test that no rule match returns None action."""
        version_data = {"confidence": 50}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action is None
        assert rule_id is None

    @pytest.mark.asyncio
    async def test_evaluate_version_disabled_rule_skipped(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
    ):
        """Test that disabled rules are skipped."""
        rule = AutomationRule(
            name="Disabled Rule",
            enabled=False,
            priority=90,
            action=RuleAction.approve,
            conditions=json.dumps([{"field": "confidence", "operator": "gte", "value": 50}]),
            logic_operator=LogicOperator.AND,
        )
        db_session.add(rule)
        await db_session.commit()

        version_data = {"confidence": 95}

        action, rule_id = await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        assert action is None
        assert rule_id is None


class TestFieldExtraction:
    """Test field extraction logic."""

    def test_extract_field_value_nested(self, rule_engine_service: RuleEngineService):
        """Test nested field extraction."""
        version_data = {"topic": {"name": "Test"}}

        result = rule_engine_service._extract_field_value(version_data, "topic.name")

        assert result == "Test"

    def test_extract_field_value_simple(self, rule_engine_service: RuleEngineService):
        """Test simple field extraction."""
        version_data = {"confidence": 85}

        result = rule_engine_service._extract_field_value(version_data, "confidence")

        assert result == 85

    def test_extract_field_value_missing(self, rule_engine_service: RuleEngineService):
        """Test extraction of missing field."""
        version_data = {"confidence": 85}

        result = rule_engine_service._extract_field_value(version_data, "missing")

        assert result is None

    def test_extract_field_value_deep_nested(self, rule_engine_service: RuleEngineService):
        """Test deeply nested field extraction."""
        version_data = {"level1": {"level2": {"level3": "deep"}}}

        result = rule_engine_service._extract_field_value(version_data, "level1.level2.level3")

        assert result == "deep"


class TestOperators:
    """Test comparison operators."""

    def test_operator_gte(self, rule_engine_service: RuleEngineService):
        """Test >= operator."""
        assert rule_engine_service._apply_operator("gte", 95, 90) is True
        assert rule_engine_service._apply_operator("gte", 90, 90) is True
        assert rule_engine_service._apply_operator("gte", 85, 90) is False

    def test_operator_lte(self, rule_engine_service: RuleEngineService):
        """Test <= operator."""
        assert rule_engine_service._apply_operator("lte", 45, 50) is True
        assert rule_engine_service._apply_operator("lte", 50, 50) is True
        assert rule_engine_service._apply_operator("lte", 55, 50) is False

    def test_operator_gt(self, rule_engine_service: RuleEngineService):
        """Test > operator."""
        assert rule_engine_service._apply_operator("gt", 95, 90) is True
        assert rule_engine_service._apply_operator("gt", 90, 90) is False
        assert rule_engine_service._apply_operator("gt", 85, 90) is False

    def test_operator_lt(self, rule_engine_service: RuleEngineService):
        """Test < operator."""
        assert rule_engine_service._apply_operator("lt", 45, 50) is True
        assert rule_engine_service._apply_operator("lt", 50, 50) is False
        assert rule_engine_service._apply_operator("lt", 55, 50) is False

    def test_operator_eq(self, rule_engine_service: RuleEngineService):
        """Test == operator."""
        assert rule_engine_service._apply_operator("eq", 50, 50) is True
        assert rule_engine_service._apply_operator("eq", "test", "test") is True
        assert rule_engine_service._apply_operator("eq", 50, 51) is False

    def test_operator_neq(self, rule_engine_service: RuleEngineService):
        """Test != operator."""
        assert rule_engine_service._apply_operator("neq", 50, 51) is True
        assert rule_engine_service._apply_operator("neq", "test", "other") is True
        assert rule_engine_service._apply_operator("neq", 50, 50) is False

    def test_operator_contains(self, rule_engine_service: RuleEngineService):
        """Test contains operator."""
        assert rule_engine_service._apply_operator("contains", "This is urgent", "urgent") is True
        assert rule_engine_service._apply_operator("contains", "This is URGENT", "urgent") is True
        assert rule_engine_service._apply_operator("contains", "This is normal", "urgent") is False

    def test_operator_starts_with(self, rule_engine_service: RuleEngineService):
        """Test starts_with operator."""
        assert rule_engine_service._apply_operator("starts_with", "Urgent: Fix bug", "Urgent") is True
        assert rule_engine_service._apply_operator("starts_with", "urgent: Fix bug", "Urgent") is True
        assert rule_engine_service._apply_operator("starts_with", "Fix urgent bug", "Urgent") is False

    def test_operator_ends_with(self, rule_engine_service: RuleEngineService):
        """Test ends_with operator."""
        assert rule_engine_service._apply_operator("ends_with", "Issue is urgent", "urgent") is True
        assert rule_engine_service._apply_operator("ends_with", "Issue is URGENT", "urgent") is True
        assert rule_engine_service._apply_operator("ends_with", "Urgent issue", "urgent") is False


class TestRuleTriggerRecording:
    """Test rule trigger recording."""

    @pytest.mark.asyncio
    async def test_record_trigger_updates_counts(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
        sample_rule_approve: AutomationRule,
    ):
        """Test that rule trigger updates triggered_count."""
        initial_count = sample_rule_approve.triggered_count

        version_data = {"confidence": 95}

        await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        await db_session.refresh(sample_rule_approve)
        assert sample_rule_approve.triggered_count == initial_count + 1

    @pytest.mark.asyncio
    async def test_record_trigger_updates_timestamp(
        self,
        db_session: AsyncSession,
        rule_engine_service: RuleEngineService,
        sample_rule_approve: AutomationRule,
    ):
        """Test that rule trigger updates last_triggered."""
        version_data = {"confidence": 95}

        await rule_engine_service.evaluate_version(db_session, version_data, "topic", 1, 1)

        await db_session.refresh(sample_rule_approve)
        assert sample_rule_approve.last_triggered is not None
