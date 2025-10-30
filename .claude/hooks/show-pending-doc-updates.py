#!/usr/bin/env python3
"""
Claude Code Hook: Show Pending Documentation Updates

Triggers on SessionEnd to show accumulated small changes that need documentation.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List
from datetime import datetime, timedelta

HOOKS_DIR = Path(__file__).parent
PENDING_UPDATES_FILE = HOOKS_DIR / ".pending-doc-updates.json"
REMINDER_THRESHOLD_HOURS = 24


def load_pending_updates() -> Dict:
    """Load pending documentation updates from file."""
    if not PENDING_UPDATES_FILE.exists():
        return {"small_changes": [], "last_reminder": None}

    try:
        with open(PENDING_UPDATES_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"small_changes": [], "last_reminder": None}


def save_pending_updates(data: Dict):
    """Save pending documentation updates to file."""
    try:
        with open(PENDING_UPDATES_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except IOError:
        pass


def should_show_reminder(pending: Dict) -> bool:
    """
    Determine if we should show reminder based on:
    1. Number of accumulated changes (>= 3)
    2. Time since last reminder (>= 24 hours)
    """
    small_changes = pending.get("small_changes", [])
    last_reminder = pending.get("last_reminder")

    if len(small_changes) >= 3:
        return True

    if last_reminder and len(small_changes) > 0:
        try:
            last_time = datetime.fromisoformat(last_reminder)
            now = datetime.now()
            if now - last_time >= timedelta(hours=REMINDER_THRESHOLD_HOURS):
                return True
        except ValueError:
            return len(small_changes) > 0

    return False


def aggregate_changes(small_changes: List[Dict]) -> Dict:
    """Aggregate accumulated changes for summary."""
    all_backend_files = set()
    all_frontend_files = set()
    all_docs = set()
    all_commits = []

    for change in small_changes:
        all_backend_files.update(change.get("backend_files", []))
        all_frontend_files.update(change.get("frontend_files", []))
        all_docs.update(change.get("docs_suggested", []))
        all_commits.append(change.get("commits", ""))

    return {
        "backend_files": list(all_backend_files),
        "frontend_files": list(all_frontend_files),
        "docs_suggested": list(all_docs),
        "commits": [c for c in all_commits if c]
    }


def create_summary_message(pending: Dict) -> str:
    """Create summary message for accumulated changes."""
    small_changes = pending.get("small_changes", [])
    aggregated = aggregate_changes(small_changes)

    message_lines = [
        "📚 Pending Documentation Updates Summary:",
        "",
        f"Accumulated {len(small_changes)} small changes that need documentation:",
        ""
    ]

    backend_files = aggregated["backend_files"]
    frontend_files = aggregated["frontend_files"]

    if backend_files:
        backend_areas = set()
        for f in backend_files:
            if "api/" in f:
                backend_areas.add("API routes")
            elif "models/" in f:
                backend_areas.add("models")
            elif "services/" in f:
                backend_areas.add("services")
            elif "utils/" in f:
                backend_areas.add("utilities")

        message_lines.append(f"  Backend: {len(backend_files)} files ({', '.join(sorted(backend_areas))})")

    if frontend_files:
        frontend_areas = set()
        for f in frontend_files:
            if "pages/" in f:
                frontend_areas.add("pages")
            elif "features/" in f:
                frontend_areas.add("features")
            elif "components/" in f:
                frontend_areas.add("components")

        message_lines.append(f"  Frontend: {len(frontend_files)} files ({', '.join(sorted(frontend_areas))})")

    docs_suggested = aggregated["docs_suggested"]
    if docs_suggested:
        message_lines.append("")
        message_lines.append("Suggested documentation to review/update:")
        for doc in sorted(set(docs_suggested)):
            message_lines.append(f"  • {doc}")

    message_lines.append("")
    message_lines.append("💡 These are small changes accumulated over time.")
    message_lines.append("   Consider updating documentation when convenient using /docs command")

    return "\n".join(message_lines)


def clear_pending_updates():
    """Clear pending updates and mark reminder time."""
    pending = load_pending_updates()
    pending["small_changes"] = []
    pending["last_reminder"] = datetime.now().isoformat()
    save_pending_updates(pending)


def main():
    pending = load_pending_updates()

    if not should_show_reminder(pending):
        sys.exit(0)

    summary_message = create_summary_message(pending)

    output = {
        "continue": True,
        "systemMessage": summary_message
    }

    print(json.dumps(output))

    clear_pending_updates()
    sys.exit(0)


if __name__ == "__main__":
    main()
