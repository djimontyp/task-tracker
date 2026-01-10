#!/usr/bin/env python3
"""
Golden Set Testing Script for LLM Quality Evaluation.

Usage:
    # Quick test (scoring only, 30 messages)
    uv run python scripts/test_golden_set.py --mode quick

    # Medium test (scoring + extraction, 50 messages)
    uv run python scripts/test_golden_set.py --mode medium

    # With specific model
    uv run python scripts/test_golden_set.py --model qwen3:14b

    # With remote Ollama
    uv run python scripts/test_golden_set.py --ollama-url http://192.168.0.64:11434
"""

import argparse
import asyncio
import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import httpx

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


@dataclass
class ScoringResult:
    msg_id: str
    content: str
    expected_score: float
    actual_score: float
    expected_class: str
    actual_class: str
    confidence: str
    score_diff: float
    status: Literal["pass", "warning", "fail"]


@dataclass
class TestReport:
    model: str
    mode: str
    total_messages: int
    scoring_pass: int
    scoring_warning: int
    scoring_fail: int
    classification_exact: int
    classification_alt: int
    classification_fail: int
    avg_score_diff: float
    max_score_diff: float
    duration_seconds: float
    failures: list[ScoringResult]


class GoldenSetTester:
    """Test LLM against Golden Set ground truth."""

    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        model: str = "qwen3:14b",
        golden_set_path: str | None = None,
    ):
        self.ollama_url = ollama_url.rstrip("/")
        self.model = model
        self.client = httpx.AsyncClient(timeout=120.0)

        # Load golden set
        if golden_set_path:
            golden_path = Path(golden_set_path)
        else:
            golden_path = Path(__file__).parent.parent / "tests" / "fixtures" / "golden_set.json"
        with open(golden_path) as f:
            self.golden_set = json.load(f)

    async def check_ollama_connection(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            resp = await self.client.get(f"{self.ollama_url}/api/tags")
            return resp.status_code == 200
        except Exception as e:
            print(f"❌ Cannot connect to Ollama at {self.ollama_url}: {e}")
            return False

    async def list_models(self) -> list[str]:
        """List available models."""
        try:
            resp = await self.client.get(f"{self.ollama_url}/api/tags")
            data = resp.json()
            return [m["name"] for m in data.get("models", [])]
        except Exception:
            return []

    async def score_message(self, content: str) -> tuple[float, str]:
        """Score a single message using LLM via Chat API."""
        system_prompt = """You are a message importance scorer for a knowledge management system.
Score messages from 0.0 (noise) to 1.0 (critical signal).
Classification: "noise" (chat/emoji/greetings), "weak" (some context but unclear), "signal" (actionable/important/bug reports).
Return ONLY valid JSON: {"score": 0.XX, "classification": "..."}"""

        try:
            resp = await self.client.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f'Rate this message: "{content}"'},
                    ],
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 800,  # enough for thinking + JSON output
                    },
                },
            )
            result = resp.json()
            response_text = result.get("message", {}).get("content", "")

            # If content empty, try to extract from thinking field
            if not response_text:
                msg = result.get("message", {})
                thinking = msg.get("thinking", "")
                if thinking:
                    import re
                    # Try to find score in thinking
                    score_match = re.search(r'(?:"score":|score\s+(?:is|should be|around|of))\s*(\d+\.?\d*)', thinking, re.IGNORECASE)
                    class_match = re.search(r'(?:classification|classify|is)\s*[:\s"\']*\s*(noise|weak|signal)', thinking, re.IGNORECASE)
                    if score_match:
                        score = float(score_match.group(1))
                        if score > 1:
                            score = score / 10  # handle "0.8" vs "8"
                        classification = class_match.group(1).lower() if class_match else "weak"
                        return score, classification
                # Thinking didn't have score - fallback
                return 0.5, "weak"

            # Parse JSON
            data = json.loads(response_text)
            score = float(data.get("score", 0.5))
            classification = data.get("classification", "weak")
            return score, classification

        except json.JSONDecodeError as e:
            print(f"\n  ⚠️ JSON parse error: {e}, response: {response_text[:100]}")
            return 0.5, "weak"
        except Exception as e:
            print(f"\n  ⚠️ Error: {e}")
            return 0.5, "weak"

    def _get_status(
        self,
        expected_score: float,
        actual_score: float,
        tolerance: dict,
    ) -> Literal["pass", "warning", "fail"]:
        """Determine pass/warning/fail status."""
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
        tolerance: dict,
    ) -> Literal["exact", "alternative", "fail"]:
        """Check classification match."""
        if actual == expected:
            return "exact"

        alternatives = tolerance.get("classification_alternatives", [])
        if actual in alternatives:
            return "alternative"

        return "fail"

    async def run_quick_test(self) -> TestReport:
        """Quick test: scoring only, first 30 messages."""
        messages = self.golden_set["messages"][:30]
        return await self._run_scoring_test(messages, "quick")

    async def run_medium_test(self) -> TestReport:
        """Medium test: all 50 messages."""
        messages = self.golden_set["messages"]
        return await self._run_scoring_test(messages, "medium")

    async def _run_scoring_test(
        self,
        messages: list[dict],
        mode: str,
    ) -> TestReport:
        """Run scoring test on messages."""
        results: list[ScoringResult] = []
        start_time = time.time()

        print(f"\n🎯 Testing {len(messages)} messages with {self.model}...")
        print("=" * 60)

        for i, msg in enumerate(messages, 1):
            content = msg["content"]
            gt = msg["ground_truth"]
            tolerance = msg.get("tolerance", {"score_band": 0.15, "score_warning": 0.25})

            # Truncate display
            display_content = content[:40] + "..." if len(content) > 40 else content
            print(f"[{i}/{len(messages)}] {display_content}", end=" ")

            actual_score, actual_class = await self.score_message(content)

            score_diff = abs(actual_score - gt["importance_score"])
            status = self._get_status(gt["importance_score"], actual_score, tolerance)
            class_status = self._check_classification(gt["classification"], actual_class, tolerance)

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

            # Print result
            status_icon = {"pass": "✅", "warning": "⚠️", "fail": "❌"}[status]
            print(f"{status_icon} {actual_score:.2f} (exp: {gt['importance_score']:.2f})")

        duration = time.time() - start_time

        # Calculate stats
        scoring_pass = sum(1 for r in results if r.status == "pass")
        scoring_warning = sum(1 for r in results if r.status == "warning")
        scoring_fail = sum(1 for r in results if r.status == "fail")

        classification_exact = sum(1 for r in results if r.expected_class == r.actual_class)
        classification_alt = sum(
            1
            for i, r in enumerate(results)
            if r.expected_class != r.actual_class
            and r.actual_class in messages[i].get("tolerance", {}).get("classification_alternatives", [])
        )
        classification_fail = len(results) - classification_exact - classification_alt

        avg_diff = sum(r.score_diff for r in results) / len(results)
        max_diff = max(r.score_diff for r in results)
        failures = [r for r in results if r.status == "fail"]

        return TestReport(
            model=self.model,
            mode=mode,
            total_messages=len(messages),
            scoring_pass=scoring_pass,
            scoring_warning=scoring_warning,
            scoring_fail=scoring_fail,
            classification_exact=classification_exact,
            classification_alt=classification_alt,
            classification_fail=classification_fail,
            avg_score_diff=avg_diff,
            max_score_diff=max_diff,
            duration_seconds=duration,
            failures=failures,
        )


