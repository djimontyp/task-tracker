#!/usr/bin/env python3
"""Generate unique agent coordination marker.

Usage:
    marker=$(uv run .claude/skills/agent-coordinator/scripts/generate_marker.py)

Output format: agent-{8hex}
Example: agent-a1b2c3d4
"""
import uuid


def generate_marker() -> str:
    """Generate unique agent coordination marker.

    Returns:
        str: Marker in format 'agent-{8hex}' (e.g., 'agent-a1b2c3d4')
    """
    return f"agent-{uuid.uuid4().hex[:8]}"


if __name__ == "__main__":
    marker = generate_marker()
    print(marker, end="")