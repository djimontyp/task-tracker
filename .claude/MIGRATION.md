# Migration Guide: Orchestration Skills → Session Manager

**Date**: 2025-10-30
**Summary**: Replaced 2,147 lines of orchestration skills with 450-line session-manager skill (79% reduction)

---

## What Changed

### Deprecated Skills

**Moved to `.claude/.deprecated/`:**
1. **task-orchestrator** (930 lines) - Over-engineered router
2. **parallel-coordinator** (657 lines) - Manual batching/checkpointing
3. **epic-orchestrator** (560 lines) - Multi-week coordination

**Total removed**: 2,147 lines

### New Skills

**Created:**
1. **session-manager** (703 lines with references) - Auto-save, pause/resume, bilingual support
   - `SKILL.md` (450 lines)
   - `references/PAUSE_WORKFLOW.md` (70 lines)
   - `references/RESUME_WORKFLOW.md` (80 lines)
   - `references/SUMMARY_TEMPLATES.md` (103 lines)

**Total added**: 703 lines

**Net reduction**: 1,444 lines (67% smaller)

---

## Why Migrate?

### Problems with Old Skills

**task-orchestrator:**
- ❌ 930 lines for a router (over-engineering)
- ❌ 8 Python scripts + YAML configs
- ❌ Manual session state JSON files
- ❌ No automatic save
- ❌ Lines 1-80 are just "don't implement" warnings

**parallel-coordinator:**
- ❌ 657 lines, 244 lines just for session continuity
- ❌ Manual checkpointing (user must trigger)
- ❌ 15-25min batching (rigid, not adaptive)
- ❌ Complex session state management

**epic-orchestrator:**
- ❌ 560 lines mirroring parallel-coordinator
- ❌ Manual progress.md updates
- ❌ Git-centric (assumes team collaboration)
- ❌ Verbose explanations

### Benefits of session-manager

**Simplicity:**
- ✅ Single markdown file per session (not 8-12 files)
- ✅ Auto-save after TodoWrite completion (no manual triggers)
- ✅ Lightweight checkpoints (context-aware)
- ✅ Clear commands: `/pause`, `/resume`, `/session`

**Usability:**
- ✅ "It just works" - transparent auto-save
- ✅ Bilingual support (EN/UA commands and content)
- ✅ Hooks integration (SessionStart/SessionEnd automation)
- ✅ One file to load for context restoration

**Context efficiency:**
- ✅ 2-word snippets (not essays)
- ✅ Tables over prose
- ✅ Progressive disclosure (load details on demand)

---

## Migration Steps

### For Users

**If you have active sessions using old skills:**

