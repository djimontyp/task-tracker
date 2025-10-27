"""Tests for AutoApprovalService decision logic."""

import pytest
from app.models.approval_rule import ApprovalRule, AutoAction
from app.services.auto_approval_service import AutoApprovalService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_evaluate_version_high_confidence_high_similarity_approve(
    db_session: AsyncSession,
) -> None:
    """Test auto-approval with high confidence (>90%) and high similarity (>80%)"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 85.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_high_confidence_high_similarity_reject(
    db_session: AsyncSession,
) -> None:
    """Test auto-rejection with high confidence/similarity when rule action is reject"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.reject,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 85.0})

    assert decision == "reject"


@pytest.mark.asyncio
async def test_evaluate_version_low_confidence_low_similarity_manual(
    db_session: AsyncSession,
) -> None:
    """Test manual review for low confidence (<30%) and low similarity (<30%)"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 25.0, "similarity": 20.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_medium_confidence_manual_review(
    db_session: AsyncSession,
) -> None:
    """Test manual review for medium confidence/similarity (30-90%)"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 60.0, "similarity": 50.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_no_active_rule_manual_review(
    db_session: AsyncSession,
) -> None:
    """Test manual review when no active rule exists"""
    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 90.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_inactive_rule_manual_review(
    db_session: AsyncSession,
) -> None:
    """Test manual review when rule exists but is inactive"""
    rule = ApprovalRule(
        confidence_threshold=80.0,
        similarity_threshold=75.0,
        auto_action=AutoAction.approve,
        is_active=False,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 90.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_boundary_confidence_equals_threshold(
    db_session: AsyncSession,
) -> None:
    """Test boundary: confidence exactly equals threshold (should approve)"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 90.0, "similarity": 85.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_boundary_similarity_equals_threshold(
    db_session: AsyncSession,
) -> None:
    """Test boundary: similarity exactly equals threshold (should approve)"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 80.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_boundary_both_equal_threshold(
    db_session: AsyncSession,
) -> None:
    """Test boundary: both confidence and similarity equal thresholds"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 90.0, "similarity": 80.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_confidence_below_threshold(
    db_session: AsyncSession,
) -> None:
    """Test manual review when confidence is just below threshold"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 89.9, "similarity": 85.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_similarity_below_threshold(
    db_session: AsyncSession,
) -> None:
    """Test manual review when similarity is just below threshold"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 79.9})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_missing_confidence_defaults_to_zero(
    db_session: AsyncSession,
) -> None:
    """Test that missing confidence defaults to 0.0"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"similarity": 85.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_missing_similarity_defaults_to_zero(
    db_session: AsyncSession,
) -> None:
    """Test that missing similarity defaults to 0.0"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_auto_action_manual(db_session: AsyncSession) -> None:
    """Test manual review when rule auto_action is manual"""
    rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.manual,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 85.0})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_multiple_rules_uses_active(
    db_session: AsyncSession,
) -> None:
    """Test that only the first active rule is used when multiple exist"""
    inactive_rule = ApprovalRule(
        confidence_threshold=50.0,
        similarity_threshold=50.0,
        auto_action=AutoAction.reject,
        is_active=False,
    )
    active_rule = ApprovalRule(
        confidence_threshold=90.0,
        similarity_threshold=80.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(inactive_rule)
    db_session.add(active_rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 95.0, "similarity": 85.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_zero_thresholds(db_session: AsyncSession) -> None:
    """Test auto-approval with zero thresholds (approve everything)"""
    rule = ApprovalRule(
        confidence_threshold=0.0,
        similarity_threshold=0.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 1.0, "similarity": 1.0})

    assert decision == "approve"


@pytest.mark.asyncio
async def test_evaluate_version_max_thresholds(db_session: AsyncSession) -> None:
    """Test manual review with maximum thresholds (100% required)"""
    rule = ApprovalRule(
        confidence_threshold=100.0,
        similarity_threshold=100.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 99.9, "similarity": 99.9})

    assert decision == "manual_review"


@pytest.mark.asyncio
async def test_evaluate_version_max_thresholds_exact_match(
    db_session: AsyncSession,
) -> None:
    """Test auto-approval with maximum thresholds when scores match exactly"""
    rule = ApprovalRule(
        confidence_threshold=100.0,
        similarity_threshold=100.0,
        auto_action=AutoAction.approve,
        is_active=True,
    )
    db_session.add(rule)
    await db_session.commit()

    service = AutoApprovalService()
    decision = await service.evaluate_version(db_session, {"confidence": 100.0, "similarity": 100.0})

    assert decision == "approve"
