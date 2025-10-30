# Claude Code Hooks Documentation

## check-docs-after-commits.py

Hook that monitors git commits and reminds you to update documentation after medium/large changes.

### Installation

This hook is **already configured** in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/check-docs-after-commits.py\""
          }
        ]
      }
    ]
  }
}
```

**Note**: `.claude/settings.local.json` is gitignored (local overrides), so each developer can customize hook behavior without affecting others.

### How It Works

1. **Triggers**: After every `git commit` command (PostToolUse with Bash matcher)
2. **Cooldown**: Waits 60 seconds after first commit to allow multiple commits to complete
3. **Analysis**: Collects all changes since commit series started
4. **Categorization**: Determines change size (small/medium/large) using combined metrics:
   - File count: 1-2 (small), 3-5 (medium), 6+ (large)
   - Commit type: fix/style (small), refactor (medium), feat/breaking (large)
   - File area: utils (low), services/components (medium), routes/models/pages (high)
5. **Documentation Check**: For medium/large changes, checks if relevant docs exist
6. **Reminder**: Shows system message with suggestions for documentation updates

### Change Size Thresholds

**Small changes** (ignored):
- 1-2 files
- Bug fixes, style changes
- Utility/helper functions

**Medium changes** (reminder):
- 3-5 files
- Refactoring
- Service layer or component changes

**Large changes** (strong reminder):
- 6+ files
- New features or breaking changes
- API routes, database models, pages

### Documentation Mapping

| Changed Files | Suggested Docs |
|---------------|----------------|
| `backend/app/api/v1/*.py` | `docs/content/{en,uk}/api/` |
| `backend/app/models/*.py` | `docs/content/{en,uk}/architecture/models.md` |
| `backend/app/services/*.py` | `docs/content/{en,uk}/architecture/backend-services.md` |
| `backend/app/agents/*.py` | `docs/content/{en,uk}/architecture/agent-system.md` |
| `backend/app/tasks/*.py` | `docs/content/{en,uk}/architecture/background-tasks.md` |
| `frontend/src/pages/*.tsx` | `docs/content/{en,uk}/frontend/architecture.md` |
| `frontend/src/features/*/` | Relevant feature documentation |

### Example Output

When you commit medium/large changes, you'll see:

```
📚 Documentation Update Reminder:

Detected medium changes in backend (4 files).
Backend areas: API routes, services

Suggested documentation to review/update:
  ✅ docs/content/{en,uk}/api/
  ⚠️ MISSING docs/content/{en,uk}/architecture/backend-services.md

💡 Consider creating missing documentation files using /docs command

Adding to TODO: 'Update documentation for recent changes'
```

### Disabling the Hook

To temporarily disable:
1. Comment out the hook in `~/.claude/settings.json`
2. Or delete `.claude/hooks/.last-commit-check` file to reset cooldown

### Troubleshooting

**Hook not triggering:**
- Check `~/.claude/settings.json` has correct configuration
- Ensure script is executable: `chmod +x .claude/hooks/check-docs-after-commits.py`
- Verify Python 3 is available: `python3 --version`

**Too many reminders:**
- Increase `COOLDOWN_SECONDS` in script (default: 60)
- Adjust size thresholds in categorization functions

**Missing reminders:**
- Check if changes match backend/frontend paths
- Verify commit series detection: `cat .claude/hooks/.commit-series-start`

### Development

Test the hook manually:

```bash
# Simulate PostToolUse input
echo '{
  "tool_input": {
    "command": "git commit -m \"test\""
  }
}' | python3 .claude/hooks/check-docs-after-commits.py
```

Debug mode:

```bash
# Add debug prints in main() function
# Or check cooldown files:
cat .claude/hooks/.last-commit-check
cat .claude/hooks/.commit-series-start
```
