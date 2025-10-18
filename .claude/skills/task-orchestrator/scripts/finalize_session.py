#!/usr/bin/env python3
"""
Finalize Orchestration Session

Marks session as complete and optionally triggers artifact cleanup.
This ensures artifacts don't accumulate as long-term storage.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


def load_session_context(session_dir: Path) -> Dict[str, Any]:
    """Load session context from context.json."""
    context_file = session_dir / "context.json"
    if not context_file.exists():
        raise FileNotFoundError(f"Context file not found: {context_file}")

    with open(context_file) as f:
        return json.load(f)


def save_session_context(session_dir: Path, context: Dict[str, Any]) -> None:
    """Save updated session context to context.json."""
    context_file = session_dir / "context.json"
    with open(context_file, "w") as f:
        json.dump(context, f, indent=2)


def check_summary_exists(session_dir: Path) -> bool:
    """Check if summary.md exists for this session."""
    summary_file = session_dir / "summary.md"
    return summary_file.exists()


def aggregate_reports_if_needed(session_dir: Path) -> None:
    """Run aggregate_reports.py if summary doesn't exist."""
    if check_summary_exists(session_dir):
        print("✅ Summary already exists")
        return

    reports_dir = session_dir / "agent-reports"
    if not reports_dir.exists() or not list(reports_dir.glob("*-report.md")):
        print("⚠️  No agent reports found, skipping aggregation")
        return

    print("📊 Aggregating agent reports...")
    script_path = Path(__file__).parent / "aggregate_reports.py"

    try:
        subprocess.run(
            [sys.executable, str(script_path), str(session_dir)],
            check=True,
            capture_output=True,
            text=True
        )
        print("✅ Reports aggregated successfully")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Failed to aggregate reports: {e.stderr}")


def prompt_session_continuation() -> bool:
    """Ask user if session will continue."""
    print("\n" + "="*60)
    print("📋 Session Finalization")
    print("="*60)

    response = input("\nWill you continue working on this feature later? (yes/no) [no]: ").strip().lower()
    return response in ("yes", "y")


def prompt_cleanup_artifacts(base_dir: Path, retention_days: int = 7) -> bool:
    """Ask user if they want to clean up old artifacts."""
    print("\n" + "="*60)
    print("🧹 Artifact Cleanup")
    print("="*60)
    print(f"\nArtifacts are temporary and should not be long-term storage.")
    print(f"Would you like to clean up artifacts older than {retention_days} days?")

    response = input("\nRun interactive cleanup? (yes/no) [yes]: ").strip().lower()
    return response in ("yes", "y", "")


def run_interactive_cleanup(base_dir: Path, retention_days: int, intelligent: bool = True) -> None:
    """Run cleanup script in interactive mode."""
    print("\n" + "="*60)
    print("🔍 Starting Interactive Cleanup")
    print("="*60 + "\n")

    script_path = Path(__file__).parent / "cleanup_artifacts.py"

    cmd = [
        sys.executable,
        str(script_path),
        "--interactive",
        "--base-dir", str(base_dir),
        "--retention-days", str(retention_days)
    ]

    if intelligent:
        cmd.append("--intelligent")

    try:
        subprocess.run(cmd, check=False)
    except KeyboardInterrupt:
        print("\n⏹️  Cleanup cancelled by user")


def display_session_summary(context: Dict[str, Any], session_dir: Path) -> None:
    """Display session information before finalization."""
    print("\n" + "="*60)
    print("📊 Session Summary")
    print("="*60)

    try:
        session_dir_rel = session_dir.relative_to(Path.cwd())
    except ValueError:
        session_dir_rel = session_dir

    print(f"\n🎯 Feature: {context.get('feature_name', 'unknown')}")
    print(f"🕒 Created: {context.get('created_at', 'unknown')}")
    print(f"📁 Location: {session_dir_rel}")

    if context.get('agents_executed'):
        print(f"\n🤖 Agents executed: {', '.join(context['agents_executed'])}")

    if context.get('reports_aggregated'):
        print(f"📄 Reports aggregated: {context['reports_aggregated']}")

    summary_file = session_dir / "summary.md"
    if summary_file.exists():
        size_kb = summary_file.stat().st_size / 1024
        print(f"📝 Summary: {summary_file.name} ({size_kb:.1f} KB)")


def finalize_session(
    session_dir: Path,
    skip_aggregation: bool = False,
    skip_cleanup: bool = False,
    retention_days: int = 7
) -> None:
    """
    Finalize orchestration session and optionally clean up artifacts.

    Args:
        session_dir: Path to session directory
        skip_aggregation: Skip report aggregation step
        skip_cleanup: Skip cleanup prompt
        retention_days: Days to retain artifacts for cleanup
    """
    if not session_dir.exists():
        print(f"❌ Session directory not found: {session_dir}")
        return

    try:
        context = load_session_context(session_dir)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        return

    display_session_summary(context, session_dir)

    current_status = context.get("status", "unknown")
    if current_status == "completed":
        print("\n⚠️  Session is already marked as completed")
        response = input("Finalize again? (yes/no) [no]: ").strip().lower()
        if response not in ("yes", "y"):
            print("⏹️  Finalization cancelled")
            return

    if not skip_aggregation:
        aggregate_reports_if_needed(session_dir)

    will_continue = prompt_session_continuation()

    if will_continue:
        print("\n✅ Session remains active for continued work")
        print("💡 Run this script again when you're ready to finalize")
        return

    context["status"] = "completed"
    context["completed_at"] = datetime.now().isoformat()
    save_session_context(session_dir, context)

    print("\n✅ Session marked as completed")

    if not skip_cleanup:
        base_dir = session_dir.parent.parent

        if prompt_cleanup_artifacts(base_dir, retention_days):
            run_interactive_cleanup(base_dir, retention_days)
        else:
            print("\n⏭️  Skipping cleanup")
            print(f"💡 You can run cleanup later with:")
            print(f"   python {Path(__file__).parent / 'cleanup_artifacts.py'} --interactive")

    print("\n" + "="*60)
    print("🎉 Session Finalized Successfully")
    print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description="Finalize orchestration session and optionally clean up artifacts"
    )
    parser.add_argument(
        "session_dir",
        type=str,
        help="Path to orchestration session directory (e.g., .artifacts/feature-name/20240118_120000)"
    )
    parser.add_argument(
        "--skip-aggregation",
        action="store_true",
        help="Skip report aggregation step"
    )
    parser.add_argument(
        "--skip-cleanup",
        action="store_true",
        help="Skip artifact cleanup prompt"
    )
    parser.add_argument(
        "--retention-days",
        type=int,
        default=7,
        help="Number of days to retain artifacts (default: 7)"
    )

    args = parser.parse_args()

    session_dir = Path(args.session_dir)
    if not session_dir.is_absolute():
        session_dir = Path.cwd() / session_dir

    try:
        finalize_session(
            session_dir=session_dir,
            skip_aggregation=args.skip_aggregation,
            skip_cleanup=args.skip_cleanup,
            retention_days=args.retention_days
        )
    except KeyboardInterrupt:
        print("\n\n⏹️  Finalization cancelled by user")
        sys.exit(1)


if __name__ == "__main__":
    main()
