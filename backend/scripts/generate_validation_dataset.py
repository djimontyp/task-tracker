"""Generate validation dataset for message scoring system.

This script uses Claude/GPT-4 to generate 1000 realistic Telegram messages
(500 Ukrainian + 500 English) with diverse patterns and edge cases for
validating the ImportanceScorer classification accuracy.

Distribution per language:
- 40% noise (200 messages)
- 30% weak_signal (150 messages)
- 30% signal (150 messages)

Usage:
    uv run python backend/scripts/generate_validation_dataset.py
    uv run python backend/scripts/generate_validation_dataset.py --api anthropic
    uv run python backend/scripts/generate_validation_dataset.py --seed 42
"""

import argparse
import json
import logging
import os
import random
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from anthropic import Anthropic
from openai import OpenAI
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MessageLabel = Literal["noise", "weak_signal", "signal"]


class GeneratedMessage(BaseModel):
    """Single generated message with metadata."""

    id: str
    text: str
    language: Literal["uk", "en"]
    label: MessageLabel
    pattern_type: str
    rationale: str


class DatasetMetadata(BaseModel):
    """Dataset metadata for tracking generation."""

    total: int
    generated_at: str
    generator: str
    noise_count: int
    weak_signal_count: int
    signal_count: int
    languages: dict[str, int]
    pattern_types: dict[str, int]
    generation_time_seconds: float


class ValidationDataset(BaseModel):
    """Complete validation dataset."""

    messages: list[GeneratedMessage]
    metadata: DatasetMetadata


PATTERN_TEMPLATES = {
    "noise": {
        "emoji_spam": "3-5 emoji reactions only",
        "short_reactions": "Single word reactions: ok, lol, +1, yeah, nope",
        "greetings_only": "Just greetings: hi, hello, bye, good morning",
        "casual_chat": "Off-topic casual conversation",
        "sticker_description": "Description of sticker/meme with no context",
        "typing_indicator": "Messages like 'typing...' or '...'",
        "duplicate_reaction": "Multiple identical emoji or text",
        "empty_context": "Single emoji with no informational value",
    },
    "weak_signal": {
        "vague_questions": "Unclear questions without context",
        "status_updates": "Short status without details",
        "incomplete_info": "Partial information requiring follow-up",
        "links_no_context": "URLs without explanation",
        "ambiguous_statements": "Statements needing clarification",
        "brief_mentions": "Brief topic mention without elaboration",
        "tentative_suggestions": "Uncertain suggestions or ideas",
        "follow_up_needed": "Information that requires more discussion",
    },
    "signal": {
        "bug_report_detailed": "Detailed bug reports with reproduction steps",
        "feature_request_rationale": "Feature requests with clear business value",
        "technical_discussion": "In-depth technical discussion with code/architecture",
        "decision_announcement": "Clear decisions with action items",
        "knowledge_sharing": "How-to guides, explanations, documentation",
        "architecture_proposal": "System design proposals with tradeoffs",
        "debugging_solution": "Solutions to technical problems",
        "performance_analysis": "Performance metrics and optimization suggestions",
        "security_concern": "Security vulnerabilities or concerns",
        "process_improvement": "Workflow or process improvement suggestions",
    },
}

