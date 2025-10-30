#!/usr/bin/env python3
"""
Claude Code Hook: Documentation Update Reminder

Triggers after git commits to check if documentation needs updating.
Uses cooldown period to avoid false starts when multiple commits happen rapidly.
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Dict, Tuple, Optional

COOLDOWN_SECONDS = 60
HOOKS_DIR = Path(__file__).parent
COOLDOWN_FILE = HOOKS_DIR / ".last-commit-check"
SERIES_START_FILE = HOOKS_DIR / ".commit-series-start"


def read_hook_input() -> Dict:
    """Read JSON input from stdin."""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def is_git_commit_command(data: Dict) -> bool:
    """Check if this is a git commit command."""
    command = data.get("tool_input", {}).get("command", "")
    return "git commit" in command


def check_cooldown() -> Tuple[bool, Optional[float]]:
    """
    Check if we're in cooldown period.
    Returns: (is_in_cooldown, last_timestamp)
    """
    if not COOLDOWN_FILE.exists():
        return False, None

    try:
        with open(COOLDOWN_FILE, "r") as f:
            last_timestamp = float(f.read().strip())

        elapsed = time.time() - last_timestamp
        return elapsed < COOLDOWN_SECONDS, last_timestamp
    except (ValueError, IOError):
        return False, None


def update_cooldown():
    """Update cooldown timestamp."""
    COOLDOWN_FILE.write_text(str(time.time()))


def get_series_start_sha() -> Optional[str]:
    """Get the SHA where commit series started."""
    if SERIES_START_FILE.exists():
        return SERIES_START_FILE.read_text().strip()

    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD~1"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None


def set_series_start_sha():
    """Record current HEAD as series start."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        SERIES_START_FILE.write_text(result.stdout.strip())
    except subprocess.CalledProcessError:
        pass


