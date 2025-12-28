# Handoff: Pulse Radar

**Гілка:** `006-knowledge-discovery`
**Оновлено:** 2025-12-28

---

## Що робити

**Один пріоритет:** Перевірити що core flow працює.

**План:** `.obsidian-docs/плани/core-flow-verification.md`

**Команда для старту:**
```bash
just db-nuclear-reset && just services-dev
```

**Потім:** Йти по чекбоксам в плані — curl на webhook, дивитись результат, TDD якщо ламається.

---

## Core Flow

```
Telegram webhook → Message → AI parsing → Atoms/Topics → UI
```

Це єдине що має працювати. Все інше — потім.

---

## Якщо щось не працює

1. Записати що зламалось
2. Написати failing test
3. Пофіксити
4. Продовжити

---

## Контекст (читати тільки якщо треба)

| Документ | Коли читати |
|----------|-------------|
| `CLAUDE.md` | Завжди — там концепції |
| `core-flow-verification.md` | Під час тестування |
| `extraction-pipeline-improvements.md` | Після core працює |
| `docs/product/prd/` | Коли треба UI деталі |
| `docs/architecture/adr/` | Коли треба технічні рішення |

---

## Не робити

- Не писати нову документацію
- Не планувати нові features
- Не оптимізувати поки не працює базове
