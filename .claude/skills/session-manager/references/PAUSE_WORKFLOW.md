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

### 6. Generate Session File

Create `.claude/sessions/paused/YYYY-MM-DD-{slug}.md` with all above data using SUMMARY_TEMPLATES.md format.

### 7. Confirm with User

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
