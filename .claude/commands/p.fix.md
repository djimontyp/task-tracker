---
description: Fix issues found by /p.analyze (tests, stories, lint)
---

# /p.fix — Fix Project Issues

**Task/Scope:** $ARGUMENTS

## Mode Detection

Determine mode based on `$ARGUMENTS`:

### Scope Mode (фіксовані команди)

If `$ARGUMENTS` is one of: `all`, `tests`, `stories`, `lint`

→ Run predefined fixes (see **Scope Mode Execution** below)

### Task Mode (довільний опис)

If `$ARGUMENTS` is anything else (e.g., "search in nav", "broken button", "topic cards")

→ Find and fix issues in specific task/feature (see **Task Mode Execution** below)

---

## Task Mode Execution

**Goal:** Fix issues related to the described task using the RIGHT specialist.

### Step 1: Select Specialist Agent

**ВАЖЛИВО:** Перед запуском — подивись на **Task tool description** де перелічені доступні агенти (subagent_type).

Проаналізуй задачу "$ARGUMENTS" і визнач:
- Який домен? (frontend, backend, design, testing, docs, AI/LLM)
- Який агент найкраще підходить для ВИПРАВЛЕННЯ цієї задачі?

**Приклади reasoning:**
- "broken button" → UI компонент → шукай агента для React/frontend
- "api returns 500" → backend → шукай агента для FastAPI/backend
- "tests failing" → testing → шукай агента для QA/тестування
- "wrong colors" → design → шукай агента для дизайну

### Step 2: Delegate to Specialist

Запусти обраного агента з задачею на виправлення:

```yaml
Task:
  subagent_type: "[ОБРАНИЙ АГЕНТ]"
  description: "Fix: $ARGUMENTS"
  prompt: |
    **Задача:** Виправити проблеми в "$ARGUMENTS"

    **Working directory:** /Users/maks/PycharmProjects/task-tracker

    **Що зробити:**
    1. Знайти пов'язані файли
    2. Виявити проблеми (typecheck, lint, tests)
    3. ВИПРАВИТИ кожну знайдену проблему
    4. Перевірити що виправлення працює

    **Формат звіту:**
    ```markdown
    ## 🔧 Fix Results: $ARGUMENTS

    ### Files Modified
    | File | Issue | Fix Applied |
    |------|-------|-------------|
    | ... | ... | ... |

    ### Verification
    - [Check type]: ✅/❌ — details

    ### Remaining Issues
    - (if any need manual fix)
    ```
```

### Step 3: Compile Report

Отримай результат від агента і покажи користувачу.

---

## Scope Mode Execution

### `tests` or `all`

1. Run tests to identify failures:
   ```bash
   cd frontend && npm run test:run 2>&1
   ```

2. For each failing test, analyze and fix:
   - Read the test file and component it tests
   - Determine if test is outdated or component changed
   - Fix test to match current component behavior
   - Do NOT change component to match test (unless bug)

3. Re-run tests to verify fix

### `stories` or `all`

1. Find components missing stories:
   ```bash
   # Components in shared/components and shared/layouts
   find frontend/src/shared -name "*.tsx" -not -name "*.stories.tsx" -not -name "*.test.tsx"
   ```

2. For each missing story:
   - Read the component to understand props and variants
   - Read existing stories in same directory for pattern
   - Create story file following project conventions:
     - `tags: ['autodocs']`
     - Cover all variants/states
     - Add proper decorators (MemoryRouter, ThemeProvider if needed)

3. Verify stories compile:
   ```bash
   cd frontend && npx tsc --noEmit
   ```

### `lint` or `all`

1. Run ESLint with auto-fix:
   ```bash
   cd frontend && ESLINT_USE_FLAT_CONFIG=false npx eslint src --ext .ts,.tsx --fix
   ```

2. Report what was fixed vs what needs manual fix

---

## Scope Mode Output

```markdown
## 🔧 Fix Results: $ARGUMENTS

### Tests
- ✅ Fixed: N tests
- ❌ Manual fix needed: M tests (list)

### Stories
- ✅ Created: N stories
- Files: (list created files)

### Lint
- ✅ Auto-fixed: N issues
- ⚠️ Manual fix: M issues (list)

### Verification
- TypeScript: ✅/❌
- Tests: ✅/❌

### Next Steps
- ✅ All fixed → готово до commit (use `smart-commit` skill)
- ❌ Manual fixes needed → see list above
```