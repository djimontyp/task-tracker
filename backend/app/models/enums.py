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


class ProviderType(str, Enum):
    """Supported LLM provider types."""

    ollama = "ollama"
    openai = "openai"


class ValidationStatus(str, Enum):
    """Provider validation status."""

    pending = "pending"
    validating = "validating"
    connected = "connected"
    error = "error"


class IngestionStatus(str, Enum):
    """Status of message ingestion job."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class AnalysisRunStatus(str, Enum):
    """Status of analysis run."""

    pending = "pending"
    running = "running"
    completed = "completed"
    reviewed = "reviewed"
    closed = "closed"
    failed = "failed"
    cancelled = "cancelled"


class ProposalStatus(str, Enum):
    """Status of task proposal."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    merged = "merged"


class LLMRecommendation(str, Enum):
    """LLM recommendation for task proposal."""

    new_task = "new_task"
    update_existing = "update_existing"
    merge = "merge"
    reject = "reject"


class SimilarityType(str, Enum):
    """Type of similarity detection."""

    exact_messages = "exact_messages"
    semantic = "semantic"
    none = "none"


class AnalysisStatus(str, Enum):
    """Analysis processing status for messages."""

    pending = "pending"
    analyzed = "analyzed"
    spam = "spam"
    noise = "noise"


class NoiseClassification(str, Enum):
    """Noise classification types for message filtering."""

    signal = "signal"
    noise = "noise"
    spam = "spam"
    low_quality = "low_quality"
    high_quality = "high_quality"


class FailedTaskStatus(str, Enum):
    """Status of failed background tasks in Dead Letter Queue."""

    failed = "failed"
    retrying = "retrying"
    abandoned = "abandoned"
