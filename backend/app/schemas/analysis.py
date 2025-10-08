"""Analysis schemas for task proposal system"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RunStatus(str, Enum):
    """Analysis run lifecycle status"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    CLOSED = "closed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TriggerType(str, Enum):
    """How the analysis run was triggered"""

    MANUAL = "manual"
    SCHEDULED = "scheduled"
    CUSTOM = "custom"


class ProposalStatus(str, Enum):
    """Status of task proposal"""

    PENDING = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    MERGED = "merged"


class AccuracyMetricsResponse(BaseModel):
    """Metrics for analysis accuracy after run closing"""

    # Approval rate
    total_proposals: int
    approved_count: int
    rejected_count: int
    approval_rate: float

    # Confidence distribution
    avg_confidence: float
    high_confidence_approved: int
    low_confidence_rejected: int
    confidence_accuracy: float

    # Duplicate detection
    duplicates_found: int
    duplicates_correct: int
    duplicates_incorrect: int
    duplicate_detection_accuracy: float

    # Project classification
    projects_classified: int
    projects_correct: int
    projects_changed: int
    project_classification_accuracy: float

    # Efficiency
    avg_time_per_proposal: float
    total_processing_time: float
    cost_per_approved_task: float

    # PM workload
    manual_edits_count: int
    quick_approvals: int


class AnalysisRunResponse(BaseModel):
    """Analysis run metadata and status"""

    id: UUID
    status: RunStatus
    trigger_type: TriggerType

    # Time window
    time_window_start: datetime
    time_window_end: datetime

    # Timestamps
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    closed_at: datetime | None = None

    # Proposals tracking
    proposals_total: int
    proposals_approved: int
    proposals_rejected: int
    proposals_pending: int

    # Statistics
    total_messages_in_window: int
    messages_after_prefilter: int
    batches_created: int
    llm_tokens_used: int
    cost_estimate: float

    # Metrics (only after closing)
    accuracy_metrics: AccuracyMetricsResponse | None = None

    # User info
    triggered_by: str | None = None


class TaskProposalResponse(BaseModel):
    """Task proposal pending PM review"""

    id: UUID
    analysis_run_id: UUID

    # Proposed task data
    proposed_title: str
    proposed_description: str
    proposed_priority: str
    proposed_category: str
    proposed_project_id: UUID | None = None

    # Source tracking
    source_message_ids: list[int]
    message_count: int

    # Duplicate detection
    similar_task_id: UUID | None = None
    similarity_score: float | None = None
    similarity_type: str | None = None

    # LLM metadata
    llm_recommendation: str
    confidence: float
    reasoning: str

    # Review status
    status: ProposalStatus
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None

    # Timestamps
    created_at: datetime


class AnalysisRunListResponse(BaseModel):
    """List of analysis runs with pagination"""

    runs: list[AnalysisRunResponse]
    total: int
    page: int
    page_size: int
