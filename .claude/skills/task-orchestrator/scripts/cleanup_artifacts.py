#!/usr/bin/env python3
"""
Cleanup Artifacts

IMPORTANT: This script NEVER deletes files without explicit user confirmation.
It only lists what COULD be cleaned up and asks for confirmation.
"""

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any


def find_old_sessions(
    base_dir: Path,
    retention_days: int
) -> List[Dict[str, Any]]:
    """
    Find sessions older than retention period.

    Args:
        base_dir: Base artifacts directory
        retention_days: Number of days to retain

    Returns:
        List of session metadata for old sessions
    """
    if not base_dir.exists():
        return []

    cutoff_date = datetime.now() - timedelta(days=retention_days)
    old_sessions = []

    for feature_dir in base_dir.iterdir():
        if not feature_dir.is_dir():
            continue

        for session_dir in feature_dir.iterdir():
            if not session_dir.is_dir():
                continue

            context_file = session_dir / "context.json"
            if not context_file.exists():
                continue

            try:
                with open(context_file) as f:
                    context = json.load(f)

                created_at_str = context.get("created_at")
                if not created_at_str:
                    continue

                created_at = datetime.fromisoformat(created_at_str)
                if created_at < cutoff_date:
                    session_size = sum(
                        f.stat().st_size
                        for f in session_dir.rglob("*")
                        if f.is_file()
                    )

                    old_sessions.append({
                        "feature": feature_dir.name,
                        "timestamp": session_dir.name,
                        "path": session_dir,
                        "created_at": created_at,
                        "age_days": (datetime.now() - created_at).days,
                        "size_mb": session_size / (1024 * 1024),
                        "status": context.get("status", "unknown")
                    })
            except (json.JSONDecodeError, ValueError):
                continue

    return sorted(old_sessions, key=lambda x: x["created_at"])


def format_session_info(session: Dict[str, Any]) -> str:
    """Format session info for display."""
    return (
        f"  📁 {session['feature']}/{session['timestamp']}\n"
        f"     Created: {session['created_at'].strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"     Age: {session['age_days']} days\n"
        f"     Size: {session['size_mb']:.2f} MB\n"
        f"     Status: {session['status']}\n"
        f"     Path: {session['path']}"
    )


def list_cleanup_candidates(
    base_dir: Path,
    retention_days: int
) -> None:
    """
    List artifacts that could be cleaned up.

    IMPORTANT: This only lists, never deletes without confirmation.
    """
    print(f"🔍 Scanning for sessions older than {retention_days} days...")
    print(f"📂 Base directory: {base_dir}\n")

    old_sessions = find_old_sessions(base_dir, retention_days)

    if not old_sessions:
        print(f"✅ No sessions older than {retention_days} days found")
        return

    print(f"⚠️  Found {len(old_sessions)} session(s) eligible for cleanup:\n")

    total_size = 0
    for session in old_sessions:
        print(format_session_info(session))
        print()
        total_size += session["size_mb"]

    print(f"💾 Total size: {total_size:.2f} MB\n")

    print("❗ IMPORTANT:")
    print("   This script will NOT delete anything without your explicit confirmation.")
    print("   To proceed with cleanup, run again with --confirm flag.")


def cleanup_sessions(
    sessions: List[Dict[str, Any]],
    dry_run: bool = True
) -> None:
    """
    Clean up old sessions.

    Args:
        sessions: List of sessions to clean up
        dry_run: If True, only show what would be deleted
    """
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be deleted\n")

    for session in sessions:
        if dry_run:
            print(f"Would delete: {session['path']}")
        else:
            try:
                import shutil
                shutil.rmtree(session['path'])
                print(f"✅ Deleted: {session['path']}")
            except Exception as e:
                print(f"❌ Failed to delete {session['path']}: {e}")

    if not dry_run:
        print(f"\n✅ Cleanup complete. Removed {len(sessions)} session(s)")


def interactive_cleanup(base_dir: Path, retention_days: int) -> None:
    """
    Interactive cleanup with user confirmation for each session.
    """
    old_sessions = find_old_sessions(base_dir, retention_days)

    if not old_sessions:
        print(f"✅ No sessions older than {retention_days} days found")
        return

    print(f"⚠️  Found {len(old_sessions)} session(s) eligible for cleanup\n")

    to_delete = []
    for session in old_sessions:
        print(format_session_info(session))
        response = input("\n  Delete this session? (yes/no) [no]: ").strip().lower()

        if response in ("yes", "y"):
            to_delete.append(session)
            print("  ✅ Marked for deletion\n")
        else:
            print("  ⏭️  Skipped\n")

    if not to_delete:
        print("✅ No sessions marked for deletion")
        return

    print(f"\n⚠️  About to delete {len(to_delete)} session(s)")
    final_confirm = input("Proceed with deletion? (yes/no) [no]: ").strip().lower()

    if final_confirm in ("yes", "y"):
        cleanup_sessions(to_delete, dry_run=False)
    else:
        print("❌ Cleanup cancelled")


def main():
    parser = argparse.ArgumentParser(
        description="List or cleanup old artifact sessions (REQUIRES CONFIRMATION)"
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path.cwd() / ".artifacts",
        help="Base artifacts directory (default: .artifacts)"
    )
    parser.add_argument(
        "--retention-days",
        type=int,
        default=7,
        help="Number of days to retain sessions (default: 7)"
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Confirm cleanup (without this, only lists candidates)"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Interactive mode - confirm each session individually"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted without actually deleting"
    )

    args = parser.parse_args()

    if args.interactive:
        interactive_cleanup(args.base_dir, args.retention_days)
    elif args.confirm or args.dry_run:
        old_sessions = find_old_sessions(args.base_dir, args.retention_days)
        if old_sessions:
            cleanup_sessions(old_sessions, dry_run=args.dry_run or not args.confirm)
        else:
            print(f"✅ No sessions older than {args.retention_days} days found")
    else:
        list_cleanup_candidates(args.base_dir, args.retention_days)


if __name__ == "__main__":
    main()
