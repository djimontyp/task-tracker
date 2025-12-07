---
description: Run parallel verification agents (typecheck, tests, stories)
---

# /p.analyze — Project Analysis

**Task/Scope:** $ARGUMENTS

## Mode Detection

Determine mode based on `$ARGUMENTS`:

### Scope Mode (фіксовані команди)

If `$ARGUMENTS` is one of: `all`, `backend`, `frontend`, `tests`, `stories`

→ Run predefined checks (see **Scope Mode Execution** below)

### Task Mode (довільний опис)

If `$ARGUMENTS` is anything else (e.g., "search in nav", "topic cards", "auth flow")

→ Analyze specific task/feature (see **Task Mode Execution** below)

---

## Task Mode Execution

**Goal:** Analyze code related to the described task using the RIGHT specialist.

### Step 1: Select Specialist Agent

**ВАЖЛИВО:** Перед запуском — подивись на **Task tool description** де перелічені доступні агенти (subagent_type).

Проаналізуй задачу "$ARGUMENTS" і визнач:
- Який домен? (frontend, backend, design, testing, docs, AI/LLM)
- Який агент найкраще підходить?

**Приклади reasoning:**
- "search in nav" → UI компонент → шукай агента для React/frontend
- "api endpoint for users" → backend → шукай агента для FastAPI/backend
- "button colors" → design tokens → шукай агента для дизайну
- "test coverage" → testing → шукай агента для QA/тестування

### Step 2: Delegate to Specialist

Запусти обраного агента з задачею:

```yaml
Task:
  subagent_type: "[ОБРАНИЙ АГЕНТ]"
  description: "Analyze: $ARGUMENTS"
  prompt: |
    **Задача:** Проаналізувати "$ARGUMENTS"

    **Working directory:** /Users/maks/PycharmProjects/task-tracker

    **Що зробити:**
    1. Знайти всі пов'язані файли
    2. Прочитати і зрозуміти код
    3. Запустити відповідні перевірки (typecheck, lint, tests)
    4. Виявити проблеми або missing functionality

    **Формат звіту:**
    ```markdown
    ## 🔍 Analysis: $ARGUMENTS

    ### Related Files
    | File | Type | Description |
    |------|------|-------------|
    | ... | ... | ... |

    ### Checks
    - [Check type]: ✅/❌ — details

    ### Issues Found
    - (list specific issues)

    ### Recommendations
    - (what to implement/fix)
    ```
```

### Step 3: Compile Report

Отримай результат від агента і покажи користувачу.

---

## Scope Mode Execution

Launch agents using Task tool with `run_in_background: true`:

### `backend` or `all`

```yaml
Task:
  subagent_type: "Backend Expert (B1)"
  description: "Backend typecheck"
  prompt: |
    Run mypy typecheck on backend.

    Command: cd /Users/maks/PycharmProjects/task-tracker/backend && uv run mypy .

    Report format:
    ```
    Backend Typecheck: ✅ PASSED / ❌ N errors

    Errors (if any):
    - file.py:line — description
    ```
  run_in_background: true
```

### `frontend` or `all`

```yaml
Task:
  subagent_type: "Frontend Expert (F1)"
  description: "Frontend typecheck"
  prompt: |
    Run TypeScript check on frontend.

    Command: cd /Users/maks/PycharmProjects/task-tracker/frontend && npx tsc --noEmit

    Report format:
    ```
    TypeScript: ✅ PASSED / ❌ N errors

    Errors (if any):
    - file.ts:line — description
    ```
  run_in_background: true
```

### `tests` or `all`

```yaml
Task:
  subagent_type: "Super QA (Q1)"
  description: "Run unit tests"
  prompt: |
    Run frontend unit tests.

    Command: cd /Users/maks/PycharmProjects/task-tracker/frontend && npm run test:run

    Report format:
    ```
    Unit Tests: ✅ X/Y passed / ❌ N failures

    Failures (if any):
    - file.test.ts — test name — reason
    ```
  run_in_background: true
```

### `stories` or `all`

```yaml
Task:
  subagent_type: "Frontend Expert (F1)"
  description: "Check missing stories"
  prompt: |
    Find components without Storybook stories.

    Working directory: /Users/maks/PycharmProjects/task-tracker/frontend

    Steps:
    1. Find all component files: src/shared/components/**/index.tsx, src/shared/layouts/**/*.tsx
    2. Check if corresponding .stories.tsx exists
    3. List components missing stories

    Report format:
    ```
    Stories Check: ✅ All covered / ⚠️ N missing

    Missing stories:
    - ComponentName — path/to/component.tsx
    ```
  run_in_background: true
```

---

## Scope Mode Output

Wait for all agents with `AgentOutputTool`, then compile:

```markdown
## 🔍 Analysis Results: $ARGUMENTS

| Check | Status | Details |
|-------|--------|---------|
| Backend Typecheck | ✅/❌ | N errors |
| Frontend TypeScript | ✅/❌ | N errors |
| Unit Tests | ✅/❌ | X/Y passed |
| Stories | ✅/⚠️ | N missing |

### Issues Found
(compile from agents)

### Next Steps
- ✅ All passed → готово до commit (use `smart-commit` skill)
- ❌ Issues found → run `/p.fix` or fix manually
```