#!/usr/bin/env bash
#
# update-active-session.sh
# Append agent report to active session file
#
# Usage:
#   ./update-active-session.sh "agent-name" report_file.md
#   ./update-active-session.sh "Pytest Master (T1)" verification_report.md
#
# Description:
#   - Finds active session in .claude/sessions/active/
#   - Appends agent report with timestamp header
#   - Falls back to creating standalone artifact if no session
#

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory (for relative paths)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Function: Print usage
usage() {
    echo "Usage: $0 <agent-name> <report-file>"
    echo ""
    echo "Arguments:"
    echo "  agent-name    Name of the agent (e.g., Pytest Master (T1))"
    echo "  report-file   Path to report markdown file"
    echo ""
    echo "Examples:"
    echo "  $0 \"Pytest Master (T1)\" verification_report.md"
    echo "  $0 \"React Frontend Expert (F1)\" ux_audit.md"
    exit 1
}

# Check arguments
if [ $# -ne 2 ]; then
    usage
fi

AGENT_NAME="$1"
REPORT_FILE="$2"

# Validate report file exists
if [ ! -f "$REPORT_FILE" ]; then
    echo -e "${RED}✗ Error: Report file not found: $REPORT_FILE${NC}"
    exit 1
fi

# Find active session
cd "$PROJECT_ROOT"
ACTIVE_SESSION=$(ls .claude/sessions/active/*.md 2>/dev/null | head -1)

if [ -n "$ACTIVE_SESSION" ]; then
    # Active session found - append report
    echo -e "${GREEN}✓ Active session found: $(basename "$ACTIVE_SESSION")${NC}"

    # Generate timestamp
    TIMESTAMP=$(date +'%Y-%m-%d %H:%M')

    # Append separator and header
    {
        echo ""
        echo "---"
        echo ""
        echo "## Agent Report: $TIMESTAMP - $AGENT_NAME"
        echo ""
    } >> "$ACTIVE_SESSION"

    # Append report content
    cat "$REPORT_FILE" >> "$ACTIVE_SESSION"

    # Add trailing newline
    echo "" >> "$ACTIVE_SESSION"

    echo -e "${GREEN}✓ Report appended to: $ACTIVE_SESSION${NC}"
    echo -e "${GREEN}✓ Auto-save will trigger on next TodoWrite update${NC}"

else
    # No active session - create standalone artifact
    echo -e "${YELLOW}⚠  No active session found${NC}"
    echo -e "${YELLOW}⚠  Creating standalone artifact instead${NC}"

    # Generate artifact filename
    ARTIFACT_NAME="${AGENT_NAME}_$(date +'%Y%m%d_%H%M%S').md"
    ARTIFACT_PATH=".artifacts/agents/$ARTIFACT_NAME"

    # Create artifacts directory if needed
    mkdir -p .artifacts/agents

    # Copy report to artifact
    cp "$REPORT_FILE" "$ARTIFACT_PATH"

    echo -e "${YELLOW}✓ Artifact created: $ARTIFACT_PATH${NC}"
    echo -e "${YELLOW}ℹ  Coordinator should merge this into session manually${NC}"
fi
