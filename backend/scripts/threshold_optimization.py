"""Threshold optimization script for ImportanceScorer.

This script:
1. Loads validation dataset (supports multiple formats)
2. Runs baseline validation with current thresholds
3. Performs grid search to find optimal thresholds
4. Generates comprehensive report with before/after metrics
5. Saves results for analysis

Usage:
    uv run python backend/scripts/threshold_optimization.py
"""

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.config.ai_config import ai_config
from app.services.importance_scorer import ImportanceScorer


@dataclass
class ThresholdConfig:
    """Threshold configuration for classification."""

    noise_threshold: float  # Below this = noise
    signal_threshold: float  # Above this = signal


@dataclass
class ValidationMetrics:
    """Validation metrics for a specific threshold configuration."""

    config: ThresholdConfig
    overall_accuracy: float
    precision_noise: float
    recall_noise: float
    f1_noise: float
    precision_weak: float
    recall_weak: float
    f1_weak: float
    precision_signal: float
    recall_signal: float
    f1_signal: float
    f1_macro: float  # Average F1 across all categories


@dataclass
class ValidationMessage:
    """Single validation message with ground truth."""

    content: str
    ground_truth: str  # noise, weak_signal, signal
    language: str
    message_id: str


class ThresholdOptimizer:
    """Optimizer for finding best classification thresholds via grid search."""

    def __init__(self):
        """Initialize optimizer with current scorer."""
        self.scorer = ImportanceScorer()
        self.messages: list[ValidationMessage] = []
        self.scores: list[float] = []

    def load_dataset(self, path: Path) -> None:
        """Load validation dataset from JSON.

        Supports format:
        {
            "messages": [
                {"text": "...", "label": "noise|weak_signal|signal", "language": "uk|en", "id": "..."},
                ...
            ]
        }
        """
        with open(path) as f:
            data = json.load(f)

        if not isinstance(data, dict) or "messages" not in data:
            raise ValueError("Expected JSON format: {'messages': [...]}")

        messages = []
        for msg in data["messages"]:
            # Map label to ground_truth format
            label = msg["label"]
            if label not in ["noise", "weak_signal", "signal"]:
                raise ValueError(f"Invalid label: {label}")

            messages.append(
                ValidationMessage(
                    content=msg["text"],
                    ground_truth=label,
                    language=msg.get("language", "unknown"),
                    message_id=msg.get("id", "unknown"),
                )
            )

        self.messages = messages
        print(f"✅ Loaded {len(messages)} validation messages")

    def score_all_messages(self) -> None:
        """Score all messages using ImportanceScorer (content-only)."""
        print("\n🔄 Scoring all messages...")
        self.scores = []

        for msg in self.messages:
            # Use only content scoring (as in validation script)
            content_score = self.scorer._score_content(msg.content)
            self.scores.append(content_score)

        print(f"✅ Scored {len(self.scores)} messages")

    def classify_with_thresholds(self, config: ThresholdConfig) -> list[str]:
        """Classify all scored messages with given thresholds.

        Args:
            config: Threshold configuration

        Returns:
            List of predicted categories
        """
        predictions = []
        for score in self.scores:
            if score < config.noise_threshold:
                predictions.append("noise")
            elif score > config.signal_threshold:
                predictions.append("signal")
            else:
                predictions.append("weak_signal")
        return predictions

    def calculate_metrics(self, predictions: list[str], labels: list[str]) -> dict[str, Any]:
        """Calculate precision, recall, F1 for all categories.

        Returns:
            Dictionary with per-category metrics
        """
        categories = ["noise", "weak_signal", "signal"]
        metrics = {}

        for category in categories:
            tp = sum(1 for pred, label in zip(predictions, labels) if pred == category and label == category)
            fp = sum(1 for pred, label in zip(predictions, labels) if pred == category and label != category)
            fn = sum(1 for pred, label in zip(predictions, labels) if pred != category and label == category)

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

            metrics[f"{category}_precision"] = precision
            metrics[f"{category}_recall"] = recall
            metrics[f"{category}_f1"] = f1

        # Calculate macro F1 (average across categories)
        f1_scores = [metrics[f"{cat}_f1"] for cat in categories]
        metrics["f1_macro"] = sum(f1_scores) / len(f1_scores)

        # Overall accuracy
        correct = sum(1 for pred, label in zip(predictions, labels) if pred == label)
        metrics["accuracy"] = correct / len(predictions) if predictions else 0.0

        return metrics

    def validate_config(self, config: ThresholdConfig) -> ValidationMetrics:
        """Validate a specific threshold configuration.

        Args:
            config: Threshold configuration to test

        Returns:
            ValidationMetrics with all performance metrics
        """
        predictions = self.classify_with_thresholds(config)
        labels = [msg.ground_truth for msg in self.messages]
        metrics = self.calculate_metrics(predictions, labels)

        return ValidationMetrics(
            config=config,
            overall_accuracy=metrics["accuracy"],
            precision_noise=metrics["noise_precision"],
            recall_noise=metrics["noise_recall"],
            f1_noise=metrics["noise_f1"],
            precision_weak=metrics["weak_signal_precision"],
            recall_weak=metrics["weak_signal_recall"],
            f1_weak=metrics["weak_signal_f1"],
            precision_signal=metrics["signal_precision"],
            recall_signal=metrics["signal_recall"],
            f1_signal=metrics["signal_f1"],
            f1_macro=metrics["f1_macro"],
        )

    def grid_search(
        self,
        noise_range: list[float],
        signal_range: list[float],
    ) -> list[ValidationMetrics]:
        """Perform grid search over threshold combinations.

        Args:
            noise_range: List of noise threshold values to test
            signal_range: List of signal threshold values to test

        Returns:
            List of ValidationMetrics for all combinations, sorted by F1 macro
        """
        print(
            f"\n🔍 Grid search: {len(noise_range)} × {len(signal_range)} = {len(noise_range) * len(signal_range)} configs"
        )

        results = []
        total = len(noise_range) * len(signal_range)
        current = 0

        for noise_thresh in noise_range:
            for signal_thresh in signal_range:
                current += 1
                # Skip invalid combinations (signal threshold must be > noise threshold)
                if signal_thresh <= noise_thresh:
                    continue

                config = ThresholdConfig(
                    noise_threshold=noise_thresh,
                    signal_threshold=signal_thresh,
                )
                metrics = self.validate_config(config)
                results.append(metrics)

                # Progress indicator
                if current % 5 == 0:
                    print(f"  Progress: {current}/{total} configurations tested...")

        # Sort by F1 macro (descending)
        results.sort(key=lambda x: x.f1_macro, reverse=True)
        print(f"✅ Grid search complete: {len(results)} valid configurations")

        return results


