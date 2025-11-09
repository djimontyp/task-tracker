"""Schemas for automation rule engine."""

from app.models.automation_rule import ConditionOperator, RuleCondition
from pydantic import BaseModel, Field

__all__ = [
    "ConditionOperator",
    "RuleCondition",
    "RulePreviewRequest",
    "RulePreviewResponse",
    "RuleAuditEntry",
    "RuleAuditResponse",
    "AutomationStatsResponse",
    "AutomationTrendPoint",
    "AutomationTrendsResponse",
]


class RulePreviewRequest(BaseModel):
    """Request schema for previewing rule impact."""

    conditions: list[RuleCondition] = Field(
        description="List of conditions to evaluate",
        min_length=1,
    )
    logic_operator: str = Field(
        default="AND",
        description="Logic operator for combining conditions (AND/OR)",
    )
    action: str = Field(
        description="Action that would be executed",
    )


class RulePreviewResponse(BaseModel):
    """Response schema showing rule preview impact."""

    affected_count: int = Field(
        description="Number of pending versions that would match this rule",
    )
    sample_versions: list[dict] = Field(
        description="Sample of versions that would be affected (max 10)",
    )


class RuleAuditEntry(BaseModel):
    """Single audit log entry for rule trigger."""

    rule_id: int
    rule_name: str
    action: str
    entity_type: str
    entity_id: int
    version_id: int
    triggered_at: str
    success: bool
    error_message: str | None = None


class RuleAuditResponse(BaseModel):
    """Response schema for rule audit history."""

    entries: list[RuleAuditEntry]
    total: int


class AutomationStatsResponse(BaseModel):
    """Response schema for automation dashboard statistics."""

    auto_approval_rate: float = Field(
        description="Percentage of versions auto-approved (0-100)",
        ge=0,
        le=100,
    )
    pending_versions_count: int = Field(
        description="Number of pending versions awaiting review",
        ge=0,
    )
    total_rules_count: int = Field(
        description="Total number of automation rules",
        ge=0,
    )
    active_rules_count: int = Field(
        description="Number of enabled automation rules",
        ge=0,
    )


class AutomationTrendPoint(BaseModel):
    """Single data point for automation trends."""

    date: str = Field(
        description="Date in ISO format (YYYY-MM-DD)",
    )
    approved: int = Field(
        description="Number of approved versions on this date",
        ge=0,
    )
    rejected: int = Field(
        description="Number of rejected versions on this date",
        ge=0,
    )
    manual: int = Field(
        description="Number of manually reviewed versions on this date",
        ge=0,
    )


class AutomationTrendsResponse(BaseModel):
    """Response schema for automation trends over time."""

    period: str = Field(
        description="Time period filter applied (7d, 30d, 90d)",
    )
    data: list[AutomationTrendPoint] = Field(
        description="Daily trend data points",
    )
