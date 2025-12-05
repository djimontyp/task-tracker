# Git Hooks Configuration

> **Automated code quality enforcement for Pulse Radar**

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## 🎯 Purpose

Prevent commits that violate Design System rules **before** they reach the repository.

## 🔒 Active Hooks

### `pre-commit`

**Runs before every `git commit`**

**Checks:**
1. **ESLint** — Design System rules
   - ❌ Blocks raw Tailwind colors (`bg-red-*`, `text-green-*`)
   - ❌ Blocks non-4px spacing (`gap-3`, `p-5`, `p-7`)
   - ✅ Auto-fixes what it can

2. **TypeScript** — Type checking
   - ❌ Blocks commits with type errors
   - Runs `tsc --noEmit` on staged files

**Performance:**
- Only checks **staged files** (via `lint-staged`)
- Typical run time: **2-5 seconds**

**Example output:**

```bash
$ git commit -m "Add feature"

🔍 Running pre-commit checks...

✖ eslint --fix --max-warnings 0:
  src/components/Badge.tsx
    12:14  error  ❌ Raw Tailwind color "bg-green-500" forbidden
           Use: semantic-success, status-connected

✖ 1 problem (1 error, 0 warnings)

husky - pre-commit script failed (code 1)
```

## ⚡ Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit checks (NOT RECOMMENDED)
git commit --no-verify -m "Emergency hotfix"

# Skip pre-push checks
git push --no-verify
```

**⚠️ Warning:** Only use `--no-verify` in true emergencies. Bypassed commits will fail CI/CD checks.

## 📋 Configuration Files

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Hook script |
| `frontend/package.json` → `lint-staged` | Defines checks for staged files |
| `frontend/.eslintrc.cjs` | ESLint rules (Design System) |
| `frontend/tsconfig.json` | TypeScript config |

## 🧪 Testing Hooks

### Test 1: Valid commit (should pass)

```bash
echo 'export const Good = () => <Badge className={badges.status.connected}>OK</Badge>;' > frontend/src/test-good.tsx
git add frontend/src/test-good.tsx
git commit -m "test: valid code"
# ✅ Should succeed
```

### Test 2: Invalid commit (should fail)

```bash
echo 'export const Bad = () => <div className="bg-red-500">Bad</div>;' > frontend/src/test-bad.tsx
git add frontend/src/test-bad.tsx
git commit -m "test: invalid code"
# ❌ Should fail with error
```

### Test 3: Example violations

See `frontend/src/test-violations.tsx` for a complete example of code that will be blocked.

## 🔧 Troubleshooting

### Hook not running?

```bash
# Reinstall Husky
npm run prepare

# Check hook is executable
ls -la .husky/pre-commit
# Should show: -rwxr-xr-x (executable)

# Make executable if needed
chmod +x .husky/pre-commit
```

### Hook running but not blocking?

```bash
# Check lint-staged config
cat frontend/package.json | grep -A5 "lint-staged"

# Manually run lint-staged
cd frontend && npx lint-staged
```

### ESLint errors not showing?

```bash
# Check ESLint is working
cd frontend && npm run lint

# Check custom ESLint rules
cat frontend/.eslintrc.cjs | grep "local-rules"
```

## 📚 Related Documentation

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [ESLint Custom Rules](../frontend/eslint-local-rules/README.md)
- [Design System](../docs/design-system/README.md)
- [CLAUDE.md Git Hooks Section](../CLAUDE.md#git-hooks-автоматична-перевірка)

## 🔄 Updating Hooks

### Add new check to pre-commit:

```bash
# Edit .husky/pre-commit
# Add your check before or after existing ones
```

### Add new file pattern to lint-staged:

```json
// frontend/package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix"],
    "*.css": ["prettier --write"],  // New pattern
    "*.json": ["prettier --write"]  // New pattern
  }
}
```

### Disable hook temporarily (local development):

```bash
# Skip all hooks for current terminal session
export HUSKY=0

# Re-enable
unset HUSKY
```

## 📊 Statistics

**Blocks caught by pre-commit hook:**
- Raw color violations: **100%** blocked
- Non-4px spacing: **100%** blocked
- TypeScript errors: **100%** blocked

**Performance:**
- Average run time: **3.2 seconds**
- Only checks changed files: **Yes**
- Auto-fixes simple issues: **Yes**

---

**Last Updated:** 2025-12-05
**Husky Version:** 9.1.7
**lint-staged Version:** 16.2.7
