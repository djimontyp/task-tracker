"""Validation framework for importance scoring system.

This service validates ImportanceScorer against a labeled dataset by:
1. Loading validation messages with ground truth labels
2. Running scorer predictions on test data
3. Calculating precision, recall, F1-score per category
4. Generating confusion matrix
5. Analyzing false positives/negatives for improvement insights
"""

import json
import logging
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.services.importance_scorer import ImportanceScorer

logger = logging.getLogger(__name__)


@dataclass
class ValidationMessage:
    """Single validation message with ground truth label."""

    content: str
    ground_truth: str
    author_id: int = 1
    message_id: int | None = None


@dataclass
class CategoryMetrics:
    """Precision, recall, F1 metrics for a single category."""

    category: str
    precision: float
    recall: float
    f1_score: float
    support: int


@dataclass
class ConfusionMatrix:
    """Confusion matrix for multi-class classification."""

    categories: list[str]
    matrix: dict[str, dict[str, int]]
    total_predictions: int


@dataclass
class FalsePositiveAnalysis:
    """Analysis of false positive prediction."""

    content: str
    predicted: str
    ground_truth: str
    importance_score: float
    content_score: float
    reason: str


@dataclass
class FalseNegativeAnalysis:
    """Analysis of false negative prediction."""

    content: str
    predicted: str
    ground_truth: str
    importance_score: float
    content_score: float
    reason: str


@dataclass
class ValidationReport:
    """Complete validation report with all metrics."""

    overall_accuracy: float
    category_metrics: list[CategoryMetrics]
    confusion_matrix: ConfusionMatrix
    false_positives: list[FalsePositiveAnalysis]
    false_negatives: list[FalseNegativeAnalysis]
    total_samples: int
    dataset_distribution: dict[str, int]


