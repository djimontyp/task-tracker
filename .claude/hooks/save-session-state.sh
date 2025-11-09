#!/bin/bash

# SessionEnd Hook: Auto-save active sessions
# Triggered when: Conversation ending
# Purpose: Lightweight auto-save of active session state

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ACTIVE_DIR="$PROJECT_DIR/.claude/sessions/active"
PAUSED_DIR="$PROJECT_DIR/.claude/sessions/paused"

# Check if active sessions directory exists
if [ ! -d "$ACTIVE_DIR" ]; then
    exit 0  # No active sessions directory
fi

# Count active sessions
ACTIVE_COUNT=$(find "$ACTIVE_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')

if [ "$ACTIVE_COUNT" -eq 0 ]; then
    exit 0  # No active sessions
fi

# Get latest active session
LATEST_SESSION=$(find "$ACTIVE_DIR" -maxdepth 1 -name "*.md" -type f -print0 | \
    xargs -0 ls -t | head -n 1)

if [ -z "$LATEST_SESSION" ]; then
    exit 0  # No session found
fi

# Extract session name
SESSION_NAME=$(basename "$LATEST_SESSION")

# Create paused directory if not exists
mkdir -p "$PAUSED_DIR"

# Move session to paused (if explicit goodbye detected by Claude)
# Note: This is a lightweight hook - Claude's session-manager skill does the heavy lifting
# We just ensure the file is moved to paused/ for next resume

# For now, just log that session exists
echo "💾 Active session preserved: $SESSION_NAME"
echo "Resume with: claude --continue"

exit 0
