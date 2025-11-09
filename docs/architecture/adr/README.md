# Architecture Decision Records (ADR)

## Що таке ADR?

Architecture Decision Record (ADR) — це документ, який фіксує важливе архітектурне або продуктове рішення разом із контекстом та наслідками.

## Навіщо це потрібно?

**Проблема:** Через місяць/рік команда забуває, чому було прийняте те чи інше рішення. Нові розробники не розуміють логіку архітектури.

**Рішення:** ADR створює історичний запис рішень із контекстом та обґрунтуванням.

## Коли писати ADR?

Створюйте ADR для рішень, які:
- Впливають на структуру системи
- Складні для зміни у майбутньому
- Мають значущі trade-offs
- Викликали суперечки в команді
- Можуть здаватися незрозумілими через кілька місяців

**Приклади:**
- ✅ Вибір між монолітом та мікросервісами
- ✅ Структура інформаційної архітектури (IA)
- ✅ Вибір state management бібліотеки
- ✅ Підхід до real-time оновлень
- ❌ Назва змінної або стиль коду (занадто дрібно)

## Формат ADR

Кожен ADR має структуру:

```markdown
# ADR-XXXX: Назва рішення

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** Хто приймав рішення
**Context:** 1-2 речення про scope

## Context
Чому виникла необхідність у рішенні? Які обмеження та вимоги?

## Decision
Що було обрано? (коротко та чітко)

## Rationale
Чому саме це рішення? Які переваги?

## Alternatives Considered
Які інші варіанти розглядали? Чому відхилили?

## Consequences
### Positive
Які позитивні наслідки?

### Negative
Які trade-offs та ризики?

## Implementation (опціонально)
План впровадження, timeline, технічні деталі

## References
Посилання на research, proposals, документацію
```

## Нумерація ADR

Використовуємо **послідовну нумерацію** із префіксом:
- `ADR-0001`, `ADR-0002`, `ADR-0003` і т.д.
- Номер **ніколи не змінюється**, навіть якщо рішення deprecated
- Файли: `001-short-description.md`

## Статуси ADR

- **Proposed:** Рішення запропоноване, обговорюється
- **Accepted:** Рішення прийняте та впроваджується
- **Deprecated:** Рішення застаріле, але історично важливе
- **Superseded by ADR-XXXX:** Замінене новим рішенням

## Мова документації

- **ADR документи:** Українська (основна мова команди)
- **Code та comments:** English (стандарт індустрії)
- **API documentation:** Bilingual (EN + UK)

## Приклад використання

```bash
# Знайти рішення про IA
grep -r "Information Architecture" docs/architecture/adr/

# Прочитати конкретний ADR
cat docs/architecture/adr/001-unified-admin-approach.md

# Створити новий ADR
# 1. Визначити номер (наступний у послідовності)
# 2. Створити файл: docs/architecture/adr/NNN-short-name.md
# 3. Заповнити template
# 4. Додати reference у CLAUDE.md
```

## Список ADR

| ID | Статус | Назва | Дата | Теги |
|----|--------|-------|------|------|
| [ADR-0001](./001-unified-admin-approach.md) | Accepted | Unified Admin Approach для IA | 2025-11-02 | UX, Frontend, IA |

---

**Корисні посилання:**
- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)
