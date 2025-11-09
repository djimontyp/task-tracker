#!/bin/bash
# Capture subagent agentId from PostToolUse Task tool
# Supports marker-based tracking for agent-coordinator skill

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

if [ "$TOOL_NAME" = "Task" ]; then
  AGENT_ID=$(echo "$INPUT" | jq -r '.tool_response.agentId // ""')
  SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // "unknown"')
  DESCRIPTION=$(echo "$INPUT" | jq -r '.tool_input.description // ""')
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ -n "$AGENT_ID" ] && [ "$AGENT_ID" != "null" ]; then
    # Storage location
    STORAGE_DIR=".artifacts/coordination"
    SESSIONS_FILE="$STORAGE_DIR/agent-sessions.json"
    LAST_AGENT_FILE="$STORAGE_DIR/last-agent-id.txt"

    mkdir -p "$STORAGE_DIR"

    # Extract marker from description (pattern: agent-{8 hex chars})
    MARKER=$(echo "$DESCRIPTION" | grep -oE 'agent-[a-f0-9]{8}' | head -1)

    # If marker found, write marker → agentId mapping
    if [ -n "$MARKER" ]; then
      echo "$AGENT_ID" > "$STORAGE_DIR/${MARKER}.txt"
      # Also write structured metadata
      cat > "$STORAGE_DIR/${MARKER}.json" <<EOF
{
  "marker": "$MARKER",
  "agentId": "$AGENT_ID",
  "subagentType": "$SUBAGENT_TYPE",
  "description": "$DESCRIPTION",
  "completedAt": "$TIMESTAMP",
  "status": "completed"
}
EOF
    fi

    # Initialize sessions file if doesn't exist
    if [ ! -f "$SESSIONS_FILE" ]; then
      echo '{"sessions":[]}' > "$SESSIONS_FILE"
    fi

    # Append to sessions log (backward compatibility + audit trail)
    jq --arg id "$AGENT_ID" \
       --arg type "$SUBAGENT_TYPE" \
       --arg marker "$MARKER" \
       --arg ts "$TIMESTAMP" \
       '.sessions += [{
         "agentId": $id,
         "subagentType": $type,
         "marker": $marker,
         "completedAt": $ts,
         "status": "completed"
       }]' "$SESSIONS_FILE" > "$SESSIONS_FILE.tmp" && mv "$SESSIONS_FILE.tmp" "$SESSIONS_FILE"

    # Write last agent ID (for non-marker usage)
    echo "$AGENT_ID" > "$LAST_AGENT_FILE"

    # Log with marker info
    if [ -n "$MARKER" ]; then
      echo "[$TIMESTAMP] Agent $AGENT_ID ($SUBAGENT_TYPE) [marker: $MARKER] completed" >> "$STORAGE_DIR/agent-tracking.log"
    else
      echo "[$TIMESTAMP] Agent $AGENT_ID ($SUBAGENT_TYPE) completed" >> "$STORAGE_DIR/agent-tracking.log"
    fi
  fi
fi

exit 0