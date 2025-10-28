#!/usr/bin/env python3
"""Visualize conversation scenario statistics.

Usage:
    python visualize_scenarios.py [scenario_name]

Examples:
    python visualize_scenarios.py                    # Show all scenarios
    python visualize_scenarios.py bug-report-en.json # Show specific scenario
"""

import json
import sys
from pathlib import Path
from typing import Any


def load_scenario(filepath: Path) -> dict[str, Any]:
    """Load scenario from JSON file."""
    with filepath.open("r", encoding="utf-8") as f:
        return json.load(f)


def print_scenario_summary(filename: str, scenario: dict[str, Any]) -> None:
    """Print summary of a scenario."""
    messages = scenario["messages"]
    total = len(messages)

    label_counts = {"noise": 0, "weak_signal": 0, "strong_signal": 0}
    for msg in messages:
        label = msg["expected_label"]
        label_counts[label] = label_counts.get(label, 0) + 1

    print(f"\n{'=' * 70}")
    print(f"Scenario: {filename}")
    print(f"{'=' * 70}")
    print(f"Type: {scenario['scenario']}")
    print(f"Language: {scenario['language']}")
    print(f"Description: {scenario['description']}")
    print(f"\nMessages: {total}")
    print(f"  Noise:         {label_counts['noise']:3d} ({label_counts['noise'] / total * 100:5.1f}%)")
    print(f"  Weak Signal:   {label_counts['weak_signal']:3d} ({label_counts['weak_signal'] / total * 100:5.1f}%)")
    print(f"  Strong Signal: {label_counts['strong_signal']:3d} ({label_counts['strong_signal'] / total * 100:5.1f}%)")

    topics = scenario.get("expected_extraction", {}).get("topics", [])
    if topics:
        print(f"\nExpected Topics: {len(topics)}")
        for i, topic in enumerate(topics, 1):
            print(f"  {i}. {topic['title']}")
            print(f"     Atoms: {len(topic['atoms'])}")
    else:
        print("\nExpected Topics: None (noise conversation)")


def print_scenario_messages(scenario: dict[str, Any], show_metadata: bool = False) -> None:
    """Print all messages in a scenario."""
    print("\n" + "-" * 70)
    print("MESSAGES")
    print("-" * 70)

    for msg in scenario["messages"]:
        order = msg["order"]
        text = msg["text"]
        label = msg["expected_label"]
        lang = msg["language"]

        label_emoji = {
            "noise": "⚪",
            "weak_signal": "🟡",
            "strong_signal": "🟢",
        }[label]

        print(f"\n[{order:2d}] {label_emoji} {label.upper()} ({lang})")
        print(f"    {text[:100]}..." if len(text) > 100 else f"    {text}")

        if show_metadata and "metadata" in msg:
            metadata = msg["metadata"]
            if metadata.get("type"):
                print(f"    Type: {metadata['type']}")
            if metadata.get("content_categories"):
                print(f"    Categories: {', '.join(metadata['content_categories'])}")


def print_all_scenarios_overview() -> None:
    """Print overview of all scenarios."""
    scenarios_dir = Path(__file__).parent
    json_files = sorted(scenarios_dir.glob("*.json"))

    print("\n" + "=" * 70)
    print("ALL SCENARIOS OVERVIEW")
    print("=" * 70)

    total_messages = 0
    total_labels = {"noise": 0, "weak_signal": 0, "strong_signal": 0}

    for filepath in json_files:
        scenario = load_scenario(filepath)
        messages = scenario["messages"]
        total_messages += len(messages)

        for msg in messages:
            label = msg["expected_label"]
            total_labels[label] = total_labels.get(label, 0) + 1

    print(f"\nTotal Scenarios: {len(json_files)}")
    print(f"Total Messages: {total_messages}")
    print(f"\nOverall Label Distribution:")
    print(f"  Noise:         {total_labels['noise']:3d} ({total_labels['noise'] / total_messages * 100:5.1f}%)")
    print(
        f"  Weak Signal:   {total_labels['weak_signal']:3d} ({total_labels['weak_signal'] / total_messages * 100:5.1f}%)"
    )
    print(
        f"  Strong Signal: {total_labels['strong_signal']:3d} ({total_labels['strong_signal'] / total_messages * 100:5.1f}%)"
    )

    print(f"\n{'Scenario':<40} {'Messages':>8} {'Noise':>8} {'Weak':>8} {'Strong':>8}")
    print("-" * 70)

    for filepath in json_files:
        scenario = load_scenario(filepath)
        messages = scenario["messages"]
        total = len(messages)

        label_counts = {"noise": 0, "weak_signal": 0, "strong_signal": 0}
        for msg in messages:
            label = msg["expected_label"]
            label_counts[label] = label_counts.get(label, 0) + 1

        filename = filepath.name
        print(
            f"{filename:<40} {total:8d} "
            f"{label_counts['noise']:7d}% "
            f"{label_counts['weak_signal']:7d}% "
            f"{label_counts['strong_signal']:7d}%"
        )


def main() -> None:
    """Main entry point."""
    scenarios_dir = Path(__file__).parent

    if len(sys.argv) > 1:
        filename = sys.argv[1]
        filepath = scenarios_dir / filename

        if not filepath.exists():
            print(f"Error: Scenario not found: {filename}")
            print(f"\nAvailable scenarios:")
            for f in sorted(scenarios_dir.glob("*.json")):
                print(f"  - {f.name}")
            sys.exit(1)

        scenario = load_scenario(filepath)
        print_scenario_summary(filename, scenario)
        print_scenario_messages(scenario, show_metadata=True)
    else:
        print_all_scenarios_overview()

        print("\n" + "=" * 70)
        print("To see details of a specific scenario, run:")
        print("  python visualize_scenarios.py <scenario-name>.json")
        print("=" * 70)


if __name__ == "__main__":
    main()
