# Information Architecture Restructuring Proposal (ОНОВЛЕНО)

**Date**: November 2, 2025 (оновлено після з'ясування реального use case)
**Auditor**: Product Designer (AI Agent)
**Context**: Post-UX audit analysis of navigation structure for Task Tracker AI-powered knowledge management system
**Status**: ⚠️ ПОПЕРЕДНЯ ВЕРСІЯ БАЗУВАЛАСЬ НА НЕПРАВИЛЬНИХ ПРИПУЩЕННЯХ

---

## ⚠️ КРИТИЧНА ПОМИЛКА В КОНТЕКСТІ

### Що було неправильно зрозуміно

**Моє припущення (НЕПРАВИЛЬНЕ):**
- ✗ Task Tracker = щоденний робочий інструмент для команди
- ✗ Користувачі постійно працюють у системі (daily driver)
- ✗ Основний workflow: Inbox → Process → Complete → Archive
- ✗ Паттерни з Linear/Asana/ClickUp релевантні
- ✗ Потрібна оптимізація для "task completion efficiency"

**Реальність:**
- ✅ Task Tracker = **інструмент збирання даних** (collection tool)
- ✅ Система працює у **фоні** (автоматично збирає з Telegram)
- ✅ Користувачі заходять **переглянути** що назбиралось (browse, не work)
- ✅ Зібрані дані **експортуються через API** в інші системи
- ✅ Користувачів: пара окремих людей, не команда
- ✅ Частота використання: нерегулярно, час від часу

### Чому попередня пропозиція не підходить

**Option B (Moderate) - що було запропоновано:**
1. "Inbox" metaphor - передбачає щоденний triage (неактуально!)
2. "Task completion" workflows - люди не виконують задачі тут (експортують!)
3. "My Tasks" page - не primary use case
4. "Workflow efficiency +40%" - оптимізація не того процесу
5. Status-driven navigation (Active/Backlog/Done) - передбачає роботу над задачами
6. Real-time collaboration patterns - тут немає команди

**Правильна метафора:**
- ❌ НЕ Task Manager (Linear, Asana)
- ❌ НЕ Email Client (Superhuman inbox zero)
- ✅ **Digital Filing Cabinet** (Google Photos, Evernote)
- ✅ **Knowledge Harvester** (автоматично збирає, організовує, готує до експорту)
- ✅ **Data Collection Dashboard** (Airtable views, Notion databases)

### Що потрібно переосмислити

1. **Default landing page**: НЕ "Today's tasks", а "What's new since last visit?"
2. **Navigation structure**: НЕ workflow stages, а browsing/filtering/exploring
3. **Primary actions**: НЕ "Complete task", а "Review", "Approve", "Export"
4. **Information density**: Browse mode > detail focus (overview first!)
5. **Time-based views**: "Last 7 days", "This month" - що назбиралось за період
6. **Bulk operations**: Approve 10 items at once (не one-by-one processing)

---

## Реальний Use Case: Collection Tool

### Типовий сценарій використання

**Фонова робота (автоматично):**
1. Telegram бот отримує messages (24/7)
2. AI обробляє їх → класифікує, score, створює topics/atoms
3. Analysis runs генерують proposals
4. Все це відбувається **без участі користувача**

**Користувач заходить (раз на день/тиждень):**
1. Відкриває Task Tracker
2. Бачить: "За останні 3 дні назбиралось 47 нових messages, 3 topics, 12 proposals"
3. Переглядає що цікаве (browse, filter, search)
4. Можливо редагує/затверджує щось
5. **Експортує через API** потрібні дані в інші інструменти (де відбувається реальна робота)

**Ключові відмінності від workflow tool:**
- Відвідування: нерегулярне (не щодня)
- Мета: переглянути що назбиралось (не виконати задачі)
- Результат: експорт даних (не task completion)
- Користувачі: пара людей (не команда з ролями/permissions)

### Аналогії з існуючими продуктами

#### 1. Google Photos (найближча аналогія!)

**Що вони роблять правильно:**
```
Landing: Timeline view
├── "Last 7 days" (31 photos)
├── "October 2025" (120 photos)
└── Auto-organized albums (People, Places, Things)

Key Features:
- Photos збираються автоматично (background upload)
- Timeline = default view (що нового?)
- Smart grouping (AI categorization)
- Search = потужний (faces, objects, locations)
- Export = easy (download, share link, Google Drive)
```

**Lesson для Task Tracker:**
- Default view: Timeline з groups по датах
- Smart collections: AI-generated topics (як Albums)
- Search first: знайти що потрібно швидко
- Export ready: API endpoints для інтеграцій

---

#### 2. Pocket / Instapaper (read-later services)

**Що вони роблять правильно:**
```
Landing: Unread articles
├── Save from anywhere (browser extension)
├── Background processing (extract text, images)
├── Tags & highlights (manual organization)
└── Export (Evernote, Notion, API)

Key Features:
- Save first, organize later (frictionless capture)
- Bulk actions (archive 10 articles at once)
- Filtering (long reads, videos, favorites)
- Offline sync (read when convenient)
```

**Lesson для Task Tracker:**
- Capture = automatic (Telegram integration)
- Review = batch mode (не one-by-one)
- Filters = essential (high importance, no topic, etc.)
- Export = primary outcome

---

#### 3. Evernote / Bear (note collectors)

**Що вони роблять правильно:**
```
Landing: All notes (reverse chronological)
├── Notebooks (manual organization)
├── Tags (cross-cutting themes)
├── Search (full-text + OCR)
└── Shortcuts (quick access to saved searches)

Key Features:
- Capture from anywhere (email, web clipper, mobile)
- Flexible organization (folders + tags)
- Powerful search (content + metadata)
- Export formats (PDF, HTML, Markdown)
```

**Lesson для Task Tracker:**
- Notes = Messages (raw capture)
- Notebooks = Topics (manual grouping)
- Tags = Labels/categories
- Search = must be excellent

---

#### 4. Airtable / Notion Databases (structured collection)

**Що вони роблять правильно:**
```
Landing: Grid view (all records)
├── Multiple views (Grid, Calendar, Kanban, Gallery)
├── Filters & sorting (dynamic queries)
├── Grouping (by category, status, date)
└── API access (export to other tools)

Key Features:
- Same data, different views (perspectives)
- Saved filters = custom dashboards
- Bulk edit (select 10 rows, change field)
- API first (integrations primary use case)
```

**Lesson для Task Tracker:**
- Views = essential (не одна табличка!)
- Custom filters = saved as views
- Bulk operations = approve/reject/export 10+ items
- API = first-class citizen (документація + examples)

---

### Анти-паттерни (що НЕ треба робити)

| Anti-Pattern | Чому не підходить для collection tool | Task Tracker risk |
|--------------|---------------------------------------|-------------------|
| **Inbox Zero metaphor** | Передбачає щоденний triage, collection tool не потребує "очистити inbox" | ✅ Попередня пропозиція базувалась на цьому! |
| **Status workflows** (Todo/In Progress/Done) | Collection tool не має "completion" стану | ⚠️ Tasks page має статуси (але не використовується) |
| **Real-time collaboration** | Collection tool = individual use (пара людей, не команда) | ❌ Немає ризику (WebSocket для оновлень, не колаборації) |
| **Daily standups / Activity feeds** | Передбачає щоденну роботу в системі | ⚠️ Dashboard metrics показують "today" (неактуально якщо заходять раз на тиждень) |
| **Notification overload** | Collection tool = passive (не треба push notifications) | ❌ Поки немає ризику |

---

## Нова IA Пропозиція для Collection Tool

### Принципи дизайну (переосмислені)

1. **Overview First**
   - Перше що бачить користувач: "Що назбиралось з останнього візиту?"
   - Aggregated view > детальні списки
   - Timeline grouping (по датах/тижнях)

2. **Browsing > Task Completion**
   - Швидкий перегляд 100 items > опрацювання кожного
   - Card previews (не full details)
   - Infinite scroll (не pagination)

3. **Filtering > Navigation**
   - Меньше сторінок, більше filters/views
   - Saved filters = custom dashboards
   - Quick filters (high importance, last 7 days, no topic)

4. **Batch Operations**
   - Select 10 messages → approve all
   - Bulk approve proposals
   - Bulk export (API payload preview)

5. **Export-Ready Organization**
   - API endpoints for every entity
   - Export previews (JSON/CSV before download)
   - Integrations as first-class features

6. **Density Control**
   - User controls information density (compact/comfortable/spacious)
   - Power users want more items visible
   - Casual users prefer cards with spacing

---

## Нові Опції IA (для Collection Tool)

### Option A: Timeline-First (як Google Photos)

**Філософія:** Default view = timeline з grouping по датах. Користувач одразу бачить що назбиралось.

**Структура:**
```
OVERVIEW (default landing)
├── Timeline (grouped by date)
│   ├── "Last 7 days" → 47 messages, 3 topics, 12 proposals
│   ├── "Last 30 days" → 220 messages, 8 topics, 45 proposals
│   └── "Older" → archive view
│
COLLECTIONS (organized data)
├── Messages (all collected items)
│   └── Filters: By topic, By importance, By source, No topic
├── Topics (AI-generated + manual)
│   └── Each topic = collection of related messages/atoms
├── Proposals (AI suggestions)
│   └── Filter: Pending, Approved, Rejected
│
ANALYSIS (AI operations)
├── Runs (history)
└── Configuration (agents, providers)

EXPORT
├── API Documentation
├── Recent Exports
└── Integrations (Notion, Linear, etc.)
```

**Ключові зміни:**

#### 1. NEW: Overview = Timeline (Default Landing)
```
┌─────────────────────────────────────────────┐
│ 📊 Overview                   [Export] [⚙️]  │
├─────────────────────────────────────────────┤
│ What's New Since Last Visit (3 days ago):   │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📨 47 New Messages                      │ │
│ │ 🏷️  3 New Topics                        │ │
│ │ 💡 12 Pending Proposals                 │ │
│ │ 🤖 2 Analysis Runs Completed            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Timeline:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Last 7 days                             │ │
│ │ ├── Nov 2 (Today)         12 messages   │ │
│ │ ├── Nov 1                 18 messages   │ │
│ │ ├── Oct 31                15 messages   │ │
│ │ └── Oct 30                 2 messages   │ │
│ │ [Expand for details]                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Quick Actions:                              │
│ [View All Messages] [Browse Topics]         │
│ [Review Proposals] [Export Recent Data]     │
└─────────────────────────────────────────────┘
```

**Переваги:**
- Zero-click insight: користувач одразу бачить activity
- Timeline grouping: nature way to browse collected data
- "Since last visit" = персоналізовано (tracking last login)
- Quick actions = jump to relevant section

#### 2. Messages Page = Browse Mode (не Inbox triage)

```
┌─────────────────────────────────────────────┐
│ 📨 Messages                  [⚙️] [Export]  │
├─────────────────────────────────────────────┤
│ Quick Filters:                              │
│ [Last 7 days•] [High Score] [No Topic]      │
│ [By Topic ▼] [By Source ▼]                  │
│                                             │
│ Showing 47 messages • Last 7 days           │
│ [Density: Comfortable ▼] [☰ Grid] [☐ Bulk] │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 💬 Alex Tanaka • 2 hours ago  🔴 9/10   │ │
│ │ "We need to prioritize API optimization"│ │
│ │ 🏷️ Product Design                       │ │
│ │ [View] [Edit Topic] [Export]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 💬 Maria Rodriguez • 5 hours ago 🟡 6/10│ │
│ │ "Documentation needs updates..."        │ │
│ │ 🏷️ No Topic Yet                         │ │
│ │ [View] [Assign Topic] [Export]          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Load More (175 older messages)]            │
├─────────────────────────────────────────────┤
│ Bulk Actions (0 selected):                  │
│ [Select All Visible] → [Assign Topic]       │
│ [Export Selected] [Archive Selected]        │
└─────────────────────────────────────────────┘
```

**Key features:**
- Density control (compact/comfortable/spacious)
- Saved filters as custom views
- Bulk select + actions
- Export button prominent

#### 3. Topics = Collections (як Albums в Google Photos)

```
┌─────────────────────────────────────────────┐
│ 🏷️ Topics                   [+ New] [Export]│
├─────────────────────────────────────────────┤
│ Filters: [All] [Draft] [Approved] [Active]  │
│ Sort: [Recent Activity ▼]                   │
├─────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐    │
│ │ 🎨 Product       │ │ 🔧 Backend API  │    │
│ │    Design        │ │    Optimization │    │
│ │                  │ │                 │    │
│ │ 15 atoms         │ │ 8 atoms         │    │
│ │ 23 messages      │ │ 12 messages     │    │
│ │ Updated 2h ago   │ │ Updated 1d ago  │    │
│ │                  │ │                 │    │
│ │ [Open] [Export]  │ │ [Open] [Export] │    │
│ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────┘

Click Topic → Detail View:
┌─────────────────────────────────────────────┐
│ ← Back to Topics                            │
├─────────────────────────────────────────────┤
│ 🎨 Product Design              [Edit] [⋮]   │
│ "UI/UX improvements and design system"      │
│                                             │
│ Tabs: [Overview•] [Messages] [Proposals]    │
├─────────────────────────────────────────────┤
│ Overview:                                   │
│ ├── 15 atoms (knowledge units)              │
│ ├── 23 messages (source data)               │
│ ├── 7 proposals (5 approved, 2 pending)     │
│ └── Last updated: 2 hours ago               │
│                                             │
│ Recent Activity:                            │
│ • 2 new messages added                      │
│ • 1 proposal approved                       │
│ • Analysis run completed                    │
│                                             │
│ Quick Actions:                              │
│ [View Messages in This Topic]               │
│ [Review Pending Proposals]                  │
│ [Export Topic Data (API)]                   │
│ [Run Analysis on This Topic]                │
└─────────────────────────────────────────────┘
```

#### 4. NEW: Export Center (first-class feature)

```
┌─────────────────────────────────────────────┐
│ 📤 Export                    [API Docs]     │
├─────────────────────────────────────────────┤
│ Quick Export:                               │
│ ┌─────────────────────────────────────────┐ │
│ │ Select Data Type:                       │ │
│ │ • [✓] Messages (last 7 days: 47 items)  │ │
│ │ • [✓] Topics (all: 8 topics)            │ │
│ │ • [ ] Proposals (pending: 12 items)     │ │
│ │                                         │ │
│ │ Format: [JSON ▼] [CSV] [Markdown]       │ │
│ │                                         │ │
│ │ [Generate Export] [Preview]             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Recent Exports:                             │
│ • messages_2025-11-02.json (47 items)       │
│ • topics_with_atoms_2025-11-01.json         │
│                                             │
│ API Access:                                 │
│ [View API Documentation]                    │
│ [Generate API Key]                          │
│ [Integration Examples (Notion, Linear)]     │
└─────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Overview-first: користувач бачить "what's new" immediately
- ✅ Timeline natural: для collection tool (як Google Photos)
- ✅ Browse-optimized: filtering > navigation
- ✅ Export prominent: primary outcome visible
- ✅ Low page count: 5 main sections (Overview, Collections, Analysis, Export, Settings)

**Trade-offs:**
- ⚠️ Timeline requires "last visit" tracking (backend feature)
- ⚠️ "What's new" aggregation = additional queries
- ⚠️ Export center = new page to build

**Implementation Complexity:** 7/10
**User Impact:** Medium (new default landing, але інтуїтивно)
**Estimated UX Score:** 6.5 → 8.5 (+2.0)

---

### Option B: Views-Based (як Airtable) ⭐ РЕКОМЕНДОВАНО

**Філософія:** Одна сторінка Messages, але з multiple saved views. Як в Airtable - same data, different perspectives.

**Структура:**
```
DASHBOARD (overview metrics)
├── Activity summary (since last visit)
└── Quick links to saved views

MESSAGES (single page, multiple views)
├── View: "Recent" (default - last 7 days)
├── View: "High Priority" (score ≥8)
├── View: "Needs Topic" (unorganized)
├── View: "By Topic" (grouped)
├── View: "All" (complete archive)
└── [+ Create Custom View]

TOPICS (organized collections)
├── Grid view (default)
├── Each topic → detail with tabs
└── Export button

ANALYSIS (AI operations)
├── Runs (history)
├── Proposals (pending actions)
└── Configuration

EXPORT & API
├── Quick export wizard
└── API docs + examples
```

**Ключові зміни:**

#### 1. Dashboard = Activity Summary (не metrics)

```
┌─────────────────────────────────────────────┐
│ 📊 Dashboard                                │
├─────────────────────────────────────────────┤
│ Since Your Last Visit (3 days ago):         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 47 new messages  → [View Recent]        │ │
│ │ 12 pending proposals → [Review]         │ │
│ │ 3 new topics created → [Browse Topics]  │ │
│ │ 2 analysis runs completed → [View Runs] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Quick Views (Saved Filters):                │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ 🔥 High      │ │ 🏷️ Needs    │          │
│ │    Priority  │ │    Topic     │          │
│ │    18 items  │ │    23 items  │          │
│ └──────────────┘ └──────────────┘          │
│                                             │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ 📅 Last      │ │ 💡 Pending   │          │
│ │    7 Days    │ │    Proposals │          │
│ │    47 items  │ │    12 items  │          │
│ └──────────────┘ └──────────────┘          │
│                                             │
│ [Export Recent Data] [API Documentation]    │
└─────────────────────────────────────────────┘
```

**Key insight:** Quick views = shortcuts to pre-filtered data. Click → jump to Messages with filter applied.

---

#### 2. Messages Page = Views System

```
┌─────────────────────────────────────────────┐
│ 📨 Messages                                 │
├─────────────────────────────────────────────┤
│ Views: [Recent•] [High Priority] [Needs     │
│        Topic] [By Topic] [All] [+ New View] │
├─────────────────────────────────────────────┤
│ Current View: Recent (Last 7 days)          │
│ Showing 47 messages                         │
│ [Density: Comfortable ▼] [Export View]      │
├─────────────────────────────────────────────┤
│ Nov 2 (Today) • 12 messages                 │
│ ┌─────────────────────────────────────────┐ │
│ │ 💬 Alex • 2h ago              🔴 9/10   │ │
│ │ "API optimization priority"             │ │
│ │ 🏷️ Product Design    [View] [Edit] [⋮] │ │
│ └─────────────────────────────────────────┘ │
│ [...more messages...]                       │
│                                             │
│ Nov 1 • 18 messages                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 💬 Maria • 5h ago             🟡 6/10   │ │
│ │ "Documentation updates needed"          │ │
│ │ 🏷️ No Topic     [View] [Assign Topic]  │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Bulk Actions:                               │
│ [☐ Select All Visible] [Assign Topic]      │
│ [Export Selected (API/JSON/CSV)]            │
└─────────────────────────────────────────────┘
```

**Saved Views (як в Airtable):**

1. **"Recent"** (default)
   - Filter: last 7 days
   - Sort: newest first
   - Group by: date

2. **"High Priority"**
   - Filter: importance_score ≥ 8
   - Sort: score desc
   - Group by: topic

3. **"Needs Topic"**
   - Filter: topic_id IS NULL
   - Sort: score desc
   - Highlight: unorganized items

4. **"By Topic"**
   - Filter: all
   - Group by: topic
   - Collapse groups by default

5. **"All"** (archive)
   - Filter: none
   - Sort: newest first
   - Virtual scroll (performance)

**User can create custom views:**
```
┌─────────────────────────────────────────────┐
│ Create New View                             │
├─────────────────────────────────────────────┤
│ Name: [My Custom View          ]            │
│                                             │
│ Filters:                                    │
│ • Score: [≥ 7▼] [_________]                 │
│ • Date: [Last 30 days▼]                     │
│ • Topic: [Product Design▼] [+ Add]          │
│                                             │
│ Group by: [Topic ▼]                         │
│ Sort: [Newest first ▼]                      │
│                                             │
│ [Save View] [Cancel]                        │
└─────────────────────────────────────────────┘
```

---

#### 3. Topics = Same (keep good design)

(залишаємо як в попередній версії - card grid, detail view з tabs)

---

#### 4. Analysis = Consolidated

```
┌─────────────────────────────────────────────┐
│ 🤖 Analysis                  [+ New Run]    │
├─────────────────────────────────────────────┤
│ Tabs: [Proposals•] [Runs] [Configuration]   │
├─────────────────────────────────────────────┤
│ Pending Proposals (12):                     │
│ [☐ Select All] [Bulk Approve] [Bulk Reject]│
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐ "Implement dark mode toggle"          │ │
│ │ From: RUN-D4BF • Confidence: 85%        │ │
│ │ 🏷️ Product Design                       │ │
│ │ [✓ Approve] [✗ Reject] [View Details]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [...more proposals...]                      │
│                                             │
│ [Export Approved (API)] [View in Topic]     │
└─────────────────────────────────────────────┘
```

**Bulk operations key:** Select 10 proposals → approve all with one click.

---

#### 5. Export & API (dedicated section in sidebar)

```
SIDEBAR:
├── Dashboard
├── Messages (views)
├── Topics
├── Analysis
├── Export & API ← NEW
└── Settings
```

**Benefits:**

✅ **Views = Game Changer**
- Same data, multiple perspectives (як Airtable)
- Saved views = custom dashboards (user productivity++)
- Filtering > navigation (reduce page count)

✅ **Dashboard = Activity Hub**
- "Since last visit" = персоналізований контекст
- Quick views = shortcuts (zero friction)
- Not metrics overload (просто "what's new")

✅ **Batch Operations First-Class**
- Bulk select everywhere
- Export prominent (API first)
- Review 10 items at once (not one-by-one)

✅ **Low Implementation Cost**
- Views = frontend state (filters + sort + group)
- Dashboard = aggregation queries (not complex)
- Export = API already exists (just add UI)

**Trade-offs:**

⚠️ Views system needs good UX (create/edit/delete views)
⚠️ "Since last visit" = track last_login (backend)
⚠️ Bulk operations = selection state management

**Implementation Complexity:** 6/10
**User Impact:** Low (familiar structure + powerful features)
**Estimated UX Score:** 6.5 → 9.0 (+2.5) ⭐

---

### Option C: Minimal (Single Page App)

**Філософія:** Радикальна мінімізація. Одна сторінка з tabs для всього.

**Структура:**
```
TASK TRACKER (single page)
├── Tab: Overview
├── Tab: Browse (messages, topics, proposals)
├── Tab: Export
└── Tab: Settings
```

**(НЕ рекомендую - занадто радикально для collection tool, потрібна структура)**

---

## Порівняння Опцій

| Criteria | Option A: Timeline | Option B: Views ⭐ | Option C: Minimal |
|----------|-------------------|-------------------|-------------------|
| **Page count** | 5 sections | 5 sections | 1 page (4 tabs) |
| **Implementation** | 8 weeks | 6 weeks | 4 weeks |
| **Learning curve** | Low (intuitive) | Very low (familiar) | High (где все?) |
| **Browse efficiency** | Very high (timeline) | Very high (views) | Medium |
| **Export prominence** | High (dedicated section) | High (in every view) | Low (hidden in tab) |
| **Filtering power** | Medium | Very high (saved views!) | Low |
| **Scalability** | High (timeline groups) | Very high (views) | Low |
| **Collection tool fit** | Excellent | Excellent | Poor |
| **UX score improvement** | +2.0 (8.5/10) | +2.5 (9.0/10) ⭐ | +1.0 (7.5/10) |

---

## Рекомендація: Option B (Views-Based)

### Чому Option B?

**1. Views = Killer Feature for Collection Tool**

Airtable довів що "same data, multiple views" = продуктивність:
- Power user створює 5 custom views для різних use cases
- Casual user користується default views
- Zero clicks to switch perspective (just click view tab)

**2. Найкраще для Export Workflow**

Collection tool → експорт в інші системи:
- Saved view "High Priority Last 7 Days" → export → API → Notion
- View filter = export scope (what you see = what you export)
- API payload preview перед експортом

**3. Low Implementation, High Impact**

Views = frontend filters + saved state:
- Не потребує нових backend endpoints
- Реюзаємо існуючі API з query params
- localStorage для saved views (або user preferences table)

**4. Scalable для Майбутнього**

Коли додасться нове джерело даних (не тільки Telegram):
- Просто додати filter "Source: Telegram / Slack / Email"
- Views можуть group by source
- Той самий UX pattern

**5. Dashboard "Since Last Visit" = Context**

Collection tool проблема: "What changed since I was here last?"
- Track last_login timestamp (backend)
- Dashboard shows delta (47 new messages, 3 new topics)
- User одразу розуміє activity level

---

## Імплементація Option B

### Phase 1: Backend - Last Visit Tracking (Week 1)

**Goal:** Track user login для "Since last visit" feature

**Changes:**
1. Add `last_login` field to User model
2. Update login endpoint → set last_login = now()
3. API endpoint: GET /api/activity/since-last-visit
   - Returns: new_messages_count, new_topics_count, pending_proposals_count
   - Filter: WHERE created_at > user.last_login

**Deliverable:** Backend ready для dashboard delta

---

### Phase 2: Dashboard Activity Hub (Weeks 2-3)

**Goal:** Replace metrics dashboard з activity summary

**Changes:**
1. Redesign Dashboard page:
   - Remove: charts, metrics over time
   - Add: "Since last visit" summary card
   - Add: Quick views grid (4 shortcuts)
   - Add: Export button prominent
2. Quick views cards:
   - "High Priority" (count + link)
   - "Needs Topic" (count + link)
   - "Last 7 Days" (count + link)
   - "Pending Proposals" (count + link)
3. Clicking card → navigate to Messages with filter applied

**Deliverable:** Dashboard = activity hub, not metrics

---

### Phase 3: Messages Views System (Weeks 4-5)

**Goal:** Add views system to Messages page

**Changes:**
1. **Views tabs** (horizontal tabs above content):
   ```tsx
   <Tabs defaultValue="recent">
     <TabsList>
       <TabsTrigger value="recent">Recent</TabsTrigger>
       <TabsTrigger value="high-priority">High Priority</TabsTrigger>
       <TabsTrigger value="needs-topic">Needs Topic</TabsTrigger>
       <TabsTrigger value="by-topic">By Topic</TabsTrigger>
       <TabsTrigger value="all">All</TabsTrigger>
       <TabsTrigger value="custom">+ New View</TabsTrigger>
     </TabsList>
   </Tabs>
   ```

2. **View configurations** (frontend state):
   ```ts
   interface MessageView {
     id: string;
     name: string;
     filters: {
       dateRange?: string; // "last-7-days", "last-30-days"
       minScore?: number;
       topicId?: string;
       hasNoTopic?: boolean;
     };
     groupBy?: "date" | "topic" | "score";
     sortBy: "newest" | "oldest" | "score-desc";
   }
   ```

3. **Saved views** (localStorage або backend):
   - Default views: hardcoded
   - Custom views: user-created, saved to localStorage
   - (Optional) Backend endpoint: POST /api/views для persistent storage

4. **Density control**:
   ```tsx
   <Select defaultValue="comfortable">
     <SelectTrigger>Density</SelectTrigger>
     <SelectContent>
       <SelectItem value="compact">Compact</SelectItem>
       <SelectItem value="comfortable">Comfortable</SelectItem>
       <SelectItem value="spacious">Spacious</SelectItem>
     </SelectContent>
   </Select>
   ```

5. **Bulk select**:
   - Checkbox in each card
   - "Select All Visible" button
   - Bulk actions bar (appears when items selected)

**Deliverable:** Messages page with 5 default views + custom views

---

### Phase 4: Topics Enhancement (Week 6)

**Goal:** Add Export button + improve detail view

**Changes:**
1. Topics grid:
   - Add "Export" button to each card
   - Export modal: JSON/CSV/Markdown format
2. Topic detail view:
   - Tab "Overview": add Recent Activity section
   - Tab "Messages": show filtered messages from this topic
   - Tab "Proposals": show proposals related to this topic
   - Export button in header

**Deliverable:** Topics = exportable collections

---

### Phase 5: Analysis Page Improvements (Week 7)

**Goal:** Add bulk operations for proposals

**Changes:**
1. Proposals tab:
   - Add checkboxes for bulk select
   - "Select All" button
   - Bulk actions: "Approve Selected", "Reject Selected"
2. Export button:
   - Export approved proposals (API payload format)
   - Preview before export

**Deliverable:** Bulk approve 10 proposals at once

---

### Phase 6: Export & API Section (Week 8)

**Goal:** Create dedicated Export page in sidebar

**Changes:**
1. New page: /export
2. Quick export wizard:
   - Select entity type (Messages, Topics, Proposals)
   - Select date range / filters
   - Choose format (JSON, CSV, Markdown)
   - Preview payload
   - Download or get API curl command
3. API documentation:
   - Link to Swagger/OpenAPI docs
   - Example curl commands for common use cases
   - Integration tutorials (Notion, Linear)

**Deliverable:** Export = first-class feature

---

### Phase 7: Polish & Testing (Week 9+)

**Goal:** Ensure quality

**Tasks:**
1. Accessibility audit
   - Keyboard navigation for views tabs
   - Screen reader labels for bulk actions
   - Focus indicators
2. Mobile testing
   - Views tabs: horizontal scroll on mobile
   - Bulk select: tap-friendly checkboxes
   - Density control: default "comfortable" on mobile
3. Performance
   - Virtual scroll for "All" view (1000+ messages)
   - Lazy load topic details
   - Debounce custom view filters
4. User testing (internal)
   - Task: "Find high priority messages from last week and export them"
   - Measure: time, errors, satisfaction

**Deliverable:** Production-ready

---

## Success Metrics (для Collection Tool)

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| **Time to find relevant data** | Unknown | <30 sec | User testing: "Find high priority items from last week" |
| **Export frequency** | 0 (no UI) | 5 per week per user | Analytics: track export button clicks |
| **Custom views created** | 0 | 2 per power user | Track view creation |
| **"Since last visit" accuracy** | N/A | 95%+ satisfaction | Survey: "Did dashboard show what you expected?" |
| **Bulk operations usage** | 0 | 30% of actions | Analytics: bulk approve vs one-by-one |
| **Mobile browsing** | Poor (table) | Usable | Mobile-specific usability test |

### Qualitative Goals

- ✅ Users say "I quickly see what's new"
- ✅ Export workflow feels effortless
- ✅ Views system = "this is like Airtable, I love it"
- ✅ Bulk operations save time
- ✅ Dashboard answers "what changed?" without clicking

---

## Висновки

### Критична помилка виправлена

**Було неправильно:**
- Припускав workflow tool (daily driver, task completion)
- Паттерни з Linear/Asana (Inbox Zero, status workflows)
- Оптимізація для команди з ролями

**Правильно тепер:**
- Collection tool (browse what's collected, export)
- Паттерни з Google Photos/Airtable (views, timeline, filtering)
- Оптимізація для individual use, нерегулярні візити

### Option B (Views-Based) = Найкращий вибір

**Причини:**
1. **Views system** = Airtable-proven pattern для collection tools
2. **Dashboard "Since last visit"** = context для нерегулярних візитів
3. **Export prominent** = primary outcome visible
4. **Bulk operations** = efficiency для review process
5. **Low implementation cost** = mostly frontend (filters, state)
6. **Scalable** = works with 10 or 10,000 messages

### Implementation: 9 тижнів

- Week 1: Backend (last visit tracking)
- Weeks 2-3: Dashboard refactor
- Weeks 4-5: Messages views system ⭐ core feature
- Week 6: Topics export
- Week 7: Analysis bulk operations
- Week 8: Export & API page
- Week 9+: Polish, testing

### Наступні кроки

1. **Валідація з користувачем:**
   - Показати wireframes Option B
   - Питання: "Чи views system вирішує вашу проблему?"
   - Питання: "Чи export workflow зрозумілий?"

2. **Technical spike:**
   - Прототип views system (1-2 дні)
   - Перевірка: чи можна реюзати API з query params?
   - Performance: virtual scroll для 1000+ items

3. **Prioritize Phase 1-5:**
   - Phases 1-5 = MVP (8 weeks)
   - Phase 6 (Export page) = nice-to-have (can defer)
   - Phase 7 = continuous (polish)

---

**Document Version:** 2.0 (REVISED based on real use case)
**Author:** Product Designer (AI Agent)
**Date:** November 2, 2025
**Status:** Ready for validation with user

---

## Appendix: Comparison with Old Proposal

| Aspect | Old Proposal (WRONG) | New Proposal (CORRECT) |
|--------|---------------------|------------------------|
| **Mental model** | Workflow tool (Inbox Zero) | Collection tool (Google Photos) |
| **Default landing** | Dashboard with metrics | Dashboard with activity delta |
| **Messages page** | Inbox triage (process items) | Browse views (filter & explore) |
| **Key feature** | Master-detail pattern | Views system (Airtable) |
| **Primary action** | Complete task | Export data (API) |
| **Frequency** | Daily use | Irregular visits |
| **User base** | Team collaboration | Individual users (2-3 people) |
| **Success metric** | Task completion rate | Export usage & find efficiency |

---

## ВИДАЛЕНО: Стара Research Секція

_(Стара research про Notion/Linear/Asana була релевантна для workflow tools, але НЕ для collection tool. Аналіз Google Photos/Pocket/Evernote/Airtable тепер в розділі "Реальний Use Case: Collection Tool")_

---

# ⚠️ КРИТИЧНИЙ АНАЛІЗ: ЕВОЛЮЦІЯ СИСТЕМИ (ДВІ ФАЗИ)

**Date Updated**: November 2, 2025 (друга ревізія)
**Critical Issue**: Попередня пропозиція (Option B: Views-Based) НЕ враховує життєвий цикл системи

---

## Помилка в попередньому аналізі

### Що було неправильно (ЗНОВУ!)

**Моє припущення:**
- ✗ Collection tool має **сталий use case** протягом життєвого циклу
- ✗ Користувачі будуть взаємодіяти з системою **однаково** від запуску до production
- ✗ Views, Export, Bulk operations **однаково важливі** на всіх етапах
- ✗ UI спроектований для "typical user" застосовний до **всіх фаз**

**Реальність (розкрита користувачем):**

Система має **ДВІ РАДИКАЛЬНО РІЗНІ ФАЗИ**:

### Фаза 1: CALIBRATION (0-6 місяців)

**Роль користувача:** Data Scientist / System Tuner

**Основна робота:**
- 🔧 Tweaking system prompts (LLM експерименти)
- 🔄 Зміна моделей (Ollama ↔ OpenAI ↔ Anthropic)
- 📊 Налаштування noise filtering (thresholds, scoring algorithms)
- ✅ Approval workflows (review proposals, patterns аналіз)
- 🧪 A/B testing classification logic
- 📈 Metrics watching (accuracy, precision, recall)

**Експорт даних:** МІНІМАЛЬНИЙ
- "Крохи валідної інформації"
- Ручні експорти для перевірки якості
- API майже не використовується

**Характер роботи:**
- Частота: Щодня (active development)
- Focus: **Settings, Metrics, Diagnostics**
- Pain points: "Чи модель правильно класифікує?", "Чому цей message отримав score 5, а не 8?"
- Потреба: **Transparency, debugging, iteration speed**

**Ключове питання:** "Як швидко я можу побачити результат зміни prompt і порівняти з попереднім?"

---

### Фаза 2: PRODUCTION (6+ місяців)

**Роль користувача:** Consumer / Data Integrator

**Основна робота:**
- 📤 Експорт через API (щоденний/тижневий flow)
- 🔗 Інтеграція з іншими системами (Notion, Linear, документація)
- 👁️ Швидкий review (перевірка що система зібрала)
- ✅ Bulk approvals (масові затвердження)
- 🔍 Search & filter (знайти конкретну інформацію)

**Експорт даних:** PRIMARY USE CASE
- API calls щодня
- Автоматизовані integrations
- Система виробляє валідні дані автоматично

**Характер роботи:**
- Частота: Нерегулярно (browse when needed)
- Focus: **Browsing, Export, Consumption**
- Pain points: "Як швидко знайти що потрібно і експортувати?"
- Потреба: **Efficiency, bulk operations, API convenience**

**Ключове питання:** "Як експортувати всі high-priority items за тиждень одним кліком?"

---

## Чому Option B (Views-Based) НЕПРАВИЛЬНИЙ для обох фаз?

### Проблеми для Фази 1 (Calibration):

**1. Відсутність Diagnostics & Metrics**

Option B фокусується на **browsing** (views, filters), але calibration потребує:
- ❌ Немає comparison tools (порівняти results до/після зміни prompt)
- ❌ Немає confidence metrics visualization (accuracy, precision графіки)
- ❌ Немає LLM reasoning visibility (чому AI прийняв це рішення?)
- ❌ Немає A/B testing UI (запустити дві версії prompt паралельно)

**2. Export-First Approach = Передчасний**

Calibration фаза: експорт НЕ пріоритет!
- ❌ Export & API page (Phase 6) = dead weight у Фазі 1
- ❌ Bulk operations = не потрібні (review one-by-one для learning)
- ❌ API documentation prominent = не використовується

**3. Dashboard "Since Last Visit" = Irrelevant**

Calibration: користувач заходить ЩОДНЯ (active development)
- ❌ "Since last visit (3 days ago)" = не realistic
- ❌ Activity delta = не допомагає (user needs details, not summary)
- Потрібно: **Real-time feedback** на зміни, не activity aggregation

**4. Views System = Overkill на початку**

Calibration: користувач потребує **manual review**, не filtering
- Створення 5 custom views = premature (user doesn't know patterns yet)
- Saved views = optimization для known workflow (якого ще НЕМАЄ)

---

### Проблеми для Фази 2 (Production):

**1. Відсутність Admin/Calibration Tools = Dead Weight**

Production: більшість diagnostics більше не потрібні
- Settings сторінка = заповнена legacy calibration controls
- Analysis page Configuration tab = rarely used
- Metrics = не цікаві (система працює стабільно)

**2. UI Не оптимізований для масових операцій**

Views system добрий, але недостатньо агресивний:
- Bulk operations = secondary (checkbox + select all)
- Потрібно: **Keyboard shortcuts** (select all with 'a', approve with 'cmd+enter')
- Потрібно: **Auto-approve rules** (якщо confidence ≥90%, approve automatically)

**3. API Integration = Half-Baked**

Export & API page в Phase 6 (тиждень 8) = too late для production needs:
- Немає **webhook configuration** (push data to external systems)
- Немає **scheduled exports** (щодня о 9:00 експортувати в Notion)
- Немає **API key management** (rotation, scopes, rate limits)

---

## Evolution-Proof IA Strategy

### ❌ ВІДКИНУТІ ПІДХОДИ

#### Option X1: "Mode Toggle" (Admin/Consumer)

```
[Toggle: Calibration Mode | Consumer Mode]
```

**Чому НІ:**
- ❌ Cognitive load: користувач повинен пам'ятати переключити
- ❌ UI clutter: два режими = подвійна складність (development + maintenance)
- ❌ False dichotomy: деякі features потрібні в ОБОХ фазах (Messages, Topics)
- ❌ Maintenance nightmare: every new feature = "яка версія в якому режимі?"

**Verdict:** Over-engineering. Не робити.

---

#### Option X2: "Phased Rollout" (Build incrementally)

```
Phase 1 (Calibration): Dashboard + Settings + Diagnostics
Phase 2 (Production): Add Views + Export later
```

**Чому НІ:**
- ❌ Переробка UI: users learn one interface, потім different interface
- ❌ Wasted work: build simple version → throw away → build complex version
- ❌ User frustration: "Чому раптом все змінилось?"
- ❌ Technical debt: legacy code для Фази 1 залишається як cruft

**Verdict:** Short-term thinking. Призведе до rewrite через 6 місяців.

---

### ✅ РЕКОМЕНДАЦІЯ: "Progressive Disclosure with Hidden Admin Layer"

**Філософія:** Одна IA для обох фаз, але з **рівнями видимості**

**Принцип:**
1. **Consumer UI** (default) = clean, browse-focused, export-ready
2. **Admin Panel** (toggle or separate route) = diagnostics, calibration, deep settings
3. **Smart defaults** = система hide complexity до потреби
4. **Keyboard shortcuts** = power users unlock efficiency without UI clutter

---

## Нова IA: Unified Interface з Admin Layer

### Top-Level Structure

```
MAIN APP (Consumer Mode - default)
├── Dashboard (activity summary)
├── Messages (views system)
├── Topics (collections)
├── Analysis (proposals)
├── Export (API & integrations)
└── Settings (basic preferences)

ADMIN PANEL (toggle: bottom-left icon or /admin route)
├── Diagnostics (LLM reasoning, confidence metrics)
├── Calibration (A/B testing, prompt comparison)
├── System Health (performance, error logs)
├── Advanced Settings (model selection, thresholds)
└── Experiments (feature flags, test runs)
```

---

### Ключові Зміни від Option B

#### 1. Dashboard: Dual Purpose

**Consumer Mode (Фаза 2):**
```
┌─────────────────────────────────────────────┐
│ 📊 Dashboard              [Admin Panel →]   │
├─────────────────────────────────────────────┤
│ Since Last Visit (3 days):                  │
│ • 47 new messages → [View Recent]           │
│ • 12 pending proposals → [Review]           │
│                                             │
│ Quick Actions:                              │
│ [Export Last 7 Days] [Bulk Approve]         │
└─────────────────────────────────────────────┘
```

**Admin Panel (Фаза 1):**
```
┌─────────────────────────────────────────────┐
│ 🔧 Admin Panel            [← Back to App]   │
├─────────────────────────────────────────────┤
│ Tabs: [Diagnostics] [Calibration] [System]  │
├─────────────────────────────────────────────┤
│ LLM Performance (Last 24h):                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Classification Accuracy:    87% ↑+2%    │ │
│ │ Avg Confidence Score:       0.78        │ │
│ │ Prompt Token Usage:         45K/day     │ │
│ │ Failed Requests:            3 (0.5%)    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Recent Prompt Changes:                      │
│ • v2.3 → v2.4: "Add context about..."      │
│ • Result: +5% accuracy, -10% tokens        │
│ • [Compare Results] [Rollback]             │
│                                             │
│ Active Experiments:                         │
│ • A/B Test: "Topic extraction v3 vs v4"    │
│   - v3 (50%): 85% accuracy                 │
│   - v4 (50%): 89% accuracy ✅               │
│   - [Promote v4 to Default]                │
└─────────────────────────────────────────────┘
```

**Перемикання:**
- Consumer → Admin: Icon в bottom-left corner (⚙️ + "Admin")
- Admin → Consumer: Top-left back button
- Keyboard: `Cmd+Shift+A` toggle admin panel

---

#### 2. Messages: Views + Diagnostics

**Consumer Mode (same as Option B):**
- Views system (Recent, High Priority, etc.)
- Bulk operations
- Export prominent

**Admin Enhancements (visible тільки в Admin Panel):**

Додати кнопку "🔍 Inspect" в кожній message card:

```
┌─────────────────────────────────────────┐
│ 💬 Alex • 2h ago              🔴 9/10   │
│ "API optimization priority"             │
│ 🏷️ Product Design                       │
│ [View] [Edit] [🔍 Inspect]             │
└─────────────────────────────────────────┘

Click "Inspect" → Modal:
┌─────────────────────────────────────────┐
│ 🔍 Message Diagnostics                  │
├─────────────────────────────────────────┤
│ LLM Processing Details:                 │
│                                         │
│ Classification:                         │
│ • Model: gpt-4o (OpenAI)               │
│ • Confidence: 0.92                     │
│ • Reasoning: "High urgency keywords    │
│   ('priority', 'optimization')         │
│   + technical context"                 │
│                                         │
│ Scoring Breakdown:                      │
│ • Urgency: 9/10                        │
│ • Relevance: 8/10                      │
│ • Actionability: 9/10                  │
│ → Final Score: 9/10                    │
│                                         │
│ Topic Assignment:                       │
│ • Suggested: "Product Design" (0.85)   │
│ • Alternatives:                         │
│   - "Backend API" (0.67)               │
│   - "Performance" (0.54)               │
│                                         │
│ [View Full Prompt] [Retry with Model X]│
└─────────────────────────────────────────┘
```

**Коли показувати "Inspect":**
- **Фаза 1:** Always visible (every message card)
- **Фаза 2:** Видалити з UI (або hide за keyboard shortcut `Cmd+I`)

**Implementation:** Feature flag `SHOW_DIAGNOSTICS` (enable during calibration)

---

#### 3. Analysis: Admin-Heavy Features

**Consumer Mode:**
- Proposals tab (bulk approve/reject)
- Export approved (API format)

**Admin Panel:**

Новий tab "Calibration":

```
┌─────────────────────────────────────────────┐
│ 🤖 Analysis > Calibration                   │
├─────────────────────────────────────────────┤
│ Prompt Experiments:                         │
│ ┌─────────────────────────────────────────┐ │
│ │ Experiment: "Classification v5"         │ │
│ │ Status: Running (50% traffic)           │ │
│ │ Duration: 3 days                        │ │
│ │                                         │ │
│ │ Variants:                               │ │
│ │ • Control (v4): 87% accuracy            │ │
│ │ • Treatment (v5): 91% accuracy ✅       │ │
│ │                                         │ │
│ │ Sample Size: 120 messages each          │ │
│ │ Statistical Significance: p < 0.05      │ │
│ │                                         │ │
│ │ [View Diff] [Compare Results]          │ │
│ │ [Promote v5] [Stop Experiment]         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Threshold Tuning:                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Noise Filter: Min Score for Visibility  │ │
│ │                                         │ │
│ │ Current: 5/10 ────●────────            │ │
│ │                    ↑                    │ │
│ │         Change: 5 → 6                   │ │
│ │                                         │ │
│ │ Impact Prediction:                      │ │
│ │ • 23% fewer visible messages            │ │
│ │ • 12% higher average relevance          │ │
│ │ • 3 high-value messages might be hidden │ │
│ │                                         │ │
│ │ [Apply Change] [Simulate on Sample]    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

#### 4. NEW: Export & API (Enhanced for Production)

**Consumer Mode (same as Option B + additions):**

```
┌─────────────────────────────────────────────┐
│ 📤 Export & API                             │
├─────────────────────────────────────────────┤
│ Tabs: [Quick Export] [Scheduled] [Webhooks]│
├─────────────────────────────────────────────┤
│ Quick Export (one-time):                    │
│ [як в Option B]                             │
│                                             │
│ ── NEW ──                                   │
│                                             │
│ Scheduled Exports:                          │
│ ┌─────────────────────────────────────────┐ │
│ │ ⏰ Daily Export to Notion                │ │
│ │ Schedule: Every day at 09:00 UTC        │ │
│ │ Data: High Priority messages (last 24h) │ │
│ │ Format: JSON                            │ │
│ │ Webhook: https://api.notion.com/v1/...  │ │
│ │ Status: ✅ Last run: 2h ago (47 items)  │ │
│ │ [Edit] [Pause] [Delete]                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ New Scheduled Export]                    │
│                                             │
│ Webhooks (push to external systems):        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔗 Send to Linear on Approval            │ │
│ │ Trigger: Proposal approved              │ │
│ │ Action: Create Linear issue             │ │
│ │ URL: https://api.linear.app/graphql     │ │
│ │ Status: ✅ Active (12 triggers today)   │ │
│ │ [Edit] [Test] [Delete]                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ New Webhook]                             │
└─────────────────────────────────────────────┘
```

**Критичні додатки для Фази 2:**
1. **Scheduled Exports** = recurring automation (щодня, щотижня)
2. **Webhooks** = push to external systems (не pull через API)
3. **Auto-approve Rules** = якщо confidence ≥ 90%, approve automatically

---

#### 5. Settings: Split Basic/Advanced

**Consumer Mode (Basic Settings):**
- Display preferences (density, theme)
- Notifications
- Account

**Admin Panel (Advanced Settings):**
```
┌─────────────────────────────────────────────┐
│ ⚙️ Advanced Settings                        │
├─────────────────────────────────────────────┤
│ LLM Configuration:                          │
│ • Provider: [OpenAI ▼] [Anthropic] [Ollama]│
│ • Model: [gpt-4o ▼]                         │
│ • Temperature: 0.7 ────●────               │
│ • Max Tokens: [2000]                        │
│                                             │
│ Noise Filtering:                            │
│ • Min Score Threshold: [5 ▼]                │
│ • Auto-Archive Below: [3 ▼]                 │
│ • Confidence Required: 0.7 ────●────       │
│                                             │
│ Topic Extraction:                           │
│ • Auto-Create Topics: [✓]                   │
│ • Min Messages per Topic: [3]               │
│ • Embedding Model: [text-embedding-3]       │
│                                             │
│ [Save Changes] [Reset to Defaults]          │
└─────────────────────────────────────────────┘
```

---

## Comparison: Option B vs Unified Admin

| Aspect | Option B (Views-Based) | Unified Admin (NEW) |
|--------|------------------------|---------------------|
| **Calibration (Фаза 1)** | ❌ Не підходить (немає diagnostics) | ✅ Admin Panel = full diagnostics |
| **Production (Фаза 2)** | ✅ Good (views, export) | ✅ Excellent (+ webhooks, scheduled) |
| **Transition 1→2** | ⚠️ Треба переробляти UI | ✅ Seamless (hide admin layer) |
| **UI Complexity** | Medium (5 pages) | Medium (5 pages + admin toggle) |
| **Development** | 9 weeks | 11 weeks (+2 для admin panel) |
| **Maintenance** | ⚠️ Calibration features = tech debt | ✅ Admin isolated (can remove) |
| **Learning Curve** | Low (для Фази 2) | Very low (admin = opt-in) |
| **Evolution-Proof** | ❌ НІ (не враховує Фазу 1) | ✅ ТАК (обидві фази covered) |

---

## Що НЕ РОБИТИ (Professional Warnings)

### ❌ 1. НЕ робити "Export & API" пріоритетом у Фазі 1

**Чому:**
- Calibration phase = майже НЕМАЄ експорту
- Building API docs/webhooks/scheduled exports = wasted 2 weeks
- User потребує diagnostics, не export UI

**Коли робити:**
- Phase 6-7 (weeks 8-9), ПІСЛЯ calibration stabilizes
- Або коли user explicitly requests export features

**Risk if ignored:**
- Spend time on unused features → delay important diagnostics
- User frustration: "Де comparison tool? Чому export prominent, а inspect hidden?"

---

### ❌ 2. НЕ робити Dashboard "Since Last Visit" core feature

**Чому:**
- Фаза 1: User заходить ЩОДНЯ → "last visit" = today (meaningless)
- Фаза 2: Може бути корисно, але NOT critical (nice-to-have)
- Backend complexity: track last_login, compute deltas

**Альтернатива:**
- Simple: "Recent Activity (last 7 days)" = static filter
- Не потребує tracking, працює в обох фазах

**Risk if ignored:**
- Build feature користувачу не потрібна у Фазі 1
- Maintenance: що якщо user clears cookies? Last visit = 6 months ago → noise

---

### ❌ 3. НЕ робити Views System складним на старті

**Чому:**
- Фаза 1: User НЕ ЗНАЄ які views потрібні (still learning patterns)
- Custom views = premature optimization
- Implementation: saved views, edit UI, delete confirmation = overkill

**Альтернатива:**
- Hardcoded views only (Recent, High Priority, Needs Topic, All)
- Custom views = Phase 2 feature (after user learns workflow)

**Risk if ignored:**
- User overwhelmed: "Як створити view? Які параметри?"
- Build complex UI яку ніхто не використовує 6 місяців

---

### ❌ 4. НЕ робити Bulk Operations без Keyboard Shortcuts

**Чому:**
- Bulk operations з checkbox + button = slow for power users
- Фаза 2: user process 100+ items → clicking = tedious
- Efficiency: keyboard shortcuts 5x faster

**Must have:**
- `a` = select all visible
- `Cmd+A` = select all in view
- `Cmd+Enter` = approve selected
- `Cmd+Backspace` = reject selected
- `Escape` = deselect all

**Risk if ignored:**
- Bulk operations exist but not efficient → user frustrated
- "Система має bulk approve, але faster to click one-by-one" = UX fail

---

### ❌ 5. НЕ робити Admin Panel як окремий додаток

**Чому:**
- Окремий admin app (/admin domain or separate repo) = context switch
- User потребує бачити Messages + Diagnostics одночасно
- Debugging: "Чому цей message score 5?" → click Inspect → modal (NOT new app)

**Правильно:**
- Admin = toggle in same app (⚙️ icon bottom-left)
- Diagnostics = contextual (inspect button в message card)
- Keyboard: `Cmd+Shift+A` = instant toggle

**Risk if ignored:**
- Admin dashboard separate → constant tab switching
- Lost context: "Де той message ID який я дивився?"

---

## Implementation Roadmap (REVISED)

### Phase 0: Foundation (Week 1) ⭐ START HERE

**Goal:** Backend ready для admin features

**Tasks:**
1. Feature flags system:
   - `SHOW_DIAGNOSTICS` (default: true у Фазі 1)
   - `ENABLE_ADMIN_PANEL` (default: true)
   - localStorage або backend user preferences
2. LLM reasoning storage:
   - Add `reasoning_text` field to Message model
   - Store confidence scores breakdown
   - Log token usage per request
3. Metrics aggregation:
   - Daily classification accuracy (approved/total)
   - Average confidence scores
   - Failed requests log

**Deliverable:** Backend готовий для diagnostics UI

---

### Phase 1: Consumer UI - Messages Views (Weeks 2-3)

**Goal:** Core browsing experience (same as Option B Phase 4-5)

**Tasks:**
- Views system (hardcoded only: Recent, High Priority, Needs Topic, All)
- Density control
- Bulk select + approve/reject
- Keyboard shortcuts (`a`, `Cmd+Enter`, etc.)

**Deliverable:** Efficient browsing для Фази 2 (але працює в Фазі 1)

---

### Phase 2: Admin Panel - Diagnostics (Weeks 4-5) ⭐ CRITICAL

**Goal:** Calibration tools для Фази 1

**Tasks:**
1. Admin Panel toggle (bottom-left, keyboard `Cmd+Shift+A`)
2. Diagnostics Dashboard:
   - LLM performance metrics (accuracy, confidence, token usage)
   - Recent prompt changes log
   - Failed requests list
3. Message Inspect modal:
   - Classification reasoning
   - Scoring breakdown
   - Topic assignment alternatives
   - "Retry with different model" button
4. Comparison tool:
   - Select 2 messages → compare LLM reasoning
   - Before/after prompt changes

**Deliverable:** User може debug classification у Фазі 1

---

### Phase 3: Admin Panel - Calibration Tools (Week 6)

**Goal:** A/B testing & threshold tuning

**Tasks:**
1. Experiments UI:
   - Create A/B test (2 prompts, split traffic)
   - View results (accuracy, sample size, significance)
   - Promote winner to default
2. Threshold tuning:
   - Slider для min score (5 → 6)
   - Impact prediction (% fewer messages, avg relevance)
   - Simulate on sample before applying
3. Model switcher:
   - Quick toggle: GPT-4 ↔ Claude ↔ Ollama
   - Side-by-side comparison (same message, different models)

**Deliverable:** User може iterate prompts швидко

---

### Phase 4: Consumer UI - Topics & Dashboard (Week 7)

**Goal:** Complete consumer experience

**Tasks:**
- Dashboard activity summary (simple: last 7 days, NOT "since last visit")
- Topics grid + detail view (same as Option B)
- Export button (basic: JSON/CSV download)

**Deliverable:** Consumer UI complete для Фази 2

---

### Phase 5: Production Features - Export Advanced (Week 8) 🚀

**Goal:** Export automation для Фази 2

**Tasks:**
1. Scheduled exports:
   - Configure recurring export (daily/weekly)
   - Select data + filters + format
   - View export history + logs
2. Webhooks:
   - Trigger on event (proposal approved, new message)
   - Configure URL + headers + payload
   - Test webhook (send sample)
3. API key management:
   - Generate API key with scopes
   - View usage stats
   - Rotate key

**Deliverable:** Production-ready export automation

---

### Phase 6: Production Features - Auto-Approve (Week 9)

**Goal:** Reduce manual review у Фазі 2

**Tasks:**
1. Auto-approve rules:
   - If confidence ≥ 90% → approve automatically
   - If score ≥ 9 AND topic assigned → approve
   - User configures rules (UI)
2. Rule logs:
   - View auto-approved items (audit log)
   - Disable rule if accuracy drops
3. Safety:
   - Max auto-approve per day (limit: 100)
   - Weekly report: auto-approve accuracy

**Deliverable:** System self-manages high-confidence items

---

### Phase 7: Polish & Transitions (Weeks 10-11)

**Goal:** Smooth transition Фаза 1 → Фаза 2

**Tasks:**
1. **Onboarding wizard:**
   - First launch: "Welcome to Calibration Mode"
   - Guide: setup LLM, configure threshold, review first 10 messages
2. **Graduation prompt:**
   - After 500 classified messages + 80% accuracy:
   - Modal: "System is calibrated! Switch to Consumer Mode?"
   - [Yes] → hide diagnostics (SHOW_DIAGNOSTICS = false)
   - [No, keep calibrating] → keep admin panel visible
3. **Feature flag UI:**
   - Settings > Advanced > "Show Admin Panel" toggle
   - User can re-enable diagnostics anytime
4. Accessibility audit
5. Mobile testing
6. Performance optimization

**Deliverable:** Production-ready transition flow

---

## Success Metrics (Both Phases)

### Фаза 1: Calibration (Weeks 1-12)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Classification accuracy** | 80% → 90% | Track approved/rejected proposals |
| **Prompt iteration speed** | <1 hour | Time: change prompt → see results → compare |
| **Inspect usage** | 50+ per week | Analytics: "Inspect" button clicks |
| **Experiments created** | 5+ A/B tests | Track experiment creation |
| **Time to debug low score** | <5 min | User testing: "Why message X scored 5?" |

### Фаза 2: Production (Week 13+)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Export frequency** | 5+ per week | Track export/webhook triggers |
| **Auto-approve rate** | 30-50% | Auto-approved / total proposals |
| **Bulk operations usage** | 70% of approvals | Bulk approve vs one-by-one |
| **Admin panel usage** | <1x per month | Track toggle after graduation |
| **Time to find & export** | <30 sec | User testing: "Export high priority from last week" |

---

## Висновки: Professional Recommendations

### 🎯 Що ТОЧНО треба зробити ЗАРАЗ (Must-Have для Фази 1)

**Priority 1 (Weeks 1-2):**
1. ✅ **Backend: Feature flags + reasoning storage** (Phase 0)
2. ✅ **Admin Panel foundation** (toggle, routing, keyboard shortcut)
3. ✅ **Message Inspect modal** (LLM reasoning, scoring breakdown)

**Rationale:**
- Без diagnostics = user сліпий у Фазі 1 (неможливо calibrate)
- Inspect modal = highest ROI feature (answers "чому?" instantly)
- Foundation first → iterate fast після

**Priority 2 (Weeks 3-5):**
1. ✅ **Admin Dashboard** (metrics, prompt changes log)
2. ✅ **Comparison tool** (before/after, side-by-side models)
3. ✅ **Consumer UI basics** (Messages views, bulk operations)

**Rationale:**
- Calibration tools = core value у Фазі 1
- Consumer UI паралельно → готовий до Фази 2
- Metrics dashboard = quantify progress (motivation для user)

---

### ⏸️ Що ВІДКЛАСТИ (Nice-to-Have, зробити в Фазі 2 АБО later)

**Defer to Week 8+:**
1. ⏸️ **Scheduled exports** (немає use case у Фазі 1)
2. ⏸️ **Webhooks** (API integrations = Фаза 2 feature)
3. ⏸️ **Custom views** (hardcoded views достатньо на старті)
4. ⏸️ **Dashboard "Since last visit"** (too complex, low value early)

**Defer to Week 10+:**
1. ⏸️ **Auto-approve rules** (потребує стабільної accuracy, не маємо у Фазі 1)
2. ⏸️ **Onboarding wizard** (polish feature, не blocker)
3. ⏸️ **API key management** (немає зовнішніх consumers у Фазі 1)

**Rationale:**
- Export features = wasted time у Фазі 1 (майже немає експорту)
- Custom views = premature (user doesn't know patterns yet)
- Auto-approve = небезпечно без calibration (може approve garbage)
- Focus на calibration tools = faster time to production

---

### 🚫 Що НЕ РОБИТИ взагалі (Over-Engineering / Anti-Patterns)

**NEVER do:**

1. ❌ **Mode Toggle (Admin/Consumer switch)**
   - Reason: Подвійна складність, cognitive load
   - Alternative: Admin Panel = opt-in (hidden за toggle)

2. ❌ **Separate Admin Application**
   - Reason: Context switch, lost productivity
   - Alternative: Admin Panel в тому ж app (keyboard toggle)

3. ❌ **"Since Last Visit" tracking на початку**
   - Reason: Фаза 1 = щоденний use (meaningless delta)
   - Alternative: Simple "Last 7 days" filter

4. ❌ **Export UI prominent у Фазі 1**
   - Reason: Confuses user ("чому export everywhere якщо немає даних?")
   - Alternative: Export = Phase 2 addition (week 8)

5. ❌ **Complex Views System на старті**
   - Reason: User overwhelmed, premature optimization
   - Alternative: 4 hardcoded views → custom views later (week 10+)

**Rationale:**
- Кожен з цих підходів = tech debt або wasted weeks
- Evolution-proof ≠ build everything upfront
- Evolution-proof = design для growth, implement incrementally

---

### ⚠️ Ризики якщо не врахувати еволюцію

**Scenario 1: Build Option B (Views-Based) без Admin Layer**

**Week 1-9:** Build consumer UI (views, export, dashboard)
**Week 10:** User у Фазі 1: "Де diagnostics? Чому я не бачу LLM reasoning?"
**Week 11-15:** ПЕРЕРОБКА: додавання admin features post-factum
**Result:** +6 weeks wasted, tech debt, user frustration

**Lesson:** Consumer UI без Calibration tools = unusable у Фазі 1

---

**Scenario 2: Build Admin-Heavy, ігнорувати Consumer needs**

**Week 1-8:** Build diagnostics, experiments, comparison tools
**Week 9:** User complains: "Де bulk operations? Export незручний"
**Week 10:** Realize: Фаза 2 близько, немає production features
**Week 11-16:** Rush build export, webhooks, auto-approve
**Result:** Quality suffers, bugs, missed production deadline

**Lesson:** Calibration tools ≠ єдина потреба. Production features теж треба спланувати.

---

**Scenario 3: Unified Admin (RECOMMENDED) - Smooth Transition**

**Week 1-6:** Build admin + consumer паралельно (foundation strong)
**Week 7-9:** Complete consumer UI + basic export
**Week 10-11:** Polish transition flow (graduation prompt, feature flags)
**Week 12:** User у Фазі 1: diagnostics працюють, calibration efficient
**Week 20:** User перейшов у Фазу 2: hide admin, use consumer UI, export automation
**Result:** ✅ Seamless evolution, zero rework, user happy

**Lesson:** Plan для обох фаз = zero surprises, smooth scaling

---

## Final Verdict: Build "Unified Admin" Approach

### Чому це найкращий вибір?

**1. Evolution-Proof Architecture**
- ✅ Працює у Фазі 1 (admin panel visible)
- ✅ Працює у Фазі 2 (admin panel hidden)
- ✅ Zero rework при transition

**2. Development Efficiency**
- Incremental: foundation → calibration → production features
- Parallel tracks: admin + consumer UI
- No wasted work (все features eventually used)

**3. User Experience**
- Фаза 1: User має diagnostics (can calibrate efficiently)
- Фаза 2: User має consumer UI (can browse/export efficiently)
- Transition: Feature flag toggle (simple, reversible)

**4. Technical Sustainability**
- Admin layer isolated (can remove after Фаза 2 if never used)
- Consumer UI clean (не забруднений calibration controls)
- Maintenance: admin = optional module

**5. Risk Mitigation**
- If Фаза 1 longer than expected → admin tools ready
- If Фаза 2 comes early → consumer UI ready
- If user wants return to calibration → just re-enable admin

---

### Implementation: 11 тижнів (Realistic, Safe)

- **Weeks 1-2:** Foundation (backend + admin panel structure)
- **Weeks 3-5:** Calibration tools (diagnostics, comparison, experiments)
- **Weeks 6-7:** Consumer UI (views, bulk, topics)
- **Weeks 8-9:** Production features (export automation, webhooks)
- **Weeks 10-11:** Transition flow + polish

**Buffer:** 2 weeks для unexpected issues (realistic estimate)

**Total:** 11 weeks до production-ready обох фаз

---

### Альтернативна думка: "А може Option B достатньо?"

**Контраргумент:**

> "Option B (Views) непогана. Може додати diagnostics як окрему сторінку пізніше?"

**Чому НІ:**

1. **Calibration = Day 1 need, не "later"**
   - User починає з Фази 1 (0 classified messages)
   - Без diagnostics = неможливо calibrate (blind guessing)
   - Додавати post-factum = переробка UI (де розмістити?)

2. **Diagnostics як окрема сторінка = контекст lost**
   - User бачить message score 5 → click "Inspect" → нова сторінка?
   - Context switch = slow (back button, lost scroll position)
   - Modal в тій же view = instant (як в Unified Admin)

3. **Option B = premature export focus**
   - Export & API page (week 8) = марна робота у Фазі 1
   - User не експортує майже нічого перші 6 місяців
   - Resources better spent на calibration tools

**Verdict:** Option B = good starting point, але incomplete. Unified Admin = complete solution.

---

## Наступні кроки

**Immediate Actions:**

1. **Валідація з користувачем** (1 година):
   - Показати секцію "ДВІ ФАЗИ" з документа
   - Питання: "Чи правильно я зрозумів lifecycle?"
   - Питання: "Чи Admin Panel approach вирішує обидві фази?"
   - Питання: "Що критично у Фазі 1, що можна defer?"

2. **Technical Spike - Feature Flags** (1 день):
   - Prototype: `SHOW_DIAGNOSTICS` flag
   - Test: hide/show Inspect button based on flag
   - Verify: localStorage persistence або backend API?

3. **Technical Spike - LLM Reasoning Storage** (1 день):
   - Add `reasoning_text` JSONB field to Message model
   - Test: store OpenAI response metadata
   - Verify: можна retrieve для Inspect modal?

4. **Design Spike - Admin Panel Toggle** (2 дні):
   - Build: bottom-left icon + keyboard shortcut
   - Build: simple admin dashboard (empty state)
   - Test: transition smooth? Keyboard `Cmd+Shift+A` works?

5. **Prioritization Decision** (1 година):
   - User decides: чи будувати Unified Admin, чи Option B + later additions?
   - If Unified: start Phase 0 (week 1)
   - If Option B: acknowledge tech debt, plan rework у week 12+

**Total prep time:** 5 days → ready to start Phase 0

---

**Document Version:** 3.1 (VISUAL WIREFRAMES ADDED)
**Author:** Product Designer (AI Agent)
**Date:** November 2, 2025
**Status:** Visual wireframes ready for review
**Recommendation:** Build "Unified Admin" approach, 11 weeks timeline

---

# ВІЗУАЛІЗАЦІЯ: ADMIN VS USER VIEW (КОНКРЕТНІ WIREFRAMES)

**Мета цієї секції:** Показати ТОЧНО як виглядатиме кожна сторінка в двох режимах.

**Дані з поточного аудиту Task Tracker:**
- 125 messages (з різними scores: 3-10)
- 5 topics (Product Design, Backend API, Documentation, Research, Personal)
- 15 analysis runs (останній: 2 години тому)
- 12 pending proposals (для approval)

---

## Концепція перемикання

### Як працює Admin Toggle?

**Default Mode:** Consumer View (чистий UI, focus на browsing/export)
**Admin Mode:** Додаткові діагностичні елементи (reasoning, metrics, experiments)

**Методи перемикання:**
1. **Keyboard Shortcut:** `Cmd+Shift+A` (Mac) або `Ctrl+Shift+A` (Windows)
2. **UI Toggle:** Іконка ⚙️ в bottom-left corner з текстом "Admin"
3. **URL Route:** `/admin` відкриває Admin Panel (не toggle, а окремий dashboard)

**Візуальний індикатор:**
```
User Mode:  [App UI - clean]
            └─ Bottom-left: [⚙️ Admin]

Admin Mode: [App UI - з diagnostics]
            └─ Top-right: [👁️ Exit Admin] (eye icon = seeing internals)
```

**Feature Flag контроль:**
```typescript
// localStorage або backend user preference
const SHOW_DIAGNOSTICS = localStorage.getItem('admin_mode') === 'true';

// В компонентах
{SHOW_DIAGNOSTICS && <InspectButton />}
```

---

## Messages Page

### User View (Consumer - Фаза 2)

**Scenario:** Користувач заходить переглянути що назбиралось за тиждень. Фокус: швидкий browse, filtering, експорт.

```
┌─────────────────────────────────────────────────────────────┐
│ Task Tracker                                    [Search 🔍] │
├─────────────────────────────────────────────────────────────┤
│ Sidebar:                                                    │
│ • Dashboard                                                 │
│ • Messages  ◄── ви тут                                      │
│ • Topics                                                    │
│ • Analysis                                                  │
│ • Export & API                                              │
│ • Settings                                                  │
│                                                             │
│ [⚙️ Admin]  ◄── toggle в bottom-left                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📨 Messages                            [Density: ▼] [Export]│
├─────────────────────────────────────────────────────────────┤
│ Views (Tabs):                                               │
│ [Recent●] [High Priority] [Needs Topic] [By Topic] [All]   │
├─────────────────────────────────────────────────────────────┤
│ Showing: 47 messages (Last 7 days)                          │
│ [☐ Select All]  [Bulk Actions: Assign Topic | Export]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nov 2 (Today) • 12 messages                                 │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💬 Alex Tanaka • 2 hours ago         🔴 Score: 9  │   │
│ │                                                       │   │
│ │ "We need to prioritize API optimization before the   │   │
│ │  next sprint. Current response time is 2.3s avg."    │   │
│ │                                                       │   │
│ │ 🏷️ Product Design                                     │   │
│ │ [View Details] [Edit Topic] [⋮ More]                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💬 Maria Rodriguez • 5 hours ago     🟡 Score: 6  │   │
│ │                                                       │   │
│ │ "Documentation for the new endpoints is ready.       │   │
│ │  Should I commit to main or create a PR?"            │   │
│ │                                                       │   │
│ │ 🏷️ No Topic Yet  [Assign Topic →]                    │   │
│ │ [View Details] [⋮ More]                              │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Nov 1 • 18 messages                                         │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💬 John Smith • Yesterday            🟢 Score: 7  │   │
│ │                                                       │   │
│ │ "Fixed the authentication bug. Testing now..."       │   │
│ │                                                       │   │
│ │ 🏷️ Backend API                                        │   │
│ │ [View Details] [Edit Topic] [⋮ More]                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [Load More (93 older messages)] ◄── infinite scroll         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Bulk Actions Bar (з'являється коли є selection):
┌─────────────────────────────────────────────────────────────┐
│ 3 selected   [Assign to Topic ▼] [Export Selected]  [✕]    │
└─────────────────────────────────────────────────────────────┘
```

**Що показуємо:**
- ✅ Clean card view (sender, text preview, score badge, topic)
- ✅ Quick actions (View, Edit Topic, More menu)
- ✅ Bulk select checkboxes
- ✅ Density control (compact/comfortable/spacious)
- ✅ Export button prominent

**Що ховаємо (немає в User View):**
- ❌ LLM reasoning text
- ❌ Confidence breakdown (urgency/relevance/actionability)
- ❌ Token usage stats
- ❌ Model info (gpt-4o, claude, etc.)
- ❌ "Inspect" or "Debug" buttons
- ❌ Comparison tools

**Keyboard Shortcuts (User View):**
- `a` - Select all visible messages
- `Cmd+A` - Select all in current view
- `Cmd+Enter` - Bulk approve/assign topic
- `Escape` - Deselect all
- `↑/↓` - Navigate between messages
- `Enter` - Open selected message details

---

### Admin View (Calibration - Фаза 1)

**Scenario:** Data scientist налаштовує LLM. Потрібно бачити ЧИ правильно AI класифікує messages + ЧОМУ прийняв це рішення.

```
┌─────────────────────────────────────────────────────────────┐
│ Task Tracker [ADMIN MODE]                      [👁️ Exit]    │
│                                            ◄── індикатор режиму
├─────────────────────────────────────────────────────────────┤
│ Global Admin Controls:  ◄── з'являється тільки в Admin Mode │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LLM: [gpt-4o ▼]  Threshold: 5.0 ────●────  [Edit]      │ │
│ │ Debug: [✓] Show Reasoning  [✓] Show Confidence         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📨 Messages                            [Density: ▼] [Export]│
├─────────────────────────────────────────────────────────────┤
│ Views: [Recent●] [High Priority] [Needs Topic] [All]        │
├─────────────────────────────────────────────────────────────┤
│ Showing: 47 messages (Last 7 days)                          │
│ [☐ Select All]  [Bulk: Reprocess | Compare | Export]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nov 2 (Today) • 12 messages                                 │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💬 Alex Tanaka • 2 hours ago         🔴 Score: 9  │   │
│ │                                                       │   │
│ │ "We need to prioritize API optimization before the   │   │
│ │  next sprint. Current response time is 2.3s avg."    │   │
│ │                                                       │   │
│ │ 🏷️ Product Design                                     │   │
│ │                                                       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ 🔍 AI DIAGNOSTICS  ◄── секція з'являється в Admin    │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │                                                       │   │
│ │ Model: gpt-4o (OpenAI) • Tokens: 250→150             │   │
│ │ Confidence: 87% (High ✅)                             │   │
│ │                                                       │   │
│ │ Reasoning:                                            │   │
│ │ "Message contains urgency keywords ('prioritize',    │   │
│ │ 'before sprint') + technical context ('API', 'response│   │
│ │ time'). Clear action item with metrics. High business │   │
│ │ impact. Classification: work/product-design."         │   │
│ │                                                       │   │
│ │ Score Breakdown:                                      │   │
│ │ • Urgency: 9/10        (deadline mentioned)           │   │
│ │ • Relevance: 8/10      (technical + business)         │   │
│ │ • Actionability: 9/10  (clear next step)              │   │
│ │ → Final Score: 8.7 → rounded to 9/10                 │   │
│ │                                                       │   │
│ │ Topic Assignment (confidence):                        │   │
│ │ • Product Design (85%) ✅ selected                    │   │
│ │ • Backend API (67%)                                   │   │
│ │ • Performance (54%)                                   │   │
│ │                                                       │   │
│ │ [View Full Prompt] [Reprocess with claude-3] [Compare]│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💬 Maria Rodriguez • 5 hours ago     🟡 Score: 6  │   │
│ │                                                       │   │
│ │ "Documentation for the new endpoints is ready.       │   │
│ │  Should I commit to main or create a PR?"            │   │
│ │                                                       │   │
│ │ 🏷️ No Topic Yet                                       │   │
│ │                                                       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ 🔍 AI DIAGNOSTICS                                     │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │                                                       │   │
│ │ Model: gpt-4o • Tokens: 180→95                       │   │
│ │ Confidence: 45% (Low ⚠️)                              │   │
│ │                                                       │   │
│ │ Reasoning:                                            │   │
│ │ "Message is a question about process (commit vs PR). │   │
│ │ Low urgency, no clear decision. Could be noise or    │   │
│ │ meta-communication. Unable to assign topic with high │   │
│ │ confidence. Classification: uncertain/process."       │   │
│ │                                                       │   │
│ │ Score Breakdown:                                      │   │
│ │ • Urgency: 4/10        (no deadline)                  │   │
│ │ • Relevance: 6/10      (work-related question)        │   │
│ │ • Actionability: 7/10  (yes/no answer)                │   │
│ │ → Final Score: 5.7 → rounded to 6/10                 │   │
│ │                                                       │   │
│ │ Topic Assignment (confidence):                        │   │
│ │ • Documentation (38%) ⚠️ too low                      │   │
│ │ • Backend API (22%)                                   │   │
│ │ • Process (15%)                                       │   │
│ │ → NO TOPIC (threshold: 50%)                           │   │
│ │                                                       │   │
│ │ [View Prompt] [Reprocess] [Manual Override]          │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Admin Action Bar (коли selected):
┌─────────────────────────────────────────────────────────────┐
│ 2 selected   [Reprocess All] [Compare Reasoning]            │
│              [Change Model: claude-3 ▼] [Export with Debug] │
└─────────────────────────────────────────────────────────────┘
```

**Додаткові елементи в Admin View:**

1. **Global Admin Controls (header)**
   - LLM Model Selector (gpt-4o, claude-3, ollama)
   - Threshold slider (5.0 = мінімальний score для показу)
   - Debug toggles (Show Reasoning, Show Confidence)

2. **Per-Message Diagnostics Panel**
   - Model info + token usage
   - Confidence score з візуальним індикатором
   - LLM reasoning (текст пояснення)
   - Score breakdown (3 компоненти: urgency, relevance, actionability)
   - Topic assignment alternatives з confidence percentages
   - Action buttons: View Prompt, Reprocess, Compare

3. **Enhanced Bulk Actions**
   - Reprocess All (run через інший model)
   - Compare Reasoning (side-by-side diff)
   - Export with Debug Info (JSON з reasoning)

**Use Cases в Admin Mode:**

**UC1: Debugging низького score**
```
User бачить: Maria message має score 6 (очікував 8)
→ Розгортає AI Diagnostics
→ Читає reasoning: "Unable to assign topic with high confidence"
→ Бачить topic confidence: Documentation (38%) - too low
→ Висновок: threshold 50% занадто високий для process questions
→ Action: знизити threshold до 35% АБО додати "Process" topic
```

**UC2: Порівняння моделей**
```
User selected 5 messages з різними scores
→ Click "Reprocess with claude-3"
→ Система reprocess ті ж messages через Claude
→ Comparison view shows:
   - GPT-4o: avg confidence 67%, score variance ±2
   - Claude-3: avg confidence 78%, score variance ±1
→ Висновок: Claude більш консистентний
→ Action: switch default model to claude-3
```

**UC3: Prompt iteration**
```
User змінив system prompt (додав context про team)
→ Version: v2.4 → v2.5
→ Reprocess sample 20 messages
→ Compare reasoning v2.4 vs v2.5:
   - v2.4: "unable to determine context" (15%)
   - v2.5: "team context helps" (85%)
→ Accuracy: +12% (approved/total)
→ Action: promote v2.5 to default
```

---

## Topics Page

### User View (Consumer)

**Scenario:** Користувач хоче експортувати всі messages з topic "Product Design".

```
┌─────────────────────────────────────────────────────────────┐
│ 🏷️ Topics                          [+ New Topic] [Export All]│
├─────────────────────────────────────────────────────────────┤
│ Filters: [All●] [Draft] [Approved] [Active (updated <7d)]   │
│ Sort: [Recent Activity ▼]                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Grid View (card layout):                                    │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ 🎨 Product Design   │  │ 🔧 Backend API      │           │
│ │                     │  │    Optimization     │           │
│ │ UI/UX improvements  │  │                     │           │
│ │ and design system   │  │ Performance work    │           │
│ │                     │  │                     │           │
│ │ 15 atoms            │  │ 8 atoms             │           │
│ │ 23 messages         │  │ 12 messages         │           │
│ │ Updated: 2h ago     │  │ Updated: 1d ago     │           │
│ │                     │  │                     │           │
│ │ [Open] [Export]     │  │ [Open] [Export]     │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ 📚 Documentation    │  │ 🔬 Research         │           │
│ │                     │  │                     │           │
│ │ Guides and API docs │  │ Explorations        │           │
│ │                     │  │                     │           │
│ │ 6 atoms             │  │ 4 atoms             │           │
│ │ 9 messages          │  │ 5 messages          │           │
│ │ Updated: 3d ago     │  │ Updated: 1w ago     │           │
│ │                     │  │                     │           │
│ │ [Open] [Export]     │  │ [Open] [Export]     │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
│ ┌─────────────────────┐                                    │
│ │ 👤 Personal         │                                    │
│ │                     │                                    │
│ │ Private notes       │                                    │
│ │                     │                                    │
│ │ 2 atoms             │                                    │
│ │ 4 messages          │                                    │
│ │ Updated: 2w ago     │                                    │
│ │                     │                                    │
│ │ [Open] [Export]     │                                    │
│ └─────────────────────┘                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Click "Product Design" → Detail View:

┌─────────────────────────────────────────────────────────────┐
│ ← Back to Topics                                            │
├─────────────────────────────────────────────────────────────┤
│ 🎨 Product Design                      [Edit] [Export] [⋮]  │
│ "UI/UX improvements and design system"                      │
│                                                             │
│ Tabs: [Overview●] [Messages] [Proposals] [Atoms]           │
├─────────────────────────────────────────────────────────────┤
│ Overview:                                                   │
│                                                             │
│ Stats:                                                      │
│ ├── 15 atoms (knowledge units)                              │
│ ├── 23 messages (source data)                               │
│ ├── 7 proposals (5 approved ✅, 2 pending ⏳)               │
│ └── Last updated: 2 hours ago                               │
│                                                             │
│ Recent Activity:                                            │
│ • 2h ago: 2 new messages added                              │
│ • 5h ago: 1 proposal approved ("Dark mode toggle")          │
│ • 1d ago: Analysis run completed (RUN-D4BF)                 │
│                                                             │
│ Top Keywords (from messages):                               │
│ [UI] [design system] [components] [accessibility] [mobile] │
│                                                             │
│ Quick Actions:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [View All Messages in This Topic (23)]                  │ │
│ │ [Review Pending Proposals (2)]                          │ │
│ │ [Export Topic Data (JSON/CSV)]                          │ │
│ │ [Run Analysis on This Topic]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Що показуємо:**
- ✅ Card grid з preview (title, description, counts)
- ✅ Activity timestamps
- ✅ Export button на кожній card
- ✅ Detail view з tabs (Overview, Messages, Proposals, Atoms)
- ✅ Recent activity timeline
- ✅ Quick actions (contextual buttons)

**Що ховаємо:**
- ❌ AI confidence scores для topic classification
- ❌ Embedding similarity metrics
- ❌ Model usage stats

---

### Admin View (Calibration)

**Scenario:** Data scientist перевіряє чи правильно AI згрупував messages в topics.

```
┌─────────────────────────────────────────────────────────────┐
│ Task Tracker [ADMIN MODE]                      [👁️ Exit]    │
├─────────────────────────────────────────────────────────────┤
│ Global Admin Controls:                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Topic Extraction: [Auto ✓]  Min Messages: [3]          │ │
│ │ Embedding Model: [text-embedding-3-large ▼]            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🏷️ Topics [ADMIN MODE]         [+ New] [Export] [Validate] │
├─────────────────────────────────────────────────────────────┤
│ Filters: [All●] [Draft] [Approved] [Low Confidence ⚠️]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ 🎨 Product Design   │  │ 🔧 Backend API      │           │
│ │                     │  │    Optimization     │           │
│ │ UI/UX improvements  │  │                     │           │
│ │                     │  │ Performance work    │           │
│ │ 15 atoms, 23 msgs   │  │ 8 atoms, 12 msgs    │           │
│ │                     │  │                     │           │
│ │ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │           │
│ │ 🔍 AI Quality       │  │ 🔍 AI Quality       │           │
│ │ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │           │
│ │ Coherence: 92% ✅   │  │ Coherence: 78% ⚠️   │           │
│ │ Avg Confidence: 85% │  │ Avg Confidence: 67% │           │
│ │ Misclassified: 1/23 │  │ Misclassified: 3/12 │           │
│ │                     │  │                     │           │
│ │ [Inspect] [Export]  │  │ [Inspect] [Retrain] │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐           │
│ │ 📚 Documentation    │  │ 🔬 Research         │           │
│ │                     │  │                     │           │
│ │ 6 atoms, 9 msgs     │  │ 4 atoms, 5 msgs     │           │
│ │                     │  │                     │           │
│ │ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │           │
│ │ 🔍 AI Quality       │  │ 🔍 AI Quality       │           │
│ │ ━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━ │           │
│ │ Coherence: 88% ✅   │  │ Coherence: 45% ⚠️⚠️ │           │
│ │ Avg Confidence: 79% │  │ Avg Confidence: 38% │           │
│ │ Misclassified: 0/9  │  │ Misclassified: 2/5  │           │
│ │                     │  │                     │           │
│ │ [Inspect] [Export]  │  │ [Inspect] [Merge?]  │           │
│ └─────────────────────┘  └─────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Click "Backend API" [Inspect] → Admin Detail Modal:

┌─────────────────────────────────────────────────────────────┐
│ 🔍 Topic Diagnostics: Backend API Optimization              │
├─────────────────────────────────────────────────────────────┤
│ Quality Metrics:                                            │
│                                                             │
│ Overall Health: 78% ⚠️ (below 80% threshold)                │
│                                                             │
│ Coherence Analysis:                                         │
│ • Semantic similarity (avg): 0.78                           │
│ • Outlier messages: 3/12 (25%) ⚠️                           │
│   - MSG-3F2A: "Let's grab lunch tomorrow"                   │
│     Similarity: 0.23 (очевидна помилка!)                    │
│   - MSG-7B1C: "API rate limiting discussion"                │
│     Similarity: 0.61 (граничний випадок)                    │
│   - MSG-9D4E: "Database indexing strategy"                  │
│     Similarity: 0.58 (можливо окремий topic?)               │
│                                                             │
│ Topic Assignment Confidence:                                │
│ • High confidence (>80%): 6 messages ✅                      │
│ • Medium confidence (60-80%): 3 messages ⚠️                 │
│ • Low confidence (<60%): 3 messages ❌                       │
│                                                             │
│ Embedding Model: text-embedding-3-large                     │
│ Vector Dimensions: 1536                                     │
│                                                             │
│ Suggested Actions:                                          │
│ 1. Remove MSG-3F2A (clearly misclassified)                  │
│ 2. Consider splitting "Database" → separate topic           │
│ 3. Reprocess low-confidence messages with updated prompt    │
│                                                             │
│ [View All Messages] [Remove Outliers] [Retrain Embeddings] │
│ [Export with Confidence Scores]                             │
└─────────────────────────────────────────────────────────────┘
```

**Додаткові елементи в Admin View:**

1. **Global Topic Controls**
   - Auto-topic extraction toggle
   - Min messages threshold (3 = мінімум для створення topic)
   - Embedding model selector

2. **Per-Topic Quality Panel**
   - Coherence score (як добре messages згруповані)
   - Avg confidence (середня впевненість AI у assignment)
   - Misclassified count (outliers)

3. **Inspect Modal (detailed diagnostics)**
   - Semantic similarity scores
   - Outlier messages з reasons
   - Confidence distribution
   - Embedding model info
   - Actionable suggestions (remove, split, reprocess)

**Use Case в Admin Mode:**

**UC: Виявлення misclassified messages**
```
User бачить: "Backend API" має coherence 78% (low)
→ Click [Inspect]
→ Modal shows: 3 outliers
→ MSG-3F2A "Let's grab lunch" - similarity 0.23 (очевидна помилка)
→ Action: [Remove from Topic]
→ Rerun coherence calculation
→ New coherence: 89% ✅ (problem solved)
```

---

## Analysis Page

### User View (Consumer)

**Scenario:** Користувач хоче bulk approve 12 pending proposals.

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Analysis                            [+ New Run] [Export]  │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Proposals●] [Runs] [Configuration]                   │
├─────────────────────────────────────────────────────────────┤
│ Pending Proposals (12):                                     │
│ [☐ Select All]   [Bulk Approve ✅] [Bulk Reject ❌]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💡 "Implement dark mode toggle"                    │   │
│ │                                                       │   │
│ │ From: RUN-D4BF • 2 hours ago                         │   │
│ │ Confidence: 85% (High)                               │   │
│ │                                                       │   │
│ │ Context: Extracted from 5 messages in Product Design │   │
│ │ 🏷️ Product Design                                     │   │
│ │                                                       │   │
│ │ Preview:                                              │   │
│ │ "Add dark mode toggle to application settings.       │   │
│ │ User preference should persist across sessions."     │   │
│ │                                                       │   │
│ │ [✓ Approve] [✗ Reject] [View Details]               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💡 "Create API rate limiting middleware"          │   │
│ │                                                       │   │
│ │ From: RUN-D4BF • 2 hours ago                         │   │
│ │ Confidence: 72% (Medium)                             │   │
│ │                                                       │   │
│ │ Context: Extracted from 3 messages in Backend API    │   │
│ │ 🏷️ Backend API                                        │   │
│ │                                                       │   │
│ │ Preview:                                              │   │
│ │ "Implement rate limiting for public API endpoints.   │   │
│ │ Suggested: 100 req/min per user, 1000 req/hr burst." │   │
│ │                                                       │   │
│ │ [✓ Approve] [✗ Reject] [View Details]               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [...10 more proposals...]                                   │
│                                                             │
│ [Show Approved (15)] [Show Rejected (3)]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Bulk Actions Bar (коли є selection):
┌─────────────────────────────────────────────────────────────┐
│ 5 selected   [✓ Approve All] [✗ Reject All] [Export]  [✕]  │
└─────────────────────────────────────────────────────────────┘
```

**Що показуємо:**
- ✅ Proposal cards (title, source run, confidence, context)
- ✅ Bulk select + actions
- ✅ Quick approve/reject buttons
- ✅ Filters (pending/approved/rejected)

**Що ховаємо:**
- ❌ LLM prompt used для extraction
- ❌ Token usage per proposal
- ❌ Alternative proposals (не selected by AI)

---

### Admin View (Calibration)

**Scenario:** Data scientist налаштовує extraction prompts, бачить чому AI запропонував саме це.

```
┌─────────────────────────────────────────────────────────────┐
│ Task Tracker [ADMIN MODE]                      [👁️ Exit]    │
├─────────────────────────────────────────────────────────────┤
│ Global Admin Controls:                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Extraction Model: [gpt-4o ▼]   Min Confidence: [70%]   │ │
│ │ Debug: [✓] Show Reasoning  [✓] Show Alternatives       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🤖 Analysis [ADMIN MODE]               [+ New] [Experiments]│
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Proposals●] [Runs] [Calibration] [Configuration]     │
├─────────────────────────────────────────────────────────────┤
│ Pending Proposals (12):                                     │
│ [☐ Select All]   [Bulk: Approve | Reject | Reprocess]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💡 "Implement dark mode toggle"                    │   │
│ │                                                       │   │
│ │ From: RUN-D4BF • 2 hours ago                         │   │
│ │ Confidence: 85% (High)                               │   │
│ │ 🏷️ Product Design                                     │   │
│ │                                                       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ 🔍 EXTRACTION DIAGNOSTICS                            │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │                                                       │   │
│ │ Model: gpt-4o • Tokens: 850→320                      │   │
│ │ Source Messages: 5 (from Product Design topic)       │   │
│ │                                                       │   │
│ │ Reasoning:                                            │   │
│ │ "Pattern detected across 5 messages: repeated        │   │
│ │ mentions of 'dark mode', 'theme switching', and      │   │
│ │ 'user preferences'. 3 messages explicitly request    │   │
│ │ feature. 2 messages discuss implementation. High     │   │
│ │ consensus suggests actionable item."                 │   │
│ │                                                       │   │
│ │ Confidence Factors:                                   │   │
│ │ • Message count: 5/5 ✅ (threshold: 3)               │   │
│ │ • Keyword frequency: 12 mentions ✅                  │   │
│ │ • Consensus: 80% positive ✅                         │   │
│ │ • Timeframe: 3 days (recent) ✅                      │   │
│ │ → Overall: 85%                                       │   │
│ │                                                       │   │
│ │ Alternative Proposals (rejected):                     │   │
│ │ • "Add light mode toggle" (confidence: 35%)          │   │
│ │   Reason: redundant with dark mode                   │   │
│ │ • "Theme customization system" (confidence: 58%)     │   │
│ │   Reason: too broad, not actionable                  │   │
│ │                                                       │   │
│ │ Source Messages (preview):                            │   │
│ │ • MSG-3A2F: "We really need dark mode!"              │   │
│ │ • MSG-7B1D: "Dark mode for accessibility..."         │   │
│ │ • MSG-9C4E: "Toggle in settings, persist to DB"      │   │
│ │ [View All 5 Messages]                                │   │
│ │                                                       │   │
│ │ [View Full Prompt] [Reprocess] [Compare with claude] │   │
│ │ [✓ Approve] [✗ Reject]                               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ☐  💡 "Create API rate limiting middleware"          │   │
│ │                                                       │   │
│ │ From: RUN-D4BF • 2 hours ago                         │   │
│ │ Confidence: 72% (Medium ⚠️)                           │   │
│ │ 🏷️ Backend API                                        │   │
│ │                                                       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ 🔍 EXTRACTION DIAGNOSTICS                            │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │                                                       │   │
│ │ Model: gpt-4o • Tokens: 720→280                      │   │
│ │ Source Messages: 3 (from Backend API topic)          │   │
│ │                                                       │   │
│ │ Reasoning:                                            │   │
│ │ "Rate limiting mentioned in 3 messages, but context  │   │
│ │ unclear. 1 message discusses implementation, 2       │   │
│ │ mention problem. No specific requirements. Medium    │   │
│ │ confidence due to vague scope."                      │   │
│ │                                                       │   │
│ │ Confidence Factors:                                   │   │
│ │ • Message count: 3/3 ✅ (threshold: 3)               │   │
│ │ • Keyword frequency: 5 mentions ⚠️ (low)             │   │
│ │ • Consensus: 60% ⚠️ (unclear agreement)              │   │
│ │ • Specificity: 40% ❌ (too vague)                    │   │
│ │ → Overall: 72%                                       │   │
│ │                                                       │   │
│ │ ⚠️ Quality Issues:                                    │   │
│ │ • Vague wording ("middleware" not specified)         │   │
│ │ • Missing requirements (what limits? per what?)      │   │
│ │ • Low message count (3 = minimum threshold)          │   │
│ │                                                       │   │
│ │ Suggested Actions:                                    │   │
│ │ • Reject and wait for more context messages          │   │
│ │ • Manually refine wording before approval            │   │
│ │                                                       │   │
│ │ [View Prompt] [Reprocess] [Manual Edit] [Reject]    │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

NEW TAB: Calibration (Admin-only)
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Analysis > Calibration                                   │
├─────────────────────────────────────────────────────────────┤
│ Extraction Quality Metrics (Last 30 days):                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Approval Rate: 68% (approved / total proposals)         │ │
│ │ Target: ≥80% (system needs tuning ⚠️)                    │ │
│ │                                                         │ │
│ │ Avg Confidence: 74% (medium)                            │ │
│ │ High Confidence (>80%): 35% of proposals                │ │
│ │ Medium (60-80%): 48%                                    │ │
│ │ Low (<60%): 17% ⚠️                                       │ │
│ │                                                         │ │
│ │ False Positives: 12% (approved but user rejected)       │ │
│ │ False Negatives: 8% (rejected but should be approved)   │ │
│ │                                                         │ │
│ │ Avg Messages per Proposal: 4.2 (healthy ✅)             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Prompt Experiments:                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Active: "Extraction Prompt v3 vs v4"                    │ │
│ │ Status: Running (7 days, 50% traffic split)            │ │
│ │                                                         │ │
│ │ Results:                                                │ │
│ │ • v3 (control): 68% approval, 74% avg confidence       │ │
│ │ • v4 (treatment): 79% approval ✅, 82% avg confidence  │ │
│ │                                                         │ │
│ │ Sample Size: 60 proposals each                          │ │
│ │ Statistical Significance: p < 0.05 ✅                   │ │
│ │                                                         │ │
│ │ Diff Highlights (v4 improvements):                      │ │
│ │ + "Focus on actionable items with clear scope"         │ │
│ │ + "Require minimum 3 supporting messages"              │ │
│ │ + "Reject vague or too-broad suggestions"              │ │
│ │                                                         │ │
│ │ [View Full Diff] [Compare Results] [Promote v4 ✅]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Threshold Tuning:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Min Confidence for Visibility: 70% ────●────           │ │
│ │                                         ↑               │ │
│ │                                  (current: 70%)         │ │
│ │                                                         │ │
│ │ Impact Preview (if change to 75%):                      │ │
│ │ • 18% fewer proposals shown (-12 proposals/month)       │ │
│ │ • 8% higher approval rate (projected)                   │ │
│ │ • 2 high-value proposals might be hidden ⚠️             │ │
│ │                                                         │ │
│ │ [Simulate on Sample] [Apply Change]                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Додаткові елементи в Admin View:**

1. **Extraction Diagnostics Panel (per proposal)**
   - Model info + token usage
   - Source messages count + preview
   - Reasoning text (чому AI обрав це)
   - Confidence factors breakdown (4 components)
   - Alternative proposals (rejected варіанти)
   - Quality issues (flags: vague, too broad, etc.)

2. **Calibration Tab (Admin-only)**
   - Quality metrics dashboard (approval rate, confidence distribution)
   - Prompt experiments (A/B testing results)
   - Threshold tuning (slider + impact preview)
   - Statistical significance indicators

**Use Case в Admin Mode:**

**UC: Підвищення якості proposals через prompt experiment**
```
User бачить: Approval rate 68% (target: 80%)
→ Переходить на Calibration tab
→ Створює experiment: v3 (current) vs v4 (with stricter scope check)
→ Runs 7 days, 50/50 traffic split
→ Results: v4 shows 79% approval (+11%) ✅
→ Stat significance: p < 0.05 (valid result)
→ Action: [Promote v4] → default prompt
→ Next month: approval rate 80% ✅ (success)
```

---

## Dashboard

### User View (Consumer)

**Scenario:** Користувач заходить перший раз за 3 дні. Хоче швидко побачити що назбиралось.

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Dashboard                           [Export] [Settings]  │
├─────────────────────────────────────────────────────────────┤
│ Activity Summary (Last 7 days):                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📨 47 new messages          → [View Recent Messages]    │ │
│ │ 💡 12 pending proposals     → [Review Proposals]        │ │
│ │ 🏷️  3 topics updated         → [Browse Topics]          │ │
│ │ 🤖 2 analysis runs completed → [View Run Results]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Quick Views (shortcuts to filtered data):                   │
│                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                 │
│ │ 🔥 High Priority │  │ 🏷️ Needs Topic   │                 │
│ │                  │  │                  │                 │
│ │ 18 messages      │  │ 23 messages      │                 │
│ │ (score ≥ 8)      │  │ (unassigned)     │                 │
│ │                  │  │                  │                 │
│ │ [View →]         │  │ [Assign →]       │                 │
│ └──────────────────┘  └──────────────────┘                 │
│                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                 │
│ │ 📅 Last 7 Days   │  │ 💡 Pending       │                 │
│ │                  │  │    Proposals     │                 │
│ │ 47 messages      │  │                  │                 │
│ │ (all activity)   │  │ 12 items         │                 │
│ │                  │  │ (need review)    │                 │
│ │ [Browse →]       │  │ [Review →]       │                 │
│ └──────────────────┘  └──────────────────┘                 │
│                                                             │
│ Recent Topics (active):                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Product Design          2h ago • 23 messages         │ │
│ │ 🔧 Backend API             1d ago • 12 messages         │ │
│ │ 📚 Documentation           3d ago • 9 messages          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Export Recent Data (JSON/CSV)] [API Documentation]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Що показуємо:**
- ✅ Activity summary (counts за period)
- ✅ Quick view shortcuts (pre-filtered links)
- ✅ Recent topics list
- ✅ Export buttons

**Що ховаємо:**
- ❌ LLM performance metrics (accuracy, token usage)
- ❌ System health indicators
- ❌ Calibration controls

---

### Admin View (Diagnostics + Calibration)

**Scenario:** Data scientist перевіряє чи система працює стабільно після зміни prompts.

```
┌─────────────────────────────────────────────────────────────┐
│ Task Tracker [ADMIN MODE]                      [👁️ Exit]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔧 Admin Panel                         [← Back to Dashboard]│
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Diagnostics●] [Calibration] [System Health]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ LLM Performance (Last 24 hours):                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Classification Accuracy:  87% ↑+2%                      │ │
│ │ (approved proposals / total)                            │ │
│ │                                                         │ │
│ │ Avg Confidence Score:     0.78                          │ │
│ │ High (>0.8): 42% • Medium (0.6-0.8): 51% • Low: 7%     │ │
│ │                                                         │ │
│ │ Token Usage:              45,000 tokens/day             │ │
│ │ • Prompts: 28K tokens                                   │ │
│ │ • Completions: 17K tokens                               │ │
│ │ • Cost: $1.35/day (GPT-4o pricing)                      │ │
│ │                                                         │ │
│ │ Failed Requests:          3 (0.5%)                      │ │
│ │ • Timeout: 2                                            │ │
│ │ • Rate limit: 1                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recent Prompt Changes:                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2h ago: Classification v2.3 → v2.4                      │ │
│ │ Change: "Add context about team structure"              │ │
│ │                                                         │ │
│ │ Impact:                                                 │ │
│ │ • Accuracy: +5% (82% → 87%) ✅                          │ │
│ │ • Avg confidence: +0.03 (0.75 → 0.78)                  │ │
│ │ • Token usage: -10% (50K → 45K) ✅                      │ │
│ │                                                         │ │
│ │ Sample Messages (before/after):                         │ │
│ │ • "Team sync at 3pm" - v2.3: uncertain (50%)            │ │
│ │                     - v2.4: meta/meeting (85%) ✅       │ │
│ │                                                         │ │
│ │ [View Full Diff] [Compare Results] [Rollback to v2.3]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Active Experiments:                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Experiment: "Topic Extraction v3 vs v4"                 │ │
│ │ Status: Running (Day 3/7) • 50% traffic split          │ │
│ │                                                         │ │
│ │ Preliminary Results:                                    │ │
│ │ • v3 (control): 85% accuracy, 120 proposals             │ │
│ │ • v4 (treatment): 89% accuracy ✅, 115 proposals        │ │
│ │                                                         │ │
│ │ Statistical Significance: Not yet (need 4 more days)    │ │
│ │ Sample Size: 120 proposals each (target: 200)          │ │
│ │                                                         │ │
│ │ [View Experiment Details] [Stop Early] [Extend 3 days] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Quick Actions:                                              │
│ [View Message Diagnostics] [Compare Models (gpt-4 vs claude)]│
│ [Tune Thresholds] [Export Debug Logs]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

CALIBRATION TAB:
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Admin Panel > Calibration                                │
├─────────────────────────────────────────────────────────────┤
│ Threshold Tuning:                                           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Noise Filter: Min Score for Message Visibility         │ │
│ │                                                         │ │
│ │ Current: 5.0 ────●─────────  (range: 0-10)             │ │
│ │                   ↑                                     │ │
│ │         Adjust: 5.0 → 6.0                               │ │
│ │                                                         │ │
│ │ Impact Prediction (if change to 6.0):                   │ │
│ │ • 23% fewer visible messages (-29 messages/week)        │ │
│ │ • +12% average relevance score                          │ │
│ │ • ⚠️ 3 potentially high-value messages hidden           │ │
│ │   (scores: 5.8, 5.5, 5.2 - borderline cases)           │ │
│ │                                                         │ │
│ │ Historical Data (when threshold was 6.0):               │ │
│ │ • User manually approved 2/10 hidden messages           │ │
│ │ • Suggests 6.0 might be too aggressive                  │ │
│ │                                                         │ │
│ │ [Simulate on Sample (50 messages)] [Apply Change]      │ │
│ │ [View Borderline Cases]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Model Comparison:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Select Messages: [Last 20 ▼] [High Priority ▼]         │ │
│ │ Compare Models: [gpt-4o ▼] vs [claude-3-opus ▼]        │ │
│ │                                                         │ │
│ │ [Run Comparison] ← reprocess через обидві моделі        │ │
│ │                                                         │ │
│ │ Results (after comparison):                             │ │
│ │                                                         │ │
│ │ Metrics:                                                │ │
│ │ • GPT-4o: avg confidence 0.78, score variance ±2.1     │ │
│ │ • Claude-3: avg confidence 0.82 ✅, variance ±1.3 ✅   │ │
│ │                                                         │ │
│ │ Agreement Rate: 85% (both models same classification)   │ │
│ │ Disagreements: 3 messages (15%)                         │ │
│ │ • MSG-2A3F: GPT=work/api, Claude=work/db (close)       │ │
│ │ • MSG-7B1C: GPT=noise, Claude=meta/process (interesting)│ │
│ │                                                         │ │
│ │ Recommendation: Claude-3 more consistent, consider      │ │
│ │ switching default model.                                │ │
│ │                                                         │ │
│ │ [View Side-by-Side] [Export Comparison] [Switch Model] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SYSTEM HEALTH TAB:
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Admin Panel > System Health                              │
├─────────────────────────────────────────────────────────────┤
│ Performance Metrics:                                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ API Response Time (avg):    245ms ✅                    │ │
│ │ • p50: 180ms  • p95: 420ms  • p99: 850ms               │ │
│ │                                                         │ │
│ │ Database Query Time:        85ms ✅                     │ │
│ │ • Slow queries (>500ms): 2 (view details)              │ │
│ │                                                         │ │
│ │ WebSocket Connections:      3 active                    │ │
│ │ • Messages sent (24h): 1,250                            │ │
│ │ • Latency: 12ms avg ✅                                  │ │
│ │                                                         │ │
│ │ Background Tasks (TaskIQ):                              │ │
│ │ • Queue size: 0 (empty ✅)                              │ │
│ │ • Completed (24h): 47 tasks                             │ │
│ │ • Failed: 1 (retry successful)                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Error Log (Last 24h):                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2h ago: LLM timeout (OpenAI API slow response)          │ │
│ │ 5h ago: Rate limit hit (resolved with retry)            │ │
│ │ 8h ago: WebSocket disconnect (client reconnected)       │ │
│ │ [View Full Logs]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Database Status:                                            │
│ • Size: 1.2 GB                                              │
│ • Tables: messages (125 rows), topics (5), proposals (30)   │
│ • pgvector index: healthy ✅                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Додаткові елементи в Admin View:**

1. **Diagnostics Tab**
   - LLM performance metrics (accuracy, confidence, tokens, cost)
   - Recent prompt changes з impact analysis
   - Active experiments status
   - Quick action buttons

2. **Calibration Tab**
   - Threshold tuning (slider + impact preview)
   - Model comparison tool (side-by-side reprocessing)
   - Historical data insights

3. **System Health Tab**
   - Performance metrics (API, DB, WebSocket)
   - Error logs (recent failures)
   - Background tasks status
   - Database stats

---

## Admin Panel Components Library

### Global Controls (Header/Top Bar)

#### Component 1: Admin Mode Toggle
```
Location: Bottom-left corner (fixed position)
States:
  • Default: [⚙️ Admin] (grey button)
  • Hover: [⚙️ Admin] (blue border)
  • Active (Admin Mode): Top-right [👁️ Exit Admin] (blue button)

Keyboard: Cmd+Shift+A (toggle)

Implementation:
  const [adminMode, setAdminMode] = useState(
    localStorage.getItem('admin_mode') === 'true'
  );
```

#### Component 2: LLM Model Selector
```
┌─────────────────────────┐
│ LLM: [gpt-4o        ▼] │
│ Options:                │
│ • gpt-4o (current) ✅   │
│ • claude-3-opus         │
│ • claude-3-sonnet       │
│ • ollama/llama3         │
└─────────────────────────┘

Location: Admin Panel header (global control)
Effect: Changes default model для всіх LLM operations
```

#### Component 3: Threshold Slider
```
Noise Filter: 5.0 ────●─────────  (0-10)
                      ↑ current

Interaction:
  • Drag slider
  • Shows impact preview (realtime)
  • [Apply] button після зміни
```

#### Component 4: Debug Toggles
```
Debug Mode:
[✓] Show Reasoning
[✓] Show Confidence
[ ] Show Token Usage
[ ] Show Timing

Implementation: Feature flags (localStorage)
```

---

### Per-Item Diagnostics (Message/Topic/Proposal Cards)

#### Component 5: Inspect Button
```
[🔍 Inspect] ← з'являється тільки в Admin Mode

Click → Opens modal з full diagnostics
```

#### Component 6: AI Diagnostics Panel (Message Card)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 AI DIAGNOSTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Model: gpt-4o (OpenAI) • Tokens: 250→150
Confidence: 87% (High ✅)

Reasoning:
"[LLM explanation text]"

Score Breakdown:
• Urgency: 9/10
• Relevance: 8/10
• Actionability: 9/10
→ Final: 8.7 → 9/10

Topic Assignment (alternatives):
• Product Design (85%) ✅
• Backend API (67%)
• Performance (54%)

[View Full Prompt] [Reprocess] [Compare Models]

Implementation:
  • Collapsible panel (default: collapsed)
  • Feature flag: SHOW_DIAGNOSTICS
  • Data source: message.llm_metadata (JSONB field)
```

#### Component 7: Confidence Badge
```
User View:  🔴 Score: 9     (just colored badge)
Admin View: 🔴 Score: 9 (87% conf) ← додатковий текст

Colors:
  • 🔴 Red: 8-10 (high priority)
  • 🟡 Yellow: 5-7 (medium)
  • 🟢 Green: 3-4 (low)
  • ⚪ Grey: 0-2 (noise)
```

#### Component 8: Topic Quality Panel (Topic Card)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 AI Quality
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coherence: 92% ✅
Avg Confidence: 85%
Misclassified: 1/23

[Inspect] [Retrain]

Appears: Admin Mode only
Data: Computed from embeddings (pgvector similarity)
```

---

### Admin-Only Sections (Pages/Modals)

#### Section 1: Admin Panel (Separate Route)
```
Route: /admin або toggle overlay
Layout: Full-page з tabs (Diagnostics, Calibration, System)
Access: Keyboard Cmd+Shift+A або bottom-left button
```

#### Section 2: Diagnostics Dashboard
```
Content:
  • LLM performance metrics (charts)
  • Recent prompt changes (timeline)
  • Active experiments (status cards)
  • Quick actions (buttons)

Updates: Real-time (WebSocket або polling every 30s)
```

#### Section 3: Calibration Tools
```
Tabs within Admin Panel:
  1. Threshold Tuning (sliders + preview)
  2. Model Comparison (side-by-side results)
  3. Prompt Experiments (A/B testing UI)
```

#### Section 4: Message Inspect Modal
```
Trigger: Click [🔍 Inspect] on message card
Layout: Modal overlay (60% screen width)
Content:
  • Full LLM reasoning
  • Confidence breakdown (visual bars)
  • Topic alternatives table
  • Source prompt (expandable code block)
  • Actions: Reprocess, Compare, Manual Override

Close: Escape key або [✕] button
```

#### Section 5: Comparison View (Model Side-by-Side)
```
Trigger: Admin Panel > Calibration > Model Comparison > [Run]
Layout: Split screen (50/50)

Left: GPT-4o Results          Right: Claude-3 Results
┌─────────────────────────┐   ┌─────────────────────────┐
│ Message 1               │   │ Message 1               │
│ Classification: work/api│   │ Classification: work/db │
│ Confidence: 78%         │   │ Confidence: 82%         │
│ Reasoning: [...]        │   │ Reasoning: [...]        │
└─────────────────────────┘   └─────────────────────────┘

Highlight differences: Color-coded (red=disagree, green=agree)
```

#### Section 6: Experiment Results (A/B Testing)
```
Layout: Table з metrics

Experiment: "Classification v3 vs v4"
┌──────────┬──────────┬─────────────┬────────────┐
│ Variant  │ Accuracy │ Avg Conf    │ Sample     │
├──────────┼──────────┼─────────────┼────────────┤
│ v3       │ 68%      │ 0.74        │ 60 msgs    │
│ v4 ✅    │ 79% ↑    │ 0.82 ↑      │ 60 msgs    │
└──────────┴──────────┴─────────────┴────────────┘

Statistical Significance: p < 0.05 ✅
[View Diff] [Promote v4]
```

---

## Implementation Notes

### Технічна реалізація Admin Toggle

#### Backend (Feature Flags)

**Database Schema:**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  admin_mode_enabled BOOLEAN DEFAULT false,
  show_diagnostics BOOLEAN DEFAULT false,
  show_confidence BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoint:**
```python
@router.patch("/api/user/preferences")
async def update_preferences(
    prefs: UserPreferencesUpdate,
    db: AsyncSession = Depends(get_db)
):
    # Update user preferences
    # Broadcast via WebSocket (real-time sync)
    pass
```

#### Frontend (React State)

**Feature Flag Hook:**
```typescript
// hooks/useAdminMode.ts
export const useAdminMode = () => {
  const [adminMode, setAdminMode] = useState(
    localStorage.getItem('admin_mode') === 'true'
  );

  const toggleAdminMode = () => {
    const newMode = !adminMode;
    setAdminMode(newMode);
    localStorage.setItem('admin_mode', String(newMode));
    // Broadcast to other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'admin_mode',
      newValue: String(newMode)
    }));
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        toggleAdminMode();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [adminMode]);

  return { adminMode, toggleAdminMode };
};
```

**Usage в компонентах:**
```typescript
// components/MessageCard.tsx
const MessageCard = ({ message }) => {
  const { adminMode } = useAdminMode();

  return (
    <Card>
      <CardHeader>{message.text}</CardHeader>
      {adminMode && (
        <AIDiagnosticsPanel
          reasoning={message.llm_metadata.reasoning}
          confidence={message.llm_metadata.confidence}
          scoreBreakdown={message.llm_metadata.score_breakdown}
        />
      )}
    </Card>
  );
};
```

#### CSS Classes (Tailwind)

**Admin Mode Indicator:**
```typescript
<div className={cn(
  "fixed bottom-4 left-4 z-50",
  adminMode && "animate-pulse"
)}>
  <Button
    variant={adminMode ? "default" : "outline"}
    onClick={toggleAdminMode}
  >
    {adminMode ? "👁️ Exit Admin" : "⚙️ Admin"}
  </Button>
</div>
```

**Diagnostics Panel (Collapsible):**
```typescript
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger className="flex items-center gap-2">
    🔍 AI Diagnostics
    <ChevronDown className="h-4 w-4" />
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 space-y-2 border-l-2 border-blue-500 pl-4">
    {/* Diagnostics content */}
  </CollapsibleContent>
</Collapsible>
```

---

### Data Storage для Diagnostics

**Message Model (Backend):**
```python
class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID, primary_key=True)
    text = Column(Text, nullable=False)
    importance_score = Column(Integer)  # 0-10

    # ✅ NEW: LLM metadata (JSONB для flexibility)
    llm_metadata = Column(JSONB, default={})
    # Structure:
    # {
    #   "model": "gpt-4o",
    #   "confidence": 0.87,
    #   "reasoning": "High urgency keywords...",
    #   "score_breakdown": {
    #     "urgency": 9,
    #     "relevance": 8,
    #     "actionability": 9
    #   },
    #   "topic_alternatives": [
    #     {"name": "Product Design", "confidence": 0.85},
    #     {"name": "Backend API", "confidence": 0.67}
    #   ],
    #   "prompt_version": "v2.4",
    #   "tokens": {"prompt": 250, "completion": 150},
    #   "processing_time_ms": 1200
    # }
```

**Storing LLM Response:**
```python
async def classify_message(message: Message):
    # Call LLM
    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[...],
        response_format=ClassificationResponse  # Pydantic model
    )

    # Store metadata
    message.llm_metadata = {
        "model": "gpt-4o",
        "confidence": response.confidence,
        "reasoning": response.reasoning,
        "score_breakdown": response.score_breakdown.dict(),
        "topic_alternatives": [
            {"name": t.name, "confidence": t.confidence}
            for t in response.topic_alternatives
        ],
        "prompt_version": CURRENT_PROMPT_VERSION,
        "tokens": {
            "prompt": response.usage.prompt_tokens,
            "completion": response.usage.completion_tokens
        },
        "processing_time_ms": elapsed_ms
    }

    await db.commit()
```

---

### Performance Considerations

#### 1. Diagnostics Data Size
**Problem:** JSONB metadata може бути великий (reasoning = 500+ chars)

**Solution:**
- Store full metadata только для last 30 days
- Older messages: compress або archive (remove reasoning, keep scores)
- Index: `CREATE INDEX idx_messages_metadata ON messages USING gin(llm_metadata);`

#### 2. Real-time Admin Panel Updates
**Problem:** Metrics dashboard потребує aggregation (slow queries)

**Solution:**
- Pre-compute metrics через background task (TaskIQ)
- Cache results (Redis, TTL=5min)
- Admin Panel polls cached data (не raw DB queries)

```python
@task(schedule=[{"cron": "*/5 * * * *"}])  # Every 5 minutes
async def compute_admin_metrics():
    metrics = {
        "accuracy": await compute_accuracy(),  # approved/total
        "avg_confidence": await compute_avg_confidence(),
        "token_usage": await compute_token_usage(),
        "failed_requests": await get_failed_requests_count()
    }
    await redis.set("admin:metrics", json.dumps(metrics), ex=300)  # 5min TTL
```

#### 3. Comparison Tool (Reprocessing)
**Problem:** Reprocess 20 messages через 2 models = 40 LLM calls (expensive!)

**Solution:**
- Limit: max 50 messages per comparison
- Show cost estimate BEFORE running ($X.XX)
- Cache comparison results (1 week)
- Async: background task, show progress bar

```typescript
const runComparison = async () => {
  setLoading(true);
  const taskId = await api.startComparison({ messageIds, models });

  // Poll for results
  const interval = setInterval(async () => {
    const status = await api.getComparisonStatus(taskId);
    setProgress(status.progress);  // 0-100%
    if (status.completed) {
      clearInterval(interval);
      setResults(status.results);
      setLoading(false);
    }
  }, 2000);
};
```

---

## Accessibility (WCAG 2.1 AA Compliance)

### Admin Mode Toggle

**Keyboard:**
- ✅ `Cmd+Shift+A` (global shortcut)
- ✅ `Tab` to focus button
- ✅ `Enter` or `Space` to activate

**Screen Reader:**
```html
<button
  aria-label="Toggle Admin Mode"
  aria-pressed={adminMode}
  onClick={toggleAdminMode}
>
  {adminMode ? "👁️ Exit Admin" : "⚙️ Admin"}
</button>
```

**Focus Indicator:**
```css
/* 3px blue outline (WCAG 2.1 AA) */
.admin-toggle:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}
```

---

### Diagnostics Panel (Collapsible)

**Keyboard:**
- ✅ `Tab` to focus trigger
- ✅ `Enter` or `Space` to expand/collapse
- ✅ `Tab` through content when expanded

**Screen Reader:**
```html
<Collapsible>
  <CollapsibleTrigger
    aria-expanded={isOpen}
    aria-controls="diagnostics-content"
  >
    🔍 AI Diagnostics
  </CollapsibleTrigger>
  <CollapsibleContent
    id="diagnostics-content"
    role="region"
    aria-label="AI classification diagnostics"
  >
    {/* Content */}
  </CollapsibleContent>
</Collapsible>
```

**Color Contrast:**
- ✅ Confidence badges: 4.5:1 ratio (text vs background)
- ✅ Score breakdown text: 16px, 4.5:1 contrast

---

### Admin Panel (Modal/Overlay)

**Keyboard:**
- ✅ `Escape` to close
- ✅ Focus trap (Tab циклується в межах modal)
- ✅ Focus restoration (повертається до toggle button після закриття)

**Screen Reader:**
```html
<Dialog
  open={adminMode}
  onOpenChange={setAdminMode}
  aria-labelledby="admin-panel-title"
>
  <DialogOverlay />
  <DialogContent>
    <DialogTitle id="admin-panel-title">Admin Panel</DialogTitle>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**Focus Management:**
```typescript
useEffect(() => {
  if (adminMode) {
    // Store previous focus
    previousFocus.current = document.activeElement;
    // Focus first interactive element in panel
    firstInteractive.current?.focus();
  } else {
    // Restore focus
    previousFocus.current?.focus();
  }
}, [adminMode]);
```

---

## Висновки

### Ключові відмінності Admin vs User View

| Елемент | User View | Admin View |
|---------|-----------|------------|
| **Messages Card** | Clean (sender, text, score badge, topic) | + AI Diagnostics Panel (reasoning, confidence breakdown, alternatives) |
| **Topics Card** | Stats (atoms, messages, updated) | + Quality Metrics (coherence, misclassified count) |
| **Proposals Card** | Title, confidence, actions | + Extraction Details (reasoning, alternatives, source messages) |
| **Dashboard** | Activity summary, quick views | + LLM Performance, Prompt Changes, Experiments |
| **Header** | Clean navigation | + Global Admin Controls (model selector, threshold slider) |
| **Actions** | Approve, Reject, Export | + Reprocess, Compare Models, View Prompt, Manual Override |

---

### Transition Strategy (Фаза 1 → Фаза 2)

**Week 1-12 (Calibration):**
- Admin Mode: ✅ Enabled by default
- User sees: Diagnostics everywhere
- Goal: Tune prompts, thresholds, models

**Week 13+ (Production):**
- Admin Mode: ⚠️ Prompted to disable
- Modal: "System is calibrated! Hide admin features?"
  - [Yes, hide] → `SHOW_DIAGNOSTICS = false`
  - [No, keep visible] → User stays in admin mode
- User sees: Clean consumer UI
- Admin Panel: Still accessible (Cmd+Shift+A або Settings toggle)

**Re-calibration:**
- User може re-enable Admin Mode anytime
- Settings > Advanced > [✓] Show Admin Panel
- Use case: System drift, new data source added

---

### Залишкові питання для валідації

1. **Чи достатньо diagnostics інформації?**
   - Що ще потрібно бачити в Inspect modal?
   - Чи reasoning text достатньо зрозумілий?

2. **Чи зручний Admin Toggle?**
   - Keyboard shortcut Cmd+Shift+A - чи інтуїтивний?
   - Чи bottom-left position - чи не заважає?

3. **Чи Comparison Tool корисний?**
   - Side-by-side models - чи потрібен?
   - Чи варто показувати cost estimate перед reprocess?

4. **Чи Calibration Tab має все необхідне?**
   - Threshold tuning - чи достатньо слайдера?
   - Experiments UI - чи зрозуміла статистика?

5. **Transition Flow:**
   - Коли показувати "graduation prompt"? (після скількох успішних днів?)
   - Чи потрібен onboarding wizard для Фази 1?

---

**Наступний крок:** Показати ці wireframes користувачу, отримати feedback, ітерувати дизайн.

**Готовність до імплементації:** 90% (потребує валідації use cases)
