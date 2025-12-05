# REF-003: Project Management Dashboard - Dark Mode UI

**Джерело:** [Dribbble](https://dribbble.com/shots/25797837-Project-Management-Dashboard-Dark-Mode-UI)
**Автор:** Hmza - UI/UX Designer

![REF-003 Project Management Dashboard](../screenshots/REF-003-project-management-dashboard.png)

## Що подобається

- [x] **Kanban board** — чіткі колонки (To-Do, On Progress, In Review, Completed)
- [x] **Metric cards** — великі числа + sparkline графіки + тренд (↑12.54%)
- [x] **Updates panel** — real-time activity feed справа
- [x] **View switcher** — Blocks / Lists / Table / Docs
- [x] **Task cards** — date, priority badge, avatars, comments count
- [x] **Schedule timeline** — інтеграція з calendar
- [x] **Dark professional theme** — елегантний без надмірного glow

## Ключові елементи

### Кольори
| Роль | Колір | Застосування |
|------|-------|--------------|
| Background | `#030304` | Основний фон (deep black) |
| Card surface | `#0D1117` | Картки, панелі |
| Card hover | `#161B22` | Hover state |
| Accent primary | `#4C669B` | Синій, кнопки, links |
| Accent secondary | `#B88F4A` | Золотий/amber, warnings |
| Text primary | `#C7D1DD` | Основний текст |
| Text highlight | `#A1C2E9` | Акцентний текст, numbers |
| Border subtle | `#3C4B62` | Borders, dividers |

### Layout структура
```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar │  Header (Search + View Switcher + Filter + Date) │
│  (icons) ├──────────────────────────────────────────────────┤
│          │  Metric Cards Row (4 cards)                      │
│          ├────────────────────────────────┬─────────────────┤
│          │  Project Info + Kanban Board   │  Updates Panel  │
│          │  (To-Do → Progress → Review →  │  (Activity Feed)│
│          │   Completed)                   │                 │
│          ├────────────────────────────────┼─────────────────┤
│          │  Schedule Meetings (Timeline)  │  App Integration│
└──────────┴────────────────────────────────┴─────────────────┘
```

### Компоненти

| Компонент | Опис | Релевантність для Pulse Radar |
|-----------|------|-------------------------------|
| **Metric Card** | Number + sparkline + trend badge | 🔥 Dashboard metrics |
| **Kanban Column** | Header + count + cards list | 🔥 Atom statuses flow |
| **Task Card** | Date + priority + title + avatars | 🔥 Message/Atom cards |
| **Activity Item** | Icon + text + timestamp | 🔥 WebSocket notifications |
| **View Switcher** | Toggle buttons group | 🔥 Table/Card view toggle |
| **Timeline** | Horizontal calendar with events | Medium - Automation jobs |
| **Priority Badge** | High/Medium/Low indicator | 🔥 Importance score |

### Task Card anatomy
```
┌─────────────────────────────────┐
│  [Jan 4, 2025]     [High] 🔴   │  ← Date + Priority
├─────────────────────────────────┤
│  Finalize Project Scope         │  ← Title (bold)
│  Document                       │
│                                 │
│  Complete the final draft of    │  ← Description (muted)
│  the scope document...          │
├─────────────────────────────────┤
│  👤👤👤  💬4  📎8               │  ← Avatars + Meta
└─────────────────────────────────┘
```

### View Switcher (tabs)
```
[ Blocks ]  [ Lists ]  [ Table ]  [ Docs ]
    ↑
  active (filled background)
```

## Пряме застосування в Pulse Radar

### 1. Dashboard Metrics (🔥 High Priority)
| Референс | Pulse Radar |
|----------|-------------|
| Total Projects: 24 | Messages Today |
| Total Completed: 48 | Atoms Extracted |
| Total Upcoming: 9 | Pending Reviews |
| Total Overdue: 13 | Failed Tasks |

**Sparkline + Trend:** `↑12.54%` — показує динаміку

### 2. Atom Status Flow (🔥 High Priority)
```
Kanban → Atom Workflow:
─────────────────────────────────────────
To-Do        → DRAFT
On Progress  → PENDING_REVIEW
In Review    → (reviewing)
Completed    → APPROVED / REJECTED
```

### 3. Activity Feed → WebSocket Notifications
```
Updates Panel структура:
─────────────────────────────────────────
✅ Tsk Completed                   12:00
   John marked 'Resolve Bug in
   Payment Integration Module' as completed.

💬 New Comment                     12:00
   Sarah commented on 'Finalize
   Project Scope Document'

📋 Task Reassigned                 12:00
   Emily reassigned 'Prepare Mockups
   for Client Presentation'
```

**Mapping для Pulse Radar:**
- ✅ Atom approved
- 💬 New message extracted
- 📋 Topic updated
- ⚠️ Analysis failed

### 4. View Switcher
```tsx
// Pulse Radar implementation
<ToggleGroup type="single" value={view}>
  <ToggleGroupItem value="cards">Cards</ToggleGroupItem>
  <ToggleGroupItem value="table">Table</ToggleGroupItem>
  <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
</ToggleGroup>
```

### 5. Message/Atom Card Design
```tsx
// Based on Task Card anatomy
<Card>
  <CardHeader className="flex justify-between">
    <Badge variant="outline">{formatDate(date)}</Badge>
    <ImportanceBadge score={0.85} /> {/* High/Medium/Low */}
  </CardHeader>
  <CardContent>
    <h4 className="font-semibold">{title}</h4>
    <p className="text-muted-foreground text-sm">{preview}</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <AvatarGroup users={assignees} />
    <div className="flex gap-2 text-muted-foreground">
      <span>💬 {commentsCount}</span>
      <span>🔗 {atomsCount}</span>
    </div>
  </CardFooter>
</Card>
```

## Порівняння з іншими референсами

| Аспект | REF-001 (Fitness) | REF-002 (Crypto) | REF-003 (PM) |
|--------|-------------------|------------------|--------------|
| Фон | `#0D0D0D` | `#050402` | `#030304` |
| Стиль | Minimal, clean | Futuristic, glow | Professional, structured |
| Акцент | Green | Orange | Blue + Gold |
| Layout | Dashboard cards | Portfolio focus | Kanban + panels |
| **Релевантність** | Medium | Medium | 🔥 **High** |

## Що НЕ копіювати

- Project-specific terminology (Projects → Topics/Atoms)
- Google Calendar integration (поки що)
- Занадто багато панелей одночасно (cognitive overload)

## Нотатки

**Чому цей референс найбільш релевантний:**
1. **Kanban** = природний mapping на Atom workflow (Draft → Approved)
2. **Activity feed** = наші WebSocket notifications
3. **Metric cards** = Dashboard KPIs
4. **Task cards** = Message/Atom cards
5. **View switcher** = вже є потреба на Messages/Topics pages

**Ідеї для реалізації:**
1. Додати Kanban view для Atoms page
2. Покращити Activity feed в sidebar
3. Metric cards зі sparklines на Dashboard
4. Priority badges на Message cards

## Action Items

- [ ] Створити `KanbanBoard` компонент для Atoms
- [ ] Додати sparkline графіки в `MetricCard`
- [ ] Покращити `ActivityFeed` компонент
- [ ] Додати `ViewSwitcher` (Cards/Table/Kanban)
- [ ] Оновити `MessageCard` з priority badge
