---
description: Full verification pipeline (analyze → fix)
---

# /p.verify — Full Verification Pipeline

**Task/Scope:** $ARGUMENTS

## Mode Detection

Determine mode based on `$ARGUMENTS`:

### Scope Mode (фіксовані команди)

If `$ARGUMENTS` is one of: `all`, `backend`, `frontend`

→ Run full pipeline for scope (see **Scope Mode Pipeline** below)

### Task Mode (довільний опис)

If `$ARGUMENTS` is anything else (e.g., "search in nav", "topic cards", "auth flow")

→ Verify specific task/feature end-to-end (see **Task Mode Pipeline** below)

---

## Task Mode Pipeline

**Goal:** Full verification cycle for a specific task/feature using the RIGHT specialist.

### Phase 1: Select Specialist Agent

**ВАЖЛИВО:** Перед запуском — подивись на **Task tool description** де перелічені доступні агенти (subagent_type).

Проаналізуй задачу "$ARGUMENTS" і визнач:
- Який домен? (frontend, backend, design, testing, docs, AI/LLM)
- Який агент найкраще підходить для ПОВНОЇ ВЕРИФІКАЦІЇ?

**Приклади reasoning:**
- "search component" → UI → шукай агента для React/frontend
- "user API" → backend → шукай агента для FastAPI/backend
- "dark mode" → design/frontend → шукай агента для дизайну або frontend

### Phase 2: Delegate Full Pipeline

Запусти обраного агента з повним pipeline:

```yaml
Task:
  subagent_type: "[ОБРАНИЙ АГЕНТ]"
  description: "Verify: $ARGUMENTS"
  prompt: |
    **Задача:** Повна верифікація "$ARGUMENTS"

    **Working directory:** /Users/maks/PycharmProjects/task-tracker

    **Pipeline:**
    1. **Discovery** — знайти всі пов'язані файли
    2. **Analysis** — запустити перевірки (typecheck, lint, tests)
    3. **Fix** — виправити знайдені проблеми
    4. **Re-verify** — підтвердити що все працює

    **Формат звіту:**
    ```markdown
    ## ✅ Verification: $ARGUMENTS

    ### Discovery
    Found N files: (list key files)

    ### Analysis → Fix
    | Check | Initial | After Fix |
    |-------|---------|-----------|
    | ... | ❌/✅ | ✅ |

    ### Fixes Applied
    - (list what was fixed)

    ### Final Status
    ✅/❌ All checks pass
    ```
```

### Phase 3: Compile Report

Отримай результат від агента.

Якщо є проблеми які агент не зміг виправити:
1. Покажи що залишилось
2. Запитай користувача: "Запустити ще одного агента для виправлення?"

---

## Scope Mode Pipeline

### Phase 1: Analysis

Run `/p.analyze` logic based on scope:

| Scope | Checks |
|-------|--------|
| `all` | backend + frontend + tests + stories |
| `backend` | backend typecheck only |
| `frontend` | frontend tsc + tests + stories |

Launch agents in parallel, collect results.

### Phase 2: Auto-Fix (if issues found)

If analysis found issues:

1. Show summary of issues
2. Ask user: "Знайдено N проблем. Запустити auto-fix? (y/n)"
3. If yes → run `/p.fix` logic for relevant scope
4. If no → show manual fix instructions

### Phase 3: Re-verify

After fixes:
1. Re-run failed checks only
2. Confirm all pass

---

## Scope Mode Output

```markdown
## ✅ Verification Complete: $ARGUMENTS

### Phase 1: Analysis
| Check | Initial | After Fix |
|-------|---------|-----------|
| Backend | ✅/❌ | ✅ |
| Frontend | ✅/❌ | ✅ |
| Tests | ✅/❌ | ✅ |
| Stories | ✅/❌ | ✅ |

### Phase 2: Fixes Applied
- Tests: N fixed
- Stories: M created
- Lint: K auto-fixed

### Phase 3: Final Status
✅ All checks pass — готово до commit

### Next Step
Use `smart-commit` skill для atomic commits
```

---

## Notes

- Pipeline does NOT auto-commit — use `smart-commit` skill separately
- If fix fails, stops and reports what needs manual attention
- Re-runs only failed checks for efficiency
- Task mode is smarter — focuses only on relevant files