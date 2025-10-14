---
description: Analyze unstaged changes and intelligently stage related files for commit.
---

The user may provide specific files or patterns as arguments. If not provided, analyze all changes.

User input:

$ARGUMENTS

## Your Task

Analyze unstaged changes and stage files logically grouped by feature or fix.

### Step 1: Analyze Current State

Run these commands **in parallel**:

```bash
git status
git diff --stat
git diff --name-only
```

### Step 2: Categorize Changes

Group modified files by:

1. **Feature/Module** - Files that belong to same feature
2. **Type** - Frontend, backend, config, docs
3. **Logical Unit** - Changes that should be committed together

**Examples of logical groups:**
- Frontend component + its styles + tests
- API endpoint + model + migration
- Config file + related documentation
- Bug fix affecting multiple related files

### Step 3: Present Options

If user provided specific files in $ARGUMENTS:
- Stage exactly those files
- Show what will be staged

Otherwise:
- Identify logical groups
- Present options to user:
  ```
  Found changes in:
  1. [backend/api] - 3 files (task classification endpoint)
  2. [frontend] - 2 files (dashboard updates)
  3. [nginx] - 1 file (CSP policy update)

  Which group to stage? (1-3, 'all', or specific files)
  ```

### Step 4: Stage Files

After user selection:

```bash
git add <selected files>
```

Then show staged status:

```bash
git diff --cached --stat
```

### Step 5: Next Steps

Suggest logical next action:
- If files staged → suggest `/commit` to create commit
- If partial staging → suggest reviewing remaining changes
- If conflicts detected → warn user

## Smart Staging Rules

**DO stage together:**
- ✅ Component + test + types
- ✅ API route + model + migration
- ✅ Related config files
- ✅ Documentation for new feature

**DON'T stage together:**
- ❌ Unrelated features
- ❌ Bug fix + new feature
- ❌ Code + unrelated config changes
- ❌ Debug code + production code

**Never stage:**
- ❌ `.env` files
- ❌ `credentials.json`
- ❌ `*.key`, `*.pem`
- ❌ IDE-specific files (unless intentional)
- ❌ Large binary files (warn user)

## Important Notes

- **Interactive mode**: Always show what will be staged before executing
- **Safety first**: Warn about sensitive files
- **Context aware**: Understand project structure (backend/, frontend/, etc.)
- **Suggest commits**: After staging, recommend commit message type/scope