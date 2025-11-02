# Рекомендації щодо документування UX/Product рішень

**Created:** 2025-11-02
**Context:** Довгострокова фіксація UX рішення (Unified Admin Approach) через ADR систему

---

## Що було зроблено

### 1. Створена ADR інфраструктура

**Файли:**
- `docs/architecture/adr/README.md` - Що таке ADR, як писати, приклади
- `docs/architecture/adr/001-unified-admin-approach.md` - Перший ADR (Unified Admin approach)

**Формат:**
- Status, Date, Deciders, Context
- Decision (що обрали)
- Rationale (чому)
- Alternatives Considered (що відхилили та чому)
- Consequences (positive/negative)
- Implementation (timeline, технічні деталі)
- References (research, proposals)

### 2. Оновлено CLAUDE.md

**Додана секція:** `## UX/Product Decisions`

**Містить:**
- Короткий summary ADR-0001 (4 рядки)
- Cross-references до повного ADR
- Посилання на research proposal

**Rationale:**
- CLAUDE.md — перший файл, який читають агенти
- Короткий reference не перевантажує контекст
- Деталі винесені в окремий ADR (lazy-load)

### 3. Збережено research proposal

**Файл:** `.artifacts/product-designer-research/ia-restructuring-proposal.md` (1800+ рядків)

**Містить:**
- Повний аналіз 4 опцій (Conservative, Moderate, Radical, Unified Admin)
- Wireframes (ASCII art)
- User flows (Mermaid diagrams)
- Detailed rationale (чому Unified Admin)

**Статус:** Довідковий документ (не для щоденного читання, але історично важливий)

---

## Що треба документувати далі

### Критерії для ADR

Створюйте ADR для рішень, які:
- ✅ Впливають на структуру системи (архітектура, IA, data models)
- ✅ Складні для зміни у майбутньому (high cost of change)
- ✅ Мають trade-offs (positive + negative consequences)
- ✅ Викликали суперечки або довгі обговорення
- ✅ Можуть здаватися незрозумілими через 6-12 місяців
- ❌ Дрібні рішення (стиль коду, назви змінних)

### Кандидати на майбутні ADR

**Frontend/UX:**
- **ADR-0002: Vector Search UI/UX Patterns** - Як візуалізувати semantic similarity для non-technical users
- **ADR-0003: Real-Time Updates UX** - WebSocket оптимістичні оновлення vs immediate feedback
- **ADR-0004: Mobile-First vs Desktop-First** - Breakpoint strategy, touch targets, keyboard shortcuts
- **ADR-0005: Accessibility WCAG 2.1 AA** - Чому саме AA level (не AAA), які exceptions
- **ADR-0006: Dense Data Visualization** - Progressive disclosure strategy для 1000s atoms/messages

**Backend/Architecture:**
- **ADR-0007: Hexagonal Architecture для LLM** - Чому ports-and-adapters, не direct integration
- **ADR-0008: TaskIQ + NATS vs Celery** - Async task queue choice
- **ADR-0009: pgvector vs separate vector DB** - Чому PostgreSQL extension, не Pinecone/Weaviate
- **ADR-0010: Versioning System (Draft → Approved)** - Approval workflow design
- **ADR-0011: Absolute Imports Only** - Чому заборонені relative imports

**Infrastructure:**
- **ADR-0012: Docker Compose vs Kubernetes** - Чому local dev через Docker Compose
- **ADR-0013: Monorepo vs Separate Repos** - Чому backend + frontend в одному repo

### Тригери для створення ADR

**Створюйте ADR коли:**
1. Розробник питає: "Чому ми робимо це так, а не інакше?"
2. PR має довгі коментарі про design alternatives
3. Team discussion займає 30+ хвилин без рішення
4. Рішення впливає на 3+ компоненти/файли
5. Потенційний tech debt (треба пояснити trade-off)

**Фрази-тригери:**
- "Навіщо нам два шари UI?" → Нагадайте ADR-0001
- "Чому не просто Celery?" → Candidate for ADR-0008
- "Чому hexagonal architecture?" → Candidate for ADR-0007

---

## Workflow для створення ADR

### 1. Дискусія → Рішення
- Обговорити alternatives (2-4 опції)
- Зважити pros/cons кожної
- Прийняти рішення (consensus або final call)

### 2. Написати ADR
```bash
# Створити новий ADR
cd docs/architecture/adr/
touch 002-short-name.md

# Заповнити template (см. README.md)
```

### 3. Додати reference в CLAUDE.md
```markdown
### Vector Search UI (ADR-0002)
**Decision:** Confidence scores + expandable reasoning
**Rationale:** Trust через transparency
**Details:** See `docs/architecture/adr/002-vector-search-ui.md`
```

### 4. Commit + PR
```bash
git add docs/architecture/adr/
git commit -m "docs(adr): add ADR-0002 vector search UI patterns"
```

---

## Best Practices

### DO ✅

**1. Write in Ukrainian (для internal team):**
- ADR документи = українською (primary language)
- Code/comments = англійською (industry standard)

**2. Link to research:**
- Якщо є детальний research proposal → посилання в References
- Не копіювати весь research в ADR (створює duplication)

**3. Update ADR list:**
- docs/architecture/adr/README.md → таблиця з усіма ADR
- CLAUDE.md → короткі summaries ключових ADR

