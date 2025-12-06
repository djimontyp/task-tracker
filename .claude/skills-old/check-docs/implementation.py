#!/usr/bin/env python3
"""
Documentation Check Skill Implementation

Analyzes git commits to suggest documentation updates.
Simpler than the hook version - just analysis, no auto-triggering.
"""

import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Tuple


def get_commits_since(start_ref: str = None, count: int = 5) -> List[str]:
    """Get commit SHAs since start_ref or last N commits."""
    try:
        if start_ref:
            cmd = ["git", "log", "--format=%H", f"{start_ref}..HEAD"]
        else:
            cmd = ["git", "log", "--format=%H", f"-{count}"]

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return [line.strip() for line in result.stdout.split("\n") if line.strip()]
    except subprocess.CalledProcessError:
        return []


def get_commit_messages(commits: List[str]) -> List[str]:
    """Get commit messages for given SHAs."""
    messages = []
    for sha in commits:
        try:
            result = subprocess.run(
                ["git", "log", "--format=%s", "-1", sha],
                capture_output=True,
                text=True,
                check=True
            )
            messages.append(result.stdout.strip())
        except subprocess.CalledProcessError:
            continue
    return messages


def get_changed_files(commits: List[str]) -> List[str]:
    """Get all files changed in given commits."""
    if not commits:
        return []

    try:
        oldest_commit = commits[-1]
        result = subprocess.run(
            ["git", "diff", "--name-only", f"{oldest_commit}^..HEAD"],
            capture_output=True,
            text=True,
            check=True
        )
        return [line.strip() for line in result.stdout.split("\n") if line.strip()]
    except subprocess.CalledProcessError:
        return []


def filter_relevant_files(files: List[str]) -> Tuple[List[str], List[str]]:
    """Filter to backend and frontend files only."""
    backend = [f for f in files if f.startswith("backend/app/")]
    frontend = [f for f in files if f.startswith("frontend/src/")]
    return backend, frontend


def categorize_files(backend: List[str], frontend: List[str]) -> Dict[str, List[str]]:
    """Categorize files by area."""
    categories = defaultdict(list)

    for f in backend:
        if "api/" in f:
            categories["API routes"].append(f)
        elif "models/" in f:
            categories["Database models"].append(f)
        elif "services/" in f:
            categories["Services"].append(f)
        elif "agents/" in f:
            categories["LLM agents"].append(f)
        elif "tasks/" in f:
            categories["Background tasks"].append(f)

    for f in frontend:
        if "pages/" in f:
            categories["Pages"].append(f)
        elif "features/" in f:
            categories["Features"].append(f)
        elif "components/" in f:
            categories["Components"].append(f)

    return dict(categories)


def determine_change_size(file_count: int, messages: List[str]) -> str:
    """Determine change size based on file count and commit types."""
    has_breaking = any(re.search(r"(feat|refactor).*!:", msg) for msg in messages)
    has_feat = any(msg.startswith("feat") for msg in messages)
    has_refactor = any(msg.startswith("refactor") for msg in messages)

    if file_count >= 6 or has_breaking or has_feat:
        return "large"
    elif file_count >= 3 or has_refactor:
        return "medium"
    else:
        return "small"


def map_to_docs(backend: List[str], frontend: List[str]) -> List[str]:
    """Map changed files to documentation paths."""
    docs = set()

    for f in backend:
        if "api/" in f:
            docs.add("docs/content/{en,uk}/api/")
        elif "models/" in f:
            docs.add("docs/content/{en,uk}/architecture/models.md")
        elif "services/" in f:
            docs.add("docs/content/{en,uk}/architecture/backend-services.md")
        elif "agents/" in f:
            docs.add("docs/content/{en,uk}/architecture/agent-system.md")
        elif "tasks/" in f:
            docs.add("docs/content/{en,uk}/architecture/background-tasks.md")

    if frontend:
        docs.add("docs/content/{en,uk}/frontend/architecture.md")

    return sorted(docs)


def check_docs_exist(doc_paths: List[str]) -> Tuple[List[str], List[str]]:
    """Check which documentation paths exist."""
    existing = []
    missing = []

    project_root = Path.cwd()

    for doc_path in doc_paths:
        # Normalize {en,uk} to en for checking
        doc_path_normalized = doc_path.replace("{en,uk}", "en")
        full_path = project_root / doc_path_normalized

        if full_path.exists() or full_path.parent.exists():
            existing.append(doc_path)
        else:
            missing.append(doc_path)

    return existing, missing


def generate_report(
    commits: List[str],
    messages: List[str],
    all_files: List[str],
    backend: List[str],
    frontend: List[str],
    categories: Dict[str, List[str]],
    size: str,
    docs: List[str],
    missing: List[str]
) -> str:
    """Generate human-readable report."""
    lines = [
        "📚 Documentation Update Check",
        "",
        f"Analyzed: {len(commits)} commits, {len(all_files)} files changed",
        ""
    ]

    # Change size explanation
    size_factors = []
    if len(backend) + len(frontend) >= 6:
        size_factors.append(f"{len(backend) + len(frontend)} files")
    if any(msg.startswith("feat") for msg in messages):
        size_factors.append("feat commit")
    if any(msg.startswith("refactor") for msg in messages):
        size_factors.append("refactor commit")

    if size_factors:
        lines.append(f"Change size: {size} (based on {', '.join(size_factors)})")
    else:
        lines.append(f"Change size: {size}")
    lines.append("")

    # Backend changes
    if backend:
        lines.append(f"Backend changes ({len(backend)} files):")
        backend_categories = {k: v for k, v in categories.items()
                            if k in ["API routes", "Database models", "Services", "LLM agents", "Background tasks"]}
        for category, files in backend_categories.items():
            lines.append(f"  - {category} ({len(files)} files)")
        lines.append("")

    # Frontend changes
    if frontend:
        lines.append(f"Frontend changes ({len(frontend)} files):")
        frontend_categories = {k: v for k, v in categories.items()
                             if k in ["Pages", "Features", "Components"]}
        for category, files in frontend_categories.items():
            lines.append(f"  - {category} ({len(files)} files)")
        lines.append("")

    # Documentation suggestions
    if docs:
        lines.append("Suggested documentation to review/update:")
        for doc in docs:
            status = "✅" if doc not in missing else "⚠️ MISSING"
            lines.append(f"  {status} {doc}")
        lines.append("")

    # Missing docs hint
    if missing:
        lines.append("💡 Use /docs to create missing documentation")
        lines.append("")

    return "\n".join(lines)


def main():
    # Parse arguments
    args = sys.argv[1:]
    start_ref = None
    count = 5

    if args:
        if args[0].isdigit():
            count = int(args[0])
        else:
            start_ref = args[0]

    # Get commits
    commits = get_commits_since(start_ref, count)
    if not commits:
        print("No commits found to analyze.")
        return

    # Get commit info
    messages = get_commit_messages(commits)
    all_files = get_changed_files(commits)

    if not all_files:
        print("No file changes found in commits.")
        return

    # Filter and categorize
    backend, frontend = filter_relevant_files(all_files)

    if not backend and not frontend:
        print("No backend or frontend changes detected.")
        return

    categories = categorize_files(backend, frontend)
    size = determine_change_size(len(backend) + len(frontend), messages)
    docs = map_to_docs(backend, frontend)
    existing, missing = check_docs_exist(docs)

    # Generate and print report
    report = generate_report(
        commits, messages, all_files, backend, frontend,
        categories, size, docs, missing
    )
    print(report)


if __name__ == "__main__":
    main()