GENERATION_PROMPT_TEMPLATE = """You are a dataset generator for Telegram message classification system validation.

Generate {count} realistic Telegram messages in {language} language with the following distribution:
- Label: {label}
- Pattern types to cover: {patterns}

CRITICAL REQUIREMENTS:

1. **Realism**: Messages MUST feel like real Telegram conversations from tech teams
2. **Language authenticity**:
   - Ukrainian: Use natural tech slang (баг, фіча, коміт, пуш, мердж, реквест), not transliterated
   - Ukrainian: Include realistic typos and casual language
   - English: Mix casual and professional tones
3. **Diversity**: Vary message length (5 to 500+ characters), formality, and structure
4. **Edge cases**: Include emoji, code snippets, URLs, markdown, mixed languages
5. **Context**: Messages should hint at conversation context without being isolated

LABEL DEFINITIONS:

**noise** (score < 0.3):
- Emoji reactions, "+1", "ok" responses
- Off-topic chat, greetings only
- Zero informational content
- Examples: "👍👍", "lol", "good morning team"

**weak_signal** (score 0.3-0.7):
- Vague questions without details
- Brief status updates
- Links without explanation
- Incomplete thoughts needing follow-up
- Examples: "thoughts?", "working on it", "https://example.com"

**signal** (score > 0.7):
- Detailed bug reports with reproduction
- Feature requests with rationale
- Technical discussions (architecture, code)
- Decisions with action items
- Knowledge sharing (how-to, explanations)
- Examples: Bug reports, design proposals, solutions

For each message, provide:
1. **text**: The actual message content (realistic Telegram style)
2. **pattern_type**: One of the specific patterns provided
3. **rationale**: Why this message deserves this label (1-2 sentences)

Return ONLY a valid JSON array of messages with this structure:
[
  {{
    "text": "message content here",
    "pattern_type": "bug_report_detailed",
    "rationale": "Detailed bug report with reproduction steps and urgency indicator"
  }}
]

Generate {count} messages now. Ensure diversity in length, tone, and content within the {label} category.
"""