def get_changed_files(start_sha: str) -> List[str]:
    """Get list of changed files since start_sha."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", f"{start_sha}..HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        return [line.strip() for line in result.stdout.split("\n") if line.strip()]
    except subprocess.CalledProcessError:
        return []


def get_commit_messages(start_sha: str) -> List[str]:
    """Get commit messages since start_sha."""
    try:
        result = subprocess.run(
            ["git", "log", "--format=%s", f"{start_sha}..HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        return [line.strip() for line in result.stdout.split("\n") if line.strip()]
    except subprocess.CalledProcessError:
        return []


def filter_relevant_files(files: List[str]) -> Tuple[List[str], List[str]]:
    """
    Filter files to backend and frontend changes.
    Returns: (backend_files, frontend_files)
    """
    backend_files = [f for f in files if f.startswith("backend/app/")]
    frontend_files = [f for f in files if f.startswith("frontend/src/")]
    return backend_files, frontend_files


def categorize_by_file_count(count: int) -> str:
    """Categorize change size by file count."""
    if count <= 2:
        return "small"
    elif count <= 5:
        return "medium"
    else:
        return "large"


def categorize_by_commit_type(messages: List[str]) -> str:
    """Categorize change size by commit message types."""
    has_breaking = any(re.search(r"(feat|refactor).*!:", msg) for msg in messages)
    has_feat = any(msg.startswith("feat") for msg in messages)
    has_refactor = any(msg.startswith("refactor") for msg in messages)

    if has_breaking or has_feat:
        return "large"
    elif has_refactor:
        return "medium"
    else:
        return "small"


def categorize_by_file_area(files: List[str]) -> str:
    """Categorize change size by affected file areas."""
    high_priority_patterns = [
        r"backend/app/api/",
        r"backend/app/models/",
        r"frontend/src/pages/",
    ]

    medium_priority_patterns = [
        r"backend/app/services/",
        r"frontend/src/features/",
    ]

    high_count = sum(1 for f in files if any(re.search(p, f) for p in high_priority_patterns))
    medium_count = sum(1 for f in files if any(re.search(p, f) for p in medium_priority_patterns))

    if high_count >= 3:
        return "large"
    elif high_count >= 1 or medium_count >= 3:
        return "medium"
    else:
        return "small"


def determine_change_size(files: List[str], messages: List[str]) -> str:
    """
    Determine overall change size using combined approach.
    Returns: "small", "medium", or "large"
    """
    size_by_count = categorize_by_file_count(len(files))
    size_by_type = categorize_by_commit_type(messages)
    size_by_area = categorize_by_file_area(files)

    sizes = {"small": 0, "medium": 1, "large": 2}
    max_size = max(sizes[size_by_count], sizes[size_by_type], sizes[size_by_area])

    return ["small", "medium", "large"][max_size]


def map_files_to_docs(backend_files: List[str], frontend_files: List[str]) -> List[str]:
    """
    Map changed files to suggested documentation paths.
    Returns list of doc paths that might need updating.
    """
    doc_suggestions = set()

    for f in backend_files:
        if f.startswith("backend/app/api/"):
            doc_suggestions.add("docs/content/{en,uk}/api/")
        elif f.startswith("backend/app/models/"):
            doc_suggestions.add("docs/content/{en,uk}/architecture/models.md")
        elif f.startswith("backend/app/services/"):
            doc_suggestions.add("docs/content/{en,uk}/architecture/backend-services.md")
        elif f.startswith("backend/app/agents/"):
            doc_suggestions.add("docs/content/{en,uk}/architecture/agent-system.md")
        elif f.startswith("backend/app/tasks/"):
            doc_suggestions.add("docs/content/{en,uk}/architecture/background-tasks.md")

    if frontend_files:
        doc_suggestions.add("docs/content/{en,uk}/frontend/architecture.md")

    return sorted(doc_suggestions)


def check_docs_exist(doc_paths: List[str]) -> Tuple[List[str], List[str]]:
    """
    Check which documentation paths exist.
    Returns: (existing_docs, missing_docs)
    """
    existing = []
    missing = []

    project_root = Path(os.environ.get("CLAUDE_PROJECT_DIR", Path.cwd()))

    for doc_path in doc_paths:
        doc_path_normalized = doc_path.replace("{en,uk}", "en")
        full_path = project_root / doc_path_normalized

        if full_path.exists():
            existing.append(doc_path)
        else:
            missing.append(doc_path)

    return existing, missing


def create_system_message(
    size: str,
    backend_files: List[str],
    frontend_files: List[str],
    doc_suggestions: List[str],
    missing_docs: List[str]
) -> str:
    """Create system message for Claude."""
    scope = []
    if backend_files:
        scope.append(f"backend ({len(backend_files)} files)")
    if frontend_files:
        scope.append(f"frontend ({len(frontend_files)} files)")

    scope_str = " and ".join(scope)

    message_lines = [
        f"📚 Documentation Update Reminder:",
        f"",
        f"Detected {size} changes in {scope_str}.",
    ]

    if backend_files:
        affected_areas = set()
        for f in backend_files:
            if "api/" in f:
                affected_areas.add("API routes")
            elif "models/" in f:
                affected_areas.add("database models")
            elif "services/" in f:
                affected_areas.add("services")
            elif "agents/" in f:
                affected_areas.add("LLM agents")

        if affected_areas:
            message_lines.append(f"Backend areas: {', '.join(sorted(affected_areas))}")

    if frontend_files:
        affected_areas = set()
        for f in frontend_files:
            if "pages/" in f:
                affected_areas.add("pages")
            elif "features/" in f:
                affected_areas.add("features")
            elif "components/" in f:
                affected_areas.add("components")

        if affected_areas:
            message_lines.append(f"Frontend areas: {', '.join(sorted(affected_areas))}")

    if doc_suggestions:
        message_lines.append(f"")
        message_lines.append("Suggested documentation to review/update:")
        for doc in doc_suggestions:
            status = "✅" if doc not in missing_docs else "⚠️ MISSING"
            message_lines.append(f"  {status} {doc}")

    if missing_docs:
        message_lines.append(f"")
        message_lines.append("💡 Consider creating missing documentation files using /docs command")

    message_lines.append(f"")
    message_lines.append("Adding to TODO: 'Update documentation for recent changes'")

    return "\n".join(message_lines)


def cleanup_cooldown_files():
    """Remove cooldown tracking files."""
    COOLDOWN_FILE.unlink(missing_ok=True)
    SERIES_START_FILE.unlink(missing_ok=True)


def main():
    data = read_hook_input()

    if not is_git_commit_command(data):
        sys.exit(0)

    in_cooldown, last_timestamp = check_cooldown()

    if in_cooldown:
        update_cooldown()
        sys.exit(0)

    if not SERIES_START_FILE.exists():
        set_series_start_sha()

    update_cooldown()

    start_sha = get_series_start_sha()
    if not start_sha:
        cleanup_cooldown_files()
        sys.exit(0)

    changed_files = get_changed_files(start_sha)
    if not changed_files:
        cleanup_cooldown_files()
        sys.exit(0)

    backend_files, frontend_files = filter_relevant_files(changed_files)

    if not backend_files and not frontend_files:
        cleanup_cooldown_files()
        sys.exit(0)

    commit_messages = get_commit_messages(start_sha)
    all_relevant_files = backend_files + frontend_files

    change_size = determine_change_size(all_relevant_files, commit_messages)

    if change_size == "small":
        cleanup_cooldown_files()
        sys.exit(0)

    doc_suggestions = map_files_to_docs(backend_files, frontend_files)
    existing_docs, missing_docs = check_docs_exist(doc_suggestions)

    system_message = create_system_message(
        change_size,
        backend_files,
        frontend_files,
        doc_suggestions,
        missing_docs
    )

    output = {
        "continue": True,
        "hookSpecificOutput": {
            "decision": "continue"
        },
        "systemMessage": system_message
    }

    print(json.dumps(output))

    cleanup_cooldown_files()
    sys.exit(0)


if __name__ == "__main__":
    main()
