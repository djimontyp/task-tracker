"""Tests for ScoringValidator service."""

import json
import tempfile
from pathlib import Path

import pytest
from app.services.importance_scorer import ImportanceScorer
from app.services.scoring_validator import (
    CategoryMetrics,
    ConfusionMatrix,
    FalseNegativeAnalysis,
    FalsePositiveAnalysis,
    ScoringValidator,
    ValidationMessage,
    ValidationReport,
)


@pytest.fixture
def importance_scorer() -> ImportanceScorer:
    """Create ImportanceScorer instance for testing."""
    return ImportanceScorer()


@pytest.fixture
def validator(importance_scorer: ImportanceScorer) -> ScoringValidator:
    """Create ScoringValidator instance for testing."""
    return ScoringValidator(importance_scorer)


@pytest.fixture
def sample_validation_data() -> list[dict[str, str | int]]:
    """Sample validation dataset in JSON format."""
    return [
        {"content": "lol", "ground_truth": "noise", "author_id": 1, "message_id": 1},
        {"content": "+1", "ground_truth": "noise", "author_id": 1, "message_id": 2},
        {
            "content": "This is a medium length message for testing",
            "ground_truth": "weak_signal",
            "author_id": 1,
            "message_id": 3,
        },
        {
            "content": "How can I fix this critical bug in production?",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 4,
        },
        {
            "content": "I've been investigating the database performance issue and found that our queries are not optimized. Here's what I discovered...",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 5,
        },
        {"content": "ok thanks", "ground_truth": "noise", "author_id": 1, "message_id": 6},
        {
            "content": "What do you think about implementing feature X?",
            "ground_truth": "signal",
            "author_id": 1,
            "message_id": 7,
        },
        {"content": "yeah", "ground_truth": "noise", "author_id": 1, "message_id": 8},
    ]


@pytest.fixture
def temp_validation_file(sample_validation_data: list[dict[str, str | int]]) -> Path:
    """Create temporary validation JSON file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(sample_validation_data, f)
        return Path(f.name)


class TestScoringValidatorInit:
    """Test ScoringValidator initialization."""

    def test_init_with_scorer(self, importance_scorer: ImportanceScorer) -> None:
        """Test validator initializes correctly with scorer."""
        validator = ScoringValidator(importance_scorer)

        assert validator.scorer is importance_scorer
        assert validator.validation_messages == []
        assert validator.predictions == []
        assert validator.ground_truth_labels == []
        assert validator.scores == []
        assert validator.categories == ["noise", "weak_signal", "signal"]


class TestLoadValidationDataset:
    """Test loading validation dataset."""

    def test_load_valid_dataset(self, validator: ScoringValidator, temp_validation_file: Path) -> None:
        """Test loading valid validation dataset."""
        messages = validator.load_validation_dataset(temp_validation_file)

        assert len(messages) == 8
        assert all(isinstance(msg, ValidationMessage) for msg in messages)
        assert messages[0].content == "lol"
        assert messages[0].ground_truth == "noise"
        assert messages[3].content == "How can I fix this critical bug in production?"
        assert messages[3].ground_truth == "signal"

    def test_load_dataset_file_not_found(self, validator: ScoringValidator) -> None:
        """Test error when dataset file doesn't exist."""
        with pytest.raises(FileNotFoundError, match="Validation dataset not found"):
            validator.load_validation_dataset("/nonexistent/path.json")

    def test_load_invalid_json(self, validator: ScoringValidator) -> None:
        """Test error when JSON is malformed."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write("invalid json {")
            temp_path = Path(f.name)

        with pytest.raises(ValueError, match="Invalid JSON format"):
            validator.load_validation_dataset(temp_path)

    def test_load_non_array_json(self, validator: ScoringValidator) -> None:
        """Test error when JSON is not an array."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump({"not": "array"}, f)
            temp_path = Path(f.name)

        with pytest.raises(ValueError, match="Expected JSON array"):
            validator.load_validation_dataset(temp_path)

    def test_load_missing_required_fields(self, validator: ScoringValidator) -> None:
        """Test error when items missing required fields."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([{"content": "test"}], f)  # Missing ground_truth
            temp_path = Path(f.name)

        with pytest.raises(ValueError, match="missing required fields"):
            validator.load_validation_dataset(temp_path)

    def test_load_invalid_ground_truth(self, validator: ScoringValidator) -> None:
        """Test error when ground_truth has invalid value."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([{"content": "test", "ground_truth": "invalid_category"}], f)
            temp_path = Path(f.name)

        with pytest.raises(ValueError, match="invalid ground_truth"):
            validator.load_validation_dataset(temp_path)


