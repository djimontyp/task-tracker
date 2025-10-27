"""Tests for ApprovalRule model and validation."""

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.approval_rule import (
    ApprovalRule,
    ApprovalRuleCreate,
    ApprovalRuleUpdate,
    AutoAction,
)


@pytest.mark.asyncio
async def test_create_approval_rule_valid(db_session: AsyncSession) -> None:
    """Test creating ApprovalRule with valid data"""
    rule = ApprovalRule(
        confidence_threshold=85.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)

    assert rule.id is not None
    assert rule.confidence_threshold == 85.0
    assert rule.similarity_threshold == 80.0
    assert rule.auto_action == AutoAction.approve
    assert rule.is_active is True
    assert rule.created_at is not None
    assert rule.updated_at is not None


@pytest.mark.asyncio
async def test_approval_rule_auto_action_values(db_session: AsyncSession) -> None:
    """Test all AutoAction enum values"""
    for action in [AutoAction.approve, AutoAction.reject, AutoAction.manual]:
        rule = ApprovalRule(
            confidence_threshold=50.0,
            similarity_threshold=50.0,
            auto_action=action,
        )
        db_session.add(rule)
        await db_session.commit()
        await db_session.refresh(rule)

        assert rule.auto_action == action


@pytest.mark.asyncio
async def test_approval_rule_is_active_default(db_session: AsyncSession) -> None:
    """Test is_active defaults to True"""
    rule = ApprovalRule(
        confidence_threshold=75.0,
        similarity_threshold=70.0,
        auto_action=AutoAction.approve,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)

    assert rule.is_active is True


@pytest.mark.asyncio
async def test_approval_rule_is_active_false(db_session: AsyncSession) -> None:
    """Test setting is_active to False"""
    rule = ApprovalRule(
        confidence_threshold=60.0,
        similarity_threshold=55.0,
        auto_action=AutoAction.manual,
        is_active=False,
    )
    db_session.add(rule)
    await db_session.commit()
    await db_session.refresh(rule)

    assert rule.is_active is False


def test_approval_rule_create_schema_valid() -> None:
    """Test ApprovalRuleCreate schema with valid thresholds"""
    schema = ApprovalRuleCreate(
        confidence_threshold=90.0,
        similarity_threshold=85.0,
        auto_action=AutoAction.approve,
    )
    assert schema.confidence_threshold == 90.0
    assert schema.similarity_threshold == 85.0
    assert schema.auto_action == AutoAction.approve
    assert schema.is_active is True


def test_approval_rule_create_schema_boundary_0() -> None:
    """Test ApprovalRuleCreate with minimum boundary (0)"""
    schema = ApprovalRuleCreate(
        confidence_threshold=0.0,
        similarity_threshold=0.0,
        auto_action=AutoAction.reject,
    )
    assert schema.confidence_threshold == 0.0
    assert schema.similarity_threshold == 0.0


def test_approval_rule_create_schema_boundary_100() -> None:
    """Test ApprovalRuleCreate with maximum boundary (100)"""
    schema = ApprovalRuleCreate(
        confidence_threshold=100.0,
        similarity_threshold=100.0,
        auto_action=AutoAction.approve,
    )
    assert schema.confidence_threshold == 100.0
    assert schema.similarity_threshold == 100.0


def test_approval_rule_create_schema_invalid_confidence_negative() -> None:
    """Test ApprovalRuleCreate rejects negative confidence"""
    with pytest.raises(ValidationError) as exc_info:
        ApprovalRuleCreate(
            confidence_threshold=-1.0,
            similarity_threshold=50.0,
            auto_action=AutoAction.approve,
        )
    assert "confidence_threshold" in str(exc_info.value)


def test_approval_rule_create_schema_invalid_confidence_over_100() -> None:
    """Test ApprovalRuleCreate rejects confidence > 100"""
    with pytest.raises(ValidationError) as exc_info:
        ApprovalRuleCreate(
            confidence_threshold=101.0,
            similarity_threshold=50.0,
            auto_action=AutoAction.approve,
        )
    assert "confidence_threshold" in str(exc_info.value)


def test_approval_rule_create_schema_invalid_similarity_negative() -> None:
    """Test ApprovalRuleCreate rejects negative similarity"""
    with pytest.raises(ValidationError) as exc_info:
        ApprovalRuleCreate(
            confidence_threshold=50.0,
            similarity_threshold=-1.0,
            auto_action=AutoAction.approve,
        )
    assert "similarity_threshold" in str(exc_info.value)


def test_approval_rule_create_schema_invalid_similarity_over_100() -> None:
    """Test ApprovalRuleCreate rejects similarity > 100"""
    with pytest.raises(ValidationError) as exc_info:
        ApprovalRuleCreate(
            confidence_threshold=50.0,
            similarity_threshold=101.0,
            auto_action=AutoAction.approve,
        )
    assert "similarity_threshold" in str(exc_info.value)


def test_approval_rule_update_schema_partial() -> None:
    """Test ApprovalRuleUpdate with partial data"""
    schema = ApprovalRuleUpdate(confidence_threshold=75.0)
    assert schema.confidence_threshold == 75.0
    assert schema.similarity_threshold is None
    assert schema.auto_action is None
    assert schema.is_active is None


def test_approval_rule_update_schema_validation() -> None:
    """Test ApprovalRuleUpdate enforces range constraints"""
    with pytest.raises(ValidationError):
        ApprovalRuleUpdate(confidence_threshold=150.0)

    with pytest.raises(ValidationError):
        ApprovalRuleUpdate(similarity_threshold=-10.0)
