#!/usr/bin/env python3
"""
Initialize Orchestration Session

Creates a new orchestration session with structured artifact directories.
"""

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


def create_session_structure(
    feature_name: str,
    base_dir: str = ".artifacts",
    working_dir: Path | None = None
) -> Dict[str, Any]:
    """
    Create session directory structure for artifact management.

    Args:
        feature_name: Name of the feature being orchestrated
        base_dir: Base directory for artifacts (default: .artifacts)
        working_dir: Working directory (default: current directory)

    Returns:
        Dictionary with session metadata
    """
    if working_dir is None:
        working_dir = Path.cwd()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    session_dir = working_dir / base_dir / feature_name / timestamp

    session_dir.mkdir(parents=True, exist_ok=True)
    (session_dir / "agent-reports").mkdir(exist_ok=True)

    session_metadata = {
        "feature_name": feature_name,
        "timestamp": timestamp,
        "session_dir": str(session_dir),
        "created_at": datetime.now().isoformat(),
        "status": "initialized",
        "agents_executed": [],
        "artifacts_created": []
    }

    context_file = session_dir / "context.json"
    with open(context_file, "w") as f:
        json.dump(session_metadata, f, indent=2)

    print(f"✅ Session initialized: {session_dir}")
    print(f"📁 Session directory: {session_dir}")
    print(f"📝 Context file: {context_file}")

    return session_metadata


def main():
    parser = argparse.ArgumentParser(
        description="Initialize orchestration session with artifact structure"
    )
    parser.add_argument(
        "feature_name",
        help="Name of the feature being orchestrated (e.g., 'user-profile-editing')"
    )
    parser.add_argument(
        "--base-dir",
        default=".artifacts",
        help="Base directory for artifacts (default: .artifacts)"
    )
    parser.add_argument(
        "--working-dir",
        type=Path,
        default=None,
        help="Working directory (default: current directory)"
    )

    args = parser.parse_args()

    metadata = create_session_structure(
        feature_name=args.feature_name,
        base_dir=args.base_dir,
        working_dir=args.working_dir
    )

    print("\n📊 Session Metadata:")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
