"""API endpoints for system configuration.

Provides read-only access to system configuration values,
enabling frontend synchronization without hardcoded magic numbers.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config.ai_config import ai_config

router = APIRouter(prefix="/config", tags=["config"])


class ScoringWeights(BaseModel):
    """Scoring factor weights (must sum to 1.0)."""

    content: float
    author: float
    temporal: float
    topics: float


class ScoringConfigResponse(BaseModel):
    """Scoring configuration for signal/noise classification."""

    noise_threshold: float
    signal_threshold: float
    weights: ScoringWeights


@router.get(
    "/scoring",
    response_model=ScoringConfigResponse,
    summary="Get scoring configuration",
    description="Returns scoring thresholds and weights for signal/noise classification.",
)
async def get_scoring_config() -> ScoringConfigResponse:
    """Get current scoring configuration.

    Returns:
        ScoringConfigResponse with thresholds and weights from AIConfig.

    Note:
        These values can be overridden via environment variables:
        - AI_MESSAGE_SCORING_NOISE_THRESHOLD
        - AI_MESSAGE_SCORING_SIGNAL_THRESHOLD
        - AI_MESSAGE_SCORING_CONTENT_WEIGHT
        - etc.
    """
    scoring = ai_config.message_scoring
    return ScoringConfigResponse(
        noise_threshold=scoring.noise_threshold,
        signal_threshold=scoring.signal_threshold,
        weights=ScoringWeights(
            content=scoring.content_weight,
            author=scoring.author_weight,
            temporal=scoring.temporal_weight,
            topics=scoring.topics_weight,
        ),
    )