class TestCalculateMetrics:
    """Test metrics calculation."""

    def test_calculate_perfect_metrics(self, validator: ScoringValidator) -> None:
        """Test metrics with perfect predictions."""
        predictions = ["noise", "noise", "weak_signal", "signal", "signal"]
        labels = ["noise", "noise", "weak_signal", "signal", "signal"]

        metrics = validator.calculate_metrics(predictions, labels)

        assert len(metrics) == 3
        assert all(isinstance(m, CategoryMetrics) for m in metrics)

        noise_metrics = next(m for m in metrics if m.category == "noise")
        assert noise_metrics.precision == 1.0
        assert noise_metrics.recall == 1.0
        assert noise_metrics.f1_score == 1.0
        assert noise_metrics.support == 2

    def test_calculate_mixed_metrics(self, validator: ScoringValidator) -> None:
        """Test metrics with some errors."""
        predictions = ["noise", "weak_signal", "signal", "noise"]
        labels = ["noise", "noise", "signal", "signal"]

        metrics = validator.calculate_metrics(predictions, labels)

        noise_metrics = next(m for m in metrics if m.category == "noise")
        assert noise_metrics.precision == 0.5
        assert noise_metrics.recall == 0.5
        assert noise_metrics.support == 2

        signal_metrics = next(m for m in metrics if m.category == "signal")
        assert signal_metrics.precision == 1.0
        assert signal_metrics.recall == 0.5
        assert signal_metrics.support == 2

    def test_calculate_zero_division_handling(self, validator: ScoringValidator) -> None:
        """Test zero division handling when no predictions for category."""
        predictions = ["noise", "noise", "noise"]
        labels = ["signal", "signal", "signal"]

        metrics = validator.calculate_metrics(predictions, labels)

        signal_metrics = next(m for m in metrics if m.category == "signal")
        assert signal_metrics.precision == 0.0
        assert signal_metrics.recall == 0.0
        assert signal_metrics.f1_score == 0.0

    def test_calculate_length_mismatch(self, validator: ScoringValidator) -> None:
        """Test error when predictions and labels length mismatch."""
        predictions = ["noise", "signal"]
        labels = ["noise"]

        with pytest.raises(ValueError, match="length mismatch"):
            validator.calculate_metrics(predictions, labels)


class TestGenerateConfusionMatrix:
    """Test confusion matrix generation."""

    def test_generate_confusion_matrix(self, validator: ScoringValidator) -> None:
        """Test generating confusion matrix from predictions."""
        validator.predictions = ["noise", "noise", "weak_signal", "signal", "signal", "noise"]
        validator.ground_truth_labels = ["noise", "weak_signal", "weak_signal", "signal", "noise", "noise"]

        matrix = validator.generate_confusion_matrix()

        assert isinstance(matrix, ConfusionMatrix)
        assert matrix.categories == ["noise", "weak_signal", "signal"]
        assert matrix.total_predictions == 6

        assert matrix.matrix["noise"]["noise"] == 2
        assert matrix.matrix["weak_signal"]["noise"] == 1
        assert matrix.matrix["weak_signal"]["weak_signal"] == 1
        assert matrix.matrix["signal"]["signal"] == 1
        assert matrix.matrix["noise"]["signal"] == 1

    def test_generate_without_predictions(self, validator: ScoringValidator) -> None:
        """Test error when generating matrix without predictions."""
        with pytest.raises(ValueError, match="No predictions available"):
            validator.generate_confusion_matrix()


