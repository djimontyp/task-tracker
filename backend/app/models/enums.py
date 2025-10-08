"""Enums for type safety across models."""
from enum import Enum


class TaskStatus(str, Enum):
    """Task status values."""

    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    closed = "closed"


class TaskCategory(str, Enum):
    """Task category values."""

    bug = "bug"
    feature = "feature"
    improvement = "improvement"
    question = "question"
    chore = "chore"


class TaskPriority(str, Enum):
    """Task priority values."""

    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class SourceType(str, Enum):
    """Communication source types."""

    telegram = "telegram"
    slack = "slack"
    email = "email"
    api = "api"
