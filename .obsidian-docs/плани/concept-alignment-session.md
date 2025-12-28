# Concept Alignment Session

> **Створено:** 2025-12-28
> **Запланована дата:** 2025-12-29
> **Статус:** draft
> **Пріоритет:** high
> **Тип:** стратегічна сесія

## Мета

Глибокий аналіз проекту Pulse Radar разом з Claude для узгодження:
- Концепцій та їх ієрархії
- UI/UX пріоритетів
- Що показувати користувачу vs що ховати

## Відомі неточності

### 1. Messages — надто видимі

**Поточний стан:**
- Messages мають окрему сторінку в UI
- Є фільтри, пошук по messages
- Виглядає як "головна" сутність

**Як має бути:**
- Messages = raw data, "чорний ящик"
- Користувач НЕ працює з messages напряму
- Видимі тільки для:
  - Дебагу на етапі "притірки" системи
  - Крайні випадки (щось пішло не так)
  - Адмін/DevOps перевірки

**Питання для сесії:**
- [ ] Прибрати Messages зі sidebar?
- [ ] Зробити Messages частиною Settings/Debug?
- [ ] Які саме сценарії потребують доступу до raw messages?

### 2. Ієрархія сутностей

**Поточне розуміння:**
```
Telegram Channel → Messages (raw) → AI Processing → Atoms → Topics
                        ↓
                   [HIDDEN LAYER]
```

**Питання:**
- [ ] Atoms — це кінцева "одиниця знань"?
- [ ] Topics — це групування atoms чи окрема сутність?
- [ ] Що бачить кінцевий користувач на Dashboard?

### 3. Фокус UI

**Де зараз фокус:**
- Messages list
- Analysis runs
- Providers configuration

**Де має бути фокус (гіпотеза):**
- Topics overview (що цікавого сьогодні?)
- Atoms feed (нові знання)
- Insights/Summary (AI-generated)

## План сесії

### Частина 1: Аудит концепцій (30 хв)

1. **Пройтись по CLAUDE.md** — чи актуальний опис?
2. **Переглянути Knowledge notes** — чи відповідають реальності?
3. **Зібрати всі TODO/FIXME** — концептуальні vs технічні

### Частина 2: User Journey Mapping (30 хв)

1. **Персона користувача** — хто він? що хоче?
2. **Щоденний сценарій** — що робить зранку?
3. **Pain points** — що дратує в 100+ повідомленнях?

### Частина 3: UI Priorities (30 хв)

1. **Що показувати ЗАВЖДИ** — Dashboard, Today's Focus
2. **Що показувати ПО ЗАПИТУ** — Topics, Atoms, Search
3. **Що ХОВАТИ** — Messages, Runs, Technical stuff

### Частина 4: Action Items (30 хв)

1. Оновити CLAUDE.md з новим баченням
2. Створити/оновити Knowledge notes
3. Сформувати backlog UI змін

### Частина 5: ADR — Architecture Decision Records (45 хв)

Пройтись по ключових архітектурних рішеннях:

1. **Чому NATS а не Redis/Kafka?**
2. **Чому pgvector а не окремий vector DB?**
3. **Чому Pydantic AI а не LangChain?**
4. **Message → Atom extraction flow**
5. **Real-time: WebSocket vs SSE**

Формат: `docs/architecture/adr/XXX-*.md`

### Частина 6: PRD — Product Requirements (1 год)

Документувати бачення для кожної підсистеми:

| Підсистема | Що робить | Для кого | Ключові сценарії |
|------------|-----------|----------|------------------|
| Ingestion | Збір messages | System | Telegram webhook → DB |
| Knowledge Extraction | Message → Atom | AI Pipeline | Автоматична класифікація |
| Topics | Групування atoms | End User | Огляд по темах |
| Dashboard | Today's Focus | End User | "Що нового?" |
| Settings | Конфігурація | Admin | Providers, channels |
| Search | Пошук знань | End User | Semantic + FTS |

Для кожної підсистеми:
- [ ] Мета (1 речення)
- [ ] User stories (3-5)
- [ ] Acceptance criteria
- [ ] Out of scope

## Артефакти сесії

По завершенню мають бути:

- [ ] Оновлений `CLAUDE.md` — Core Flow секція
- [ ] Нова нотатка `концепт-user-journey.md`
- [ ] Нова нотатка `концепт-ui-hierarchy.md`
- [ ] **ADRs** для ключових рішень (3-5 документів)
- [ ] **PRDs** для підсистем (в `.artifacts/prd/` або `docs/`)
- [ ] **Testing Strategy** документ — коли Storybook, коли integration
- [ ] Issues для UI рефакторингу

## Підготовка

Перед сесією підготувати:

1. **Скріншоти поточного UI** — як виглядає зараз
2. **Список всіх сторінок/routes** — що є в navigation
3. **Референси** — як виглядають схожі продукти
4. **Метрики** — скільки messages/atoms/topics в seed data