**4. Use Status field:**
- **Proposed:** Обговорюється, не прийняте
- **Accepted:** Прийняте та впроваджується
- **Deprecated:** Застаріле, але історично важливе
- **Superseded by ADR-XXXX:** Замінене новим рішенням

**5. Be specific about consequences:**
- Не "це може бути складно" → "потребує 20 годин розробки Admin Panel components"
- Не "краща UX" → "зменшує context switching time на 40% (hypothesis)"

### DON'T ❌

**1. Don't write ADR for everything:**
- Дрібні рішення (код стиль) → не потребують ADR
- Очевидні рішення (REST API for CRUD) → не потребують ADR

**2. Don't copy-paste entire research:**
- ADR = concise summary (2-4 сторінки)
- Research proposal = detailed analysis (10-50 сторінок)
- Link між ними через References

**3. Don't skip Alternatives section:**
- Найважливіша частина ADR — чому НЕ обрали інші варіанти
- Майбутні розробники будуть питати "а чому не X?" → відповідь в Alternatives

**4. Don't forget to update CLAUDE.md:**
- Агенти читають CLAUDE.md першим
- Якщо ADR не згаданий там → легко пропустити

**5. Don't change ADR number:**
- Номер = permanent ID
- Якщо рішення змінилося → Status: Superseded by ADR-XXXX
- Не видаляйте старі ADR (історія важлива)

---

## Структура файлів

```
task-tracker/
├── CLAUDE.md (short summaries + cross-refs)
├── docs/
│   └── architecture/
│       └── adr/
│           ├── README.md (що таке ADR, як писати)
│           ├── 001-unified-admin-approach.md (IA decision)
│           ├── 002-vector-search-ui.md (future)
│           └── 003-real-time-updates-ux.md (future)
├── .artifacts/
│   └── product-designer-research/
│       ├── ia-restructuring-proposal.md (1800 lines research)
│       ├── documentation-recommendations.md (this file)
│       └── (future research proposals)
└── frontend/
    └── CLAUDE.md (frontend-specific context, може містити UX references)
```

---

## Для product-designer агента

**Коли створювати ADR:**

1. **User research завершено** → є insights + options → ADR фіксує рішення
2. **Wireframes готові** → є design rationale → ADR пояснює "чому так"
3. **IA реструктуризація** → є migration plan → ADR документує approach
4. **A/B testing hypothesis** → є success metrics → ADR визначає measurement

**Template для product-designer ADR:**

```markdown
# ADR-XXXX: [Feature Name]

**Status:** Accepted
**Date:** YYYY-MM-DD
**Deciders:** Product Designer (AI Agent), User
**Context:** [1-2 речення про user need]

## Context
[User research insights, pain points, requirements]

## Decision
[Обраний design pattern/approach]

## Rationale
[Чому це вирішує user pain points? Які UX переваги?]

## Alternatives Considered
### Option A: [Name]
- User Impact: [...]
- Pros: [...]
- Cons: [...]
- Rejected: [reason]

## Consequences
### Positive (User Experience)
- [UX improvement 1]
- [UX improvement 2]

### Negative (Trade-offs)
- [What users lose/sacrifice]
- [Development complexity]

## Success Metrics
- [Measurable outcome 1]
- [A/B testing hypothesis]

## Implementation
[Wireframes, user flows, timeline]

## References
- User research: [link]
- Wireframes: [link to artifacts]
- Prototypes: [link]
```

---

## Приклади хороших ADR

### ✅ Good Example: ADR-0001

**Чому добрий:**
- Чіткий context (2 фази: calibration → production)
- 4 alternatives детально розглянуті
- Specific consequences (positive + negative із митигацією)
- Implementation plan (11 тижнів, 6 фаз)
- References до research proposal

**Що робить його корисним:**
- Через рік розробник зрозуміє "чому два UI шари?"
- Нові члени команди побачать trade-offs (не "просто так зробили")
- Product decisions traceable (від user needs до implementation)

### ❌ Bad Example (hypothetical):

```markdown
# ADR-XXXX: Improve UI

**Decision:** Make UI better

**Rationale:** Current UI is not good

**Consequences:** UI will be better
```

**Чому поганий:**
- Не specific (що саме "better"?)
- Немає alternatives (що розглядали?)
- Немає measurable outcomes (як виміряти "better"?)
- Немає context (яка проблема?)

---

## Підсумок

### Створено сьогодні:
1. ✅ ADR infrastructure (README + template)
2. ✅ ADR-0001 (Unified Admin Approach)
3. ✅ CLAUDE.md update (short summary)
4. ✅ Documentation recommendations (цей файл)

### Що маємо тепер:
- **Довгострокова пам'ять:** ADR-0001 зберігає контекст IA рішення
- **Швидкий доступ:** CLAUDE.md → agents бачать summary першим
- **Детальний контекст:** Research proposal (1800 рядків) доступний при потребі
- **Repeatable process:** Workflow для майбутніх ADR

### Next Steps:
- Створити ADR-0002, 0003, 0004 у міру прийняття design decisions
- Оновлювати CLAUDE.md при кожному новому ADR
- Зберігати research proposals в `.artifacts/`

---

**Questions?**
- Як писати ADR → `docs/architecture/adr/README.md`
- Приклад ADR → `docs/architecture/adr/001-unified-admin-approach.md`
- Короткий summary → `CLAUDE.md` секція "UX/Product Decisions"
