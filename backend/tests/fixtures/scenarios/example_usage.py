"""Example usage of test scenarios with actual system services.

This file demonstrates how to use the realistic conversation scenarios
for testing the importance scoring and knowledge extraction pipeline.

Run with: pytest tests/fixtures/scenarios/example_usage.py -v
"""

from tests.fixtures.scenarios import (
    calculate_signal_ratio,
    get_messages_by_label,
    get_signal_messages,
    load_scenario,
)

# These examples assume you have the actual services available
# Uncomment and adapt to your actual service implementations


# Example 1: Test Importance Scoring
# ===================================
"""
from app.services.importance_scorer import ImportanceScorer

@pytest.mark.asyncio
async def test_importance_scoring_accuracy():
    scorer = ImportanceScorer()
    scenario = load_scenario("bug-report-en.json")

    correct = 0
    total = len(scenario["messages"])

    for msg in scenario["messages"]:
        result = await scorer.score(msg["text"])
        if result.label == msg["expected_label"]:
            correct += 1

    accuracy = correct / total
    assert accuracy > 0.8, f"Accuracy {accuracy:.2%} below threshold"
    print(f"Importance scoring accuracy: {accuracy:.2%}")
"""


# Example 2: Test Knowledge Extraction
# ====================================
"""
from app.services.knowledge_extraction_service import KnowledgeExtractionService

@pytest.mark.asyncio
async def test_knowledge_extraction():
    extractor = KnowledgeExtractionService()
    scenario = load_scenario("technical-uk.json")

    # Extract from signal messages only
    signals = get_signal_messages(scenario)
    topics = await extractor.extract([msg["text"] for msg in signals])

    expected_topics = scenario["expected_extraction"]["topics"]
    assert len(topics) == len(expected_topics)

    for topic, expected in zip(topics, expected_topics):
        assert topic.title == expected["title"]
        assert len(topic.atoms) >= len(expected["atoms"])
"""


# Example 3: Test Full E2E Pipeline
# =================================
"""
from app.webhooks.telegram import handle_telegram_message
from app.database import get_db
from sqlalchemy.orm import Session

@pytest.mark.asyncio
async def test_e2e_pipeline(db: Session):
    scenario = load_scenario("feature-planning-en.json")

    # Simulate webhook ingestion
    for msg in scenario["messages"]:
        await handle_telegram_message({
            "message": {
                "text": msg["text"],
                "chat": {"id": 12345},
                "message_id": msg["order"]
            }
        })

    # Wait for background tasks to complete
    await asyncio.sleep(5)

    # Verify topics were extracted
    topics = db.query(Topic).all()
    expected = scenario["expected_extraction"]["topics"]

    assert len(topics) == len(expected)
"""


# Example 4: Test Noise Filtering
# ===============================
"""
from app.services.knowledge_extraction_service import KnowledgeExtractionService

@pytest.mark.asyncio
async def test_noise_filtering():
    extractor = KnowledgeExtractionService()

    # Pure noise scenario should extract nothing
    scenario = load_scenario("noise-uk.json")
    messages = [msg["text"] for msg in scenario["messages"]]

    topics = await extractor.extract(messages)
    assert len(topics) == 0, "Noise conversation should not extract topics"
"""


# Example 5: Test Multilingual Handling
# =====================================
"""
from app.services.language_detector import detect_language

def test_language_detection():
    scenario = load_scenario("mixed-language.json")

    for msg in scenario["messages"]:
        detected = detect_language(msg["text"])
        expected = msg["language"]

        # For mixed messages, accept either language
        if expected == "mixed":
            assert detected in ("uk", "en")
        else:
            assert detected == expected
"""


# Example 6: Benchmark Different Scenarios
# ========================================
"""
from app.services.importance_scorer import ImportanceScorer
import time

@pytest.mark.asyncio
async def test_scenario_benchmarks():
    scorer = ImportanceScorer()

    scenarios = [
        "bug-report-en.json",
        "feature-planning-uk.json",
        "technical-en.json",
        "mixed-language.json"
    ]

    results = {}

    for scenario_name in scenarios:
        scenario = load_scenario(scenario_name)
        messages = [msg["text"] for msg in scenario["messages"]]

        start = time.time()
        for msg in messages:
            await scorer.score(msg)
        elapsed = time.time() - start

        avg_time = elapsed / len(messages)
        results[scenario_name] = avg_time

    # Print benchmark results
    for name, avg in results.items():
        print(f"{name}: {avg*1000:.2f}ms per message")
"""


