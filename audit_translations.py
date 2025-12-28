#!/usr/bin/env python3
"""
Translation Audit Script

Checks translation files for:
1. Missing keys between uk and en
2. Placeholder values (TODO, TBD, ...)
3. Ukrainian pluralization correctness
4. Empty values
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

LOCALES_DIR = Path(__file__).parent / "frontend" / "public" / "locales"
LANGUAGES = ["uk", "en"]
PLACEHOLDER_PATTERNS = [
    re.compile(r"TODO", re.IGNORECASE),
    re.compile(r"TBD", re.IGNORECASE),
    re.compile(r"\.\.\."),
    re.compile(r"xxx", re.IGNORECASE),
    re.compile(r"fixme", re.IGNORECASE),
    re.compile(r"placeholder", re.IGNORECASE),
]

REQUIRED_UK_PLURAL_SUFFIXES = ["_one", "_few", "_many"]
REQUIRED_EN_PLURAL_SUFFIXES = ["_one", "_other"]


class TranslationAuditor:
    def __init__(self):
        self.issues: List[Dict] = []
        self.stats = {
            "total_files": 0,
            "total_keys": {"uk": 0, "en": 0},
            "missing_keys": 0,
            "placeholders": 0,
            "empty_values": 0,
            "plural_issues": 0,
        }

    def load_json(self, file_path: Path) -> Dict | None:
        """Load JSON file"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            self.add_issue("error", f"Failed to load {file_path}: {e}")
            return None

    def flatten_keys(self, obj: Dict, prefix: str = "") -> List[Tuple[str, str]]:
        """Flatten nested object to dot notation keys"""
        keys = []
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                keys.extend(self.flatten_keys(value, full_key))
            else:
                keys.append((full_key, value))
        return keys

    def add_issue(self, level: str, message: str, file: str | None = None):
        """Add issue to report"""
        self.issues.append({"level": level, "file": file, "message": message})

    def check_placeholders(self, file: str, lang: str, entries: List[Tuple[str, str]]):
        """Check for placeholder values"""
        placeholders = []

        for key, value in entries:
            if not isinstance(value, str):
                continue

            for pattern in PLACEHOLDER_PATTERNS:
                if pattern.search(value):
                    placeholders.append(
                        {"key": key, "value": value, "pattern": pattern.pattern}
                    )
                    self.stats["placeholders"] += 1
                    break

        if placeholders:
            msg = f"Found {len(placeholders)} placeholder values:\n"
            msg += "\n".join(f'  - {p["key"]}: "{p["value"]}"' for p in placeholders)
            self.add_issue("warning", msg, f"{lang}/{file}")

    def check_empty_values(self, file: str, lang: str, entries: List[Tuple[str, str]]):
        """Check for empty values"""
        empty = [(k, v) for k, v in entries if isinstance(v, str) and not v.strip()]

        if empty:
            self.stats["empty_values"] += len(empty)
            msg = f"Found {len(empty)} empty values:\n"
            msg += "\n".join(f"  - {k}" for k, _ in empty)
            self.add_issue("error", msg, f"{lang}/{file}")

    def check_ukrainian_plurals(self, file: str, data: Dict):
        """Check Ukrainian pluralization"""
        plurals_section = data.get("plurals")
        if not plurals_section:
            return

        keys = list(plurals_section.keys())
        plural_groups: Dict[str, Set[str]] = {}

        # Group plural keys by base name
        for key in keys:
            match = re.match(r"^(.+?)_(one|few|many)$", key)
            if match:
                base, form = match.groups()
                if base not in plural_groups:
                    plural_groups[base] = set()
                plural_groups[base].add(form)

        # Check each group has all required forms
        for base, forms in plural_groups.items():
            required = {s.replace("_", "") for s in REQUIRED_UK_PLURAL_SUFFIXES}
            missing = required - forms

            if missing:
                self.stats["plural_issues"] += 1
                self.add_issue(
                    "error",
                    f'Plural "{base}" missing forms: {", ".join(sorted(missing))}',
                    f"uk/{file}",
                )

    def check_english_plurals(self, file: str, data: Dict):
        """Check English pluralization"""
        plurals_section = data.get("plurals")
        if not plurals_section:
            return

        keys = list(plurals_section.keys())
        plural_groups: Dict[str, Set[str]] = {}

        # Group plural keys by base name
        for key in keys:
            match = re.match(r"^(.+?)_(one|other)$", key)
            if match:
                base, form = match.groups()
                if base not in plural_groups:
                    plural_groups[base] = set()
                plural_groups[base].add(form)

        # Check each group has all required forms
        for base, forms in plural_groups.items():
            required = {s.replace("_", "") for s in REQUIRED_EN_PLURAL_SUFFIXES}
            missing = required - forms

            if missing:
                self.stats["plural_issues"] += 1
                self.add_issue(
                    "error",
                    f'Plural "{base}" missing forms: {", ".join(sorted(missing))}',
                    f"en/{file}",
                )

    def compare_keys(
        self, file: str, uk_entries: List[Tuple], en_entries: List[Tuple]
    ):
        """Compare keys between languages"""
        uk_keys = {k for k, _ in uk_entries}
        en_keys = {k for k, _ in en_entries}

        missing_in_en = uk_keys - en_keys
        missing_in_uk = en_keys - uk_keys

        if missing_in_en:
            self.stats["missing_keys"] += len(missing_in_en)
            msg = f"Missing {len(missing_in_en)} keys in EN:\n"
            msg += "\n".join(f"  - {k}" for k in sorted(missing_in_en))
            self.add_issue("error", msg, f"en/{file}")

        if missing_in_uk:
            self.stats["missing_keys"] += len(missing_in_uk)
            msg = f"Missing {len(missing_in_uk)} keys in UK:\n"
            msg += "\n".join(f"  - {k}" for k in sorted(missing_in_uk))
            self.add_issue("error", msg, f"uk/{file}")

    def audit_file(self, file: str):
        """Audit a single file pair"""
        uk_path = LOCALES_DIR / "uk" / file
        en_path = LOCALES_DIR / "en" / file

        uk_data = self.load_json(uk_path)
        en_data = self.load_json(en_path)

        if not uk_data or not en_data:
            return

        uk_entries = self.flatten_keys(uk_data)
        en_entries = self.flatten_keys(en_data)

        self.stats["total_keys"]["uk"] += len(uk_entries)
        self.stats["total_keys"]["en"] += len(en_entries)

        # Check for missing keys
        self.compare_keys(file, uk_entries, en_entries)

        # Check for placeholders
        self.check_placeholders(file, "uk", uk_entries)
        self.check_placeholders(file, "en", en_entries)

        # Check for empty values
        self.check_empty_values(file, "uk", uk_entries)
        self.check_empty_values(file, "en", en_entries)

        # Check pluralization
        self.check_ukrainian_plurals(file, uk_data)
        self.check_english_plurals(file, en_data)

    def run(self):
        """Run full audit"""
        print("🔍 Starting translation audit...\n")

        uk_dir = LOCALES_DIR / "uk"
        en_dir = LOCALES_DIR / "en"

        uk_files = {f.name for f in uk_dir.glob("*.json")}
        en_files = {f.name for f in en_dir.glob("*.json")}

        # Check for file discrepancies
        all_files = uk_files | en_files
        missing_in_en = uk_files - en_files
        missing_in_uk = en_files - uk_files

        if missing_in_en:
            self.add_issue("error", f"Files missing in EN: {', '.join(missing_in_en)}")

        if missing_in_uk:
            self.add_issue("error", f"Files missing in UK: {', '.join(missing_in_uk)}")

        # Audit each file
        for file in sorted(all_files):
            if file in uk_files and file in en_files:
                self.audit_file(file)
                self.stats["total_files"] += 1

        self.print_report()

    def print_report(self):
        """Print audit report"""
        print("═══════════════════════════════════════════════════════")
        print("📊 TRANSLATION AUDIT REPORT")
        print("═══════════════════════════════════════════════════════\n")

        # Statistics
        print("📈 STATISTICS:")
        print(f'   Files audited: {self.stats["total_files"]}')
        print(f'   Total keys (UK): {self.stats["total_keys"]["uk"]}')
        print(f'   Total keys (EN): {self.stats["total_keys"]["en"]}')
        print()

        # Issues summary
        errors = sum(1 for i in self.issues if i["level"] == "error")
        warnings = sum(1 for i in self.issues if i["level"] == "warning")

        print("🚨 ISSUES SUMMARY:")
        print(f"   Errors: {errors}")
        print(f"   Warnings: {warnings}")
        print(f'   - Missing keys: {self.stats["missing_keys"]}')
        print(f'   - Placeholder values: {self.stats["placeholders"]}')
        print(f'   - Empty values: {self.stats["empty_values"]}')
        print(f'   - Pluralization issues: {self.stats["plural_issues"]}')
        print()

        # Detailed issues
        if self.issues:
            print("📋 DETAILED ISSUES:\n")

            error_issues = [i for i in self.issues if i["level"] == "error"]
            warning_issues = [i for i in self.issues if i["level"] == "warning"]

            if error_issues:
                print("❌ ERRORS:")
                for issue in error_issues:
                    if issue["file"]:
                        print(f'\n   📄 {issue["file"]}')
                    print(f'   {issue["message"]}')
                print()

            if warning_issues:
                print("⚠️  WARNINGS:")
                for issue in warning_issues:
                    if issue["file"]:
                        print(f'\n   📄 {issue["file"]}')
                    print(f'   {issue["message"]}')
                print()
        else:
            print("✅ NO ISSUES FOUND!\n")

        print("═══════════════════════════════════════════════════════")

        # Summary
        if errors > 0:
            print("\n❌ Audit failed with errors\n")
            exit(1)
        elif warnings > 0:
            print("\n⚠️  Audit completed with warnings\n")
        else:
            print("\n✅ Audit passed successfully\n")


if __name__ == "__main__":
    auditor = TranslationAuditor()
    auditor.run()
