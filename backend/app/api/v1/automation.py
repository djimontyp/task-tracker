"""API endpoints for automation rule management."""

import json
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.automation import (
    AutomationStatsResponse,
    AutomationTrendPoint,
    AutomationTrendsResponse,
    RulePreviewRequest,
    RulePreviewResponse,
)
from app.database import get_session
from app.models.atom_version import AtomVersion
from app.models.automation_rule import (
    AutomationRule,
    AutomationRuleCreate,
    AutomationRuleListResponse,
    AutomationRulePublic,
    AutomationRuleUpdate,
)
from app.models.topic_version import TopicVersion
from app.services.rule_engine_service import rule_engine_service
from app.services.rule_templates import RULE_TEMPLATES
from app.services.versioning import VersioningService

router = APIRouter(prefix="/automation", tags=["automation"])
rules_router = APIRouter(prefix="/rules")

versioning_service = VersioningService()


@router.get(
    "/stats",
    response_model=AutomationStatsResponse,
    summary="Get automation statistics",
    description="Retrieve KPI metrics for automation dashboard.",
)
async def get_automation_stats(
    session: AsyncSession = Depends(get_session),
) -> AutomationStatsResponse:
    """
    Get automation dashboard statistics.

    Returns key performance indicators:
    - Auto-approval rate: Percentage of versions auto-approved
    - Pending versions: Count of versions awaiting review
    - Total rules: Count of all automation rules
    - Active rules: Count of enabled rules

    Args:
        session: Database session

    Returns:
        Dashboard statistics with counts and rates
    """
    total_rules_stmt = select(func.count()).select_from(AutomationRule)
    total_rules_count = await session.scalar(total_rules_stmt) or 0

    active_rules_stmt = select(func.count()).select_from(AutomationRule).where(AutomationRule.enabled == True)  # noqa: E712  # type: ignore[arg-type]
    active_rules_count = await session.scalar(active_rules_stmt) or 0

    pending_count_data = await versioning_service.get_pending_count(session)
    pending_versions_count = pending_count_data["count"]

    topic_approved_stmt = (
        select(func.count()).select_from(TopicVersion).where(TopicVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
    )
    atom_approved_stmt = (
        select(func.count()).select_from(AtomVersion).where(AtomVersion.approved == True)  # noqa: E712  # type: ignore[arg-type]
    )

    approved_count = (await session.scalar(topic_approved_stmt) or 0) + (await session.scalar(atom_approved_stmt) or 0)

    topic_total_stmt = select(func.count()).select_from(TopicVersion)
    atom_total_stmt = select(func.count()).select_from(AtomVersion)

    total_versions = (await session.scalar(topic_total_stmt) or 0) + (await session.scalar(atom_total_stmt) or 0)

    auto_approval_rate = (approved_count / total_versions * 100) if total_versions > 0 else 0.0

    return AutomationStatsResponse(
        auto_approval_rate=round(auto_approval_rate, 2),
        pending_versions_count=pending_versions_count,
        total_rules_count=total_rules_count,
        active_rules_count=active_rules_count,
    )


@router.get(
    "/trends",
    response_model=AutomationTrendsResponse,
    summary="Get automation trends",
    description="Retrieve automation trends over time for dashboard graphs.",
)
async def get_automation_trends(
    period: str = Query("30d", regex="^(7d|30d|90d)$", description="Time period: 7d, 30d, or 90d"),
    session: AsyncSession = Depends(get_session),
) -> AutomationTrendsResponse:
    """
    Get automation trends over specified period.

    Analyzes version approval patterns over time, grouped by date.
    Returns daily counts of approved, rejected, and pending versions.

    Args:
        period: Time period filter (7d, 30d, 90d)
        session: Database session

    Returns:
        Trend data with daily approval statistics

    Example:
        GET /automation/trends?period=30d
    """
    period_days = int(period.rstrip("d"))
    start_date = datetime.now(UTC) - timedelta(days=period_days)

    topic_versions_stmt = (
        select(TopicVersion)
        .where(TopicVersion.created_at >= start_date)  # type: ignore[arg-type]
        .order_by(TopicVersion.created_at)  # type: ignore[arg-type]
    )
    atom_versions_stmt = (
        select(AtomVersion)
        .where(AtomVersion.created_at >= start_date)  # type: ignore[arg-type]
        .order_by(AtomVersion.created_at)  # type: ignore[arg-type]
    )

    topic_versions_result = await session.execute(topic_versions_stmt)
    atom_versions_result = await session.execute(atom_versions_stmt)

    topic_versions = list(topic_versions_result.scalars().all())
    atom_versions = list(atom_versions_result.scalars().all())

    all_versions = topic_versions + atom_versions

    daily_stats: dict[str, dict[str, int]] = {}
    for version in all_versions:
        date_key = version.created_at.date().isoformat()

        if date_key not in daily_stats:
            daily_stats[date_key] = {"approved": 0, "rejected": 0, "manual": 0}

        if version.approved:
            daily_stats[date_key]["approved"] += 1
        else:
            daily_stats[date_key]["manual"] += 1

    data_points = [
        AutomationTrendPoint(
            date=date_key,
            approved=stats["approved"],
            rejected=stats["rejected"],
            manual=stats["manual"],
        )
        for date_key, stats in sorted(daily_stats.items())
    ]

    return AutomationTrendsResponse(
        period=period,
        data=data_points,
    )


@rules_router.get(
    "",
    response_model=AutomationRuleListResponse,
    summary="List automation rules",
    description="Get list of all automation rules with pagination and statistics.",
)
async def list_rules(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    enabled: bool | None = Query(None, description="Filter by enabled status"),
    session: AsyncSession = Depends(get_session),
) -> AutomationRuleListResponse:
    """
    List all automation rules with pagination.

    Returns rules sorted by priority (highest first), then by name.
    Optionally filter by enabled status.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        enabled: Filter by enabled status (optional)
        session: Database session

    Returns:
        List of automation rules with pagination metadata
    """
    query = select(AutomationRule)

    if enabled is not None:
        query = query.where(AutomationRule.enabled == enabled)

    query = query.order_by(AutomationRule.priority.desc(), AutomationRule.name.asc())

    count_query = select(func.count()).select_from(AutomationRule)
    if enabled is not None:
        count_query = count_query.where(AutomationRule.enabled == enabled)

    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    result = await session.execute(query.offset(skip).limit(limit))
    rules = result.scalars().all()

    page = (skip // limit) + 1 if limit else 1

    return AutomationRuleListResponse(
        rules=[AutomationRulePublic.model_validate(rule) for rule in rules],
        total=total,
        page=page,
        page_size=limit,
    )


@rules_router.get(
    "/{rule_id}",
    response_model=AutomationRulePublic,
    summary="Get rule details",
    description="Retrieve detailed information about a specific automation rule.",
)
async def get_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
) -> AutomationRulePublic:
    """
    Get detailed information about an automation rule.

    Args:
        rule_id: Rule ID
        session: Database session

    Returns:
        Complete rule details including conditions and execution statistics

    Raises:
        HTTPException: 404 if rule not found
    """
    query = select(AutomationRule).where(AutomationRule.id == rule_id)
    result = await session.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule with ID {rule_id} not found",
        )

    return AutomationRulePublic.model_validate(rule)


