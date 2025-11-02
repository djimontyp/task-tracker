"""Schemas for dashboard metrics."""

from typing import Literal

from pydantic import BaseModel, Field


class MetricTrend(BaseModel):
    """Metric trend information."""

    direction: Literal["up", "down", "stable"] = Field(..., description="Trend direction")
    change: float = Field(..., description="Percentage change", ge=0)


class DashboardMetricsResponse(BaseModel):
    """Response model for dashboard metrics."""

    topicQualityScore: float = Field(
        ..., description="Average topic quality score (0-100)", ge=0, le=100
    )
    noiseRatio: float = Field(
        ..., description="Percentage of messages filtered as noise", ge=0, le=100
    )
    classificationAccuracy: float = Field(
        ..., description="Classification model accuracy (0-100)", ge=0, le=100
    )
    activeAnalysisRuns: int = Field(
        ..., description="Number of currently active analysis runs", ge=0
    )
    trends: dict[str, MetricTrend] = Field(
        ..., description="Trend data for each metric"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "topicQualityScore": 85.0,
                "noiseRatio": 18.5,
                "classificationAccuracy": 92.3,
                "activeAnalysisRuns": 9,
                "trends": {
                    "topicQualityScore": {"direction": "up", "change": 3.2},
                    "noiseRatio": {"direction": "down", "change": 2.1},
                    "classificationAccuracy": {"direction": "up", "change": 1.5},
                    "activeAnalysisRuns": {"direction": "stable", "change": 0.0},
                },
            }
        }
