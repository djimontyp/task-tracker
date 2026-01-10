"""Golden Set Testing Service.

Runs LLM agents against predefined test messages with ground truth labels
to evaluate quality and consistency.
"""

import json
import logging
import time
from pathlib import Path
from typing import Any, AsyncIterator, Literal
from uuid import UUID

from pydantic import BaseModel, Field
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.golden_set import (
    GoldenSetTestProgress,
    GoldenSetTestReport,
    ScoringResult,
)
from app.llm.application.llm_service import LLMService
from app.llm.application.provider_resolver import ProviderResolver
from app.llm.domain.models import AgentConfig as DomainAgentConfig
from app.models.agent_config import AgentConfig
from app.models.llm_provider import LLMProvider
from app.services.provider_crud import ProviderCRUD

logger = logging.getLogger(__name__)


class ScoringOutput(BaseModel):
    """Expected output structure from scoring LLM."""

    score: float = Field(..., ge=0.0, le=1.0, description="Importance score 0.0-1.0")
    classification: str = Field(..., description="One of: noise, weak, signal")


class GoldenSetTestService:
    """Service for running Golden Set tests against LLM agents."""

    # System prompt for scoring (same as test_golden_set.py)
    SCORING_SYSTEM_PROMPT = """You are a message importance scorer for a knowledge management system.
Score messages from 0.0 (noise) to 1.0 (critical signal).
Classification: "noise" (chat/emoji/greetings), "weak" (some context but unclear), "signal" (actionable/important/bug reports).
Return ONLY valid JSON: {"score": 0.XX, "classification": "..."}"""

    def __init__(self, session: AsyncSession):
        """Initialize service.

        Args:
            session: Database session
        """
        self.session = session
        self._provider_crud = ProviderCRUD(session)
        self._provider_resolver = ProviderResolver(self._provider_crud)
        self._llm_service = LLMService(self._provider_resolver)

    async def load_golden_set(
        self,
        golden_set_path: str | None = None,
        mode: Literal["quick", "medium"] = "quick",
    ) -> list[dict[str, Any]]:
        """Load golden set messages from JSON file.

        Args:
            golden_set_path: Path to golden set file (relative to project root)
            mode: 'quick' for 30 messages, 'medium' for all messages

        Returns:
            List of message dictionaries with ground_truth and tolerance
        """
        # Default path - use fixtures directory in app
        if golden_set_path is None:
            golden_set_path = "fixtures/golden_set.json"

        # Resolve path relative to /app directory (Docker) or backend directory (local)
        # In Docker: /app/fixtures/golden_set.json
        # Local: backend/fixtures/golden_set.json
        app_root = Path(__file__).parent.parent.parent  # /app or backend/
        full_path = app_root / golden_set_path

        # Fallback to tests/fixtures if not found in app/fixtures
        if not full_path.exists():
            project_root = app_root.parent  # task-tracker/
            full_path = project_root / "tests" / "fixtures" / "golden_set.json"

        if not full_path.exists():
            raise FileNotFoundError(f"Golden set file not found: {full_path}")

        with open(full_path) as f:
            data = json.load(f)

        messages: list[dict[str, Any]] = data.get("messages", [])

        # Apply mode filter
        if mode == "quick":
            return messages[:30]
        return messages

    def _get_status(
        self,
        expected_score: float,
        actual_score: float,
        tolerance: dict[str, Any],
    ) -> Literal["pass", "warning", "fail"]:
        """Determine pass/warning/fail status based on tolerance.

        Args:
            expected_score: Ground truth score
            actual_score: LLM-generated score
            tolerance: Tolerance settings from golden set

        Returns:
            Status string
        """
        diff = abs(actual_score - expected_score)
        score_band = tolerance.get("score_band", 0.15)
        score_warning = tolerance.get("score_warning", 0.25)

        # Check must_be_below constraint
        if "must_be_below" in tolerance:
            if actual_score > tolerance["must_be_below"]:
                return "fail"

        if diff <= score_band:
            return "pass"
        elif diff <= score_warning:
            return "warning"
        else:
            return "fail"

    def _check_classification(
        self,
        expected: str,
        actual: str,
        tolerance: dict[str, Any],
    ) -> Literal["exact", "alternative", "fail"]:
        """Check classification match.

        Args:
            expected: Ground truth classification
            actual: LLM-generated classification
            tolerance: Tolerance settings from golden set

        Returns:
            Match status
        """
        if actual == expected:
            return "exact"

        alternatives = tolerance.get("classification_alternatives", [])
        if actual in alternatives:
            return "alternative"

        return "fail"

    def _calculate_verdict(
        self,
        total: int,
        scoring_pass: int,
        classification_exact: int,
        classification_alt: int,
    ) -> Literal["acceptable", "needs_improvement", "failed"]:
        """Calculate overall verdict.

        Args:
            total: Total number of messages
            scoring_pass: Number of passed scores
            classification_exact: Exact classification matches
            classification_alt: Alternative classification matches

        Returns:
            Verdict string
        """
        score_rate = scoring_pass / total * 100 if total > 0 else 0
        class_rate = (classification_exact + classification_alt) / total * 100 if total > 0 else 0

        if score_rate >= 80 and class_rate >= 75:
            return "acceptable"
        elif score_rate >= 70:
            return "needs_improvement"
        else:
            return "failed"

    async def _score_message(
        self,
        agent_config: AgentConfig,
        provider: LLMProvider,
        content: str,
    ) -> tuple[float | None, str | None, str | None]:
        """Score a single message using LLM.

        Args:
            agent_config: Agent configuration
            provider: LLM provider
            content: Message content to score

        Returns:
            Tuple of (score, classification, error_message)
            - On success: (score, classification, None)
            - On failure: (None, None, error_message)
        """
        # Build domain config for LLM service
        domain_config = DomainAgentConfig(
            name="golden_set_scorer",
            model_name=agent_config.model_name,
            system_prompt=self.SCORING_SYSTEM_PROMPT,
            output_type=ScoringOutput,
            temperature=0.1,  # Low temperature for consistency
        )

        user_prompt = f'Rate this message: "{content}"'

        try:
            agent = await self._llm_service.create_agent(
                session=self.session,
                config=domain_config,
                provider_id=provider.id,
            )

            result = await agent.run(user_prompt)
            output: ScoringOutput = result.output

            return output.score, output.classification, None

        except Exception as e:
            logger.warning(f"Scoring failed for message: {e}")
            return None, None, str(e)

    async def run_test(
        self,
        agent_id: UUID,
        mode: Literal["quick", "medium"] = "quick",
        golden_set_path: str | None = None,
    ) -> GoldenSetTestReport:
        """Run complete Golden Set test.

        Args:
            agent_id: Agent UUID to test
            mode: Test mode ('quick' or 'medium')
            golden_set_path: Optional custom path to golden set file

        Returns:
            Complete test report
        """
        # Load agent and provider
        agent_config = await self.session.get(AgentConfig, agent_id)
        if not agent_config:
            raise ValueError(f"Agent with ID '{agent_id}' not found")

        provider = await self.session.get(LLMProvider, agent_config.provider_id)
        if not provider:
            raise ValueError(f"Provider with ID '{agent_config.provider_id}' not found")

        # Load golden set
        messages = await self.load_golden_set(golden_set_path, mode)

        results: list[ScoringResult] = []
        start_time = time.time()

        logger.info(f"Starting Golden Set test: {len(messages)} messages with {agent_config.model_name}")

        for i, msg in enumerate(messages, 1):
            content = msg["content"]
            gt = msg["ground_truth"]
            tolerance = msg.get("tolerance", {"score_band": 0.15, "score_warning": 0.25})

            # Score message
            actual_score, actual_class, error_msg = await self._score_message(agent_config, provider, content)

            # Handle error case (LLM failed to respond)
            if actual_score is None:
                result = ScoringResult(
                    msg_id=msg["id"],
                    content=content,
                    expected_score=gt["importance_score"],
                    actual_score=None,
                    expected_class=gt["classification"],
                    actual_class=None,
                    confidence=gt.get("confidence", "medium"),
                    score_diff=1.0,  # Max diff for errors
                    status="error",
                    error_message=error_msg,
                )
                results.append(result)
                logger.debug(f"[{i}/{len(messages)}] error: LLM failed")
                continue

            # Calculate metrics for successful scoring
            score_diff = abs(actual_score - gt["importance_score"])
            status = self._get_status(gt["importance_score"], actual_score, tolerance)

            result = ScoringResult(
                msg_id=msg["id"],
                content=content,
                expected_score=gt["importance_score"],
                actual_score=actual_score,
                expected_class=gt["classification"],
                actual_class=actual_class,
                confidence=gt.get("confidence", "medium"),
                score_diff=score_diff,
                status=status,
            )
            results.append(result)

            logger.debug(f"[{i}/{len(messages)}] {status}: {actual_score:.2f} (exp: {gt['importance_score']:.2f})")

        duration = time.time() - start_time

        # Calculate aggregate metrics (errors count as failures)
        scoring_pass = sum(1 for r in results if r.status == "pass")
        scoring_warning = sum(1 for r in results if r.status == "warning")
        scoring_fail = sum(1 for r in results if r.status in ("fail", "error"))

        # Classification metrics (errors count as mismatches)
        classification_exact = sum(
            1 for r in results if r.actual_class is not None and r.expected_class == r.actual_class
        )
        classification_alt = sum(
            1
            for i, r in enumerate(results)
            if r.actual_class is not None
            and r.expected_class != r.actual_class
            and r.actual_class in messages[i].get("tolerance", {}).get("classification_alternatives", [])
        )
        classification_fail = len(results) - classification_exact - classification_alt

        avg_diff = sum(r.score_diff for r in results) / len(results) if results else 0
        max_diff = max((r.score_diff for r in results), default=0)
        failures = [r for r in results if r.status in ("fail", "error")]

        verdict = self._calculate_verdict(len(results), scoring_pass, classification_exact, classification_alt)

        return GoldenSetTestReport(
            agent_id=agent_id,
            agent_name=agent_config.name,
            model=agent_config.model_name,
            provider_name=provider.name,
            mode=mode,
            total_messages=len(results),
            scoring_pass=scoring_pass,
            scoring_warning=scoring_warning,
            scoring_fail=scoring_fail,
            classification_exact=classification_exact,
            classification_alt=classification_alt,
            classification_fail=classification_fail,
            avg_score_diff=round(avg_diff, 3),
            max_score_diff=round(max_diff, 3),
            duration_seconds=round(duration, 1),
            verdict=verdict,
            all_results=results,
            failures=failures[:10],  # Limit to 10 failures for backward compatibility
        )

    async def run_test_streaming(
        self,
        agent_id: UUID,
        mode: Literal["quick", "medium"] = "quick",
        golden_set_path: str | None = None,
    ) -> AsyncIterator[GoldenSetTestProgress | GoldenSetTestReport]:
        """Run Golden Set test with streaming progress updates.

        Yields progress updates for each message, then final report.

        Args:
            agent_id: Agent UUID to test
            mode: Test mode ('quick' or 'medium')
            golden_set_path: Optional custom path to golden set file

        Yields:
            GoldenSetTestProgress for each message
            GoldenSetTestReport as final item
        """
        # Load agent and provider
        agent_config = await self.session.get(AgentConfig, agent_id)
        if not agent_config:
            raise ValueError(f"Agent with ID '{agent_id}' not found")

        provider = await self.session.get(LLMProvider, agent_config.provider_id)
        if not provider:
            raise ValueError(f"Provider with ID '{agent_config.provider_id}' not found")

        # Load golden set
        messages = await self.load_golden_set(golden_set_path, mode)

        results: list[ScoringResult] = []
        start_time = time.time()

        for i, msg in enumerate(messages, 1):
            content = msg["content"]
            gt = msg["ground_truth"]
            tolerance = msg.get("tolerance", {"score_band": 0.15, "score_warning": 0.25})

            # Score message
            actual_score, actual_class, error_msg = await self._score_message(agent_config, provider, content)

            # Handle error case (LLM failed to respond)
            if actual_score is None:
                result = ScoringResult(
                    msg_id=msg["id"],
                    content=content,
                    expected_score=gt["importance_score"],
                    actual_score=None,
                    expected_class=gt["classification"],
                    actual_class=None,
                    confidence=gt.get("confidence", "medium"),
                    score_diff=1.0,
                    status="error",
                    error_message=error_msg,
                )
                results.append(result)

                yield GoldenSetTestProgress(
                    current_message=i,
                    total_messages=len(messages),
                    current_content=content[:50] + "..." if len(content) > 50 else content,
                    status="error",
                    actual_score=0.0,
                    expected_score=gt["importance_score"],
                )
                continue

            # Calculate metrics for successful scoring
            score_diff = abs(actual_score - gt["importance_score"])
            status = self._get_status(gt["importance_score"], actual_score, tolerance)

            result = ScoringResult(
                msg_id=msg["id"],
                content=content,
                expected_score=gt["importance_score"],
                actual_score=actual_score,
                expected_class=gt["classification"],
                actual_class=actual_class,
                confidence=gt.get("confidence", "medium"),
                score_diff=score_diff,
                status=status,
            )
            results.append(result)

            # Yield progress update
            yield GoldenSetTestProgress(
                current_message=i,
                total_messages=len(messages),
                current_content=content[:50] + "..." if len(content) > 50 else content,
                status=status,
                actual_score=actual_score,
                expected_score=gt["importance_score"],
            )

        duration = time.time() - start_time

        # Calculate aggregate metrics (errors count as failures)
        scoring_pass = sum(1 for r in results if r.status == "pass")
        scoring_warning = sum(1 for r in results if r.status == "warning")
        scoring_fail = sum(1 for r in results if r.status in ("fail", "error"))

        # Classification metrics (errors count as mismatches)
        classification_exact = sum(
            1 for r in results if r.actual_class is not None and r.expected_class == r.actual_class
        )
        classification_alt = sum(
            1
            for i, r in enumerate(results)
            if r.actual_class is not None
            and r.expected_class != r.actual_class
            and r.actual_class in messages[i].get("tolerance", {}).get("classification_alternatives", [])
        )
        classification_fail = len(results) - classification_exact - classification_alt

        avg_diff = sum(r.score_diff for r in results) / len(results) if results else 0
        max_diff = max((r.score_diff for r in results), default=0)
        failures = [r for r in results if r.status in ("fail", "error")]

        verdict = self._calculate_verdict(len(results), scoring_pass, classification_exact, classification_alt)

        # Yield final report
        yield GoldenSetTestReport(
            agent_id=agent_id,
            agent_name=agent_config.name,
            model=agent_config.model_name,
            provider_name=provider.name,
            mode=mode,
            total_messages=len(results),
            scoring_pass=scoring_pass,
            scoring_warning=scoring_warning,
            scoring_fail=scoring_fail,
            classification_exact=classification_exact,
            classification_alt=classification_alt,
            classification_fail=classification_fail,
            avg_score_diff=round(avg_diff, 3),
            max_score_diff=round(max_diff, 3),
            duration_seconds=round(duration, 1),
            verdict=verdict,
            all_results=results,
            failures=failures[:10],  # Limit to 10 failures for backward compatibility
        )
