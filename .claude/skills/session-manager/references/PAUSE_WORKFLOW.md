# Pause Workflow

## Purpose

Checkpoint current work state and create resumable session artifact. Supports both auto-pause (end of conversation) and explicit pause (user command).

## When to Trigger

### Explicit Triggers (EN)
- "pause"
- "stop for now"
- "stop for today"
- "save progress"
- "save my progress"
- "checkpoint"
- "break"
- "take a break"

### Explicit Triggers (UA)
- "пауза"
- "зупинись"
- "зупини"
- "зберегти прогрес"
- "зберегти"
- "чекпоінт"
- "перерва"
- "зроби перерву"

### Auto Triggers
- User says goodbye: "bye", "пока", "до побачення"
- Long inactivity detected (>5 min without response)
- Conversation ending naturally

## Pause Checklist

Execute in order:

### 1. Generate Session Metadata

Extract:
- Session goal (2-word summary)
- Current approach (pattern/strategy being used)
- Active blockers (if any)
- Last completed action

### 2. Capture Todo State

From TodoWrite tool:
- Total tasks count
- Completed count & list
- In-progress tasks (should be 0 before pause)
- Pending tasks & list
- Estimated completion percentage

### 3. Document Agent History

For each agent used:
- Agent name
- Task assigned
- Output/artifact location
- Status (done/partial/blocked)

### 4. Identify Next Actions

List immediate next steps:
- Next 1-2 tasks to tackle
- Any unresolved questions
- Required user input
- Known blockers

### 5. Link Artifacts

List all files created/modified:
- Relative paths from project root
- Brief description of changes
- Git commits (if any)

### 6. Ingest Orphaned Agent Artifacts

Before finalizing session, check for orphaned agent reports:

**Check for orphaned files:**
```bash
# Find potential orphaned agent artifacts
orphaned=$(find . -maxdepth 1 \
  -name "*REPORT*.md" \
  -o -name "*VERIFICATION*.md" \
  -o -name "*SUMMARY*.md" \
  -o -name "*ANALYSIS*.md" \
  -o -name "*AUDIT*.md" \
  2>/dev/null)
```

**If found, append to session file:**
```bash
for artifact in $orphaned; do
  echo -e "\n---\n" >> "$session_file"
  echo "## Orphaned Artifact: $(basename $artifact)" >> "$session_file"
  echo "" >> "$session_file"
  echo "*Source: Project root (should have been in session)*" >> "$session_file"
  echo "" >> "$session_file"
  cat "$artifact" >> "$session_file"
done
```

**Clean up after merge:**
```bash
# Only delete after successful append
if [ $? -eq 0 ]; then
  for artifact in $orphaned; do
    rm "$artifact"
    echo "✓ Merged and deleted: $(basename $artifact)"
  done
fi
```

**Why this step:**
- Agents may have created standalone reports before session integration was implemented
- Ensures all work is captured in session file
- Prevents orphaned artifacts cluttering project root
- Session becomes single source of truth

**Common orphaned patterns:**
- `SPRINT1_TEST_FIX_VERIFICATION.md`
- `UX_AUDIT_REPORT.md`
- `DATABASE_ANALYSIS_SUMMARY.md`
- `test_results.txt` (if markdown)

### 7. Generate Session File

Create `.claude/sessions/paused/YYYY-MM-DD-{slug}.md` with all above data using SUMMARY_TEMPLATES.md format.

### 8. Confirm with User

Output resume instruction:
```
Session paused and saved to .claude/sessions/paused/YYYY-MM-DD-{slug}.md

To resume: `claude --continue` or tell me "resume" / "продовжити"
```

## Error Handling

If TodoWrite state is inconsistent (multiple in_progress tasks):
- Complete current task or mark as blocked
- Add warning to session file
- Proceed with pause

If no meaningful progress to save:
- Skip session file creation
- Output: "No active session to pause"

## Notes

- Keep summaries compact (2-word snippets preferred)
- Use tables over prose
- Prefer relative paths over absolute
- Always include bilingual resume instruction
