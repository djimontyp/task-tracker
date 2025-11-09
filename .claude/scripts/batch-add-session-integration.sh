#!/usr/bin/env bash
#
# batch-add-session-integration.sh
# Add session integration block to all agent files
#
# Usage: ./batch-add-session-integration.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENTS_DIR="$PROJECT_ROOT/.claude/agents"
TEMPLATE_FILE="$PROJECT_ROOT/.claude/templates/session-integration.md"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter
updated=0

echo "Starting batch update of agent files..."
echo ""

# Loop through all .md files in agents directory
for agent_file in "$AGENTS_DIR"/*.md; do
    # Skip template file
    if [[ "$(basename "$agent_file")" == "_session_integration_template.md" ]]; then
        continue
    fi

    # Extract agent name from filename
    agent_name=$(basename "$agent_file" .md)

    echo -e "Processing: ${YELLOW}$agent_name${NC}"

    # Check if already has session integration
    if grep -q "🔗 Session Integration" "$agent_file"; then
        echo -e "  ⏭️  Already has session integration - skipping"
        echo ""
        continue
    fi

    # Read template content
    template_content=$(<"$TEMPLATE_FILE")

    # Replace [AGENT_NAME] with actual agent name
    integration_block="${template_content//\[AGENT_NAME\]/$agent_name}"

    # Find the line number of the LAST --- separator in anti-delegation header
    # We want to insert AFTER the "---" that closes anti-delegation section
    separator_line=$(grep -n "^---$" "$agent_file" | tail -1 | cut -d: -f1)

    if [ -z "$separator_line" ]; then
        echo -e "  ${YELLOW}⚠️  No separator found - skipping${NC}"
        echo ""
        continue
    fi

    # Create temp file with content
    temp_file=$(mktemp)

    # Insert integration block after separator
    {
        head -n "$separator_line" "$agent_file"
        echo ""
        echo "$integration_block"
        echo ""
        tail -n +$((separator_line + 1)) "$agent_file"
    } > "$temp_file"

    # Replace original file
    mv "$temp_file" "$agent_file"

    echo -e "  ${GREEN}✓ Updated${NC}"
    echo ""

    ((updated++))
done

echo "======================================"
echo -e "${GREEN}✓ Batch update complete!${NC}"
echo "Updated: $updated agent files"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff .claude/agents/"
echo "2. Test with one agent"
echo "3. Commit if satisfied"
