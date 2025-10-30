#!/bin/bash

# SessionStart Hook: Auto-resume paused sessions
# Triggered when: Starting new conversation or resuming existing
# Purpose: Check for paused sessions and prompt user to resume

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
PAUSED_DIR="$PROJECT_DIR/.claude/sessions/paused"

# Check if paused sessions directory exists
if [ ! -d "$PAUSED_DIR" ]; then
    exit 0  # No paused sessions directory, nothing to do
fi

# Count paused sessions
PAUSED_COUNT=$(find "$PAUSED_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')

if [ "$PAUSED_COUNT" -eq 0 ]; then
    exit 0  # No paused sessions
fi

# Get latest paused session
LATEST_SESSION=$(find "$PAUSED_DIR" -maxdepth 1 -name "*.md" -type f -print0 | \
    xargs -0 ls -t | head -n 1)

if [ -z "$LATEST_SESSION" ]; then
    exit 0  # No session found
fi

# Extract session name from filename
SESSION_NAME=$(basename "$LATEST_SESSION" .md)

# Output message for Claude to see
echo "📋 Found paused session: $SESSION_NAME"
echo ""
echo "Would you like to resume this session?"
echo "Say 'resume' / 'продовжити' to continue, or 'skip' to start fresh."
echo ""
echo "Session file: $LATEST_SESSION"

exit 0