@rules_router.post(
    "",
    response_model=AutomationRulePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create automation rule",
    description="Create a new automation rule with conditions and action.",
)
async def create_rule(
    rule_data: AutomationRuleCreate,
    session: AsyncSession = Depends(get_session),
) -> AutomationRulePublic:
    """
    Create a new automation rule.

    Creates a rule with specified conditions that will be evaluated
    against pending versions in priority order.

    Args:
        rule_data: Rule creation data with name, conditions, and action
        session: Database session

    Returns:
        Created rule with default statistics

    Raises:
        HTTPException: 400 if rule name already exists or conditions are invalid

    Example:
        {
            "name": "High Confidence Auto-Approve",
            "description": "Automatically approve high-quality versions",
            "enabled": true,
            "priority": 90,
            "action": "approve",
            "conditions": "[{\"field\": \"confidence\", \"operator\": \"gte\", \"value\": 90}]",
            "logic_operator": "AND"
        }
    """
    try:
        json.loads(rule_data.conditions)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conditions JSON format",
        )

    existing = await session.execute(select(AutomationRule).where(AutomationRule.name == rule_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule with name '{rule_data.name}' already exists",
        )

    rule = AutomationRule(**rule_data.model_dump())
    session.add(rule)
    await session.commit()
    await session.refresh(rule)

    return AutomationRulePublic.model_validate(rule)


@rules_router.put(
    "/{rule_id}",
    response_model=AutomationRulePublic,
    summary="Update automation rule",
    description="Update rule configuration including conditions and priority.",
)
async def update_rule(
    rule_id: int,
    rule_data: AutomationRuleUpdate,
    session: AsyncSession = Depends(get_session),
) -> AutomationRulePublic:
    """
    Update an automation rule.

    Updates rule configuration. Only provided fields will be updated (partial update).
    If name is updated, it must be unique across all rules.

    Args:
        rule_id: Rule ID
        rule_data: Update data with optional fields
        session: Database session

    Returns:
        Updated rule details

    Raises:
        HTTPException: 404 if rule not found
        HTTPException: 400 if conditions are invalid or name conflicts
    """
    query = select(AutomationRule).where(AutomationRule.id == rule_id)
    result = await session.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule with ID {rule_id} not found",
        )

    if rule_data.conditions is not None:
        try:
            json.loads(rule_data.conditions)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conditions JSON format",
            )

    if rule_data.name is not None and rule_data.name != rule.name:
        existing = await session.execute(select(AutomationRule).where(AutomationRule.name == rule_data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rule with name '{rule_data.name}' already exists",
            )

    update_data = rule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    await session.commit()
    await session.refresh(rule)

    return AutomationRulePublic.model_validate(rule)


@rules_router.delete(
    "/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete automation rule",
    description="Remove an automation rule permanently.",
)
async def delete_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    """
    Delete an automation rule.

    Removes rule permanently. This operation cannot be undone.
    Active rules will stop being evaluated immediately.

    Args:
        rule_id: Rule ID
        session: Database session

    Raises:
        HTTPException: 404 if rule not found
    """
    query = select(AutomationRule).where(AutomationRule.id == rule_id)
    result = await session.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule with ID {rule_id} not found",
        )

    await session.delete(rule)
    await session.commit()


