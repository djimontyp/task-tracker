# Resume Workflow

## Purpose

Restore session context from saved state file and continue work seamlessly. Supports both automatic resume (via hooks) and explicit resume (user command).

## When to Trigger

### Explicit Triggers (EN)
- "resume"
- "continue"
- "continue work"
- "pick up where we left off"
- "load session"
- User provides session file path

### Explicit Triggers (UA)
- "продовжити"
- "продовж"
- "відновити"
- "продовжити роботу"
- "завантажити сесію"

### Auto Triggers
- SessionStart hook detects paused session
- `claude --continue` with active session
- NEXT_SESSION_TODO.md exists in project root

## Resume Checklist

Execute in order:

### 1. Locate Session File

Priority order:
1. Explicit path from user: `.claude/sessions/paused/{filename}.md`
2. Latest file in `.claude/sessions/paused/`
3. NEXT_SESSION_TODO.md in project root (legacy)
4. Latest file in `.claude/sessions/active/`

If no session found:
- Output: "No paused session found. Start new work?"
- Skip remaining steps

### 2. Read Session File

Parse markdown sections:
- Context table
- Todo checklist
- Agents Used table
- Next Actions
- Artifacts list

### 3. Restore TodoWrite State

From Todo section:
- Recreate todo list with exact statuses
- Verify counts match (completed vs pending)
- Mark first pending task as in_progress

### 4. Reconstruct Context

Output to user:
```
Resuming session: {session-name}

Goal: {2-word goal}
Progress: {X}/{Y} tasks ({Z}%)
Last action: {brief summary}
Blockers: {list or "None"}

Next up: {next task description}
```

### 5. Verify Artifacts

Check that files listed in session still exist:
- Read critical files to confirm state
- Warn user if files missing/modified
- Update session context if needed

### 6. Move Session File

Move from `paused/` to `active/`:
```
.claude/sessions/paused/YYYY-MM-DD-{slug}.md
  → .claude/sessions/active/YYYY-MM-DD-{slug}.md
```

Update "Last Updated" timestamp in file.

### 7. Confirm Ready to Continue

Output:
```
Context restored. Ready to continue with: {next task}

Say "готовий" / "ready" to proceed, or ask questions if needed.
```

## Context Restoration Best Practices

### High-Priority Context
- Session goal & approach
- Current todo state
- Next immediate action
- Active blockers

### Medium-Priority Context
- Agent outputs (links to artifacts)
- Decisions made
- File changes list

### Low-Priority Context
- Full conversation history (let user browse if needed)
- Detailed agent reports (accessible via artifact links)

Load high-priority immediately, medium on demand, low only if user asks.

## Error Handling

### Session File Corrupted
- Parse what's readable
- Output: "Session file partially corrupted. Known context: {summary}"
- Ask user for clarification

### TodoWrite State Mismatch
- Use session file as source of truth
- Warn user: "Todo state diverged. Restored from session."
- Proceed with session version

### Artifacts Missing
- Warn: "Files modified/deleted since pause: {list}"
- Ask: "Continue anyway? The context may be stale."

### Multiple Active Sessions
- List all found
- Ask user to choose: "Multiple sessions found: 1) {slug-1}, 2) {slug-2}. Which to resume?"

## Notes

- Always output bilingual prompts (EN/UA)
- Keep context restoration concise
- Use tables/lists over prose
- Verify file state before continuing work
- Don't assume context - explicitly state what was restored
