# Робота агентів

## Підхід: Fail-Fast + SPEC-light

**Перед реалізацією — прості перевірки:**
- API endpoint існує? (`curl` → 200?)
- Типи/schemas доступні?
- Залежності на місці?

**Якщо перевірка провалилась → blocker, не обхід.**

## Заборонено при відсутності API:
- ❌ Mock/stub дані
- ❌ Альтернативні endpoints
- ❌ Читати backend код для "обходу"

## Порядок роботи (адаптувати до розміру задачі):
1. **Перевірка** — API, types, dependencies
2. **Контекст** — існуючі паттерни в codebase
3. **Реалізація** — код (Storybook для компонентів)
4. **Верифікація** — typecheck, build, browser

## При оновленні UI концепцій:
1. **Переглянь референси** — `docs/design-system/references/`
2. **Зрозумій патерни** — що спільного між референсами?
3. **Реалізуй в Storybook** — референси інформують, Storybook реалізує

---

# 🚫 Blocker Detection Protocol

> **TL;DR:** Signal blocks clearly, get unblocked fast, track everything.

## When to Signal Blocker

Сигналізуй блокер коли:
- ✅ **DEPENDENCY:** Необхідний код ще не існує (API endpoint, model, component)
- ✅ **CONTEXT:** Потрібна інформація з іншого domain (business logic, requirements)
- ✅ **EXTERNAL:** Зовнішній сервіс недоступний (DB, API, NATS)
- ✅ **REQUIREMENTS:** Spec неясний/неповний/суперечливий

Заборонено:
- ❌ Mock/stub data замість блокера
- ❌ Workarounds замість сигналізації
- ❌ Читання чужого domain коду для "обходу"

## Signal Format

**Повний формат:**
```markdown
## Status: Blocked

**Category:** [DEPENDENCY|CONTEXT|EXTERNAL|REQUIREMENTS]
**Severity:** [CRITICAL|HIGH|MEDIUM|LOW]
**Problem:** [Що блокує прогрес]
**Need:** [Конкретна вимога для розблокування]
**Blocker ID:** BLK-{issue-id}-{timestamp}
```

**Мінімальний формат:**
```markdown
**Status:** Blocked
**Category:** [категорія]
**Problem:** [опис]
**Need:** [що потрібно]
```

## Resolution Flow

```
Agent blocks → Coordinator detects → Beads update (blocked)
                                            ↓
                                      Route to resolver
                                            ↓
                    Resolver provides solution/context
                                            ↓
                          Resume blocked agent with context
                                            ↓
                            Beads update (in-progress)
```

## Beads Integration

```bash
# Blocker detected
bd update {issue} --status blocked
bd comments add {issue} "🚫 BLOCKED\nCategory: DEPENDENCY\n..."

# Blocker resolved
bd update {issue} --status in-progress
bd comments add {issue} "✅ RESOLVED\nSolution: ..."
```

## Category Routing

| Category | Primary Resolver | Fallback |
|----------|------------------|----------|
| DEPENDENCY | Domain expert | User |
| CONTEXT | BA (A1) | Domain expert |
| EXTERNAL | Auto-retry (3x) | User |
| REQUIREMENTS | BA (A1) + User | User |