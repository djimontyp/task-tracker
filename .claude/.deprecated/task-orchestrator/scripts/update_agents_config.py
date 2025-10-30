#!/usr/bin/env python3
"""
Update Agent Configuration

Interactive tool for updating agents.yaml configuration.
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

try:
    import yaml
except ImportError:
    print("❌ Required package not found. Install with: pip install pyyaml")
    sys.exit(1)


class AgentConfigUpdater:
    """Interactive agent configuration updater."""

    def __init__(self, config_path: Path, changelog_path: Path):
        self.config_path = config_path
        self.changelog_path = changelog_path
        self.config: Dict[str, Any] = {}
        self.changes: List[str] = []

    def load_config(self) -> None:
        """Load current configuration."""
        with open(self.config_path) as f:
            self.config = yaml.safe_load(f)
        print(f"✅ Loaded configuration version {self.config.get('version', 'unknown')}")

    def save_config(self) -> None:
        """Save updated configuration."""
        with open(self.config_path, "w") as f:
            yaml.dump(self.config, f, default_flow_style=False, sort_keys=False)
        print(f"✅ Configuration saved to {self.config_path}")

    def update_changelog(self) -> None:
        """Update CHANGELOG.md with changes."""
        if not self.changes:
            return

        version = self.config.get("version", "unknown")
        date = datetime.now().strftime("%Y-%m-%d")

        changelog_entry = f"\n## [{version}] - {date}\n\n"
        for change in self.changes:
            changelog_entry += f"- {change}\n"

        if self.changelog_path.exists():
            with open(self.changelog_path, "r") as f:
                existing_content = f.read()

            if "## [Unreleased]" in existing_content:
                new_content = existing_content.replace(
                    "## [Unreleased]",
                    f"## [Unreleased]\n{changelog_entry}"
                )
            else:
                header_end = existing_content.find("\n## [")
                if header_end > 0:
                    new_content = (
                        existing_content[:header_end] +
                        changelog_entry +
                        existing_content[header_end:]
                    )
                else:
                    new_content = existing_content + changelog_entry
        else:
            new_content = (
                "# Changelog\n\n"
                "All notable changes to the agent configuration will be documented here.\n"
                "\n## [Unreleased]\n"
                f"{changelog_entry}"
            )

        with open(self.changelog_path, "w") as f:
            f.write(new_content)

        print(f"✅ CHANGELOG.md updated with {len(self.changes)} changes")

    def add_agent(self, agent_name: str, task_type: str, triggers: List[str]) -> None:
        """Add a new agent to a task type."""
        if "task_types" not in self.config:
            self.config["task_types"] = {}

        if task_type not in self.config["task_types"]:
            print(f"❌ Task type '{task_type}' not found")
            return

        task_config = self.config["task_types"][task_type]
        primary = task_config.get("primary_agent")

        if isinstance(primary, list):
            if agent_name not in primary:
                primary.append(agent_name)
                self.changes.append(
                    f"Added agent '{agent_name}' to task type '{task_type}'"
                )
        elif isinstance(primary, str):
            task_config["primary_agent"] = [primary, agent_name]
            self.changes.append(
                f"Added agent '{agent_name}' to task type '{task_type}' (converted to list)"
            )

        if triggers:
            existing_triggers = task_config.get("trigger_keywords", [])
            new_triggers = [t for t in triggers if t not in existing_triggers]
            task_config["trigger_keywords"] = existing_triggers + new_triggers
            if new_triggers:
                self.changes.append(
                    f"Added trigger keywords to '{task_type}': {', '.join(new_triggers)}"
                )

        print(f"✅ Added agent '{agent_name}' to task type '{task_type}'")

    def remove_agent(self, agent_name: str, task_type: str) -> None:
        """Remove an agent from a task type."""
        if task_type not in self.config.get("task_types", {}):
            print(f"❌ Task type '{task_type}' not found")
            return

        task_config = self.config["task_types"][task_type]
        primary = task_config.get("primary_agent")

        if isinstance(primary, list):
            if agent_name in primary:
                primary.remove(agent_name)
                self.changes.append(
                    f"Removed agent '{agent_name}' from task type '{task_type}'"
                )
                if len(primary) == 1:
                    task_config["primary_agent"] = primary[0]
                    self.changes.append(
                        f"Converted task type '{task_type}' primary_agent to string"
                    )
        elif primary == agent_name:
            print(f"❌ Cannot remove sole primary agent '{agent_name}' from '{task_type}'")
            return

        print(f"✅ Removed agent '{agent_name}' from task type '{task_type}'")

    def deprecate_agent(self, agent_name: str, replacement: str) -> None:
        """Mark an agent as deprecated."""
        if "deprecated" not in self.config:
            self.config["deprecated"] = {"agents": [], "migration_guide": ""}

        if agent_name not in self.config["deprecated"]["agents"]:
            self.config["deprecated"]["agents"].append(agent_name)
            self.changes.append(
                f"Deprecated agent '{agent_name}' (use '{replacement}' instead)"
            )

        print(f"✅ Marked agent '{agent_name}' as deprecated")

    def bump_version(self, bump_type: str = "patch") -> None:
        """Bump configuration version."""
        version = self.config.get("version", "0.0.0")
        major, minor, patch = map(int, version.split("."))

        if bump_type == "major":
            major += 1
            minor = 0
            patch = 0
        elif bump_type == "minor":
            minor += 1
            patch = 0
        elif bump_type == "patch":
            patch += 1

        new_version = f"{major}.{minor}.{patch}"
        self.config["version"] = new_version
        self.changes.append(f"Bumped version from {version} to {new_version}")

        print(f"✅ Version bumped: {version} → {new_version}")

    def interactive_mode(self) -> None:
        """Run interactive configuration update."""
        print("\n🔧 Interactive Agent Configuration Update\n")
        print("Available commands:")
        print("  1. Add agent to task type")
        print("  2. Remove agent from task type")
        print("  3. Deprecate agent")
        print("  4. Bump version")
        print("  5. Save and exit")
        print("  6. Exit without saving")

        while True:
            choice = input("\nEnter command number: ").strip()

            if choice == "1":
                agent_name = input("Agent name: ").strip()
                task_type = input("Task type: ").strip()
                triggers_input = input("Trigger keywords (comma-separated): ").strip()
                triggers = [t.strip() for t in triggers_input.split(",")] if triggers_input else []
                self.add_agent(agent_name, task_type, triggers)

            elif choice == "2":
                agent_name = input("Agent name: ").strip()
                task_type = input("Task type: ").strip()
                self.remove_agent(agent_name, task_type)

            elif choice == "3":
                agent_name = input("Agent name to deprecate: ").strip()
                replacement = input("Replacement agent: ").strip()
                self.deprecate_agent(agent_name, replacement)

            elif choice == "4":
                bump_type = input("Bump type (major/minor/patch) [patch]: ").strip() or "patch"
                self.bump_version(bump_type)

            elif choice == "5":
                if self.changes:
                    self.save_config()
                    self.update_changelog()
                    print("\n✅ Configuration updated successfully")
                else:
                    print("\n⚠️  No changes made")
                break

            elif choice == "6":
                print("\n❌ Exiting without saving")
                break

            else:
                print("❌ Invalid choice")


def main():
    parser = argparse.ArgumentParser(description="Update agent configuration")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).parent.parent / "config" / "agents.yaml",
        help="Path to agents.yaml"
    )
    parser.add_argument(
        "--changelog",
        type=Path,
        default=Path(__file__).parent.parent / "references" / "CHANGELOG.md",
        help="Path to CHANGELOG.md"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run in interactive mode"
    )
    parser.add_argument(
        "--add-agent",
        help="Add agent to task type"
    )
    parser.add_argument(
        "--type",
        help="Task type for agent"
    )
    parser.add_argument(
        "--triggers",
        nargs="+",
        help="Trigger keywords"
    )
    parser.add_argument(
        "--bump",
        choices=["major", "minor", "patch"],
        help="Bump version"
    )

    args = parser.parse_args()

    updater = AgentConfigUpdater(args.config, args.changelog)
    updater.load_config()

    if args.interactive:
        updater.interactive_mode()
    elif args.add_agent and args.type:
        updater.add_agent(args.add_agent, args.type, args.triggers or [])
        if args.bump:
            updater.bump_version(args.bump)
        updater.save_config()
        updater.update_changelog()
    elif args.bump:
        updater.bump_version(args.bump)
        updater.save_config()
        updater.update_changelog()
    else:
        print("❌ No action specified. Use --interactive or provide arguments")
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
