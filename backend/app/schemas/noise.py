"""Noise filtering statistics schemas."""

from pydantic import BaseModel, Field


class NoiseTrendData(BaseModel):
    """Daily noise classification trend data."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    signal: int = Field(..., description="Count of high-importance messages (score > 0.7)")
    noise: int = Field(..., description="Count of low-importance messages (score < 0.3)")
    weak_signal: int = Field(..., description="Count of medium-importance messages (0.3-0.7)")


class NoiseSource(BaseModel):
    """Top noise source statistics."""

    name: str = Field(..., description="Source name")
    count: int = Field(..., description="Number of noise messages from this source")


class NoiseStatsResponse(BaseModel):
    """Noise filtering statistics for dashboard."""

    total_messages: int = Field(..., description="Total number of messages in database")
    signal_count: int = Field(..., description="Number of signal messages (importance > 0.7)")
    noise_count: int = Field(..., description="Number of noise messages (importance < 0.3)")
    signal_ratio: float = Field(..., ge=0.0, le=1.0, description="Ratio of signal to total (0.0-1.0)")
    needs_review: int = Field(..., description="Number of weak signals needing review (0.3-0.7)")
    trend: list[NoiseTrendData] = Field(..., description="7-day trend data")
    top_noise_sources: list[NoiseSource] = Field(..., description="Top 5 noise sources")
