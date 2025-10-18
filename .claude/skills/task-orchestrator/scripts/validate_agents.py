#!/usr/bin/env python3
"""
Validate Agent Configuration

Validates agents.yaml against the JSON schema and performs additional checks.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

try:
    import yaml
    import jsonschema
except ImportError:
    print("❌ Required packages not found. Install with: pip install pyyaml jsonschema")
    sys.exit(1)


class AgentConfigValidator:
    """Validates agent configuration against schema and business rules."""

    def __init__(self, config_path: Path, schema_path: Path):
        self.config_path = config_path
        self.schema_path = schema_path
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def load_config(self) -> Dict[str, Any]:
        """Load YAML configuration."""
        with open(self.config_path) as f:
            return yaml.safe_load(f)

    def load_schema(self) -> Dict[str, Any]:
        """Load JSON schema."""
        with open(self.schema_path) as f:
            return json.load(f)

    def validate_schema(self, config: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate config against JSON schema."""
        try:
            jsonschema.validate(instance=config, schema=schema)
            print("✅ Schema validation passed")
            return True
        except jsonschema.ValidationError as e:
            self.errors.append(f"Schema validation failed: {e.message}")
            print(f"❌ Schema validation failed: {e.message}")
            return False

    def check_trigger_keyword_conflicts(self, config: Dict[str, Any]) -> None:
        """Check for overlapping trigger keywords between task types."""
        all_keywords: Dict[str, List[str]] = {}

        for task_type, task_config in config.get("task_types", {}).items():
            keywords = task_config.get("trigger_keywords", [])
            for keyword in keywords:
                if keyword not in all_keywords:
                    all_keywords[keyword] = []
                all_keywords[keyword].append(task_type)

        conflicts = {
            kw: types for kw, types in all_keywords.items() if len(types) > 1
        }

        if conflicts:
            for keyword, task_types in conflicts.items():
                self.warnings.append(
                    f"Keyword '{keyword}' triggers multiple task types: {', '.join(task_types)}"
                )
            print(f"⚠️  Found {len(conflicts)} trigger keyword conflicts")
        else:
            print("✅ No trigger keyword conflicts found")

    def check_agent_references(self, config: Dict[str, Any]) -> None:
        """Check that all agent references are valid."""
        known_agents = {
            "general-purpose",
            "fastapi-backend-expert",
            "react-frontend-architect",
            "pytest-test-master",
            "codebase-cleaner",
            "comment-cleaner",
            "devops-expert",
            "architecture-guardian",
            "documentation-expert",
            "Explore"
        }

        for task_type, task_config in config.get("task_types", {}).items():
            primary = task_config.get("primary_agent")
            fallback = task_config.get("fallback_agent")

            agents_to_check = []
            if isinstance(primary, list):
                agents_to_check.extend(primary)
            elif isinstance(primary, str):
                agents_to_check.append(primary)

            if fallback:
                agents_to_check.append(fallback)

            for agent in agents_to_check:
                if agent not in known_agents:
                    self.warnings.append(
                        f"Task '{task_type}' references unknown agent: '{agent}'"
                    )

    def check_version_staleness(self, config: Dict[str, Any]) -> None:
        """Check if configuration version is up to date."""
        version = config.get("version", "0.0.0")
        major, minor, patch = map(int, version.split("."))

        if major == 0:
            self.warnings.append(
                f"Configuration version {version} is pre-release (0.x.x)"
            )

    def validate(self, strict: bool = False) -> bool:
        """
        Run all validation checks.

        Args:
            strict: If True, treat warnings as errors

        Returns:
            True if validation passed, False otherwise
        """
        print(f"🔍 Validating configuration: {self.config_path}")

        config = self.load_config()
        schema = self.load_schema()

        schema_valid = self.validate_schema(config, schema)
        if not schema_valid:
            return False

        self.check_trigger_keyword_conflicts(config)
        self.check_agent_references(config)
        self.check_version_staleness(config)

        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")

            if strict:
                print("\n❌ Validation failed in strict mode due to warnings")
                return False

        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
            return False

        print("\n✅ All validation checks passed")
        return True


def main():
    parser = argparse.ArgumentParser(description="Validate agent configuration")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).parent.parent / "config" / "agents.yaml",
        help="Path to agents.yaml (default: ../config/agents.yaml)"
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=Path(__file__).parent.parent / "config" / "agents.schema.json",
        help="Path to agents.schema.json (default: ../config/agents.schema.json)"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors"
    )

    args = parser.parse_args()

    validator = AgentConfigValidator(args.config, args.schema)
    success = validator.validate(strict=args.strict)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