class TestAnalyzeFalsePositives:
    """Test false positive analysis."""

    def test_analyze_false_positives(self, validator: ScoringValidator) -> None:
        """Test identifying false positive predictions."""
        validator.validation_messages = [
            ValidationMessage(content="lol", ground_truth="noise"),
            ValidationMessage(content="This is important", ground_truth="noise"),
        ]
        validator.predictions = ["noise", "signal"]
        validator.ground_truth_labels = ["noise", "noise"]
        validator.scores = [
            {"importance_score": 0.1, "noise_factors": {"content": 0.1}},
            {"importance_score": 0.9, "noise_factors": {"content": 0.9}},
        ]

        fps = validator.analyze_false_positives()

        assert len(fps) == 1
        assert isinstance(fps[0], FalsePositiveAnalysis)
        assert fps[0].predicted == "signal"
        assert fps[0].ground_truth == "noise"
        assert fps[0].importance_score == 0.9
        assert "reason" in fps[0].reason.lower() or "score" in fps[0].reason.lower()

    def test_analyze_no_false_positives(self, validator: ScoringValidator) -> None:
        """Test when there are no false positives."""
        validator.validation_messages = [ValidationMessage(content="test", ground_truth="noise")]
        validator.predictions = ["noise"]
        validator.ground_truth_labels = ["noise"]
        validator.scores = [{"importance_score": 0.1, "noise_factors": {"content": 0.1}}]

        fps = validator.analyze_false_positives()

        assert len(fps) == 0

    def test_analyze_without_predictions(self, validator: ScoringValidator) -> None:
        """Test error when analyzing without predictions."""
        with pytest.raises(ValueError, match="No predictions available"):
            validator.analyze_false_positives()


class TestAnalyzeFalseNegatives:
    """Test false negative analysis."""

    def test_analyze_false_negatives(self, validator: ScoringValidator) -> None:
        """Test identifying false negative predictions."""
        validator.validation_messages = [
            ValidationMessage(content="Critical bug here", ground_truth="signal"),
            ValidationMessage(content="ok", ground_truth="noise"),
        ]
        validator.predictions = ["noise", "noise"]
        validator.ground_truth_labels = ["signal", "noise"]
        validator.scores = [
            {"importance_score": 0.2, "noise_factors": {"content": 0.2}},
            {"importance_score": 0.1, "noise_factors": {"content": 0.1}},
        ]

        fns = validator.analyze_false_negatives()

        assert len(fns) == 1
        assert isinstance(fns[0], FalseNegativeAnalysis)
        assert fns[0].predicted == "noise"
        assert fns[0].ground_truth == "signal"
        assert fns[0].importance_score == 0.2
        assert "reason" in fns[0].reason.lower() or "score" in fns[0].reason.lower()

    def test_analyze_no_false_negatives(self, validator: ScoringValidator) -> None:
        """Test when there are no false negatives."""
        validator.validation_messages = [ValidationMessage(content="test", ground_truth="signal")]
        validator.predictions = ["signal"]
        validator.ground_truth_labels = ["signal"]
        validator.scores = [{"importance_score": 0.9, "noise_factors": {"content": 0.9}}]

        fns = validator.analyze_false_negatives()

        assert len(fns) == 0