def print_metrics_table(metrics: ValidationMetrics, title: str) -> None:
    """Print metrics in formatted table."""
    print(f"\n{title}")
    print("=" * 80)
    print(
        f"Thresholds: noise < {metrics.config.noise_threshold:.2f} | "
        f"{metrics.config.noise_threshold:.2f} ≤ weak < {metrics.config.signal_threshold:.2f} | "
        f"signal ≥ {metrics.config.signal_threshold:.2f}"
    )
    print(f"Overall Accuracy: {metrics.overall_accuracy:.3f} ({metrics.overall_accuracy * 100:.1f}%)")
    print(f"F1 Macro (avg): {metrics.f1_macro:.3f} ({metrics.f1_macro * 100:.1f}%)")
    print()
    print(f"{'Category':15} {'Precision':>12} {'Recall':>12} {'F1-Score':>12}")
    print("-" * 55)
    print(f"{'noise':15} {metrics.precision_noise:>12.3f} {metrics.recall_noise:>12.3f} {metrics.f1_noise:>12.3f}")
    print(f"{'weak_signal':15} {metrics.precision_weak:>12.3f} {metrics.recall_weak:>12.3f} {metrics.f1_weak:>12.3f}")
    print(f"{'signal':15} {metrics.precision_signal:>12.3f} {metrics.recall_signal:>12.3f} {metrics.f1_signal:>12.3f}")
    print("=" * 80)


