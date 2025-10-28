"""Integration tests using realistic conversation scenarios.

Tests the importance scoring and knowledge extraction pipeline
against realistic Telegram conversation flows.
"""

import pytest
from tests.fixtures.scenarios import (
    calculate_signal_ratio,
    get_messages_by_label,
    get_signal_messages,
    list_scenarios,
    load_scenario,
)


class TestScenarioLoading:
    """Test that scenario fixtures load correctly."""

    def test_list_all_scenarios(self) -> None:
        """All expected scenario files are present."""
        scenarios = list_scenarios()
        assert len(scenarios) == 11

        expected_scenarios = {
            "bug-report-en.json",
            "bug-report-uk.json",
            "feature-planning-en.json",
            "feature-planning-uk.json",
            "noise-en.json",
            "noise-uk.json",
            "technical-en.json",
            "technical-uk.json",
            "mixed-language.json",
            "mixed-signal-noise-uk.json",
            "architecture-decision-en.json",
        }
        assert set(scenarios) == expected_scenarios

    @pytest.mark.parametrize(
        "filename",
        [
            "bug-report-en.json",
            "feature-planning-uk.json",
            "noise-en.json",
            "technical-uk.json",
            "mixed-language.json",
        ],
    )
    def test_load_scenario_structure(self, filename: str) -> None:
        """Scenario files have correct structure."""
        scenario = load_scenario(filename)

        assert "scenario" in scenario
        assert "language" in scenario
        assert "description" in scenario
        assert "messages" in scenario
        assert "expected_extraction" in scenario

        assert isinstance(scenario["messages"], list)
        assert len(scenario["messages"]) > 0

        for msg in scenario["messages"]:
            assert "order" in msg
            assert "text" in msg
            assert "language" in msg
            assert "expected_label" in msg
            assert "metadata" in msg


class TestScenarioStatistics:
    """Test scenario message distribution and characteristics."""

    def test_noise_scenario_is_pure_noise(self) -> None:
        """Noise scenarios contain only noise messages."""
        for lang in ["en", "uk"]:
            scenario = load_scenario(f"noise-{lang}.json")
            ratio = calculate_signal_ratio(scenario)

            assert ratio["noise"] == 1.0
            assert ratio["weak_signal"] == 0.0
            assert ratio["strong_signal"] == 0.0

    def test_technical_scenario_has_high_signal(self) -> None:
        """Technical deep-dive scenarios have mostly signal."""
        for lang in ["en", "uk"]:
            scenario = load_scenario(f"technical-{lang}.json")
            ratio = calculate_signal_ratio(scenario)

            signal_ratio = ratio["weak_signal"] + ratio["strong_signal"]
            assert signal_ratio > 0.7

    def test_bug_report_has_mixed_content(self) -> None:
        """Bug report scenarios have both noise and signal."""
        for lang in ["en", "uk"]:
            scenario = load_scenario(f"bug-report-{lang}.json")
            ratio = calculate_signal_ratio(scenario)

            assert ratio["noise"] > 0
            assert ratio["strong_signal"] > 0

    def test_mixed_signal_noise_has_both(self) -> None:
        """Mixed scenario has both noise and signal messages."""
        scenario = load_scenario("mixed-signal-noise-uk.json")

        noise = get_messages_by_label(scenario, "noise")
        signal = get_signal_messages(scenario)

        assert len(noise) > 0
        assert len(signal) > 0