@rules_router.post(
    "/{rule_id}/toggle",
    response_model=AutomationRulePublic,
    summary="Toggle rule status",
    description="Enable or disable an automation rule.",
)
async def toggle_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
) -> AutomationRulePublic:
    """
    Toggle rule enabled/disabled status.

    Toggles between enabled and disabled. Disabled rules are not evaluated
    during version processing.

    Args:
        rule_id: Rule ID
        session: Database session

    Returns:
        Updated rule with new enabled status

    Raises:
        HTTPException: 404 if rule not found
    """
    query = select(AutomationRule).where(AutomationRule.id == rule_id)
    result = await session.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule with ID {rule_id} not found",
        )

    rule.enabled = not rule.enabled
    await session.commit()
    await session.refresh(rule)

    return AutomationRulePublic.model_validate(rule)


@router.get(
    "/templates",
    response_model=list[dict],
    summary="Get rule templates",
    description="Retrieve pre-built rule templates for common automation scenarios.",
    tags=["automation"],
)
async def get_rule_templates() -> list[dict]:
    """
    Get pre-built rule templates.

    Returns a list of ready-to-use rule templates for common automation
    scenarios like high-confidence approval, low-quality rejection, etc.

    Returns:
        List of rule template dictionaries
    """
    return RULE_TEMPLATES


@rules_router.post(
    "/preview",
    response_model=RulePreviewResponse,
    summary="Preview rule impact",
    description="Preview how many pending versions would be affected by a rule.",
)
async def preview_rule(
    request: RulePreviewRequest,
    session: AsyncSession = Depends(get_session),
) -> RulePreviewResponse:
    """
    Preview rule impact on current pending versions.

    Evaluates the rule against pending versions without executing any actions.
    Useful for testing rules before creating them.

    Args:
        request: Preview request with conditions and logic operator
        session: Database session

    Returns:
        Preview response with affected count and sample versions

    Example:
        {
            "conditions": [
                {"field": "confidence", "operator": "gte", "value": 90},
                {"field": "similarity", "operator": "gte", "value": 85}
            ],
            "logic_operator": "AND",
            "action": "approve"
        }
    """
    affected_count, sample_versions = await rule_engine_service.preview_rule_impact(
        session,
        request.conditions,
        request.logic_operator,
    )

    return RulePreviewResponse(
        affected_count=affected_count,
        sample_versions=sample_versions,
    )


@rules_router.get(
    "/{rule_id}/stats",
    response_model=dict,
    summary="Get rule statistics",
    description="Get detailed statistics for a rule's execution history.",
)
async def get_rule_stats(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Get detailed statistics for a rule.

    Returns execution statistics including trigger count, success rate,
    last trigger time, and success percentage.

    Args:
        rule_id: Rule ID
        session: Database session

    Returns:
        Dictionary with rule statistics

    Raises:
        HTTPException: 404 if rule not found
    """
    query = select(AutomationRule).where(AutomationRule.id == rule_id)
    result = await session.execute(query)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule with ID {rule_id} not found",
        )

    success_rate = (rule.success_count / rule.triggered_count * 100) if rule.triggered_count > 0 else 0.0

    return {
        "rule_id": rule.id,
        "rule_name": rule.name,
        "triggered_count": rule.triggered_count,
        "success_count": rule.success_count,
        "success_rate": round(success_rate, 2),
        "last_triggered": rule.last_triggered.isoformat() if rule.last_triggered else None,
        "enabled": rule.enabled,
        "priority": rule.priority,
    }


router.include_router(rules_router)