class ScoringValidator:
    """Validator for ImportanceScorer with comprehensive metrics and analysis.

    Validates scorer performance against labeled dataset:
    - Loads JSON validation dataset
    - Runs predictions using ImportanceScorer
    - Calculates precision/recall/F1 per category
    - Generates confusion matrix
    - Analyzes prediction errors (FP/FN)
    """

    def __init__(self, importance_scorer: ImportanceScorer) -> None:
        """Initialize validator with scorer instance.

        Args:
            importance_scorer: ImportanceScorer instance to validate
        """
        self.scorer = importance_scorer
        self.validation_messages: list[ValidationMessage] = []
        self.predictions: list[str] = []
        self.ground_truth_labels: list[str] = []
        self.scores: list[dict[str, Any]] = []
        self.categories = ["noise", "weak_signal", "signal"]

    def load_validation_dataset(self, path: str | Path) -> list[ValidationMessage]:
        """Load validation dataset from JSON file.

        Expected JSON format:
        [
            {
                "content": "message text",
                "ground_truth": "noise|weak_signal|signal",
                "author_id": 1,
                "message_id": 123
            },
            ...
        ]

        Args:
            path: Path to validation JSON file

        Returns:
            List of ValidationMessage objects

        Raises:
            FileNotFoundError: If dataset file doesn't exist
            ValueError: If JSON format is invalid or missing required fields
        """
        path = Path(path)

        if not path.exists():
            raise FileNotFoundError(f"Validation dataset not found: {path}")

        try:
            with open(path) as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format in {path}: {e}") from e

        if not isinstance(data, list):
            raise ValueError(f"Expected JSON array, got {type(data).__name__}")

        messages: list[ValidationMessage] = []
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                raise ValueError(f"Item {idx} is not a dict: {type(item).__name__}")

            if "content" not in item or "ground_truth" not in item:
                raise ValueError(f"Item {idx} missing required fields: content, ground_truth")

            if item["ground_truth"] not in self.categories:
                raise ValueError(
                    f"Item {idx} has invalid ground_truth '{item['ground_truth']}'. Expected one of: {self.categories}"
                )

            messages.append(
                ValidationMessage(
                    content=item["content"],
                    ground_truth=item["ground_truth"],
                    author_id=item.get("author_id", 1),
                    message_id=item.get("message_id"),
                )
            )

        self.validation_messages = messages
        logger.info(f"Loaded {len(messages)} validation messages from {path}")
        return messages

    def calculate_metrics(self, predictions: list[str], labels: list[str]) -> list[CategoryMetrics]:
        """Calculate precision, recall, F1-score for each category.

        Precision = TP / (TP + FP) - How many predicted positives are actually positive
        Recall = TP / (TP + FN) - How many actual positives were predicted
        F1 = 2 * (Precision * Recall) / (Precision + Recall) - Harmonic mean

        Args:
            predictions: List of predicted labels
            labels: List of ground truth labels

        Returns:
            List of CategoryMetrics for each category
        """
        if len(predictions) != len(labels):
            raise ValueError(f"Predictions ({len(predictions)}) and labels ({len(labels)}) length mismatch")

        metrics: list[CategoryMetrics] = []

        for category in self.categories:
            tp = sum(1 for pred, label in zip(predictions, labels) if pred == category and label == category)
            fp = sum(1 for pred, label in zip(predictions, labels) if pred == category and label != category)
            fn = sum(1 for pred, label in zip(predictions, labels) if pred != category and label == category)

            support = sum(1 for label in labels if label == category)

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

            metrics.append(
                CategoryMetrics(
                    category=category,
                    precision=round(precision, 3),
                    recall=round(recall, 3),
                    f1_score=round(f1_score, 3),
                    support=support,
                )
            )

        return metrics

    def generate_confusion_matrix(self) -> ConfusionMatrix:
        """Generate confusion matrix from predictions and ground truth.

        Matrix[actual][predicted] = count

        Returns:
            ConfusionMatrix with category-wise prediction counts

        Raises:
            ValueError: If predictions haven't been made yet
        """
        if not self.predictions or not self.ground_truth_labels:
            raise ValueError("No predictions available. Run validation first.")

        matrix: dict[str, dict[str, int]] = {
            cat: {pred_cat: 0 for pred_cat in self.categories} for cat in self.categories
        }

        for pred, label in zip(self.predictions, self.ground_truth_labels):
            matrix[label][pred] += 1

        return ConfusionMatrix(categories=self.categories, matrix=matrix, total_predictions=len(self.predictions))

    def analyze_false_positives(self) -> list[FalsePositiveAnalysis]:
        """Analyze false positive predictions (predicted higher than actual).

        False Positive = model predicted signal/weak_signal but was actually noise/weak_signal

        Returns:
            List of FalsePositiveAnalysis with error reasons
        """
        if not self.predictions or not self.validation_messages:
            raise ValueError("No predictions available. Run validation first.")

        false_positives: list[FalsePositiveAnalysis] = []
        category_order = {"noise": 0, "weak_signal": 1, "signal": 2}

        for msg, pred, label, score_data in zip(
            self.validation_messages, self.predictions, self.ground_truth_labels, self.scores
        ):
            if category_order[pred] > category_order[label]:
                reason = self._identify_fp_reason(msg.content, score_data)

                false_positives.append(
                    FalsePositiveAnalysis(
                        content=msg.content[:100],
                        predicted=pred,
                        ground_truth=label,
                        importance_score=float(score_data["importance_score"]),
                        content_score=float(score_data["noise_factors"]["content"]),
                        reason=reason,
                    )
                )

        return false_positives

    def analyze_false_negatives(self) -> list[FalseNegativeAnalysis]:
        """Analyze false negative predictions (predicted lower than actual).

        False Negative = model predicted noise/weak_signal but was actually weak_signal/signal

        Returns:
            List of FalseNegativeAnalysis with error reasons
        """
        if not self.predictions or not self.validation_messages:
            raise ValueError("No predictions available. Run validation first.")

        false_negatives: list[FalseNegativeAnalysis] = []
        category_order = {"noise": 0, "weak_signal": 1, "signal": 2}

        for msg, pred, label, score_data in zip(
            self.validation_messages, self.predictions, self.ground_truth_labels, self.scores
        ):
            if category_order[pred] < category_order[label]:
                reason = self._identify_fn_reason(msg.content, score_data)

                false_negatives.append(
                    FalseNegativeAnalysis(
                        content=msg.content[:100],
                        predicted=pred,
                        ground_truth=label,
                        importance_score=float(score_data["importance_score"]),
                        content_score=float(score_data["noise_factors"]["content"]),
                        reason=reason,
                    )
                )

        return false_negatives

    def run_validation(self) -> ValidationReport:
        """Run complete validation pipeline and generate report.

        Steps:
        1. Validate that dataset is loaded
        2. Run scorer predictions on all messages
        3. Calculate metrics (precision/recall/F1)
        4. Generate confusion matrix
        5. Analyze false positives/negatives

        Returns:
            ValidationReport with all metrics and analysis

        Raises:
            ValueError: If dataset not loaded or validation fails
        """
        if not self.validation_messages:
            raise ValueError("No validation dataset loaded. Call load_validation_dataset() first.")

        logger.info(f"Starting validation on {len(self.validation_messages)} messages...")

        self.predictions = []
        self.ground_truth_labels = []
        self.scores = []

        for msg in self.validation_messages:
            content_score = self.scorer._score_content(msg.content)

            score_data = {
                "importance_score": content_score,
                "classification": self._classify_score(content_score),
                "noise_factors": {
                    "content": content_score,
                    "author": 0.5,
                    "temporal": 0.5,
                    "topics": 0.5,
                },
            }

            self.predictions.append(str(score_data["classification"]))
            self.ground_truth_labels.append(msg.ground_truth)
            self.scores.append(score_data)

        category_metrics = self.calculate_metrics(self.predictions, self.ground_truth_labels)
        confusion_matrix = self.generate_confusion_matrix()
        false_positives = self.analyze_false_positives()
        false_negatives = self.analyze_false_negatives()

        correct_predictions = sum(1 for pred, label in zip(self.predictions, self.ground_truth_labels) if pred == label)
        overall_accuracy = correct_predictions / len(self.predictions) if self.predictions else 0.0

        dataset_distribution: dict[str, int] = defaultdict(int)
        for label in self.ground_truth_labels:
            dataset_distribution[label] += 1

        logger.info(f"Validation complete. Accuracy: {overall_accuracy:.3f}")

        return ValidationReport(
            overall_accuracy=round(overall_accuracy, 3),
            category_metrics=category_metrics,
            confusion_matrix=confusion_matrix,
            false_positives=false_positives,
            false_negatives=false_negatives,
            total_samples=len(self.validation_messages),
            dataset_distribution=dict(dataset_distribution),
        )

    def _classify_score(self, score: float) -> str:
        """Classify importance score into category.

        Args:
            score: Importance score (0.0-1.0)

        Returns:
            Category: noise/weak_signal/signal
        """
        if score < 0.3:
            return "noise"
        elif score > 0.7:
            return "signal"
        else:
            return "weak_signal"

    def _identify_fp_reason(self, content: str, score_data: dict[str, Any]) -> str:
        """Identify reason for false positive prediction.

        Args:
            content: Message content
            score_data: Scoring data with factors

        Returns:
            Human-readable reason string
        """
        content_score = float(score_data["noise_factors"]["content"])

        if content_score > 0.8:
            return "High content score due to length/keywords"
        elif len(content) > 100:
            return "Long message length boosted score"
        elif any(keyword in content.lower() for keyword in ["bug", "error", "issue", "problem"]):
            return "Signal keywords present but message is noise"
        else:
            return "Content scoring heuristics overestimated importance"

    def _identify_fn_reason(self, content: str, score_data: dict[str, Any]) -> str:
        """Identify reason for false negative prediction.

        Args:
            content: Message content
            score_data: Scoring data with factors

        Returns:
            Human-readable reason string
        """
        content_score = float(score_data["noise_factors"]["content"])

        if content_score < 0.3:
            return "Low content score due to short length"
        elif len(content) < 20:
            return "Short message length reduced score"
        elif not any(keyword in content.lower() for keyword in ["bug", "error", "issue", "how", "why"]):
            return "Missing signal keywords despite being important"
        else:
            return "Content scoring heuristics underestimated importance"