def print_report(report: TestReport) -> None:
    """Print formatted test report."""
    total = report.total_messages
    score_rate = report.scoring_pass / total * 100
    class_rate = (report.classification_exact + report.classification_alt) / total * 100

    print("\n")
    print("=" * 60)
    print(f"📊 QUALITY REPORT: {report.model}")
    print(f"   Mode: {report.mode} | Messages: {total}")
    print(f"   Duration: {report.duration_seconds:.1f}s")
    print("=" * 60)

    print("\nSCORING")
    print("────────")
    print(f"  ✅ Pass:    {report.scoring_pass}/{total} ({report.scoring_pass/total*100:.0f}%)")
    print(f"  ⚠️  Warning: {report.scoring_warning}/{total} ({report.scoring_warning/total*100:.0f}%)")
    print(f"  ❌ Fail:    {report.scoring_fail}/{total} ({report.scoring_fail/total*100:.0f}%)")
    print(f"\n  Avg deviation: {report.avg_score_diff:.3f}")
    print(f"  Max deviation: {report.max_score_diff:.3f}")

    print("\nCLASSIFICATION")
    print("──────────────")
    print(f"  ✅ Exact match:  {report.classification_exact}/{total} ({report.classification_exact/total*100:.0f}%)")
    print(f"  ⚠️  Alternative:  {report.classification_alt}/{total} ({report.classification_alt/total*100:.0f}%)")
    print(f"  ❌ Mismatch:     {report.classification_fail}/{total} ({report.classification_fail/total*100:.0f}%)")

    if report.failures:
        print("\nFAILURES (top 5)")
        print("────────────────")
        for f in report.failures[:5]:
            content_short = f.content[:35] + "..." if len(f.content) > 35 else f.content
            print(f"  • '{content_short}'")
            print(f"    Expected: {f.expected_score:.2f} ({f.expected_class})")
            print(f"    Actual:   {f.actual_score:.2f} ({f.actual_class})")
            print(f"    Diff:     {f.score_diff:.2f}")

    print("\n" + "=" * 60)
    if score_rate >= 80 and class_rate >= 75:
        print("✅ VERDICT: ACCEPTABLE")
    elif score_rate >= 70:
        print("⚠️  VERDICT: NEEDS IMPROVEMENT")
    else:
        print("❌ VERDICT: FAILED")
    print("=" * 60)