class TestRunValidation:
    """Test complete validation pipeline."""

    def test_run_validation_complete(self, validator: ScoringValidator, temp_validation_file: Path) -> None:
        """Test complete validation run."""
        validator.load_validation_dataset(temp_validation_file)
        report = validator.run_validation()

        assert isinstance(report, ValidationReport)
        assert 0.0 <= report.overall_accuracy <= 1.0
        assert len(report.category_metrics) == 3
        assert isinstance(report.confusion_matrix, ConfusionMatrix)
        assert isinstance(report.false_positives, list)
        assert isinstance(report.false_negatives, list)
        assert report.total_samples == 8
        assert "noise" in report.dataset_distribution
        assert "signal" in report.dataset_distribution

    def test_run_validation_accuracy_calculation(self, validator: ScoringValidator) -> None:
        """Test accuracy calculation in validation report."""
        validator.validation_messages = [
            ValidationMessage(content="lol", ground_truth="noise"),
            ValidationMessage(content="ok", ground_truth="noise"),
            ValidationMessage(content="This is a longer message about important stuff", ground_truth="weak_signal"),
        ]

        report = validator.run_validation()

        assert report.total_samples == 3
        correct = sum(1 for pred, label in zip(validator.predictions, validator.ground_truth_labels) if pred == label)
        expected_accuracy = correct / 3
        assert report.overall_accuracy == round(expected_accuracy, 3)

    def test_run_validation_without_dataset(self, validator: ScoringValidator) -> None:
        """Test error when running validation without loading dataset."""
        with pytest.raises(ValueError, match="No validation dataset loaded"):
            validator.run_validation()

    def test_run_validation_dataset_distribution(self, validator: ScoringValidator, temp_validation_file: Path) -> None:
        """Test dataset distribution calculation."""
        validator.load_validation_dataset(temp_validation_file)
        report = validator.run_validation()

        assert report.dataset_distribution["noise"] == 4
        assert report.dataset_distribution["weak_signal"] == 1
        assert report.dataset_distribution["signal"] == 3


class TestClassifyScore:
    """Test score classification helper."""

    def test_classify_noise(self, validator: ScoringValidator) -> None:
        """Test noise classification."""
        assert validator._classify_score(0.0) == "noise"
        assert validator._classify_score(0.2) == "noise"
        assert validator._classify_score(0.29) == "noise"

    def test_classify_weak_signal(self, validator: ScoringValidator) -> None:
        """Test weak_signal classification."""
        assert validator._classify_score(0.3) == "weak_signal"
        assert validator._classify_score(0.5) == "weak_signal"
        assert validator._classify_score(0.7) == "weak_signal"

    def test_classify_signal(self, validator: ScoringValidator) -> None:
        """Test signal classification."""
        assert validator._classify_score(0.71) == "signal"
        assert validator._classify_score(0.9) == "signal"
        assert validator._classify_score(1.0) == "signal"


class TestIdentifyReasons:
    """Test error reason identification."""

    def test_identify_fp_reason_high_score(self, validator: ScoringValidator) -> None:
        """Test FP reason for high content score."""
        score_data = {"importance_score": 0.9, "noise_factors": {"content": 0.9}}
        reason = validator._identify_fp_reason("test content", score_data)

        assert isinstance(reason, str)
        assert len(reason) > 0

    def test_identify_fp_reason_long_content(self, validator: ScoringValidator) -> None:
        """Test FP reason for long content."""
        long_content = "a" * 150
        score_data = {"importance_score": 0.7, "noise_factors": {"content": 0.7}}
        reason = validator._identify_fp_reason(long_content, score_data)

        assert isinstance(reason, str)
        assert len(reason) > 0

    def test_identify_fn_reason_low_score(self, validator: ScoringValidator) -> None:
        """Test FN reason for low content score."""
        score_data = {"importance_score": 0.2, "noise_factors": {"content": 0.2}}
        reason = validator._identify_fn_reason("test", score_data)

        assert isinstance(reason, str)
        assert len(reason) > 0

    def test_identify_fn_reason_short_content(self, validator: ScoringValidator) -> None:
        """Test FN reason for short content."""
        score_data = {"importance_score": 0.2, "noise_factors": {"content": 0.2}}
        reason = validator._identify_fn_reason("hi", score_data)

        assert isinstance(reason, str)
        assert len(reason) > 0