class TestScenarioHelpers:
    """Test helper functions for working with scenarios."""

    def test_get_messages_by_label(self) -> None:
        """Can filter messages by importance label."""
        scenario = load_scenario("bug-report-en.json")

        noise = get_messages_by_label(scenario, "noise")
        weak = get_messages_by_label(scenario, "weak_signal")
        strong = get_messages_by_label(scenario, "strong_signal")

        assert all(msg["expected_label"] == "noise" for msg in noise)
        assert all(msg["expected_label"] == "weak_signal" for msg in weak)
        assert all(msg["expected_label"] == "strong_signal" for msg in strong)

    def test_get_signal_messages(self) -> None:
        """Can get all signal messages (weak + strong)."""
        scenario = load_scenario("feature-planning-en.json")
        signals = get_signal_messages(scenario)

        for msg in signals:
            assert msg["expected_label"] in ("weak_signal", "strong_signal")

    def test_calculate_signal_ratio(self) -> None:
        """Signal ratio calculation is accurate."""
        scenario = load_scenario("architecture-decision-en.json")
        ratio = calculate_signal_ratio(scenario)

        assert sum(ratio.values()) == pytest.approx(1.0)
        assert all(0 <= v <= 1 for v in ratio.values())


class TestMultilingualScenarios:
    """Test language handling in scenarios."""

    def test_mixed_language_scenario_has_both_languages(self) -> None:
        """Mixed language scenario contains Ukrainian and English."""
        scenario = load_scenario("mixed-language.json")

        languages = {msg["language"] for msg in scenario["messages"]}
        assert "uk" in languages
        assert "en" in languages

    @pytest.mark.parametrize(
        "filename,expected_lang",
        [
            ("bug-report-uk.json", "uk"),
            ("bug-report-en.json", "en"),
            ("feature-planning-uk.json", "uk"),
            ("feature-planning-en.json", "en"),
        ],
    )
    def test_monolingual_scenarios_consistent(self, filename: str, expected_lang: str) -> None:
        """Monolingual scenarios use consistent language."""
        scenario = load_scenario(filename)

        for msg in scenario["messages"]:
            assert msg["language"] == expected_lang


class TestExpectedExtractions:
    """Test expected knowledge extraction results."""

    def test_noise_scenarios_expect_no_extraction(self) -> None:
        """Noise scenarios should not extract any topics."""
        for lang in ["en", "uk"]:
            scenario = load_scenario(f"noise-{lang}.json")
            expected = scenario["expected_extraction"]

            assert "topics" in expected
            assert len(expected["topics"]) == 0

    def test_technical_scenarios_expect_topics(self) -> None:
        """Technical scenarios should extract multiple topics."""
        for lang in ["en", "uk"]:
            scenario = load_scenario(f"technical-{lang}.json")
            expected = scenario["expected_extraction"]

            assert "topics" in expected
            topics = expected["topics"]
            assert len(topics) > 0

            for topic in topics:
                assert "title" in topic
                assert "atoms" in topic
                assert isinstance(topic["atoms"], list)
                assert len(topic["atoms"]) > 0

    def test_architecture_decision_captures_rationale(self) -> None:
        """Architecture decision scenario captures decision details."""
        scenario = load_scenario("architecture-decision-en.json")
        expected = scenario["expected_extraction"]

        topics = expected["topics"]
        assert len(topics) > 0

        first_topic = topics[0]
        atoms = first_topic["atoms"]

        assert any("Decision:" in atom for atom in atoms)
        assert any("Rationale:" in atom for atom in atoms)


# Example usage for actual classification/extraction tests
# (These would be implemented with actual service integration)
"""
class TestImportanceScoringWithScenarios:
    @pytest.mark.asyncio
    async def test_classify_bug_report_messages(
        self, importance_scorer
    ) -> None:
        scenario = load_scenario("bug-report-en.json")

        for msg in scenario["messages"]:
            result = await importance_scorer.score(msg["text"])
            assert result.label == msg["expected_label"]


class TestKnowledgeExtractionWithScenarios:
    @pytest.mark.asyncio
    async def test_extract_from_technical_discussion(
        self, knowledge_extractor
    ) -> None:
        scenario = load_scenario("technical-en.json")
        signal_messages = get_signal_messages(scenario)

        topics = await knowledge_extractor.extract(signal_messages)
        expected_topics = scenario["expected_extraction"]["topics"]

        assert len(topics) == len(expected_topics)
        for topic, expected in zip(topics, expected_topics):
            assert topic.title == expected["title"]
            assert len(topic.atoms) == len(expected["atoms"])
"""
