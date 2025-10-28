"""Example script demonstrating how to use ScoringValidator.

This script shows how to:
1. Load a validation dataset
2. Run validation with ImportanceScorer
3. Generate a comprehensive validation report
4. Analyze false positives and false negatives

Usage:
    uv run python backend/scripts/validate_scoring.py --dataset path/to/validation.json
"""

import argparse
import json
import sys
from pathlib import Path

from app.services.importance_scorer import ImportanceScorer
from app.services.scoring_validator import ScoringValidator


def print_report(report):
    """Print validation report in human-readable format."""
    print("\n" + "=" * 80)
    print("VALIDATION REPORT")
    print("=" * 80)

    print(f"\nOverall Accuracy: {report.overall_accuracy:.1%}")
    print(f"Total Samples: {report.total_samples}")

    print("\n📊 Dataset Distribution:")
    for category, count in report.dataset_distribution.items():
        percentage = (count / report.total_samples) * 100
        print(f"  {category:15} {count:4} samples ({percentage:.1f}%)")

    print("\n📈 Per-Category Metrics:")
    print(f"{'Category':15} {'Precision':>10} {'Recall':>10} {'F1-Score':>10} {'Support':>10}")
    print("-" * 60)
    for metric in report.category_metrics:
        print(
            f"{metric.category:15} {metric.precision:>10.3f} {metric.recall:>10.3f} "
            f"{metric.f1_score:>10.3f} {metric.support:>10}"
        )

    print("\n🔀 Confusion Matrix:")
    print(f"{'Actual \\ Predicted':20}", end="")
    for cat in report.confusion_matrix.categories:
        print(f"{cat:>15}", end="")
    print()
    print("-" * 70)
    for actual in report.confusion_matrix.categories:
        print(f"{actual:20}", end="")
        for predicted in report.confusion_matrix.categories:
            count = report.confusion_matrix.matrix[actual][predicted]
            print(f"{count:>15}", end="")
        print()

    if report.false_positives:
        print(f"\n⚠️ False Positives ({len(report.false_positives)}):")
        for fp in report.false_positives[:5]:
            print(f"\n  Content: {fp.content}")
            print(f"  Predicted: {fp.predicted} | Actual: {fp.ground_truth}")
            print(f"  Score: {fp.importance_score:.2f} | Reason: {fp.reason}")

    if report.false_negatives:
        print(f"\n⚠️ False Negatives ({len(report.false_negatives)}):")
        for fn in report.false_negatives[:5]:
            print(f"\n  Content: {fn.content}")
            print(f"  Predicted: {fn.predicted} | Actual: {fn.ground_truth}")
            print(f"  Score: {fn.importance_score:.2f} | Reason: {fn.reason}")

    print("\n" + "=" * 80 + "\n")


def create_sample_dataset(output_path: Path) -> None:
    """Create a sample validation dataset for testing."""
    sample_data = [
        {"content": "lol", "ground_truth": "noise", "author_id": 1, "message_id": 1},
        {"content": "+1", "ground_truth": "noise", "author_id": 1, "message_id": 2},
        {"content": "ok thanks", "ground_truth": "noise", "author_id": 1, "message_id": 3},
        {"content": "yeah", "ground_truth": "noise", "author_id": 1, "message_id": 4},
        {
            "content": "This is a medium length message for testing purposes",
            "ground_truth": "weak_signal",
            "author_id": 1,
            "message_id": 5,
        },
        {
            "content": "I think we should consider this approach",
            "ground_truth": "weak_signal",
            "author_id": 1,
            "message_id": 6,
        },
        {
            "content": "How can I fix this critical bug in production?",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 7,
        },
        {
            "content": "I've been investigating the database performance issue and found that our queries are not optimized. Here's what I discovered: the main bottleneck is in the user lookup query.",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 8,
        },
        {
            "content": "What do you think about implementing feature X?",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 9,
        },
        {
            "content": "We need to discuss the architecture for the new module",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 10,
        },
    ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(sample_data, f, indent=2)

    print(f"✅ Created sample validation dataset: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Validate ImportanceScorer performance")
    parser.add_argument(
        "--dataset",
        type=Path,
        help="Path to validation dataset JSON file",
    )
    parser.add_argument(
        "--create-sample",
        action="store_true",
        help="Create sample validation dataset",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/tests/fixtures/scoring_validation_sample.json"),
        help="Output path for sample dataset",
    )

    args = parser.parse_args()

    if args.create_sample:
        create_sample_dataset(args.output)
        return

    if not args.dataset:
        print("Error: Please provide --dataset path or use --create-sample")
        parser.print_help()
        sys.exit(1)

    print(f"Loading validation dataset from: {args.dataset}")

    scorer = ImportanceScorer()
    validator = ScoringValidator(scorer)

    try:
        validator.load_validation_dataset(args.dataset)
        print(f"✅ Loaded {len(validator.validation_messages)} validation messages")

        print("\n🔄 Running validation...")
        report = validator.run_validation()

        print_report(report)

        print("💡 Next Steps:")
        print("  1. Review false positives/negatives to identify scoring issues")
        print("  2. Adjust scoring heuristics in ImportanceScorer if needed")
        print("  3. Re-run validation to measure improvement")
        print("  4. Consider expanding validation dataset for better coverage")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
