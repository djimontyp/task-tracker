# Dashboard

## Мета

CEO/PM за **30 секунд** розуміє "що важливого сьогодні/цього тижня".

## Цільова аудиторія

| Роль | Потреба |
|------|---------|
| CEO | "Покажи головне, без деталей" |
| PM | "Що потребує моєї уваги?" |

---

## Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ROW 1: METRICS (grid-cols-2 mobile, grid-cols-4 desktop)                      │
│                                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ [!] Критичне    │ │ [*] Ідеї        │ │ [v] Рішення     │ │ [?] Питання   │ │
│  │       3         │ │       7         │ │      12         │ │      5        │ │
│  │  +2 vs вчора    │ │  +5 тижня       │ │  +3 тижня       │ │  відкритих    │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘ │
│                                                                                │
│  ROW 2: TRENDS                                                                 │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ [^] Тренди тижня                                                         │  │
│  │                                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 1  API інтеграція                        15 згадувань         +8   │  │  │
│  │  └────────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 2  Клієнт X        [! 2 проблеми]         8 згадувань         +2   │  │  │
│  │  └────────────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 3  Деплой п'ятниця                        6 згадувань          0   │  │  │
│  │  └────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                          │  │
│  │  [Показати всі тренди ->]                                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ROW 3: RECENT INSIGHTS (Timeline)                                             │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ [*] Останні важливі                                             [Всі >]  │  │
│  │                                                                          │  │
│  │     (!)───┬────────────────────────────────────────────────────────┐     │  │
│  │     red   │ ПРОБЛЕМА                                      14:32    │     │  │
│  │     dot   │ Баг авторизації на проді                               │     │  │
│  │      |    │ Користувачі не можуть залогінитись...                  │     │  │
│  │      |    │ # Mobile App Development                               │     │  │
│  │      |    └────────────────────────────────────────────────────────┘     │  │
│  │      |                                                                   │  │
│  │     (*)───┬────────────────────────────────────────────────────────┐     │  │
│  │     yel   │ ІДЕЯ                                          вчора    │     │  │
│  │     dot   │ Додати dark mode в налаштування                        │     │  │
│  │      |    │ Багато користувачів просять темну тему...              │     │  │
│  │      |    │ # UI/UX                                                │     │  │
│  │      |    └────────────────────────────────────────────────────────┘     │  │
│  │      |                                                                   │  │
│  │     (v)───┬────────────────────────────────────────────────────────┐     │  │
│  │     grn   │ РІШЕННЯ                                       2 дні    │     │  │
│  │     dot   │ Використовуємо PostgreSQL замість MongoDB              │     │  │
│  │      :    │ # Backend API                                          │     │  │
│  │           └────────────────────────────────────────────────────────┘     │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ROW 4: ACTIVITY + TOPICS (2 cols on desktop)                                  │
│                                                                                │
│  ┌───────────────────────────────────┐ ┌───────────────────────────────────┐  │
│  │ Активність (7 днів)               │ │ [#] Топ топіки                    │  │
│  │                                   │ │                                   │  │
│  │ ┌───────────────────────────────┐ │ │ ┌─────────────────────────────┐   │  │
│  │ │ Mo Tu We Th Fr Sa Su          │ │ │ │ (o) 1  Mobile App Dev       │   │  │
│  │ │ ## ## ## ## ## ## ##          │ │ │ │     23 atoms * 45 msgs      │   │  │
│  │ │ ## ## ## ## ## ## ##          │ │ │ └─────────────────────────────┘   │  │
│  │ │ ## ## ## ## ## ## ##          │ │ │ ┌─────────────────────────────┐   │  │
│  │ │ ## ## ## ## ## ## ##          │ │ │ │ (o) 2  Backend API          │   │  │
│  │ └───────────────────────────────┘ │ │ │     18 atoms * 32 msgs      │   │  │
│  │                                   │ │ └─────────────────────────────┘   │  │
│  │ Пік: Вівторок 10:00               │ │ ┌─────────────────────────────┐   │  │
│  │ 127 повідомлень сьогодні          │ │ │ (o) 3  DevOps               │   │  │
│  │                                   │ │ │     12 atoms * 28 msgs      │   │  │
│  │                                   │ │ └─────────────────────────────┘   │  │
│  └───────────────────────────────────┘ └───────────────────────────────────┘  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

Legend:
  [!] = AlertTriangle (critical)    (!) = Problem dot (red)
  [*] = Lightbulb (idea)            (*) = Idea dot (yellow)
  [v] = CheckCircle (decision)      (v) = Decision dot (green)
  [?] = HelpCircle (question)       (o) = Topic colored circle
  [^] = TrendingUp                  [#] = Trophy
```

---

## Компоненти

### 1. DashboardMetrics (4 MetricCards)

Показує 4 ключові метрики у grid (2x2 mobile, 4 cols desktop).

```tsx
interface DashboardMetricsData {
  critical:  { count: number; delta: number };
  ideas:     { count: number; delta: number };
  decisions: { count: number; delta: number };
  questions: { count: number; delta: number };
}
```

**Варіанти:**

| Metric | Icon | Color | deltaLabel |
|--------|------|-------|------------|
| Критичне | AlertTriangle | `semantic-error` | "vs вчора" |
| Ідеї | Lightbulb | `semantic-warning` | "цього тижня" |
| Рішення | CheckCircle | `semantic-success` | "цього тижня" |
| Питання | HelpCircle | `semantic-info` | "відкритих" |

**Файл:** `DashboardPage/components/DashboardMetrics.tsx`

**API:**
```
GET /api/v1/dashboard/metrics?period=today
Response: {
  critical:  { count: 3, delta: 2 },
  ideas:     { count: 7, delta: 5 },
  decisions: { count: 12, delta: 3 },
  questions: { count: 5, delta: 0 }
}
```

---

### 2. TrendsList

Показує топ ключових слів/тем за період.

```tsx
interface Trend {
  keyword: string;
  count: number;
  delta: number;           // vs попередній період
  relatedProblems?: number;
}
```

**API:**
```
GET /api/v1/dashboard/trends?period=week&limit=5
Response: {
  trends: [
    { keyword: "API інтеграція", count: 15, delta: 8 },
    { keyword: "Клієнт X", count: 8, delta: 2, relatedProblems: 2 }
  ]
}
```

---

### 3. RecentInsights (Timeline Layout)

Останні важливі atoms у вигляді вертикального timeline з кольоровими dots.

```tsx
type AtomType = 'PROBLEM' | 'TASK' | 'IDEA' | 'DECISION' | 'QUESTION' | 'INSIGHT';

interface RecentInsight {
  id: string;
  type: AtomType;
  title: string;
  content?: string;        // Preview text (line-clamp-2)
  topicId: string;
  topicName: string;
  createdAt: string;
}
```

**Timeline Item Structure:**
```
    (dot)────┬─────────────────────────────┐
     │       │ TYPE_LABEL           TIME   │
     │       │ Title (semibold)            │
     │       │ Content preview...          │
     │       │ # TopicName                 │
     line    └─────────────────────────────┘
```

**Atom Type Colors:**

| Type | Icon | Dot Background |
|------|------|----------------|
| PROBLEM | AlertTriangle | `atom.problem.bg` |
| TASK | CircleDot | `semantic.error.bg` |
| IDEA | Lightbulb | `semantic.warning.bg` |
| DECISION | CheckCircle | `atom.decision.bg` |
| QUESTION | HelpCircle | `atom.question.bg` |
| INSIGHT | Gem | `atom.insight.bg` |

**Файл:** `DashboardPage/components/RecentInsights.tsx`

**API:**
```
GET /api/v1/atoms?sort=-created_at&limit=5&importance_gte=0.65
```

---

### 4. ActivityHeatmap

Візуалізація активності по дням/годинах.

```tsx
interface HeatmapData {
  day: number;      // 0-6 (Mon-Sun)
  hour: number;     // 0-23
  count: number;
}
```

**Існуючий компонент:** `ActivityHeatmap.tsx` — реюз.

---

### 5. TopTopics

Топ топіків за кількістю atoms. Кожен item має кольорову іконку та показує atomCount + messageCount.

```tsx
interface TopTopic {
  id: string;
  name: string;
  icon?: string;           // Lucide icon name (e.g., "Flame")
  color?: string;          // HEX color for icon background
  atomCount: number;
  messageCount: number;
}
```

**Item Structure:**
```
┌────────────────────────────────────────┐
│ (o)  1  Topic Name                     │
│      23 atoms * 45 msgs                │
└────────────────────────────────────────┘
```

**Файл:** `DashboardPage/components/TopTopics.tsx`

**API:**
```
GET /api/v1/topics?sort=-atom_count&limit=5
Response: {
  items: [
    { id: "...", name: "Mobile App", icon: "Smartphone", color: "#3B82F6", atomCount: 23, messageCount: 45 }
  ]
}
```

---

## Стани

### Loading

Кожен компонент має власний skeleton:

```tsx
// DashboardMetrics - 4 skeleton cards
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
</div>

// TrendsList - 5 skeleton items
// RecentInsights - 3 timeline skeleton items
// TopTopics - 5 skeleton items
```

### Empty (Cold Start)

Показується коли `hasNoData && !isAnyLoading`:

```tsx
<Card className="border-dashed border-2 border-primary/30 bg-primary/5">
  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
      <Inbox className="h-8 w-8 text-primary" />
    </div>
    <h3>Почніть збирати знання</h3>
    <p>Підключіть Telegram, щоб AI почав аналізувати...</p>
    <div className="flex gap-4">
      <Button>Налаштувати Telegram</Button>
      <Button variant="outline">Переглянути повідомлення</Button>
    </div>
  </CardContent>
</Card>
```

### Error

Кожен компонент показує власний error state з retry button.

### Onboarding

При `hasNoData` для нових користувачів показується `OnboardingWizard`.

---

## Responsive

| Breakpoint | Metrics | Activity + Topics |
|------------|---------|-------------------|
| mobile | 2x2 grid | 1 column (stacked) |
| tablet | 2x2 grid | 1 column (stacked) |
| desktop (lg+) | 4 columns | 2 columns (side by side) |

---

## Файли

```
src/pages/DashboardPage/
├── index.tsx                    # Layout + PageWrapper + animations
├── components/
│   ├── DashboardMetrics.tsx     # 4 MetricCards
│   ├── DashboardMetrics.stories.tsx
│   ├── TrendsList.tsx           # Ranked trends with badges
│   ├── TrendsList.stories.tsx
│   ├── RecentInsights.tsx       # Timeline layout
│   ├── RecentInsights.stories.tsx
│   ├── TopTopics.tsx            # Clickable topic items
│   ├── TopTopics.stories.tsx
│   └── index.ts                 # Barrel export
├── hooks/
│   └── useDashboardData.ts      # TanStack Query hooks
├── types/
│   └── index.ts                 # TypeScript interfaces
└── mocks/
    └── index.ts                 # Mock data for Storybook
```
