"""Schemas for Golden Set testing API."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class GoldenSetTestRequest(BaseModel):
    """Request to run Golden Set test against an agent."""

    mode: Literal["quick", "medium"] = Field(
        default="quick",
        description="Test mode: 'quick' (30 messages) or 'medium' (50 messages)",
    )
    golden_set_path: str | None = Field(
        default=None,
        description="Path to golden set JSON file (relative to project root). Default: tests/fixtures/golden_set.json",
    )


class ScoringResult(BaseModel):
    """Result of scoring a single message."""

    msg_id: str
    content: str
    expected_score: float
    actual_score: float | None  # None if LLM failed to respond
    expected_class: str
    actual_class: str | None  # None if LLM failed to respond
    confidence: str
    score_diff: float
    status: Literal["pass", "warning", "fail", "error"]  # "error" when LLM fails
    error_message: str | None = None  # Error details if status is "error"


class GoldenSetTestReport(BaseModel):
    """Complete report from Golden Set test run."""

    agent_id: UUID
    agent_name: str
    model: str
    provider_name: str
    mode: str
    total_messages: int

    # Scoring metrics
    scoring_pass: int
    scoring_warning: int
    scoring_fail: int

    # Classification metrics
    classification_exact: int
    classification_alt: int
    classification_fail: int

    # Deviation metrics
    avg_score_diff: float
    max_score_diff: float

    # Timing
    duration_seconds: float

    # Verdict
    verdict: Literal["acceptable", "needs_improvement", "failed"]

    # All results for detailed analysis
    all_results: list[ScoringResult]

    # Failed cases for review (first 10, for backward compatibility)
    failures: list[ScoringResult]


class GoldenSetTestProgress(BaseModel):
    """Progress update during Golden Set test."""

    current_message: int
    total_messages: int
    current_content: str
    status: Literal["pass", "warning", "fail", "error"]
    actual_score: float
    expected_score: float