def main():
    """Run threshold optimization workflow."""
    print("🎯 Message Scoring Threshold Optimization")
    print("=" * 80)

    # Initialize optimizer
    optimizer = ThresholdOptimizer()

    # Load dataset
    dataset_path = Path("backend/tests/fixtures/scoring_validation.json")
    if not dataset_path.exists():
        dataset_path = Path("tests/fixtures/scoring_validation.json")

    optimizer.load_dataset(dataset_path)

    # Score all messages once
    optimizer.score_all_messages()

    # Step 1: Baseline validation with current thresholds
    print("\n" + "=" * 80)
    print("STEP 1: Baseline Validation (Current Thresholds)")
    print("=" * 80)

    current_config = ThresholdConfig(
        noise_threshold=ai_config.message_scoring.noise_threshold,
        signal_threshold=ai_config.message_scoring.signal_threshold,
    )
    baseline_metrics = optimizer.validate_config(current_config)
    print_metrics_table(baseline_metrics, "📊 BASELINE METRICS")

    # Step 2: Grid search optimization
    print("\n" + "=" * 80)
    print("STEP 2: Grid Search Optimization")
    print("=" * 80)

    # Define search ranges
    noise_thresholds = [0.20, 0.25, 0.30, 0.35, 0.40]
    signal_thresholds = [0.60, 0.65, 0.70, 0.75, 0.80]

    results = optimizer.grid_search(noise_thresholds, signal_thresholds)

    # Step 3: Show top 5 configurations
    print("\n" + "=" * 80)
    print("STEP 3: Top 5 Configurations")
    print("=" * 80)

    for i, metrics in enumerate(results[:5], 1):
        print_metrics_table(metrics, f"🏆 Rank #{i}")

    # Step 4: Compare best vs baseline
    best_metrics = results[0]
    print("\n" + "=" * 80)
    print("STEP 4: Best vs Baseline Comparison")
    print("=" * 80)

    improvement_f1 = (best_metrics.f1_macro - baseline_metrics.f1_macro) * 100
    improvement_acc = (best_metrics.overall_accuracy - baseline_metrics.overall_accuracy) * 100

    print(f"\n📈 Performance Improvement:")
    print(f"  F1 Macro:   {baseline_metrics.f1_macro:.3f} → {best_metrics.f1_macro:.3f} ({improvement_f1:+.1f}%)")
    print(
        f"  Accuracy:   {baseline_metrics.overall_accuracy:.3f} → {best_metrics.overall_accuracy:.3f} ({improvement_acc:+.1f}%)"
    )
    print()
    print(f"🎯 Optimal Thresholds:")
    print(f"  noise_threshold:  {current_config.noise_threshold:.2f} → {best_metrics.config.noise_threshold:.2f}")
    print(f"  signal_threshold: {current_config.signal_threshold:.2f} → {best_metrics.config.signal_threshold:.2f}")

    # Step 5: Recommendation
    print("\n" + "=" * 80)
    print("STEP 5: Recommendation")
    print("=" * 80)

    if best_metrics.f1_macro >= 0.85:
        print("✅ SUCCESS: F1 macro ≥ 85% achieved!")
    else:
        print(f"⚠️  WARNING: F1 macro = {best_metrics.f1_macro:.1%} (target: ≥85%)")

    if improvement_f1 >= 2.0:
        print(f"✅ RECOMMEND UPDATE: F1 improvement = {improvement_f1:.1f}% (≥2% threshold)")
        print("\n📝 Update backend/app/config/ai_config.py:")
        print(f"    noise_threshold: float = Field(default={best_metrics.config.noise_threshold})")
        print(f"    signal_threshold: float = Field(default={best_metrics.config.signal_threshold})")
    else:
        print(f"ℹ️  NO UPDATE: F1 improvement = {improvement_f1:.1f}% (<2% threshold)")
        print("   Current thresholds are already well-optimized.")

    # Save results to JSON
    output_path = Path(".artifacts/threshold_optimization_results.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    results_data = {
        "baseline": {
            "noise_threshold": current_config.noise_threshold,
            "signal_threshold": current_config.signal_threshold,
            "accuracy": baseline_metrics.overall_accuracy,
            "f1_macro": baseline_metrics.f1_macro,
        },
        "optimal": {
            "noise_threshold": best_metrics.config.noise_threshold,
            "signal_threshold": best_metrics.config.signal_threshold,
            "accuracy": best_metrics.overall_accuracy,
            "f1_macro": best_metrics.f1_macro,
        },
        "improvement": {
            "f1_macro_delta": improvement_f1,
            "accuracy_delta": improvement_acc,
        },
        "top_5_configs": [
            {
                "rank": i,
                "noise_threshold": m.config.noise_threshold,
                "signal_threshold": m.config.signal_threshold,
                "accuracy": m.overall_accuracy,
                "f1_macro": m.f1_macro,
            }
            for i, m in enumerate(results[:5], 1)
        ],
    }

    with open(output_path, "w") as f:
        json.dump(results_data, f, indent=2)

    print(f"\n💾 Results saved to: {output_path}")
    print()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
