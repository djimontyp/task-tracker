"""Quick test of dataset generation with 10 messages.

This script generates a small sample to verify the generation logic works
before running the full 1000-message generation.

Usage:
    uv run python backend/scripts/test_generation_sample.py
"""

import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.generate_validation_dataset import DatasetGenerator

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    """Generate small sample for testing."""
    logger.info("=" * 80)
    logger.info("Testing Dataset Generation (10 messages sample)")
    logger.info("=" * 80)

    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        logger.error("❌ No API key found!")
        logger.error("Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable")
        sys.exit(1)

    try:
        api_provider = "anthropic" if os.getenv("ANTHROPIC_API_KEY") else "openai"
        logger.info(f"Using API: {api_provider}")

        generator = DatasetGenerator(api_provider=api_provider, seed=42)

        logger.info("\nGenerating sample batch: 5 noise messages in Ukrainian...")
        messages = generator.generate_batch(
            label="noise",
            language="uk",
            count=5,
            pattern_types=["emoji_spam", "short_reactions", "greetings_only"],
        )

        logger.info("\n" + "=" * 80)
        logger.info("Generated Messages:")
        logger.info("=" * 80)

        for msg in messages:
            print(f"\n📝 Message: {msg.text}")
            print(f"   Label: {msg.label}")
            print(f"   Pattern: {msg.pattern_type}")
            print(f"   Rationale: {msg.rationale}")
            print("-" * 80)

        logger.info("\n✅ Sample generation successful!")
        logger.info(f"   Generated {len(messages)} messages")
        logger.info("\nTo generate full dataset:")
        logger.info("   uv run python backend/scripts/generate_validation_dataset.py")

    except Exception as e:
        logger.error(f"❌ Sample generation failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