async def main():
    parser = argparse.ArgumentParser(description="Test LLM against Golden Set")
    parser.add_argument(
        "--mode",
        choices=["quick", "medium"],
        default="quick",
        help="Test mode: quick (30 msgs) or medium (50 msgs)",
    )
    parser.add_argument(
        "--model",
        default="qwen3:14b",
        help="Ollama model to test (default: qwen3:14b)",
    )
    parser.add_argument(
        "--ollama-url",
        default="http://localhost:11434",
        help="Ollama API URL (default: http://localhost:11434)",
    )
    parser.add_argument(
        "--list-models",
        action="store_true",
        help="List available models and exit",
    )
    parser.add_argument(
        "--golden-set",
        default=None,
        help="Path to custom golden set JSON file (default: tests/fixtures/golden_set.json)",
    )

    args = parser.parse_args()

    tester = GoldenSetTester(
        ollama_url=args.ollama_url,
        model=args.model,
        golden_set_path=args.golden_set,
    )

    # Check connection
    print(f"🔗 Connecting to Ollama at {args.ollama_url}...")
    if not await tester.check_ollama_connection():
        print("\n💡 Make sure Ollama is running:")
        print("   Local: ollama serve")
        print("   Remote: OLLAMA_HOST=0.0.0.0 ollama serve")
        sys.exit(1)

    # List models if requested
    if args.list_models:
        models = await tester.list_models()
        print("\n📦 Available models:")
        for m in models:
            print(f"   • {m}")
        sys.exit(0)

    # Check if model exists
    models = await tester.list_models()
    if args.model not in models and not any(args.model in m for m in models):
        print(f"\n❌ Model '{args.model}' not found!")
        print("Available models:")
        for m in models:
            print(f"   • {m}")
        print(f"\n💡 Pull it with: ollama pull {args.model}")
        sys.exit(1)

    # Run test
    if args.mode == "quick":
        report = await tester.run_quick_test()
    else:
        report = await tester.run_medium_test()

    print_report(report)

    await tester.client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