1. **Complete current work** using the old skill (don't interrupt mid-session)
2. **No action needed** - Old skills are deprecated but still functional in `.claude/.deprecated/`
3. **Future sessions** will automatically use `session-manager` instead

**New workflow:**
```bash
# Old way (manual):
task-orchestrator → creates session → delegates → manual saves → manual resume

# New way (automatic):
Work on task → TodoWrite updates → auto-saved to .claude/sessions/active/
Say "pause" or "пауза" → saved to .claude/sessions/paused/
Say "resume" or "продовжити" → restores from paused/
```

---

### For Claude (AI)

**Behavior changes:**

#### Old workflow (deprecated):
```
User: "Add authentication feature"
→ Check complexity score
→ If score ≥8: Invoke task-orchestrator
→ task-orchestrator routes to parallel-coordinator or epic-orchestrator
→ Manual session state creation
→ User must trigger /pause or /resume explicitly
```

#### New workflow (current):
```
User: "Add authentication feature"
→ Create TodoWrite list
→ session-manager auto-creates session in .claude/sessions/active/
→ Auto-save after each TodoWrite completion
→ User says "pause" → explicit checkpoint to .claude/sessions/paused/
→ User says "resume" → auto-restore from paused/
```

**Key differences:**
- ❌ Don't invoke `task-orchestrator`, `parallel-coordinator`, or `epic-orchestrator`
- ✅ Use `session-manager` skill (or let it trigger automatically)
- ❌ Don't create manual session state files
- ✅ Trust auto-save after TodoWrite updates
- ❌ Don't use complexity scoring to route tasks
- ✅ Use TodoWrite + delegation patterns (see `.claude/delegation-patterns.md`)

---

## Backward Compatibility

### Existing Artifacts

**Location**: `.artifacts/` directory structure

**Status**: ✅ Kept as-is, no migration needed

**Reason**: Old artifacts are historical reference. New sessions use `.claude/sessions/`, but old artifacts remain accessible.

### Permission Settings

**Old permissions** (`.claude/settings.local.json`):
```json
"allow": [
  "Skill(task-orchestrator)",
  "Skill(parallel-coordinator)",
  "Skill(epic-orchestrator)"
]
```

**New permissions** (already updated):
```json
"allow": [
  "Skill(session-manager)"
]
```

**Action**: ✅ Already updated - no user action needed

### Hooks

**New hooks added** (`.claude/settings.local.json`):
```json
"hooks": {
  "SessionStart": [...],  // Auto-prompt to resume paused sessions
  "SessionEnd": [...]     // Auto-save active sessions on exit
}
```

**Action**: ✅ Already configured - no user action needed

---

## FAQ

### Q: Can I still use old orchestration skills?

**A**: Yes, but not recommended. They're in `.claude/.deprecated/` and will trigger deprecation warnings. Use `session-manager` instead.

---

### Q: What happens to my old session artifacts?

**A**: They remain in `.artifacts/` unchanged. New sessions use `.claude/sessions/`, but old artifacts are preserved for historical reference.

---

### Q: Do I need to manually create session files?

**A**: No! `session-manager` auto-creates/updates sessions after TodoWrite completions. You only need to explicitly use `/pause` for important milestones.

---

### Q: How do bilingual commands work?

**A**: Both EN and UA work:
- `/pause` or `/пауза`
- `/resume` or `/продовжити`
- "pause" or "пауза" (natural language)
- "resume" or "продовжити" (natural language)

---

### Q: Where are session files stored?

**A**:
- `.claude/sessions/active/` - Current work (gitignored)
- `.claude/sessions/paused/` - Explicitly paused (gitignored)
- `.claude/sessions/completed/` - Finished (tracked in git for team visibility)

---

### Q: What if I prefer manual session management?

**A**: You can:
1. Disable auto-save by skipping TodoWrite (not recommended)
2. Use `/pause` and `/resume` explicitly (hybrid approach)
3. Continue using old skills from `.claude/.deprecated/` (legacy support)

**Recommended**: Trust auto-save, use `/pause` for milestones only.

---

### Q: How do I test the new workflow?

**A**: Simple test:
1. Start a task: "Refactor X component"
2. Create TodoWrite list (3-5 tasks)
3. Complete a task → Check `.claude/sessions/active/` for auto-saved file
4. Say "pause" / "пауза" → Check `.claude/sessions/paused/` for session
5. Say "resume" / "продовжити" → Verify context restored + TodoWrite synced

---

## Rollback (If Needed)

If you encounter issues with session-manager:

1. **Move skills back**:
   ```bash
   mv .claude/.deprecated/{task-orchestrator,parallel-coordinator,epic-orchestrator} .claude/skills/
   ```

2. **Update permissions** (`.claude/settings.local.json`):
   ```json
   "allow": [
     "Skill(task-orchestrator)",
     "Skill(parallel-coordinator)",
     "Skill(epic-orchestrator)"
   ]
   ```

3. **Report issue**: Create GitHub issue with details

**Note**: Rollback not expected - session-manager is simpler and more robust.

---

## Timeline

- **2025-10-30**: Orchestration skills deprecated, session-manager created
- **Future**: Old skills may be removed entirely (6+ months notice)

---

## Support

**Questions or issues?**
- Check `.claude/skills/session-manager/SKILL.md` for usage
- Review `.claude/delegation-patterns.md` for delegation guidance
- See session templates in `.claude/skills/session-manager/references/SUMMARY_TEMPLATES.md`