class DatasetGenerator:
    """LLM-powered validation dataset generator."""

    def __init__(self, api_provider: Literal["anthropic", "openai"] = "anthropic", seed: int | None = None) -> None:
        """Initialize generator with API client.

        Args:
            api_provider: Which API to use (anthropic or openai)
            seed: Random seed for reproducibility
        """
        self.api_provider = api_provider
        self.seed = seed

        if seed:
            random.seed(seed)

        if api_provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")
            self.client = Anthropic(api_key=api_key)
            self.model = "claude-sonnet-4-20250514"
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4-turbo-preview"

    def _call_llm(self, prompt: str, max_retries: int = 3) -> str:
        """Call LLM API with retry logic and rate limiting.

        Args:
            prompt: Generation prompt
            max_retries: Maximum retry attempts

        Returns:
            LLM response text

        Raises:
            Exception: If all retries fail
        """
        for attempt in range(max_retries):
            try:
                if self.api_provider == "anthropic":
                    response = self.client.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        temperature=0.8,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    return response.content[0].text
                else:
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.8,
                        max_tokens=4096,
                    )
                    return response.choices[0].message.content or ""

            except Exception as e:
                logger.warning(f"API call failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** (attempt + 1)
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise

        raise Exception("All API retries failed")

    def _parse_llm_response(self, response: str) -> list[dict[str, Any]]:
        """Parse LLM JSON response with error handling.

        Args:
            response: Raw LLM response

        Returns:
            Parsed message list

        Raises:
            ValueError: If JSON parsing fails
        """
        try:
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response: {e}")
            logger.error(f"Response preview: {response[:500]}...")
            raise ValueError(f"Invalid JSON response from LLM: {e}")

    def generate_batch(
        self,
        label: MessageLabel,
        language: Literal["uk", "en"],
        count: int,
        pattern_types: list[str],
    ) -> list[GeneratedMessage]:
        """Generate a batch of messages for specific label and language.

        Args:
            label: Message classification label
            language: Target language (uk or en)
            count: Number of messages to generate
            pattern_types: List of pattern types to cover

        Returns:
            List of generated messages
        """
        logger.info(f"Generating {count} {label} messages in {language}...")

        patterns_str = ", ".join(pattern_types)
        prompt = GENERATION_PROMPT_TEMPLATE.format(
            count=count,
            language="Ukrainian" if language == "uk" else "English",
            label=label,
            patterns=patterns_str,
        )

        response = self._call_llm(prompt)
        parsed = self._parse_llm_response(response)

        messages = []
        for idx, item in enumerate(parsed[:count]):
            msg = GeneratedMessage(
                id=f"{language}_{label}_{idx:03d}",
                text=item["text"],
                language=language,
                label=label,
                pattern_type=item.get("pattern_type", "unknown"),
                rationale=item.get("rationale", "No rationale provided"),
            )
            messages.append(msg)

        time.sleep(1)

        return messages

    def generate_dataset(self) -> ValidationDataset:
        """Generate complete validation dataset with all labels and languages.

        Distribution:
        - 500 Ukrainian: 200 noise, 150 weak_signal, 150 signal
        - 500 English: 200 noise, 150 weak_signal, 150 signal

        Returns:
            Complete validation dataset
        """
        start_time = time.time()
        all_messages: list[GeneratedMessage] = []

        config = [
            ("noise", 200),
            ("weak_signal", 150),
            ("signal", 150),
        ]

        for language in ["uk", "en"]:
            for label, count in config:
                pattern_types = list(PATTERN_TEMPLATES[label].keys())

                batch_size = 25
                batches = (count + batch_size - 1) // batch_size

                for batch_idx in range(batches):
                    batch_count = min(batch_size, count - batch_idx * batch_size)
                    batch_patterns = random.sample(
                        pattern_types * ((batch_count // len(pattern_types)) + 1),
                        batch_count,
                    )

                    try:
                        messages = self.generate_batch(label, language, batch_count, batch_patterns)  # type: ignore[arg-type]
                        all_messages.extend(messages)
                        logger.info(
                            f"✓ Generated batch {batch_idx + 1}/{batches} "
                            f"({len(messages)} messages, total: {len(all_messages)}/1000)"
                        )
                    except Exception as e:
                        logger.error(f"Failed to generate batch: {e}")
                        continue

        generation_time = time.time() - start_time

        pattern_counts: dict[str, int] = {}
        for msg in all_messages:
            pattern_counts[msg.pattern_type] = pattern_counts.get(msg.pattern_type, 0) + 1

        metadata = DatasetMetadata(
            total=len(all_messages),
            generated_at=datetime.now(UTC).isoformat(),
            generator=f"{self.api_provider}:{self.model}",
            noise_count=sum(1 for m in all_messages if m.label == "noise"),
            weak_signal_count=sum(1 for m in all_messages if m.label == "weak_signal"),
            signal_count=sum(1 for m in all_messages if m.label == "signal"),
            languages={
                "uk": sum(1 for m in all_messages if m.language == "uk"),
                "en": sum(1 for m in all_messages if m.language == "en"),
            },
            pattern_types=pattern_counts,
            generation_time_seconds=round(generation_time, 2),
        )

        return ValidationDataset(messages=all_messages, metadata=metadata)


def save_dataset(dataset: ValidationDataset, output_path: Path) -> None:
    """Save dataset to JSON file.

    Args:
        dataset: Generated validation dataset
        output_path: Output file path
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(dataset.model_dump(), f, ensure_ascii=False, indent=2)

    logger.info(f"✓ Dataset saved to {output_path}")
    logger.info(f"  Total messages: {dataset.metadata.total}")
    logger.info(f"  Generation time: {dataset.metadata.generation_time_seconds:.1f}s")
    logger.info(
        f"  Distribution: {dataset.metadata.noise_count} noise, "
        f"{dataset.metadata.weak_signal_count} weak_signal, "
        f"{dataset.metadata.signal_count} signal"
    )


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Generate validation dataset for message scoring")
    parser.add_argument(
        "--api",
        choices=["anthropic", "openai"],
        default="anthropic",
        help="API provider to use (default: anthropic)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        help="Random seed for reproducibility",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/tests/fixtures/scoring_validation.json"),
        help="Output file path",
    )

    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("Validation Dataset Generator")
    logger.info("=" * 80)
    logger.info(f"API Provider: {args.api}")
    logger.info(f"Random Seed: {args.seed or 'None (non-deterministic)'}")
    logger.info(f"Output Path: {args.output}")
    logger.info("=" * 80)

    try:
        generator = DatasetGenerator(api_provider=args.api, seed=args.seed)
        dataset = generator.generate_dataset()
        save_dataset(dataset, args.output)

        logger.info("=" * 80)
        logger.info("✓ Dataset generation complete!")
        logger.info("=" * 80)
        logger.info(f"Next steps:")
        logger.info(f"1. Review dataset: uv run python backend/scripts/review_validation_dataset.py")
        logger.info(f"2. Run validation: pytest backend/tests/test_scoring_validation.py")

    except KeyboardInterrupt:
        logger.warning("\n⚠ Generation interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"✗ Generation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