## Trigger для запуску

Коли готовий почати:
```
/obsidian:vault "почати concept alignment сесію"
```

Або просто:
```
"Давай проведемо alignment сесію по концепціях Pulse Radar"
```

---

### Частина 7: Development Workflow & Testing Strategy (45 хв)

**Ключове питання:**
> Якщо я пропрацьовую компоненти в Storybook (ізольовано), чи "вирівняється" система автоматично? Чи треба завжди тестувати всю інтеграцію?

#### Дослідити:

1. **Storybook-first підхід**
   - [ ] Які компоненти можна повністю розробити в ізоляції?
   - [ ] Де потрібен реальний API/state?
   - [ ] Як мокати залежності правильно?

2. **Рівні тестування**
   ```
   Storybook (ізоляція) → Unit тести → Integration → E2E
         ↓                    ↓              ↓         ↓
     UI/візуал           логіка        API зв'язки  real flow
   ```

   - [ ] Що ловить кожен рівень?
   - [ ] Де найбільше багів проскакує?
   - [ ] Мінімальний набір для впевненості?

3. **"Вирівнювання" системи**
   - [ ] Чи є компоненти що "самовирівнюються" (stateless, pure)?
   - [ ] Чи є компоненти що потребують real data для валідації?
   - [ ] Contract testing: API ↔ Frontend типи

4. **Поточний стан тестів**
   - Backend: 996 тестів ✅
   - Frontend unit: 51 тест (96% pass)
   - E2E: stubs (не працюють)
   - Storybook: ~280 stories

   **Питання:** Чого не вистачає? Що ламається непомітно?

5. **Практичні сценарії**

   | Зміна | Storybook достатньо? | Потрібно ще |
   |-------|---------------------|-------------|
   | Новий Button variant | ✅ Так | — |
   | Зміна TopicCard layout | ⚠️ Частково | Перевірити в Dashboard |
   | Новий API endpoint | ❌ Ні | Integration + types |
   | Зміна state logic | ❌ Ні | Unit + integration |
   | Редизайн сторінки | ⚠️ Частково | E2E critical path |

6. **Рекомендації (сформувати по результатах)**
   - [ ] Чеклист: коли Storybook достатньо
   - [ ] Чеклист: коли потрібен повний цикл
   - [ ] Automation: що можна автоматизувати

### Частина 8: Deep Analysis з MCP Sequential Thinking (1 год)

**Що це:** MCP server для структурованого покрокового аналізу складних проблем.

**Де застосувати:**

1. **Архітектурні дилеми**
   ```
   Питання: "NATS vs Redis для real-time?"
   → Sequential thinking розкладе:
     - Вимоги
     - Критерії порівняння
     - Trade-offs
     - Рекомендація з обґрунтуванням
   ```

2. **UI/UX рішення**
   ```
   Питання: "Як організувати navigation для різних ролей?"
   → Покрокова декомпозиція user flows
   ```

3. **Testing strategy**
   ```
   Питання: "Мінімальний набір тестів для впевненості?"
   → Аналіз ризиків → coverage priorities
   ```

4. **Концептуальні питання**
   ```
   Питання: "Messages visible vs hidden — як правильно?"
   → Аналіз use cases → рекомендація
   ```

**Формат роботи:**

| Крок | Дія |
|------|-----|
| 1 | Сформулювати проблему/питання |
| 2 | Запустити sequential thinking |
| 3 | Ревью кожного кроку reasoning |
| 4 | Зафіксувати висновок в ADR/PRD |

**Кандидати для deep analysis:**

- [ ] Message visibility strategy
- [ ] Component isolation levels (Storybook vs Integration)
- [ ] Dashboard information hierarchy
- [ ] Real-time update strategy (WebSocket topics)
- [ ] Knowledge extraction pipeline design

**Артефакт:** Для кожного deep analysis → окремий ADR або Knowledge note з reasoning chain.

## Нотатки

*Додавай сюди думки/спостереження до сесії:*

- Messages мають бути як logs — є, але не дивишся поки не треба
- Dashboard = "Що нового за останні 24h" а не "Статистика системи"
- Storybook = швидкий feedback loop, але не замінює integration
- ...

---

**Оцінка часу:** 6-7 годин (розбити на 3 сесії)
**Формат:** інтерактивна сесія з Claude + MCP Sequential Thinking

## Структура сесій

| Сесія | Частини | Час |
|-------|---------|-----|
| **Сесія 1** | Аудит + User Journey + UI Priorities | ~1.5 год |
| **Сесія 2** | ADR + PRD + Action Items | ~2.5 год |
| **Сесія 3** | Testing Strategy + Deep Analysis (MCP) | ~2 год |

*MCP Sequential Thinking використовувати для найскладніших питань.*
