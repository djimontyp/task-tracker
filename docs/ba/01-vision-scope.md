# Vision & Scope Document

**Продукт:** Pulse Radar
**Версія:** Draft v0.1
**Статус:** ✅ Approved (Q1-Q4 узгоджено)
**Дата:** 2025-12-10

---

## 1. Problem Statement

### Поточна ситуація (As-Is)

Команди отримують **500+ повідомлень на день** у робочих Telegram чатах.
В активні періоди — **до 500+ за кілька годин** з одного чату.
Приблизно **80% з них — шум**: привітання, off-topic, дублікати.

**Три ключові проблеми:**
1. **Втрата інформації** — важливі рішення та завдання губляться в потоці
2. **Неможливість пошуку** — не знайти що обговорювалось раніше
3. **Відсутність структури** — знання розкидані, не систематизовані

**Наслідки:**
- Витрачається **30+ хвилин** на review
- Рішення приймаються без повного контексту
- Повторюються питання що вже обговорювались

### Цільова ситуація (To-Be)

AI-система автоматично:
1. Фільтрує шум (сигнал/шум класифікація)
2. Витягує структуровані знання (Atoms)
3. Групує по темах (Topics)
4. Надає пошук та аналітику (Dashboard)

**Результат:**
- 30 хв → **5 хв** на daily review
- 100+ повідомлень → **5-10 atoms** (структуровані insights)
- Знання searchable та persistent

---

## 2. Vision Statement

> **Pulse Radar** перетворює хаос командної комунікації в структуровані, searchable знання.

**One-liner:**
```
Telegram (500+ msg) → AI → Dashboard (5-10 insights)
```

---

## 3. Target Users

### Масштаб

- **Primary deployment:** 40 користувачів
- **Організація:** компанія з декількома проєктами
- **Team size:** 5-10 людей на проєкт

### Primary Users

| Роль | Потреба | Як використовує |
|------|---------|-----------------|
| **PM** | Швидко зрозуміти стан проєкту | Daily review → Dashboard |
| **CEO** | Бачити key decisions та blockers | Weekly summary |
| **Dev** | Знайти контекст минулих рішень | Search |

### User Personas

**Persona 1: PM Олена**
- 3 активні проєкти
- 500+ повідомлень/день у робочих чатах
- Витрачає 1 годину на morning sync
- Pain: губить важливу інформацію в потоці
- Хоче: "Що важливого пропустила за вчора?"

**Persona 2: CTO Максим**
- 5 команд під керівництвом
- Не читає всі канали
- Pain: не може знайти що обговорювалось раніше
- Хоче: "Які блокери та рішення цього тижня?"

---

## 4. Success Criteria

### MVP Launch Criteria (Priority #1)

| Метрика | Target | Як вимірюємо |
|---------|--------|--------------|
| Users onboarded | 40 users | System registrations |
| MVP demonstrated | ✓ | Stakeholder sign-off |
| Daily active users | >50% | Analytics |

### Quantitative (Post-Launch)

| Метрика | Baseline | Target | Як вимірюємо |
|---------|----------|--------|--------------|
| Час на review | 30 min | 5 min | User survey |
| Повідомлень → Atoms | 500:500 | 500:10-20 | System metrics |
| Signal/Noise accuracy | - | >85% | User feedback |
| Search relevance | - | >80% | User ratings |

### Qualitative

- Users знаходять потрібну інформацію за <30 секунд
- Dashboard показує "pulse" команди at a glance
- Знання не губляться — все searchable
- Користувачі перестають питати "а де це обговорювалось?"

---

## 5. Scope

### In Scope (v1.0)

**MVP Done (13 features):**
- [x] Telegram webhook інгест
- [x] Message storage та CRUD
- [x] AI knowledge extraction (Atoms)
- [x] Topics management
- [x] Dashboard з метриками
- [x] LLM providers (OpenAI, Ollama)
- [x] Background tasks (TaskIQ)
- [x] Settings page
- [x] Design System (shadcn/ui, WCAG AA)

**v1.1 Priorities:**

1. **User Onboarding** (PRIMARY)
   - [ ] Запуск перших користувачів
   - [ ] MVP демонстрація stakeholders
   - [ ] Onboarding documentation

2. **Technical Features** (SECONDARY)
   - [ ] WebSocket real-time updates
   - [ ] AI agents configuration
   - [ ] Semantic search (pgvector)
   - [ ] Embeddings API
   - [ ] Ingestion API

### Out of Scope (v1.x)

| Feature | Коли | Чому не зараз |
|---------|------|---------------|
| Slack integration | v2.0 | Фокус на Telegram |
| Multi-tenant | v2.0 | Single-team first |
| Mobile app | v2.0+ | Web-first |
| Email integration | v2.0+ | Low priority |

---

## 6. Constraints & Assumptions

### Constraints

1. **Technical:**
   - OpenAI API rate limits
   - PostgreSQL single instance (no sharding)
   - Browser-only (no native apps)

2. **Business:**
   - Solo development
   - MVP-first approach

### Assumptions

1. Telegram — основне джерело комунікації
2. AI extraction accuracy >85% achievable
3. Users willing to review AI suggestions
4. Team size: 5-20 people

### Risks (High-level)

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI rate limits | High | Ollama fallback |
| LLM hallucinations | Medium | Human review |
| Data privacy | High | Self-hosted option |

---

## 7. Key Decisions Made

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| 1 | Telegram-first | 2024 | Most used by target teams |
| 2 | PostgreSQL + pgvector | 2024 | Unified DB for vectors |
| 3 | Human-in-the-loop | 2024 | AI proposes, human approves |
| 4 | shadcn/ui + Tailwind | 2024 | Rapid UI development |

---

## 8. Open Questions

### Закриті питання (Q1-Q4)

| # | Питання | Відповідь | Дата |
|---|---------|-----------|------|
| Q1 | Volume | 500+ msg/день, до 500+ за кілька годин | 2025-12-10 |
| Q2 | Users | Team 5-10, 40 users total, multi-project | 2025-12-10 |
| Q3 | Pain points | Втрата інфо, пошук, структура | 2025-12-10 |
| Q4 | Priority | User onboarding, MVP demo | 2025-12-10 |

### Закриті питання (Q5-Q7)

| # | Питання | Відповідь | Дата |
|---|---------|-----------|------|
| Q5 | Atom types | Всі 6 потрібні: TASK, IDEA, DECISION, PROBLEM, QUESTION, INSIGHT | 2025-12-10 |
| Q6 | Scoring thresholds | Iterative calibration: почати з базових, калібрувати по результатах | 2025-12-10 |
| Q7 | Topics | Auto + Manual: AI пропонує, людина підтверджує | 2025-12-10 |

---

## Appendix: Core Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TELEGRAM   │────▶│   ІНГЕСТ    │────▶│     AI      │────▶│  DASHBOARD  │
│   (500+     │     │  + Scoring  │     │ Extraction  │     │   Insights  │
│  msg/day)   │     │             │     │             │     │   Search    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │                   │
       │                  ▼                   ▼                   │
       │           Signal/Noise         6 Atom Types             │
       │           Classification       + Topics                 │
       │                                                         │
       └─────────────────────────────────────────────────────────┘
                              Feedback Loop
```

---

**Next:** Після узгодження цього документа → [Glossary](./02-glossary.md)
