"""Interactive review tool for validation dataset.

This script provides a visual interface to review and correct generated messages.
Allows accepting, rejecting, or modifying labels for quality assurance.

Usage:
    uv run python backend/scripts/review_validation_dataset.py
    uv run python backend/scripts/review_validation_dataset.py --sample 50
    uv run python backend/scripts/review_validation_dataset.py --filter noise
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
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
    reviewed: bool = False
    reviewer_notes: str | None = None


class ReviewSession:
    """Interactive review session for dataset validation."""

    def __init__(self, dataset_path: Path) -> None:
        """Initialize review session.

        Args:
            dataset_path: Path to validation dataset JSON
        """
        self.dataset_path = dataset_path
        self.messages: list[GeneratedMessage] = []
        self.current_index = 0
        self.changes_made = 0
        self.load_dataset()

    def load_dataset(self) -> None:
        """Load dataset from JSON file."""
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")

        with self.dataset_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        self.messages = [GeneratedMessage(**msg) for msg in data["messages"]]
        logger.info(f"Loaded {len(self.messages)} messages from {self.dataset_path}")

    def save_dataset(self) -> None:
        """Save reviewed dataset back to JSON file."""
        with self.dataset_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        data["messages"] = [msg.model_dump() for msg in self.messages]

        reviewed_count = sum(1 for m in self.messages if m.reviewed)
        data["metadata"]["reviewed_count"] = reviewed_count
        data["metadata"]["review_progress"] = f"{reviewed_count}/{len(self.messages)}"

        backup_path = self.dataset_path.with_suffix(".json.backup")
        self.dataset_path.rename(backup_path)

        with self.dataset_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"✓ Saved changes to {self.dataset_path}")
        logger.info(f"  Backup created: {backup_path}")

    def display_message(self, msg: GeneratedMessage, index: int) -> None:
        """Display message in formatted view.

        Args:
            msg: Message to display
            index: Current message index
        """
        print("\n" + "=" * 100)
        print(f"Message {index + 1}/{len(self.messages)} | ID: {msg.id} | Language: {msg.language.upper()}")
        print("=" * 100)
        print(f"\n📝 TEXT:\n{msg.text}\n")
        print(f"🏷️  LABEL: {msg.label.upper()} ({msg.pattern_type})")
        print(f"💭 RATIONALE: {msg.rationale}")
        if msg.reviewed:
            print(f"✓ REVIEWED: {msg.reviewer_notes or 'No notes'}")
        print("\n" + "-" * 100)

    def review_message(self, msg: GeneratedMessage) -> None:
        """Interactive review for single message.

        Args:
            msg: Message to review
        """
        while True:
            print("\nActions:")
            print("  [a] Accept - Label is correct")
            print("  [n] Change to NOISE")
            print("  [w] Change to WEAK_SIGNAL")
            print("  [s] Change to SIGNAL")
            print("  [c] Add comment/note")
            print("  [j] Jump to message #")
            print("  [q] Save and quit")
            print("  [x] Quit without saving")

            choice = input("\nYour choice: ").strip().lower()

            if choice == "a":
                msg.reviewed = True
                msg.reviewer_notes = "Accepted"
                print("✓ Accepted")
                return

            elif choice == "n":
                old_label = msg.label
                msg.label = "noise"
                msg.reviewed = True
                msg.reviewer_notes = f"Changed from {old_label} to noise"
                self.changes_made += 1
                print(f"✓ Changed to NOISE (was {old_label.upper()})")
                return

            elif choice == "w":
                old_label = msg.label
                msg.label = "weak_signal"
                msg.reviewed = True
                msg.reviewer_notes = f"Changed from {old_label} to weak_signal"
                self.changes_made += 1
                print(f"✓ Changed to WEAK_SIGNAL (was {old_label.upper()})")
                return

            elif choice == "s":
                old_label = msg.label
                msg.label = "signal"
                msg.reviewed = True
                msg.reviewer_notes = f"Changed from {old_label} to signal"
                self.changes_made += 1
                print(f"✓ Changed to SIGNAL (was {old_label.upper()})")
                return

            elif choice == "c":
                note = input("Enter your note: ").strip()
                msg.reviewer_notes = note
                msg.reviewed = True
                print(f"✓ Note added: {note}")
                return

            elif choice == "j":
                try:
                    jump_to = int(input(f"Jump to message (1-{len(self.messages)}): ").strip())
                    if 1 <= jump_to <= len(self.messages):
                        self.current_index = jump_to - 1
                        return
                    else:
                        print(f"❌ Invalid message number. Must be 1-{len(self.messages)}")
                except ValueError:
                    print("❌ Invalid input. Enter a number.")

            elif choice == "q":
                self.save_dataset()
                print(f"\n✓ Progress saved! Changes made: {self.changes_made}")
                sys.exit(0)

            elif choice == "x":
                confirm = input("Quit without saving? (yes/no): ").strip().lower()
                if confirm == "yes":
                    print("✗ Exiting without saving")
                    sys.exit(0)

            else:
                print("❌ Invalid choice. Try again.")

    def start_review(
        self,
        sample_size: int | None = None,
        filter_label: MessageLabel | None = None,
        start_from: int = 0,
    ) -> None:
        """Start interactive review session.

        Args:
            sample_size: Review only N messages (random sample)
            filter_label: Review only messages with specific label
            start_from: Start from specific message index
        """
        messages_to_review = self.messages

        if filter_label:
            messages_to_review = [m for m in messages_to_review if m.label == filter_label]
            logger.info(f"Filtered to {len(messages_to_review)} {filter_label} messages")

        if sample_size and sample_size < len(messages_to_review):
            import random

            messages_to_review = random.sample(messages_to_review, sample_size)
            logger.info(f"Sampled {sample_size} messages for review")

        if start_from > 0:
            self.current_index = start_from

        logger.info(f"Starting review from message {self.current_index + 1}")

        try:
            while self.current_index < len(messages_to_review):
                msg = messages_to_review[self.current_index]
                self.display_message(msg, self.current_index)
                self.review_message(msg)
                self.current_index += 1

            print("\n" + "=" * 100)
            print("🎉 Review complete!")
            print("=" * 100)
            print(f"Total reviewed: {sum(1 for m in self.messages if m.reviewed)}/{len(self.messages)}")
            print(f"Changes made: {self.changes_made}")

            self.save_dataset()

        except KeyboardInterrupt:
            print("\n\n⚠️  Review interrupted!")
            save = input("Save progress? (yes/no): ").strip().lower()
            if save == "yes":
                self.save_dataset()
                print("✓ Progress saved")
            else:
                print("✗ Exiting without saving")
            sys.exit(0)


def generate_statistics(dataset_path: Path) -> None:
    """Generate statistics report for dataset.

    Args:
        dataset_path: Path to validation dataset
    """
    with dataset_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    messages = data["messages"]
    metadata = data["metadata"]

    print("\n" + "=" * 100)
    print("DATASET STATISTICS")
    print("=" * 100)

    print(f"\nGeneral:")
    print(f"  Total messages: {metadata['total']}")
    print(f"  Generated at: {metadata['generated_at']}")
    print(f"  Generator: {metadata['generator']}")
    print(f"  Generation time: {metadata['generation_time_seconds']}s")

    print(f"\nDistribution:")
    print(f"  Noise: {metadata['noise_count']}")
    print(f"  Weak Signal: {metadata['weak_signal_count']}")
    print(f"  Signal: {metadata['signal_count']}")

    print(f"\nLanguages:")
    for lang, count in metadata["languages"].items():
        print(f"  {lang.upper()}: {count}")

    reviewed_count = sum(1 for m in messages if m.get("reviewed", False))
    print(f"\nReview Progress:")
    print(f"  Reviewed: {reviewed_count}/{len(messages)} ({reviewed_count / len(messages) * 100:.1f}%)")

    pattern_counts = metadata.get("pattern_types", {})
    if pattern_counts:
        print(f"\nTop 10 Pattern Types:")
        sorted_patterns = sorted(pattern_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        for pattern, count in sorted_patterns:
            print(f"  {pattern}: {count}")

    print("\n" + "=" * 100)


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Review validation dataset interactively")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=Path("backend/tests/fixtures/scoring_validation.json"),
        help="Path to validation dataset",
    )
    parser.add_argument(
        "--sample",
        type=int,
        help="Review random sample of N messages",
    )
    parser.add_argument(
        "--filter",
        choices=["noise", "weak_signal", "signal"],
        help="Review only messages with specific label",
    )
    parser.add_argument(
        "--start-from",
        type=int,
        default=0,
        help="Start review from message index",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show statistics only (no review)",
    )

    args = parser.parse_args()

    if args.stats:
        generate_statistics(args.dataset)
        return

    logger.info("=" * 80)
    logger.info("Validation Dataset Review Tool")
    logger.info("=" * 80)

    try:
        session = ReviewSession(args.dataset)
        session.start_review(
            sample_size=args.sample,
            filter_label=args.filter,  # type: ignore[arg-type]
            start_from=args.start_from,
        )
    except FileNotFoundError as e:
        logger.error(f"✗ {e}")
        logger.error("Generate dataset first: uv run python backend/scripts/generate_validation_dataset.py")
        sys.exit(1)
    except Exception as e:
        logger.error(f"✗ Review failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
