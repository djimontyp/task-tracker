#!/usr/bin/env python3
"""
Load Orchestration Session

Loads session context for resumption. Can be used by Claude or scripts.
"""

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional


def find_latest_session(feature_dir: Path) -> Optional[Path]:
    """
    Find the most recent session for a feature.

    Args:
        feature_dir: Feature directory (e.g., .artifacts/user-auth/)

    Returns:
        Path to latest session directory or None
    """
    if not feature_dir.exists():
        return None

    sessions = [
        d for d in feature_dir.iterdir()
        if d.is_dir() and (d / "context.json").exists()
    ]

    if not sessions:
        return None

    return max(sessions, key=lambda d: d.name)


def load_session_context(session_dir: Path) -> Dict[str, Any]:
    """Load context.json from session directory."""
    context_file = session_dir / "context.json"

    if not context_file.exists():
        raise FileNotFoundError(f"context.json not found in {session_dir}")

    with open(context_file) as f:
        return json.load(f)


def load_task_breakdown(session_dir: Path) -> Optional[List[Dict[str, Any]]]:
    """
    Load task breakdown if it exists.

    Returns:
        List of tasks with status or None if not found
    """
    breakdown_file = session_dir / "task-breakdown.json"

    if not breakdown_file.exists():
        return None

    with open(breakdown_file) as f:
        return json.load(f)


def load_agent_reports(session_dir: Path) -> List[Dict[str, Any]]:
    """Load all agent reports from session."""
    reports_dir = session_dir / "agent-reports"

    if not reports_dir.exists():
        return []

    reports = []
    for report_file in sorted(reports_dir.glob("*-report.md")):
        reports.append({
            "agent": report_file.stem.replace("-report", ""),
            "path": str(report_file),
            "size": report_file.stat().st_size,
            "modified": datetime.fromtimestamp(report_file.stat().st_mtime).isoformat()
        })

    return reports


def get_session_summary(session_dir: Path) -> Dict[str, Any]:
    """
    Get complete session summary for resumption.

    Returns:
        Dictionary with all session information (RELATIVE paths)
    """
    context = load_session_context(session_dir)

    try:
        session_dir_rel = session_dir.relative_to(Path.cwd())
    except ValueError:
        session_dir_rel = session_dir

    summary = {
        "session_dir": str(session_dir_rel),
        "feature_name": context.get("feature_name", "unknown"),
        "timestamp": context.get("timestamp", "unknown"),
        "status": context.get("status", "unknown"),
        "created_at": context.get("created_at"),
        "completed_at": context.get("completed_at"),
        "context": context,
        "task_breakdown": load_task_breakdown(session_dir),
        "agent_reports": load_agent_reports(session_dir),
    }

    summary_file = session_dir / "summary.md"
    summary["has_summary"] = summary_file.exists()

    return summary


def format_session_info(summary: Dict[str, Any], verbose: bool = False) -> str:
    """Format session info for display."""
    lines = [
        "=" * 60,
        f"📊 Session: {summary['feature_name']}",
        "=" * 60,
        f"",
        f"📁 Location: {summary['session_dir']}",
        f"🆔 Timestamp: {summary['timestamp']}",
        f"📌 Status: {summary['status']}",
        f"🕒 Created: {summary['created_at']}",
    ]

    if summary.get('completed_at'):
        lines.append(f"✅ Completed: {summary['completed_at']}")

    if summary['agent_reports']:
        lines.append(f"\n🤖 Agents Executed ({len(summary['agent_reports'])}):")
        for report in summary['agent_reports']:
            lines.append(f"   - {report['agent']}")

    if summary['task_breakdown']:
        tasks = summary['task_breakdown']
        completed = sum(1 for t in tasks if t.get('status') == 'completed')
        in_progress = sum(1 for t in tasks if t.get('status') == 'in_progress')
        pending = sum(1 for t in tasks if t.get('status') == 'pending')

        lines.append(f"\n📝 Task Breakdown:")
        lines.append(f"   ✅ Completed: {completed}")
        lines.append(f"   🔄 In Progress: {in_progress}")
        lines.append(f"   ⏳ Pending: {pending}")

        if verbose:
            lines.append(f"\n   Tasks:")
            for i, task in enumerate(tasks, 1):
                status_icon = {
                    'completed': '✅',
                    'in_progress': '🔄',
                    'pending': '⏳'
                }.get(task.get('status', 'pending'), '⏳')
                lines.append(f"   {i}. {status_icon} {task.get('content', 'Unknown')}")

    if summary['has_summary']:
        lines.append(f"\n📄 Summary report available")

    lines.append("=" * 60)

    return "\n".join(lines)


def list_feature_sessions(feature_dir: Path) -> List[Dict[str, Any]]:
    """List all sessions for a feature."""
    if not feature_dir.exists():
        return []

    sessions = []
    for session_dir in sorted(feature_dir.iterdir(), reverse=True):
        if not session_dir.is_dir():
            continue

        context_file = session_dir / "context.json"
        if not context_file.exists():
            continue

        try:
            summary = get_session_summary(session_dir)
            sessions.append(summary)
        except Exception as e:
            print(f"⚠️  Failed to load session {session_dir.name}: {e}")

    return sessions


def main():
    parser = argparse.ArgumentParser(
        description="Load orchestration session for resumption"
    )
    parser.add_argument(
        "path",
        type=str,
        help="Path to session directory or feature directory (relative or absolute)"
    )
    parser.add_argument(
        "--latest",
        action="store_true",
        help="Load latest session from feature directory"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all sessions for feature"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output with task details"
    )

    args = parser.parse_args()

    path = Path(args.path)
    if not path.is_absolute():
        path = Path.cwd() / path

    if args.list:
        sessions = list_feature_sessions(path)

        if not sessions:
            print(f"No sessions found in {args.path}")
            return

        print(f"\n📁 Sessions in {path.name}:\n")
        for i, session in enumerate(sessions, 1):
            print(f"{i}. {session['timestamp']} ({session['status']})")
            if session['agent_reports']:
                agents = ', '.join(r['agent'] for r in session['agent_reports'])
                print(f"   Agents: {agents}")

        return

    if args.latest:
        session_dir = find_latest_session(path)
        if not session_dir:
            print(f"No sessions found in {args.path}")
            return
    else:
        session_dir = path

    try:
        summary = get_session_summary(session_dir)

        if args.json:
            print(json.dumps(summary, indent=2))
        else:
            print(format_session_info(summary, verbose=args.verbose))

            if summary['status'] != 'completed':
                print(f"\n💡 This session can be resumed")
                print(f"   Use: продовжуємо @{summary['session_dir']}")

    except FileNotFoundError as e:
        print(f"❌ {e}")
    except Exception as e:
        print(f"❌ Failed to load session: {e}")


if __name__ == "__main__":
    main()
