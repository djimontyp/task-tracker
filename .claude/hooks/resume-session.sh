#!/bin/bash

# SessionStart Hook: Auto-resume paused/planned sessions
# Triggered when: Starting new conversation
# Purpose: Check for paused sessions and show available work

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
PAUSED_DIR="$PROJECT_DIR/.claude/sessions/paused"
ACTIVE_DIR="$PROJECT_DIR/.claude/sessions/active"
PLANNED_DIR="$PROJECT_DIR/.claude/sessions/planned"

# Check if session directories exist
if [ ! -d "$PAUSED_DIR" ] && [ ! -d "$ACTIVE_DIR" ] && [ ! -d "$PLANNED_DIR" ]; then
    exit 0  # No session directories
fi

# Count sessions
ACTIVE_COUNT=0
PAUSED_COUNT=0
PLANNED_COUNT=0

[ -d "$ACTIVE_DIR" ] && ACTIVE_COUNT=$(find "$ACTIVE_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
[ -d "$PAUSED_DIR" ] && PAUSED_COUNT=$(find "$PAUSED_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
[ -d "$PLANNED_DIR" ] && PLANNED_COUNT=$(find "$PLANNED_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')

# If active session exists, suggest continuing it
if [ "$ACTIVE_COUNT" -gt 0 ]; then
    LATEST_ACTIVE=$(find "$ACTIVE_DIR" -maxdepth 1 -name "*.md" -type f -print0 | \
        xargs -0 ls -t | head -n 1)
    SESSION_NAME=$(basename "$LATEST_ACTIVE" .md)

    echo "🟢 Active session: $SESSION_NAME"
    echo ""
    echo "Continue? Say 'continue' / 'продовжити' or 'show sessions' / 'покажи сесії'"
    exit 0
fi

# If paused sessions exist, suggest resuming
if [ "$PAUSED_COUNT" -gt 0 ]; then
    LATEST_PAUSED=$(find "$PAUSED_DIR" -maxdepth 1 -name "*.md" -type f -print0 | \
        xargs -0 ls -t | head -n 1)
    SESSION_NAME=$(basename "$LATEST_PAUSED" .md)

    echo "⏸️ Paused session: $SESSION_NAME"
    echo ""
    echo "Resume? Say 'resume' / 'продовжити' or 'show sessions' / 'покажи сесії'"
    exit 0
fi

# If only planned sessions exist, show them
if [ "$PLANNED_COUNT" -gt 0 ]; then
    echo "📅 $PLANNED_COUNT planned sessions available"
    echo ""
    echo "Ready to start? Say 'show sessions' / 'покажи сесії' or 'what's next' / 'що далі'"
    exit 0
fi

exit 0
