# Claude Code Hooks

Project uses Claude Code hooks for automation and quality checks.

## Available Hooks

### Documentation Reminder Hook

**File**: `.claude/hooks/check-docs-after-commits.py`
**Trigger**: After git commits (`PostToolUse` with `Bash` matcher)
**Purpose**: Reminds to update documentation after medium/large code changes

#### How It Works

1. **Cooldown Period**: Waits 60 seconds after first commit to allow multiple commits
2. **Change Analysis**: Collects all changes since commit series started
3. **Categorization**: Determines change size using combined metrics:
   - **File count**: 1-2 (small), 3-5 (medium), 6+ (large)
   - **Commit type**: fix/style (small), refactor (medium), feat/breaking (large)
   - **File area**: utils (low), services/components (medium), routes/models/pages (high)
4. **Documentation Check**: For medium/large changes, checks if relevant docs exist
5. **Reminder**: Shows system message with suggestions

#### Change Categories

**Small changes** (no reminder):
- 1-2 files
- Bug fixes (`fix:`), style changes (`style:`)
- Utility/helper functions

**Medium changes** (gentle reminder):
- 3-5 files
- Refactoring (`refactor:`), performance (`perf:`)
- Service layer, components

**Large changes** (strong reminder):
- 6+ files
- New features (`feat:`), breaking changes (`feat!:`)
- API routes, database models, pages

#### Documentation Mapping

| Changed Files | Suggested Documentation |
|---------------|------------------------|
| `backend/app/api/v1/*.py` | `docs/content/{en,uk}/api/` |
| `backend/app/models/*.py` | `docs/content/{en,uk}/architecture/models.md` |
| `backend/app/services/*.py` | `docs/content/{en,uk}/architecture/backend-services.md` |
| `backend/app/agents/*.py` | `docs/content/{en,uk}/architecture/agent-system.md` |
| `backend/app/tasks/*.py` | `docs/content/{en,uk}/architecture/background-tasks.md` |
| `frontend/src/pages/*.tsx` | `docs/content/{en,uk}/frontend/architecture.md` |
| `frontend/src/features/*/` | Relevant feature docs |

#### Example Output

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

#### Configuration

Hook is configured in `.claude/settings.local.json` (gitignored, local overrides):

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

#### Customization

**Adjust cooldown period:**
Edit `COOLDOWN_SECONDS` in `.claude/hooks/check-docs-after-commits.py` (default: 60)

**Change size thresholds:**
Modify categorization functions:
- `categorize_by_file_count()`
- `categorize_by_commit_type()`
- `categorize_by_file_area()`

**Disable temporarily:**
Comment out hook in `.claude/settings.local.json` or delete cooldown files:
```bash
rm .claude/hooks/.last-commit-check .claude/hooks/.commit-series-start
```

#### Troubleshooting

**Hook not triggering:**
- Verify `python3` is available: `python3 --version`
- Check script permissions: `ls -la .claude/hooks/check-docs-after-commits.py`
- Ensure `.claude/settings.local.json` has correct configuration

**Too many/few reminders:**
- Adjust `COOLDOWN_SECONDS` (increase to reduce frequency)
- Modify size thresholds in categorization functions

**Debug mode:**
```bash
# Manual test with simulated input
echo '{
  "tool_input": {
    "command": "git commit -m \"test\""
  }
}' | python3 .claude/hooks/check-docs-after-commits.py

# Check cooldown state
cat .claude/hooks/.last-commit-check
cat .claude/hooks/.commit-series-start
```

## Session Hooks

### Resume Session Hook

**File**: `.claude/hooks/resume-session.sh`
**Trigger**: `SessionStart` with `resume` matcher
**Purpose**: Displays session summary when resuming work

### Save Session State Hook

**File**: `.claude/hooks/save-session-state.sh`
**Trigger**: `SessionEnd`
**Purpose**: Auto-saves session state for later resume

## Adding New Hooks

To add custom hooks:

1. Create script in `.claude/hooks/`
2. Make executable: `chmod +x .claude/hooks/your-hook.sh`
3. Add configuration to `.claude/settings.local.json`:
   ```json
   {
     "hooks": {
       "EventType": [
         {
           "matcher": "optional-matcher",
           "hooks": [
             {
               "type": "command",
               "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/your-hook.sh"
             }
           ]
         }
       ]
     }
   }
   ```

See [Claude Code hooks documentation](https://docs.claude.com/en/docs/claude-code/hooks.md) for available event types and matchers.
