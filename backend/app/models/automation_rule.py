"""Automation rule model for intelligent version approval workflow."""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class RuleAction(str, Enum):
    """Available automation actions."""

    approve = "approve"
    reject = "reject"
    escalate = "escalate"
    notify = "notify"


class LogicOperator(str, Enum):
    """Logic operators for combining multiple conditions."""

    AND = "AND"
    OR = "OR"


class AutomationRule(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Automation rule for intelligent version approval workflow.

    Evaluates versions against configurable conditions to automatically approve,
    reject, escalate, or notify based on confidence scores, similarity metrics,
    and entity metadata.
    """

    __tablename__ = "automation_rules"

    name: str = Field(
        sa_column=Column(String(255), nullable=False, unique=True),
        description="Unique rule name identifier",
    )
    description: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Human-readable rule description",
    )
    enabled: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default="true"),
        description="Whether this rule is active",
    )
    priority: int = Field(
        default=0,
        ge=0,
        le=100,
        sa_column=Column(Integer, nullable=False, server_default="0"),
        description="Rule priority (higher = evaluated first)",
    )
    action: RuleAction = Field(
        sa_column=Column(String(20), nullable=False),
        description="Action to execute when rule matches",
    )
    conditions: str = Field(
        sa_column=Column(Text, nullable=False),
        description="JSON-encoded list of RuleCondition objects",
    )
    logic_operator: LogicOperator = Field(
        default=LogicOperator.AND,
        sa_column=Column(String(3), nullable=False, server_default="AND"),
        description="Logic operator for combining conditions",
    )
    triggered_count: int = Field(
        default=0,
        ge=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
        description="Total number of times rule matched",
    )
    success_count: int = Field(
        default=0,
        ge=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
        description="Number of successful action executions",
    )
    last_triggered: datetime | None = Field(
        default=None,
        description="Timestamp of last rule trigger",
    )


class AutomationRuleCreate(SQLModel):
    """Schema for creating a new automation rule."""

    name: str = Field(min_length=1, max_length=255, description="Unique rule name")
    description: str | None = Field(None, description="Rule description")
    enabled: bool = Field(default=True, description="Rule enabled status")
    priority: int = Field(default=0, ge=0, le=100, description="Rule priority")
    action: RuleAction = Field(description="Action to execute")
    conditions: str = Field(min_length=1, description="JSON-encoded conditions")
    logic_operator: LogicOperator = Field(default=LogicOperator.AND, description="Logic operator")


class AutomationRuleUpdate(SQLModel):
    """Schema for updating an existing automation rule."""

    name: str | None = Field(None, min_length=1, max_length=255, description="Rule name")
    description: str | None = Field(None, description="Rule description")
    enabled: bool | None = Field(None, description="Rule enabled status")
    priority: int | None = Field(None, ge=0, le=100, description="Rule priority")
    action: RuleAction | None = Field(None, description="Action to execute")
    conditions: str | None = Field(None, min_length=1, description="JSON-encoded conditions")
    logic_operator: LogicOperator | None = Field(None, description="Logic operator")


class AutomationRulePublic(SQLModel):
    """Public schema for automation rule responses."""

    id: int
    name: str
    description: str | None
    enabled: bool
    priority: int
    action: RuleAction
    conditions: str
    logic_operator: LogicOperator
    triggered_count: int
    success_count: int
    last_triggered: datetime | None
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True


class AutomationRuleListResponse(SQLModel):
    """Response schema for paginated rule listing."""

    rules: list[AutomationRulePublic]
    total: int
    page: int
    page_size: int
