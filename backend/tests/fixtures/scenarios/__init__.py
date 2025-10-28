"""Test conversation scenarios for E2E testing.

This module provides utilities to load and work with realistic Telegram
conversation scenarios for testing the knowledge extraction pipeline.
"""

import json
from pathlib import Path
from typing import Any

SCENARIOS_DIR = Path(__file__).parent


def load_scenario(filename: str) -> dict[str, Any]:
    """Load a conversation scenario from JSON file.

    Args:
        filename: Scenario filename (e.g., "bug-report-en.json")

    Returns:
        Scenario data with messages and expected extraction results

    Example:
        >>> scenario = load_scenario("bug-report-en.json")
        >>> messages = scenario["messages"]
        >>> expected = scenario["expected_extraction"]
    """
    filepath = SCENARIOS_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Scenario not found: {filename}")

    with filepath.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_scenarios() -> list[str]:
    """List all available scenario files.

    Returns:
        List of scenario filenames

    Example:
        >>> scenarios = list_scenarios()
        >>> print(scenarios)
        ['bug-report-en.json', 'bug-report-uk.json', ...]
    """
    return sorted([f.name for f in SCENARIOS_DIR.glob("*.json")])


def get_messages_by_label(scenario: dict[str, Any], label: str) -> list[dict[str, Any]]:
    """Filter messages by expected importance label.

    Args:
        scenario: Loaded scenario data
        label: Importance label (noise, weak_signal, strong_signal)

    Returns:
        List of messages with the specified label

    Example:
        >>> scenario = load_scenario("bug-report-en.json")
        >>> noise_msgs = get_messages_by_label(scenario, "noise")
        >>> signal_msgs = get_messages_by_label(scenario, "strong_signal")
    """
    return [msg for msg in scenario["messages"] if msg["expected_label"] == label]


def get_signal_messages(scenario: dict[str, Any]) -> list[dict[str, Any]]:
    """Get all signal messages (weak + strong) from scenario.

    Args:
        scenario: Loaded scenario data

    Returns:
        List of messages with weak_signal or strong_signal labels

    Example:
        >>> scenario = load_scenario("feature-planning-uk.json")
        >>> signals = get_signal_messages(scenario)
    """
    return [msg for msg in scenario["messages"] if msg["expected_label"] in ("weak_signal", "strong_signal")]


def calculate_signal_ratio(scenario: dict[str, Any]) -> dict[str, float]:
    """Calculate distribution of message labels in scenario.

    Args:
        scenario: Loaded scenario data

    Returns:
        Dictionary with percentages for each label

    Example:
        >>> scenario = load_scenario("noise-en.json")
        >>> ratio = calculate_signal_ratio(scenario)
        >>> print(ratio)
        {'noise': 1.0, 'weak_signal': 0.0, 'strong_signal': 0.0}
    """
    messages = scenario["messages"]
    total = len(messages)

    if total == 0:
        return {"noise": 0.0, "weak_signal": 0.0, "strong_signal": 0.0}

    label_counts = {"noise": 0, "weak_signal": 0, "strong_signal": 0}
    for msg in messages:
        label = msg["expected_label"]
        label_counts[label] = label_counts.get(label, 0) + 1

    return {label: count / total for label, count in label_counts.items()}


__all__ = [
    "load_scenario",
    "list_scenarios",
    "get_messages_by_label",
    "get_signal_messages",
    "calculate_signal_ratio",
    "SCENARIOS_DIR",
]
