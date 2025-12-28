# User Journey Maps — Pulse Radar

**Дата:** 2025-12-27
**Версія:** 1.0
**Автор:** Business Analyst (A1)

---

## Зміст

1. [Персона 1: Knowledge Manager](#persona-1-knowledge-manager)
2. [Персона 2: Team Lead](#persona-2-team-lead)
3. [Персона 3: Analyst](#persona-3-analyst)
4. [Cross-Persona Insights](#cross-persona-insights)
5. [Priority Recommendations](#priority-recommendations)

---

## Персона 1: Knowledge Manager

**Профіль:**
- Роль: Координатор знань у команді/організації
- Мета: Витягувати інсайти з team chat, структурувати знання
- Навички: Середні (не технічний user)
- Частота використання: Щоденна (2-3 рази на день)

### Journey Map

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   ЕТАП      │  ENTRY       │  DISCOVERY   │  EXTRACTION  │  REVIEW      │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Дії        │ • Відкрив    │ • Переглядає │ • Обирає     │ • Перевіряє  │
│ користувача│   Dashboard  │   Messages   │   AI agent   │   Versions   │
│            │ • Бачить     │ • Фільтрує   │ • Запускає   │ • Approve/   │
│            │   "No data"  │   за датою   │   extraction │   Reject     │
│            │ • Натискає   │ • Читає      │ • Чекає     │ • Редагує    │
│            │   Settings   │   повідом.   │   progress   │   atoms      │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ UI         │ Dashboard    │ MessagesPage │ Knowledge    │ VersionsPage │
│ touchpoint │ + Onboarding │ + Filters    │ Extraction   │ + Diff View  │
│            │ Wizard       │ + Search     │ Panel        │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Емоції     │ 😕 Confusion │ 😐 Neutral   │ 🙂 Hope      │ 😊 Delight   │
│            │ (Empty state)│              │              │ (Results!)   │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Pain       │ ❌ Не зрозу- │ ⚠️  Багато   │ ⏳ Очікуван- │ ⚠️  Багато   │
│ Points     │   міло що    │   шуму       │   ня без     │   версій для │
│            │   робити     │   (noise)    │   feedback   │   review     │
│            │ ❌ Telegram  │ ⚠️  Незрозу- │ ❌ Немає     │ ❌ Diff view │
│            │   налашту-   │   міло які   │   ETA        │   складний   │
│            │   вання      │   важливі    │              │              │
│            │   складне    │              │              │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Moments of │              │ ✅ Smart     │ ✅ Real-time │ ✅ "Review   │
│ Delight    │              │   filters    │   progress   │   Now" CTA   │
│            │              │   працюють   │   (WebSocket)│   in toast   │
│            │              │              │ ✅ Live      │ ✅ One-click │
│            │              │              │   counters   │   approve    │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Drop-off   │ 🔴 HIGH      │ 🟡 MEDIUM    │ 🟢 LOW       │ 🟡 MEDIUM    │
│ Risk       │ (No guidance)│ (Overwhelm)  │              │ (Fatigue)    │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Pain Points Деталізація

**Entry Stage:**
1. **Onboarding Gap** — wizard показується тільки при `hasNoData`, але що якщо є дані але user новий?
2. **Telegram Setup** — вимагає webhook URL, токен, не всі users знають як це налаштувати
3. **Empty State** — надто пасивний: "Підключіть джерела" без кроків

**Discovery Stage:**
4. **Signal vs Noise** — 80% повідомлень шум, важко знайти важливе
5. **Filter Overload** — 5+ фільтрів (importance, date, topic, source, classification)
6. **Search UX** — пошук є, але немає підказок що шукати

**Extraction Stage:**
7. **No Feedback Loop** — після "Extract" тільки WebSocket events, немає ETA
8. **Agent Selection** — незрозуміло який agent обрати (немає рекомендацій)

**Review Stage:**
9. **Version Fatigue** — якщо 50+ versions → overwhelm
10. **Diff Complexity** — diff view має JSON patches, не user-friendly

### Opportunities

| # | Проблема | Рішення | Пріоритет |
|---|----------|---------|-----------|
| 1 | Onboarding gap | Persistent help menu (HelpCircle icon) з tutorials | **HIGH** |
| 2 | Telegram setup | Quick setup wizard з копіюванням webhook URL | **HIGH** |
| 3 | Empty state | Actionable steps: "1. Setup Telegram 2. Wait for messages" | **MEDIUM** |
| 4 | Signal vs noise | Default filter: "High importance" (≥0.7) | **HIGH** |
| 5 | Filter overload | Smart presets: "Today's signals", "Last week" | **MEDIUM** |
| 6 | No ETA | Progress bar з оцінкою часу (based on message count) | **LOW** |
| 7 | Version fatigue | Batch actions: "Approve all", "Reject all" | **HIGH** |
| 8 | Diff complexity | Human-readable diff: "Changed topic from X → Y" | **MEDIUM** |

---

## Персона 2: Team Lead

**Профіль:**
- Роль: Керівник команди/проєкту
- Мета: Не пропускати важливі рішення, blockers, critical messages
- Навички: Високі (технічний background)
- Частота використання: 2-3 рази на день (ранок + EOD)

### Journey Map

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   ЕТАП      │  MORNING     │  TRIAGE      │  DEEP DIVE   │  FOLLOW-UP   │
│             │  REVIEW      │              │              │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Дії        │ • Відкрив    │ • Клік на    │ • Переглядає │ • Призначає  │
│ користувача│   Dashboard  │   "3 critical│   topic      │   tasks      │
│            │ • Читає      │   signals"   │   details    │ • Додає      │
│            │   subtitle   │ • Фільтрує   │ • Читає      │   atoms до   │
│            │ • Скан       │   Messages   │   atoms      │   Topics     │
│            │   metrics    │ • Відкрив    │ • Перевіряє  │ • Export     │
│            │              │   Topic      │   зв'язки    │   summary    │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ UI         │ Dashboard    │ MessagesPage │ TopicDetail  │ AgentTasks   │
│ touchpoint │ + Metrics    │ + Smart      │ + Atoms      │ + Executive  │
│            │ + Trends     │   Filters    │ + Messages   │   Summary    │
│            │ + Focus      │              │ + Activity   │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Емоції     │ 🙂 Confident │ 😟 Concerned │ 🤔 Analyzing │ ✅ Resolved  │
│            │              │ (Critical!)  │              │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Pain       │ ⚠️  "Макс"   │ ❌ Critical  │ ⚠️  Topic    │ ❌ Task      │
│ Points     │   hardcoded  │   count без  │   relations  │   assignment │
│            │   (not real  │   деталей    │   незрозумі- │   відсутній  │
│            │   user name) │ ❌ Немає     │   лі         │ ⚠️  Export   │
│            │ ⚠️  Subtitle │   shortcuts  │ ❌ Breadcrumb│   PDF/MD     │
│            │   generic    │   до Critica │   тільки     │   не працює  │
│            │              │              │   topic name │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Moments of │ ✅ Dynamic   │ ✅ Real-time │ ✅ Atom card │ ✅ (Немає    │
│ Delight    │   subtitle   │   metrics    │   показує    │   delight на │
│            │   адаптивний │ ✅ Badge     │   зміни      │   цьому      │
│            │ ✅ Heatmap   │   indicators │              │   етапі)     │
│            │   наглядний  │              │              │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Drop-off   │ 🟢 LOW       │ 🟡 MEDIUM    │ 🟡 MEDIUM    │ 🔴 HIGH      │
│ Risk       │              │ (Overwhelm)  │ (Confusion)  │ (Dead end)   │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Pain Points Деталізація

**Morning Review:**
1. **Hardcoded Name** — "Макс!" в greeting (line 31 `DashboardPage/index.tsx`)
2. **Generic Subtitle** — "Проєкт рухається стабільно" замість конкретних actionables
3. **No Priorities** — Dashboard показує trends, але не каже "Start here"

**Triage Stage:**
4. **Critical Count без Контексту** — "3 critical signals" але не ясно які саме
5. **No Shortcuts** — треба кілька кліків щоб дійти до critical messages
6. **Filter Overload** — same issue як у Knowledge Manager

**Deep Dive:**
7. **Topic Relations Gap** — TopicDetailPage показує atoms + messages, але не показує:
   - Які topics пов'язані між собою?
   - Які atoms найважливіші в цьому topic?
8. **Breadcrumb Обмежений** — тільки "Topics > Topic Name", немає контексту

**Follow-up:**
9. **Task Assignment відсутній** — є AgentTasksPage але це templates, не assignment до конкретних людей
10. **Export Gap** — Executive Summary має ExportButton, але формат незрозумілий

### Opportunities

| # | Проблема | Рішення | Пріоритет |
|---|----------|---------|-----------|
| 1 | Hardcoded name | User profile store (Zustand) з real name | **MEDIUM** |
| 2 | Generic subtitle | Actionable subtitle: "Review 3 blockers in Project X" | **HIGH** |
| 3 | No priorities | "Today's Focus" component з top 3 actions | **HIGH** |
| 4 | Critical без контексту | Badge clickable → filter Messages (importance≥0.9) | **HIGH** |
| 5 | No shortcuts | Quick actions: "View Critical", "Review Pending" | **MEDIUM** |
| 6 | Topic relations | Topic graph/network visualization | **LOW** |
| 7 | Task assignment | Human task assignment (not just AI agents) | **MEDIUM** |
| 8 | Export gap | PDF export з logo, date, stats | **LOW** |

---

## Персона 3: Analyst

**Профіль:**
- Роль: Data analyst / Product analyst
- Мета: Знайти trends, patterns, insights у комунікації
- Навички: Високі (SQL, Python, аналітичне мислення)
- Частота використання: Weekly deep dives

### Journey Map

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   ЕТАП      │  HYPOTHESIS  │  EXPLORATION │  ANALYSIS    │  REPORTING   │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Дії        │ • Формулює   │ • Search по  │ • Дивиться   │ • Експортує  │
│ користувача│   питання    │   keywords   │   Trends     │   дані       │
│            │ • Відкрив    │ • Фільтрує   │ • Аналізує   │ • Створює    │
│            │   Analytics  │   по періоду │   Heatmap    │   insights   │
│            │   (dormant!) │ • Будує FTS  │ • Читає      │ • Зберігає   │
│            │              │   запити     │   atoms      │   як Atom    │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ UI         │ (Немає       │ SearchPage   │ Dashboard    │ Executive    │
│ touchpoint │  dedicated   │ + FTS        │ + Trends     │ Summary      │
│            │  entry)      │ MessagesPage │ + Heatmap    │ + Export     │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Емоції     │ 🤔 Curious   │ 😐 Neutral   │ 😕 Frustrated│ 😞 Disappoint│
│            │              │              │ (Обмежені    │ (Немає API)  │
│            │              │              │  charts)     │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Pain       │ ❌ Analytics │ ⚠️  FTS      │ ❌ Recharts  │ ❌ Немає API │
│ Points     │   page       │   працює але │   обмежений  │   для export │
│            │   dormant    │   UI простий │ ❌ Немає     │ ❌ CSV/JSON  │
│            │ ❌ Немає     │ ❌ Немає     │   drill-down │   експорт    │
│            │   hypothesis │   highlighting│ ⚠️  Heatmap  │   відсутній  │
│            │   workspace  │   в results  │   тільки     │ ⚠️  Немає    │
│            │              │              │   activity   │   saved      │
│            │              │              │              │   queries    │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Moments of │              │ ✅ FTS       │ ✅ Heatmap   │              │
│ Delight    │              │   швидкий    │   візуально  │              │
│            │              │              │   чіткий     │              │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Drop-off   │ 🔴 HIGH      │ 🟡 MEDIUM    │ 🔴 HIGH      │ 🔴 HIGH      │
│ Risk       │ (No entry)   │ (Basic UX)   │ (Limited)    │ (Dead end)   │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Pain Points Деталізація

**Hypothesis Stage:**
1. **Analytics Page Dormant** — існує `/analytics` але приховано з навігації
2. **No Hypothesis Workspace** — немає місця де аналітик може:
   - Зберегти питання ("Чи зростає mention X?")
   - Збудувати custom query
   - Порівняти periods

**Exploration Stage:**
3. **FTS UI Basic** — SearchPage працює, але:
   - Немає highlighting в results (видалено `highlightRenderer.tsx`)
   - Немає фільтрів по atom type, importance
   - Немає saved searches
4. **No Advanced Filters** — MessagesPage має фільтри, але не для аналітики:
   - Немає "Messages with 2+ atoms"
   - Немає "Topics created last week"

**Analysis Stage:**
5. **Recharts Обмежений** — TrendsList, ActivityHeatmap використовують Recharts, але:
   - Немає drill-down (клік на trend → показати messages)
   - Немає export chart як PNG
   - Немає comparison (this week vs last week)
6. **Heatmap тільки Activity** — ActivityHeatmap показує тільки message count, не:
   - Importance score distribution
   - Atom creation rate

**Reporting Stage:**
7. **Немає API для Export** — Executive Summary має ExportButton, але:
   - Backend endpoint `/api/v1/executive-summary/export` не існує (stub?)
   - Немає CSV/JSON export для raw data
8. **Saved Queries відсутні** — analyst не може зберегти:
   - Custom filters
   - Search queries
   - Dashboard views

### Opportunities

| # | Проблема | Рішення | Пріоритет |
|---|----------|---------|-----------|
| 1 | Analytics dormant | Активувати Analytics page з custom charts builder | **MEDIUM** |
| 2 | No hypothesis workspace | "Saved Queries" feature + query builder | **LOW** |
| 3 | FTS highlighting | Відновити `highlightRenderer.tsx` | **HIGH** |
| 4 | No advanced filters | "Advanced mode" в MessagesPage filters | **MEDIUM** |
| 5 | Recharts drill-down | onClick handlers → navigate з filters | **MEDIUM** |
| 6 | Chart export | Export chart as PNG (recharts підтримує) | **LOW** |
| 7 | API export gap | Backend endpoint для CSV/JSON export | **HIGH** |
| 8 | Saved queries | User preferences store (backend DB) | **LOW** |

---

## Cross-Persona Insights

### Спільні Pain Points (Всі 3 персони)

| Pain Point | Вплив | Рішення | Пріоритет |
|------------|-------|---------|-----------|
| **Signal vs Noise** | 🔴 Critical | Default filter "High importance" + Smart presets | **P0** |
| **Filter Overload** | 🟡 High | Filter presets: "Today's critical", "Last week signals" | **P1** |
| **No Highlighting в Search** | 🟡 High | Restore `highlightRenderer.tsx` | **P1** |
| **Export Gap** | 🟡 High | Backend API для CSV/JSON/PDF export | **P1** |
| **Empty State пасивний** | 🟢 Medium | Actionable steps в empty states | **P2** |

### Унікальні Pain Points

| Персона | Унікальна проблема | Рішення | Пріоритет |
|---------|-------------------|---------|-----------|
| **Knowledge Manager** | Version fatigue (50+ versions) | Batch approve/reject + filters | **P1** |
| **Team Lead** | Critical count без контексту | Clickable badges → filtered views | **P0** |
| **Analyst** | Analytics page dormant | Активувати + custom charts | **P2** |

### Entry Points Порівняння

```
┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Entry Point        │ Knowledge Mgr   │ Team Lead       │ Analyst         │
├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Primary             │ Dashboard       │ Dashboard       │ Search          │
│                     │ (Onboarding)    │ (Morning review)│ (Exploration)   │
├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Secondary           │ Messages        │ Messages        │ Dashboard       │
│                     │ (Discovery)     │ (Triage)        │ (Trends)        │
├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Tertiary            │ Versions        │ TopicDetail     │ Analytics       │
│                     │ (Review)        │ (Deep dive)     │ (DORMANT!)      │
├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Drop-off Risk       │ 🔴 Entry        │ 🔴 Follow-up    │ 🔴 Hypothesis   │
│ (highest)           │ (No guidance)   │ (Dead end)      │ (No entry)      │
└─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Navigation Patterns

**Current:** Sidebar → Page → Detail (linear)
```
Sidebar → Messages → (filter) → MessageCard → TopicDetail
```

**Problem:** Немає shortcuts для critical flows

**Opportunity:** Contextual navigation
```
Dashboard "3 critical" → Messages (pre-filtered importance≥0.9)
Topic badge "5 pending" → Versions (pre-filtered by topic)
```

---

## Priority Recommendations

### P0 — Critical (Must Have) — Next Sprint

| # | Feature | Persona Impact | Effort | Value |
|---|---------|---------------|--------|-------|
| 1 | **Clickable metric badges** | Team Lead 🔴 | 🟢 Small (2h) | 🔴 High |
|   | Dashboard metrics → filtered Messages | Knowledge Manager 🟡 | | |
|   | *Why:* Найбільший drop-off risk у Team Lead follow-up | | | |
| 2 | **Default filter preset** | All 🔴 | 🟢 Small (3h) | 🔴 High |
|   | Messages page: default "High importance" (≥0.7) | | | |
|   | *Why:* 80% messages = noise, це #1 complaint | | | |
| 3 | **Batch actions у Versions** | Knowledge Manager 🔴 | 🟡 Medium (8h) | 🟡 Medium |
|   | "Approve all", "Reject all", filters | | | |
|   | *Why:* Version fatigue = drop-off | | | |

### P1 — High (Should Have) — Next 2 Sprints

| # | Feature | Persona Impact | Effort | Value |
|---|---------|---------------|--------|-------|
| 4 | **FTS highlighting** | Analyst 🔴 | 🟢 Small (4h) | 🟡 Medium |
|   | Restore `highlightRenderer.tsx` | Knowledge Manager 🟡 | | |
|   | *Why:* Search UX degraded after refactor | | | |
| 5 | **Filter presets** | All 🟡 | 🟡 Medium (6h) | 🟡 Medium |
|   | "Today's critical", "Last week signals", "Pending review" | | | |
|   | *Why:* Reduces cognitive load | | | |
| 6 | **Export API (CSV/JSON)** | Analyst 🔴 | 🔴 Large (16h) | 🟡 Medium |
|   | Backend endpoints для raw data export | Team Lead 🟡 | | |
|   | *Why:* Dead end для analysts | | | |
| 7 | **Actionable empty states** | Knowledge Manager 🟡 | 🟢 Small (3h) | 🟢 Low |
|   | "1. Setup Telegram 2. Wait for messages 3. Extract knowledge" | | | |
|   | *Why:* Onboarding clarity | | | |

### P2 — Medium (Could Have) — Future

| # | Feature | Persona Impact | Effort | Value |
|---|---------|---------------|--------|-------|
| 8 | **Analytics page activation** | Analyst 🔴 | 🔴 Large (24h) | 🟢 Low |
|   | Custom charts, drill-down, saved queries | | | |
|   | *Why:* Power user feature, low reach | | | |
| 9 | **User profile store** | Team Lead 🟡 | 🟡 Medium (8h) | 🟢 Low |
|   | Real user name замість "Макс!" | | | |
|   | *Why:* Nice-to-have, не блокер | | | |
| 10 | **Topic relations graph** | Team Lead 🟡 | 🔴 Large (40h) | 🟢 Low |
|    | Network visualization topics → atoms | | | |
|    | *Why:* Complex, unclear ROI | | | |

### Quick Wins (≤ 4h effort, high value)

1. **Clickable badges** (2h) — Dashboard metrics → Messages filtered
2. **Default filter** (3h) — Messages: importance ≥ 0.7 by default
3. **Empty state steps** (3h) — Numbered action list
4. **FTS highlighting** (4h) — Restore deleted component

### ROI Calculation

```
Priority Formula = (Impact × Reach) / Effort

Impact: 1-3 (Low/Medium/High pain severity)
Reach: 1-3 (How many personas affected)
Effort: 1-3 (Small/Medium/Large)

Example:
Clickable badges = (3 × 3) / 1 = 9 (highest)
Topic graph      = (2 × 1) / 3 = 0.67 (lowest)
```

---

## Додаткові Insights

### WebSocket як Delight Moment

**Спостереження:** Всі персони відзначили WebSocket real-time updates як **moment of delight**

**Приклади:**
- Knowledge Manager: Live extraction progress (topics/atoms/versions counters)
- Team Lead: Real-time metrics update on Dashboard
- Analyst: Heatmap updates без refresh

**Recommendation:** Розширити WebSocket usage:
- Toast notifications для critical events
- Live badge counters в navbar
- Activity feed в sidebar

### Mobile Experience Gap

**Спостереження:** Navbar має mobile layout, але жодна персона не згадала mobile use case

**Hypothesis:** Pulse Radar = desktop-first product (аналітика, review робота)

**Question для стейкхолдерів:**
- Чи потрібен mobile-first підхід?
- Які use cases на mobile? (Може тільки notifications?)

### i18n Incomplete

**Спостереження:** Codebase має react-i18next, але частково:
- Dashboard greeting перекладено
- Інші pages — hardcoded strings

**Impact:** Якщо target audience = міжнародна команда → blocker

**Recommendation:** Audit translations або видалити i18n якщо не потрібен

---

## Наступні Кроки

1. **Валідація з users** — провести 3 user interviews (по 1 на персону)
2. **Prioritization workshop** — стейкхолдери ранжують P0-P2
3. **Technical spikes** — оцінити effort для P0 features
4. **Prototype** — clickable badges + default filter (quick win demo)

---

**Версія:** 1.0
**Дата:** 2025-12-27
**Статус:** Draft (чекає review)