# Example 7: Validate Expected Extractions
# ========================================
"""
from app.services.knowledge_extraction_service import KnowledgeExtractionService

@pytest.mark.asyncio
@pytest.mark.parametrize("scenario_name", [
    "bug-report-en.json",
    "feature-planning-uk.json",
    "technical-en.json",
    "architecture-decision-en.json"
])
async def test_extraction_quality(scenario_name: str):
    extractor = KnowledgeExtractionService()
    scenario = load_scenario(scenario_name)

    signals = get_signal_messages(scenario)
    topics = await extractor.extract([msg["text"] for msg in signals])

    expected = scenario["expected_extraction"]["topics"]

    # Check topic count matches
    assert len(topics) == len(expected), (
        f"Expected {len(expected)} topics, got {len(topics)}"
    )

    # Check each topic has atoms
    for topic in topics:
        assert len(topic.atoms) > 0, f"Topic '{topic.title}' has no atoms"

    # Check coverage of expected atoms (fuzzy matching)
    for expected_topic in expected:
        expected_atoms = set(expected_topic["atoms"])
        extracted_atoms = set(
            atom.content
            for topic in topics
            if topic.title == expected_topic["title"]
            for atom in topic.atoms
        )

        # At least 50% of expected atoms should be present
        coverage = len(expected_atoms & extracted_atoms) / len(expected_atoms)
        assert coverage >= 0.5, (
            f"Atom coverage {coverage:.0%} below threshold for "
            f"topic '{expected_topic['title']}'"
        )
"""


# Example 8: Test Signal Ratio Calculation
# ========================================
def test_signal_ratios():
    """Verify signal distribution matches scenario type."""
    # Noise scenarios should be 100% noise
    noise_scenario = load_scenario("noise-en.json")
    ratio = calculate_signal_ratio(noise_scenario)
    assert ratio["noise"] == 1.0
    assert ratio["weak_signal"] == 0.0
    assert ratio["strong_signal"] == 0.0

    # Technical scenarios should have high signal
    tech_scenario = load_scenario("technical-uk.json")
    ratio = calculate_signal_ratio(tech_scenario)
    signal_total = ratio["weak_signal"] + ratio["strong_signal"]
    assert signal_total > 0.7, f"Technical scenario signal ratio {signal_total:.0%} too low"

    # Mixed scenarios should have both
    mixed_scenario = load_scenario("mixed-signal-noise-uk.json")
    ratio = calculate_signal_ratio(mixed_scenario)
    assert ratio["noise"] > 0
    assert ratio["strong_signal"] > 0


# Example 9: Helper Function Validation
# =====================================
def test_helper_functions():
    """Validate helper functions work correctly."""
    scenario = load_scenario("bug-report-en.json")

    # Test label filtering
    noise = get_messages_by_label(scenario, "noise")
    weak = get_messages_by_label(scenario, "weak_signal")
    strong = get_messages_by_label(scenario, "strong_signal")

    assert all(m["expected_label"] == "noise" for m in noise)
    assert all(m["expected_label"] == "weak_signal" for m in weak)
    assert all(m["expected_label"] == "strong_signal" for m in strong)

    # Test signal aggregation
    signals = get_signal_messages(scenario)
    assert len(signals) == len(weak) + len(strong)

    # Test ratio calculation
    ratio = calculate_signal_ratio(scenario)
    assert abs(sum(ratio.values()) - 1.0) < 0.01  # Should sum to 1.0


# Example 10: Progressive Testing Strategy
# ========================================
"""
from app.services.importance_scorer import ImportanceScorer

@pytest.mark.asyncio
class TestProgressiveScenarios:
    # Start simple, increase complexity

    async def test_1_pure_noise(self):
        # Simplest: all noise
        scorer = ImportanceScorer()
        scenario = load_scenario("noise-en.json")

        for msg in scenario["messages"]:
            result = await scorer.score(msg["text"])
            assert result.label == "noise"

    async def test_2_mixed_content(self):
        # Medium: mixed signal/noise
        scorer = ImportanceScorer()
        scenario = load_scenario("bug-report-en.json")

        correct = sum(
            1 for msg in scenario["messages"]
            if (await scorer.score(msg["text"])).label == msg["expected_label"]
        )
        accuracy = correct / len(scenario["messages"])
        assert accuracy > 0.7

    async def test_3_technical_deep(self):
        # Complex: technical with code
        scorer = ImportanceScorer()
        scenario = load_scenario("technical-en.json")

        signals = get_signal_messages(scenario)
        for msg in signals:
            result = await scorer.score(msg["text"])
            assert result.label in ("weak_signal", "strong_signal")

    async def test_4_multilingual(self):
        # Most complex: code-switching
        scorer = ImportanceScorer()
        scenario = load_scenario("mixed-language.json")

        correct = sum(
            1 for msg in scenario["messages"]
            if (await scorer.score(msg["text"])).label == msg["expected_label"]
        )
        accuracy = correct / len(scenario["messages"])
        assert accuracy > 0.7
"""


if __name__ == "__main__":
    # Run basic tests that don't require service integration
    test_signal_ratios()
    test_helper_functions()
    print("Basic scenario tests passed!")
    print("\nTo run full integration tests, uncomment service examples and run:")
    print("  pytest tests/fixtures/scenarios/example_usage.py -v")
