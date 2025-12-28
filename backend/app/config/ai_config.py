"""AI system configuration with production-tested thresholds and rationale.

This module centralizes all AI/LLM-related configuration values that were previously
hardcoded as magic numbers across the codebase. Each setting includes:
- Type-safe bounds (via Pydantic Field validators)
- Production rationale explaining why this value works
- Environment variable override support (via pydantic-settings)
"""

from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class KnowledgeExtractionSettings(BaseSettings):
    """Knowledge extraction thresholds with production-tested rationale."""

    message_threshold: int = Field(
        default=10,
        ge=5,
        le=100,
        description=(
            "Minimum unprocessed messages to trigger extraction. "
            "Rationale: 10 provides optimal balance - "
            "too low (<5) = high LLM costs + fragmented topics, "
            "too high (>50) = delayed insights + memory issues"
        ),
    )

    lookback_hours: int = Field(
        default=24,
        ge=1,
        le=168,
        description="Time window for unprocessed messages (24h = daily batch processing)",
    )

    confidence_threshold: float = Field(
        default=0.7,
        ge=0.5,
        le=1.0,
        description=(
            "Auto-approval threshold (0.7 = 70% confidence). "
            "Based on experiments: 0.6 = too many false positives, 0.8 = missed valid topics"
        ),
    )

    batch_size: int = Field(
        default=50,
        ge=10,
        le=200,
        description="Max messages per extraction batch (LLM context window limit)",
    )


class MessageScoringSettings(BaseSettings):
    """Message scoring configuration with weighted importance factors."""

    noise_threshold: float = Field(
        default=0.30,
        ge=0.0,
        le=1.0,
        description=(
            "Below = noise (exclude from analysis). "
            "Calibrated Dec 2025: 0.30 ensures short messages ('Ок', '👍') "
            "with content_score=0.1 fall below threshold even with neutral other factors."
        ),
    )

    signal_threshold: float = Field(
        default=0.60,
        ge=0.0,
        le=1.0,
        description=(
            "Above = signal (high priority). "
            "Calibrated Dec 2025: 0.60 ensures messages with signal keywords "
            "(content_score=0.8) exceed threshold with neutral other factors."
        ),
    )

    content_weight: float = Field(
        default=0.4,
        ge=0.0,
        le=1.0,
        description="40% - Content quality factor",
    )

    author_weight: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="20% - Author reputation factor",
    )

    temporal_weight: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="20% - Temporal relevance factor",
    )

    topics_weight: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="20% - Topic importance factor",
    )

    @field_validator("topics_weight")
    @classmethod
    def validate_weights_sum(cls, v: float, info: Any) -> float:
        """Ensure all scoring weights sum to 1.0."""
        if not info.data:
            return v

        total = (
            info.data.get("content_weight", 0.4)
            + info.data.get("author_weight", 0.2)
            + info.data.get("temporal_weight", 0.2)
            + v
        )

        if not 0.99 <= total <= 1.01:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total:.2f}. "
                f"Adjust content_weight, author_weight, temporal_weight, or topics_weight."
            )
        return v


class AnalysisSettings(BaseSettings):
    """Analysis system batching configuration."""

    time_gap_seconds: int = Field(
        default=600,
        ge=60,
        le=3600,
        description=(
            "Max time gap between messages in same batch (conversation boundary). "
            "10 minutes = typical pause in active conversation"
        ),
    )

    max_batch_size: int = Field(
        default=50,
        ge=10,
        le=200,
        description="Max messages per batch (balance: context vs LLM cost)",
    )

    group_by_thread: bool = Field(
        default=True,
        description="Group messages by thread before extraction (keeps conversations together)",
    )

    group_by_channel: bool = Field(
        default=True,
        description="Group messages by channel before extraction (separates different chat sources)",
    )


class VectorSearchSettings(BaseSettings):
    """Vector search thresholds for different use cases."""

    semantic_search_threshold: float = Field(
        default=0.65,
        ge=0.0,
        le=1.0,
        description="Semantic search threshold (balanced precision/recall)",
    )

    duplicate_detection_threshold: float = Field(
        default=0.95,
        ge=0.8,
        le=1.0,
        description="High precision for duplicate detection",
    )

    exploration_threshold: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
        description="Low threshold for exploratory search",
    )


class AIConfig(BaseSettings):
    """Unified AI system configuration with environment variable override support.

    Environment variables follow pattern: {PREFIX}_{SUBSECTION}_{FIELD}
    Example: AI_KNOWLEDGE_EXTRACTION_MESSAGE_THRESHOLD=20
    """

    knowledge_extraction: KnowledgeExtractionSettings = Field(default_factory=KnowledgeExtractionSettings)
    message_scoring: MessageScoringSettings = Field(default_factory=MessageScoringSettings)
    analysis: AnalysisSettings = Field(default_factory=AnalysisSettings)
    vector_search: VectorSearchSettings = Field(default_factory=VectorSearchSettings)

    model_config = {"env_prefix": "AI_", "env_nested_delimiter": "_"}


ai_config = AIConfig()
