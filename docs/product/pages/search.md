# Search

## Мета

Знайти **"хто і коли говорив про X"** через семантичний пошук.

## Цільова аудиторія

| Роль | Потреба |
|------|---------|
| Всі | "Хто казав про Stripe інтеграцію?" |
| PM | "Які рішення приймали по цій темі?" |

---

## Wireframe

```
┌────────────────────────────────────────────────────────────────┐
│  SEARCH                                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  [Що казали про інтеграцію з Stripe?______________]      │  │
│  │                                                          │  │
│  │  Шукає по: [x] Повідомлення  [x] Insights  [x] Топіки    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  [i] Підказка: Семантичний пошук розуміє смисл, не тільки      │
│      ключові слова. Спробуйте "проблеми з оплатою".            │
│                                                                │
│  ============================================================  │
│                                                                │
│  Знайдено: 12 результатів                   [По релевантності] │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MESSAGE                                      92% match   │  │
│  │ -------------------------------------------------------- │  │
│  │ @ivan * 3 дні тому * Backend API                         │  │
│  │                                                          │  │
│  │ "Треба подивитись на **Stripe**, вони мають новий API    │  │
│  │ для підписок. Може спростити нам біллінг."               │  │
│  │                                                          │  │
│  │ [Показати контекст]                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ INSIGHT                                      87% match   │  │
│  │ -------------------------------------------------------- │  │
│  │ Рішення: Інтеграція платіжної системи                    │  │
│  │                                                          │  │
│  │ Вирішили використати **Stripe** для міжнародних          │  │
│  │ платежів та LiqPay для українських карток.               │  │
│  │                                                          │  │
│  │ [Переглянути деталі]                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MESSAGE                                      76% match   │  │
│  │ -------------------------------------------------------- │  │
│  │ @olena * тиждень тому * Payments                         │  │
│  │                                                          │  │
│  │ "**Stripe** чи LiqPay? Думаю Stripe краще для нас,       │  │
│  │ бо клієнти з різних країн..."                            │  │
│  │                                                          │  │
│  │ [Показати контекст]                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Як працює семантичний пошук

```
Query: "проблеми з оплатою"
        ↓
   [Embedding]
        ↓
   Vector [0.02, -0.15, 0.87, ...]
        ↓
   pgvector cosine similarity
        ↓
   Результати відсортовані по схожості
```

**Переваги:**
- Знаходить синоніми ("payment issues" → "проблеми з оплатою")
- Розуміє контекст
- Не потребує точного співпадіння

---

## Компоненти

### 1. SearchInput

```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}
```

**Особливості:**
- Debounce 300ms
- Clear button
- Enter to search
- Search history (localStorage)

---

### 2. SearchTypeFilter

```tsx
interface SearchTypeFilterProps {
  types: ('messages' | 'atoms' | 'topics')[];
  onChange: (types: string[]) => void;
}
```

**UI:**
```tsx
<div className="flex gap-2">
  <Button variant={active ? 'default' : 'outline'} size="sm">
    <MessageSquare className="mr-1.5 h-4 w-4" />
    Повідомлення
  </Button>
  <Button variant={active ? 'default' : 'outline'} size="sm">
    <Sparkles className="mr-1.5 h-4 w-4" />
    Insights
  </Button>
  <Button variant={active ? 'default' : 'outline'} size="sm">
    <Folder className="mr-1.5 h-4 w-4" />
    Топіки
  </Button>
</div>
```

---

### 3. SearchResult

Universal компонент для різних типів результатів.

```tsx
interface SearchResultProps {
  type: 'message' | 'atom' | 'topic';
  similarity: number;        // 0.0 - 1.0

  // For message
  authorName?: string;
  content?: string;
  sentAt?: string;
  topicName?: string;

  // For atom
  atomType?: AtomType;
  title?: string;

  // For topic
  icon?: string;
  atomCount?: number;

  highlightTerms?: string[];
  onViewContext?: () => void;
}
```

**Match score badge:**
```tsx
<Badge variant="outline" className={cn(
  similarity >= 0.9 && "border-success text-success",
  similarity >= 0.7 && similarity < 0.9 && "border-warning text-warning",
  similarity < 0.7 && "border-muted text-muted-foreground"
)}>
  {Math.round(similarity * 100)}% match
</Badge>
```

---

### 4. SearchHint

Показує підказку для користувачів.

```tsx
<Alert>
  <Lightbulb className="h-4 w-4" />
  <AlertTitle>Підказка</AlertTitle>
  <AlertDescription>
    Семантичний пошук розуміє смисл, не тільки ключові слова.
    Спробуйте "проблеми з оплатою" замість "payment error".
  </AlertDescription>
</Alert>
```

---

## API

### Semantic Search

```
GET /api/v1/search
  ?q=stripe+integration
  &types=messages,atoms,topics
  &limit=20
  &threshold=0.5

Response: {
  results: [
    {
      type: "message",
      id: "uuid",
      similarity: 0.92,
      data: {
        content: "Треба подивитись на Stripe...",
        authorName: "@ivan",
        sentAt: "2025-12-04T14:32:00Z",
        topicName: "Backend API"
      }
    },
    {
      type: "atom",
      id: "uuid",
      similarity: 0.87,
      data: {
        atomType: "DECISION",
        title: "Інтеграція платіжної системи",
        content: "Вирішили використати Stripe..."
      }
    }
  ],
  total: 12,
  query_embedding_time_ms: 45,
  search_time_ms: 12
}
```

---

## Highlighting

Виділення знайдених термінів у тексті.

```tsx
function highlightText(text: string, terms: string[]): ReactNode {
  // Split by terms and wrap matches in <mark>
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
      : part
  );
}
```

---

## Стани

### Initial (no query)

```tsx
<div className="text-center py-12">
  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium">Пошук по знаннях</h3>
  <p className="text-muted-foreground mt-1">
    Введіть запит, щоб знайти повідомлення, insights або топіки
  </p>
</div>
```

### Loading

```tsx
<div className="space-y-4">
  {[1,2,3].map(i => (
    <Card key={i}>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  ))}
</div>
```

### No Results

```tsx
<EmptyState
  icon={SearchX}
  title="Нічого не знайдено"
  description={`Немає результатів для "${query}"`}
>
  <p className="text-sm text-muted-foreground mt-2">
    Спробуйте інші ключові слова або розширте фільтри
  </p>
</EmptyState>
```

---

## Файли

```
src/pages/SearchPage/
├── index.tsx              # Layout + state
├── components/
│   ├── SearchInput.tsx
│   ├── SearchTypeFilter.tsx
│   ├── SearchResult.tsx
│   └── SearchHint.tsx
└── hooks/
    └── useSearch.ts       # Query + debounce
```
