# Messages

## Мета

Переглянути **оригінальні повідомлення**, верифікувати AI-класифікацію.

## Цільова аудиторія

| Роль | Потреба |
|------|---------|
| PM | "Покажи що реально писали" |
| Team Lead | "Перевірити чи AI правильно класифікував" |

---

## Wireframe

```
┌────────────────────────────────────────────────────────────────┐
│  MESSAGES                                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Search...]                                              │  │
│  │                                                          │  │
│  │ Показувати: [Всі] [Тільки Signal x] [Шум прихований]     │  │
│  │ Топік: [Всі топіки v]    Автор: [Всі v]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  127 повідомлень сьогодні (23 signal, 104 noise)               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Петро Іванов                               14:32  [v]    │  │
│  │ -------------------------------------------------------- │  │
│  │ Знайшов баг в авторизації - користувачі не можуть        │  │
│  │ залогінитись через Google OAuth. Помилка 500.            │  │
│  │                                                          │  │
│  │ @ Mobile App   Score: 0.87   2 insights                  │  │
│  │                                                          │  │
│  │ [Пов'язані insights]                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Марія Коваленко                            14:28  [v]    │  │
│  │ -------------------------------------------------------- │  │
│  │ @Петро, глянь може це пов'язано з тим оновленням         │  │
│  │ Google API яке було вчора?                               │  │
│  │                                                          │  │
│  │ @ Mobile App   Score: 0.72                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Олександр                                  14:25  [~]    │  │
│  │ -------------------------------------------------------- │  │
│  │ +1                                                       │  │
│  │                                                          │  │
│  │ Score: 0.12 (noise)                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Завантажити ще...]                                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Signal/Noise Classification

| Класифікація | Score | Іконка | Колір |
|--------------|-------|--------|-------|
| **Signal** | > 0.65 | ✅ CheckCircle | `success` |
| **Weak Signal** | 0.25 - 0.65 | ⚡ Zap | `warning` |
| **Noise** | < 0.25 | 🔇 VolumeX | `muted` |

---

## Компоненти

### 1. MessageFilters

```tsx
interface MessageFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;

  signalFilter: 'all' | 'signal' | 'noise_hidden';
  onSignalFilterChange: (filter: string) => void;

  topicId: string | null;
  onTopicChange: (id: string | null) => void;

  authorId: string | null;
  onAuthorChange: (id: string | null) => void;
}
```

**Signal filter UI:**
```tsx
<Tabs value={signalFilter} onValueChange={setSignalFilter}>
  <TabsList>
    <TabsTrigger value="all">Всі</TabsTrigger>
    <TabsTrigger value="signal">Тільки Signal</TabsTrigger>
    <TabsTrigger value="noise_hidden">Шум прихований</TabsTrigger>
  </TabsList>
</Tabs>
```

---

### 2. MessageCard

```tsx
interface MessageCardProps {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  sentAt: string;
  topicName?: string;
  importanceScore: number;
  noiseClassification: 'signal' | 'weak_signal' | 'noise';
  linkedInsightsCount: number;
  onViewInsights?: () => void;
}
```

**Score indicator:**
```tsx
function ScoreIndicator({ score }: { score: number }) {
  const classification = getClassification(score);

  return (
    <div className="flex items-center gap-1.5">
      {classification === 'signal' && (
        <CheckCircle className="h-4 w-4 text-status-connected" />
      )}
      {classification === 'weak_signal' && (
        <Zap className="h-4 w-4 text-status-validating" />
      )}
      {classification === 'noise' && (
        <VolumeX className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-xs text-muted-foreground">
        {score.toFixed(2)}
      </span>
    </div>
  );
}
```

---

### 3. MessageStats

Показує статистику за період.

```tsx
interface MessageStatsProps {
  total: number;
  signal: number;
  noise: number;
}
```

**UI:**
```tsx
<div className="text-sm text-muted-foreground">
  📊 {total} повідомлень сьогодні ({signal} signal, {noise} noise)
</div>
```

---

### 4. LinkedInsightsPopover

Показує пов'язані atoms для повідомлення.

```tsx
interface LinkedInsightsPopoverProps {
  messageId: string;
  count: number;
}
```

**API:**
```
GET /api/v1/messages/{id}/atoms
Response: {
  atoms: [
    { id, type, title }
  ]
}
```

---

## Фільтри

### Signal Filter

| Значення | Логіка |
|----------|--------|
| `all` | Показати всі |
| `signal` | `importance_score >= 0.65` |
| `noise_hidden` | `importance_score >= 0.25` |

### Topic Filter

```
GET /api/v1/topics?has_messages=true
```

### Author Filter

```
GET /api/v1/users?has_messages=true
```

---

## API

### List Messages

```
GET /api/v1/messages
  ?page=1
  &per_page=50
  &search=баг
  &importance_gte=0.65      # signal only
  &topic_id=uuid
  &author_id=uuid
  &sort=-sent_at

Response: {
  items: Message[],
  total: 127,
  stats: {
    signal: 23,
    weak_signal: 45,
    noise: 59
  }
}
```

### Message with Atoms

```
GET /api/v1/messages/{id}?include=atoms

Response: {
  id, content, authorName, sentAt, importanceScore, ...
  atoms: [
    { id, type, title }
  ]
}
```

---

## Real-time Updates

WebSocket підписка на нові повідомлення.

```tsx
// useWebSocket hook
useEffect(() => {
  const unsubscribe = subscribeToTopic('messages', (event) => {
    if (event.type === 'message.updated') {
      // Optimistic update or refetch
      queryClient.invalidateQueries(['messages']);
    }
  });

  return unsubscribe;
}, []);
```

---

## Infinite Scroll

Замість pagination — load more.

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['messages', filters],
  queryFn: ({ pageParam = 1 }) => fetchMessages({ ...filters, page: pageParam }),
  getNextPageParam: (lastPage) =>
    lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
});

// Intersection Observer для auto-load
const loadMoreRef = useRef(null);
useIntersectionObserver(loadMoreRef, () => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
});
```

---

## Стани

### Loading (initial)

```tsx
<div className="space-y-4">
  {[1,2,3,4,5].map(i => (
    <Card key={i}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  ))}
</div>
```

### Empty

```tsx
<EmptyState
  icon={MessageSquare}
  title="Немає повідомлень"
  description="Підключіть Telegram, щоб почати збирати повідомлення"
  action={<Button>Підключити</Button>}
/>
```

### Loading More

```tsx
<div ref={loadMoreRef} className="py-4 text-center">
  {isFetchingNextPage && <Spinner />}
  {!hasNextPage && (
    <p className="text-sm text-muted-foreground">Це всі повідомлення</p>
  )}
</div>
```

---

## Responsive

| Breakpoint | Layout |
|------------|--------|
| mobile | Filters collapsed, full width cards |
| tablet | Filters row |
| desktop | Full layout |

---

## Файли

```
src/pages/MessagesPage/               # ІСНУЄ
├── index.tsx                         # + Signal/Noise filter
├── components/
│   ├── MessageCard.tsx               # + Score indicator
│   ├── MessageFilters.tsx            # НОВИЙ
│   ├── MessageStats.tsx              # НОВИЙ
│   └── LinkedInsightsPopover.tsx     # НОВИЙ
└── hooks/
    └── useMessages.ts                # + infinite scroll
```
