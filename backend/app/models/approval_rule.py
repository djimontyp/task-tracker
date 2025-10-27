"""Approval rule configuration for automated version management."""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, Float, String
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class AutoAction(str, Enum):
    """Automated action to take based on rule evaluation."""

    approve = "approve"
    reject = "reject"
    manual = "manual"


class ApprovalRule(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Configuration for automated version approval workflow.

    Defines thresholds and actions for automated decision-making on
    Topic/Atom version proposals based on confidence and similarity scores.
    """

    __tablename__ = "approval_rules"

    confidence_threshold: float = Field(
        sa_column=Column(Float, nullable=False),
        description="Minimum confidence score (0-100) for auto-approval",
    )
    similarity_threshold: float = Field(
        sa_column=Column(Float, nullable=False),
        description="Minimum similarity score (0-100) for auto-approval",
    )
    auto_action: AutoAction = Field(
        sa_column=Column(String, nullable=False),
        description="Action to take when thresholds are met: approve, reject, or manual",
    )
    is_active: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default="true"),
        description="Whether this rule is currently active",
    )


class ApprovalRuleCreate(SQLModel):
    """Schema for creating a new approval rule."""

    confidence_threshold: float = Field(ge=0, le=100, description="Confidence threshold (0-100)")
    similarity_threshold: float = Field(ge=0, le=100, description="Similarity threshold (0-100)")
    auto_action: AutoAction = Field(description="Automated action: approve, reject, or manual")
    is_active: bool = Field(default=True, description="Rule active status")


class ApprovalRuleUpdate(SQLModel):
    """Schema for updating an existing approval rule."""

    confidence_threshold: float | None = Field(None, ge=0, le=100, description="Confidence threshold (0-100)")
    similarity_threshold: float | None = Field(None, ge=0, le=100, description="Similarity threshold (0-100)")
    auto_action: AutoAction | None = Field(None, description="Automated action: approve, reject, or manual")
    is_active: bool | None = Field(None, description="Rule active status")


class ApprovalRulePublic(SQLModel):
    """Public schema for approval rule responses."""

    id: int
    confidence_threshold: float
    similarity_threshold: float
    auto_action: AutoAction
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True
