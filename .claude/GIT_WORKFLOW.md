# Git Workflow Commands

Quick reference for Claude Code slash commands for git operations.

## Commands

### `/stage [files...]`

Intelligently stage files for commit with smart grouping.

**Usage:**
```bash
/stage                          # Interactive - analyze and group changes
/stage frontend/nginx.conf      # Stage specific file
/stage backend/app/api/*.py     # Stage pattern
```

**Features:**
- Groups related files (component + test + types)
- Warns about sensitive files (.env, credentials)
- Suggests logical commit boundaries
- Shows preview before staging

### `/commit [message]`

Create conventional commit following Conventional Commits 1.0.0 spec.

**Usage:**
```bash
/commit                                    # Auto-generate from staged changes
/commit "fix(api): resolve timeout issue"  # Use custom message
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `style` - Code formatting
- `docs` - Documentation
- `test` - Tests
- `chore` - Build/tooling
- `ci` - CI/CD config

**Scopes (project-specific):**
- `backend` / `api` - FastAPI backend
- `frontend` / `dashboard` - React app
- `bot` - Telegram bot
- `db` - Database/migrations
- `docker` - Containerization
- `nginx` - Web server config
- `worker` - TaskIQ background jobs
- `deps` - Dependencies

**Format:**
```
<type>(<scope>): <subject>

[Optional body]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Workflow Examples

### Example 1: Feature Development

```bash
# Make changes to backend API
# Edit: backend/app/api/v1/endpoints/tasks.py
# Edit: backend/app/models/task.py

/stage                  # Interactive staging
> 1. [backend/api] - 2 files (new task endpoint)
> Select: 1

/commit                 # Auto-generates:
> feat(api): add task priority field to endpoints
```

### Example 2: Bug Fix

```bash
# Fix WebSocket reconnection bug
# Edit: frontend/src/components/AppSidebar.tsx

/stage frontend/src/components/AppSidebar.tsx
/commit "fix(frontend): prevent WebSocket reconnection loop on page navigation"
```

### Example 3: Configuration Update

```bash
# Update nginx CSP policy
# Edit: frontend/nginx.conf
# Edit: nginx/nginx.conf

/stage                  # Groups nginx configs together
/commit                 # Auto-generates:
> chore(nginx): update CSP to allow Google Fonts
```

### Example 4: Multiple Logical Changes

```bash
# Scenario: Fixed bug + updated docs

# Fix bug first
/stage backend/app/services/classifier.py
/commit "fix(backend): handle empty message in classifier"

# Then docs
/stage README.md
/commit "docs: update API usage examples"
```

## Best Practices

### DO ✅
- Stage related files together
- Use semantic commit types
- Keep commits focused and atomic
- Review staged changes before commit
- Use `/stage` interactive mode when unsure

### DON'T ❌
- Mix unrelated changes in one commit
- Stage sensitive files (.env, credentials)
- Commit without reviewing diffs
- Use vague messages ("fix stuff", "update")
- Skip scope when changes affect specific module

## Conventional Commits Reference

**Structure:**
```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

**Type + Scope Examples:**
```
feat(api): add webhook retry mechanism
fix(db): resolve migration rollback issue
refactor(frontend): extract WebSocket logic to custom hook
perf(backend): optimize task query with database indexes
style(dashboard): apply consistent spacing to components
docs(readme): add deployment instructions
test(api): add integration tests for task endpoints
chore(deps): upgrade React to 18.3.1
ci(github): add automated E2E tests
```

**Breaking Changes:**
```
feat(api)!: change task status enum values

BREAKING CHANGE: Task status values changed from numeric to string enum.
Clients must update to use new status values.
```

## Tips

1. **Let AI analyze first** - Use `/stage` without arguments to see suggested groupings
2. **Review before commit** - Always check `git diff --cached` output
3. **Trust the scopes** - AI understands project structure
4. **Customize when needed** - Override AI suggestions with explicit arguments
5. **Chain commands** - `/stage` → `/commit` is the golden path

## Integration with Claude Code

These commands integrate seamlessly with:
- `/specify` - Create feature specs before coding
- `/plan` - Plan implementation before changes
- `/implement` - Execute planned tasks with commits

**Full workflow:**
```bash
/specify "add user notification preferences"
/plan
/implement
# During implementation, use /stage and /commit as needed
```
