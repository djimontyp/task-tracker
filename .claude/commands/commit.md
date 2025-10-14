---
description: Analyze staged changes and create a conventional commit with proper type and scope.
---

The user may provide a custom commit message as an argument. If provided, use it; otherwise, analyze the changes and generate one.

User input:

$ARGUMENTS

## Your Task

Create a git commit following the Conventional Commits 1.0.0 specification based on current staged changes.

### Step 1: Analyze Current State

Run these commands **in parallel** to understand the changes:

```bash
git status
git diff --cached --stat
git diff --cached
git log -5 --oneline
```

### Step 2: Determine Commit Type

Based on the changes, select the appropriate type:

- **feat**: New feature or functionality
- **fix**: Bug fix
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvements
- **style**: Code style/formatting (whitespace, semicolons, etc.)
- **docs**: Documentation only changes
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes
- **revert**: Reverting previous commits

### Step 3: Identify Scope

Determine scope from the changed files:

- **backend** / **api** - Backend Python/FastAPI code
- **frontend** / **dashboard** - React/TypeScript code
- **bot** - Telegram bot code
- **db** - Database models, migrations
- **docker** - Docker/compose configuration
- **nginx** - Nginx configuration
- **worker** - TaskIQ worker code
- **deps** - Dependencies updates
- **config** - Configuration files
- Leave empty if changes affect multiple areas

### Step 4: Generate Commit Message

Format: `<type>(<scope>): <subject>`

**Rules:**
- Subject: imperative mood, lowercase, no period, max 72 chars
- Body (optional): explain WHAT and WHY, not HOW
- Footer (optional): breaking changes, issue references

**Examples:**
```
feat(dashboard): add real-time WebSocket updates to task list
fix(api): resolve race condition in task status updates
refactor(backend): extract classification logic to separate service
perf(db): add index on tasks.created_at for faster queries
docs(readme): update installation instructions
chore(deps): upgrade fastapi to 0.104.1
style(frontend): format code with prettier
ci(github): add automated type checking workflow
```

### Step 5: Create Commit

If user provided custom message in $ARGUMENTS:
- Use it as-is (assume it follows conventions)
- Add the standard footer

Otherwise:
- Generate message based on analysis
- Include body if changes are complex
- Add footer

Execute commit with this format:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

[Optional body explaining the changes]

EOF
)"
```

### Step 6: Verify

After commit:
```bash
git log -1 --pretty=format:"%h - %s%n%b"
git status
```

Report the commit hash and message to confirm success.

## Important Notes

- **DO NOT** commit if there are no staged changes
- **DO NOT** run `git add` unless explicitly asked
- **DO NOT** push unless explicitly requested
- **Analyze carefully** - wrong commit type/scope is worse than no commit
- If unsure about classification, **ask the user** before committing
- For breaking changes, add `BREAKING CHANGE:` in footer and `!` after scope