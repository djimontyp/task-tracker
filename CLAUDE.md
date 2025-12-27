# CLAUDE.md

## Мова

- **Спілкування:** завжди українською
- **Код:** коментарі та docstrings **ТІЛЬКИ** англійською
- **Питання:** спершу пряма відповідь, потім дії (не ігноруй питання!)

## Проект

**Pulse Radar** — AI-система збору знань з комунікаційних каналів (Telegram, Slack).

**Проблема:** 100+ повідомлень/день, 80% — шум. Важлива інформація втрачається.

**Core Flow:** `Telegram → Інгест → AI-екстракція → Атом → Топік → Дашборд`

**Статус:** MVP Верифіковано (11/31 features)

## Команди

> **ВАЖЛИВО:** Завжди віддавай перевагу `just` командам! Див. [@justfile](justfile)

```bash
just                  # показати всі команди

# Services
just services-dev     # запуск з live reload (ss)
just services-stop    # зупинити (st)
just rebuild backend  # перебудувати один сервіс

# Database
just db-full-reset    # nuclear reset + full seed
just db-seed 50       # seed N tasks
just db-topics-seed   # seed topics + atoms + messages

# Quality
just typecheck        # mypy перевірка (tc)
just fmt              # format code
just test             # pytest suite

# Docs
just docs             # http://127.0.0.1:8081
```

## Архітектура

**Backend:** FastAPI → Service → Model (SQLModel) — Гексагональна (Ports & Adapters)
**Frontend:** React 18 + Zustand + TanStack Query + shadcn/ui
**Real-time:** Native WebSocket (не Socket.IO!)
**Message broker:** NATS JetStream + TaskIQ

```
Telegram → Webhook → FastAPI → PostgreSQL + pgvector
                         ↓
                    NATS JetStream
                         ↓
                    TaskIQ Worker (scoring, embedding, analysis)
                         ↓
                    WebSocket → React Dashboard
```

## Бізнес-логіка

### Message
- **Джерело:** Telegram webhook
- **Classification:** SIGNAL (важливе) / NOISE (шум)
- **Scoring:** importance_score (0-1) на основі 4 факторів
- **Storage:** embedding (1536 dims) для semantic search

### Topic
- Контейнер для організації Atoms
- Поля: `name`, `icon`, `color`, `keywords`
- M2M з Atoms та Messages

### Atom (ядро системи)
**Типи:** TASK, IDEA, QUESTION, DECISION, INSIGHT

**Статуси:**
```
DRAFT → PENDING_REVIEW → APPROVED / REJECTED
```

### AnalysisRun (AI pipeline)
**7 станів:**
```
PENDING → QUEUED → RUNNING → COMPLETED / FAILED / CANCELLED / TIMEOUT
```

### LLMProvider
- Типи: `ollama`, `openai`
- Статуси валідації: `pending → validating → connected / error`
- API keys encrypted (Fernet)

### Key Enums
```python
# Message
AnalysisStatus: pending, analyzed, spam, noise
NoiseClassification: signal, noise, spam, low_quality, high_quality

# Workflow
ProposalStatus: pending, approved, rejected, merged
ValidationStatus: pending, validating, connected, error

# Automation
RuleAction: approve, reject, escalate, notify
```

## LLM Pipeline (Pydantic AI)

**3 агенти:**
1. **Classification** — категорія + пріоритет повідомлення
2. **Extraction** — витяг сутностей (projects, components, tags)
3. **Analysis** — структуровані примітки

**RAG Context:**
```
Query Embedding → pgvector search →
├─ similar_proposals (past approved)
├─ relevant_atoms (knowledge base)
└─ related_messages (history)
→ Inject into LLM prompt
```

**TaskIQ Flow:**
```
save_telegram_message → score_message_task → extract_knowledge
                                           ↓
                        embed_messages_batch + embed_atoms_batch
```
Threshold: 10+ unprocessed messages → auto-trigger extraction

## WebSocket Topics

| Topic | Events |
|-------|--------|
| messages | message.updated, ingestion.started/progress/completed |
| knowledge | extraction_started/completed, topic/atom_created |
| noise_filtering | message_scored |
| monitoring | task_started/completed/failed |
| metrics | metrics:update |

**Cross-process:** Worker → NATS → API → Browser

## Services (40 сервісів)

**CRUD Layer:**
- BaseCRUD[T], AgentCRUD, ProviderCRUD, AtomCRUD, TopicCRUD

**Business Logic:**
- KnowledgeOrchestrator — LLM extraction
- RuleEngineService — automation rules (8 operators)
- VersioningService — entity snapshots, diffs

**AI/Search:**
- EmbeddingService — OpenAI/Ollama embeddings
- SemanticSearchService — pgvector cosine similarity
- RAGContextBuilder — context для LLM prompts

**Infrastructure:**
- WebSocketManager — real-time pub/sub + NATS relay
- CredentialEncryption — Fernet для API keys

## Roadmap

**MVP (11 features) ✅:**
F001 Telegram інгест, F002 Messages, F003 AI-екстракція, F004 Topics, F005 Atoms, F006 Dashboard, F008 LLM Providers, F019 Health, F026 TaskIQ, F030 Settings, F031 shadcn Theme

**v1.1 (5):** WebSocket, AI-агенти, Семантичний пошук, Ембедінги, API інгесту
**v1.2 (5):** Task assignments, FTS, Projects, Version history, Users
**Later (5):** Noise filter, Automation rules, Scheduled jobs, Auto-approve, Scoring
**Dormant (5):** Metrics WS, Task configs, Prompts, RAG, Onboarding — *приховані з UI*

## Філософія тестування

### КРИТИЧНО: Frontend тести

> **Я перевіряю UI 1 раз. Далі — тести МАЮТЬ ловити регресії!**

**Обов'язково:**
- **Vitest** для unit/integration тестів компонентів
- **Playwright** для E2E критичних flows
- Кожна нова фіча = тест що її покриває
- Кожен баг-фікс = тест що запобігає повторенню

**Головне правило:**
Якщо UI зламається — тест **ПОВИНЕН** впасти. Якщо тест не впав при поломці — тест поганий, переписати.

**Статистика:**
- Backend: 996 тестів, 22K LOC, Contract tests
- Frontend: 51 unit tests (96% pass), E2E stubs

### Backend тести

- **pytest** з coverage (мінімум 80%)
- `just typecheck` після КОЖНОЇ зміни Python коду
- Integration тести для API endpoints
- Unit тести для сервісів з бізнес-логікою

### Assertion Messages (обов'язково)

```python
# ✅ ПРАВИЛЬНО — зрозуміло що пішло не так
assert response.status_code == 200, f"API error: {response.json()}"
assert len(atoms) == 3, f"Expected 3 atoms, got {len(atoms)}: {atoms}"

# ❌ НЕПРАВИЛЬНО — при падінні незрозуміло що сталось
assert response.status_code == 200
assert len(atoms) == 3
```

### Заборонено

- ❌ Саботувати тести (пропускати, коментувати, робити завжди-зелені)
- ❌ Видаляти тести без явної згоди
- ❌ Писати тести "для галочки" без реальної перевірки
- ❌ Змінювати assertion щоб тест просто пройшов

## Правила коду

### Імпорти
```python
# ✅ ПРАВИЛЬНО — абсолютні
from app.models import User
from app.services.embedding import EmbeddingService

# ❌ НЕПРАВИЛЬНО — відносні
from . import User
from ..services import EmbeddingService
```

### Коментарі
- Пояснюй **ЧОМУ**, не **ЩО**
- 80% структурних коментарів = шум
- Код має бути самодокументованим

### ASCII-діаграми та текстова візуалізація

> **TL;DR:** Після створення — ОБОВ'ЯЗКОВО перевір вирівнювання!

При візуалізації таблиць, wireframes, діаграм у текстових файлах (MD, TXT):
1. **Використовуй monospace** — границі мають бути з однакових символів
2. **Перевіряй ширину** — всі рядки однакової довжини
3. **Тестуй рендер** — переглянь результат перед commit

```
❌ КРИВО (різна ширина, зʼїхали границі):
┌──────────────────────────────┐
│  Content here          |
│  More content              │
└─────────────────────────┘

✅ РІВНО (консистентні границі):
┌────────────────────────────┐
│  Content here              │
│  More content              │
└────────────────────────────┘
```

**Правило:** Якщо рисуєш box — порахуй символи. `─` має бути стільки ж зверху і знизу.

### Принципи

| Принцип | Застосовуй | Ігноруй |
|---------|-----------|---------|
| **KISS** | Завжди | — |
| **DRY** | Бізнес-логіка, сервіси | Тести (явність > абстракція) |
| **YAGNI** | Завжди — не роби "про запас" | — |

### Заборонено

- ❌ Змінювати `pyproject.toml` / `package.json` без схвалення
- ❌ Комітити `.env`, secrets, credentials
- ❌ Force push до main/master
- ❌ Пропускати `just typecheck` після Python змін

## Git Hooks (Автоматична перевірка)

> **TL;DR:** Pre-commit hook **блокує** commits з порушеннями Design System

### 🔒 Pre-commit Hook

**Що перевіряється:**
```bash
# 1. ESLint (Design System rules)
#    - Заборонені raw кольори (bg-red-*, text-green-*)
#    - Заборонені непарні spacing (gap-3, p-5, p-7)
#    - TypeScript errors

# 2. TypeScript compilation
#    - tsc --noEmit (type checking)
```

**Налаштовано через:**
- `.husky/pre-commit` — Git hook script
- `frontend/package.json` → `lint-staged` — incremental checks

**Приклад блокування:**

```bash
$ git commit -m "Add new badge"

🔍 Running pre-commit checks...

✖ eslint --fix --max-warnings 0:
  12:14  error  ❌ Raw Tailwind color "bg-green-500" is forbidden.
         Use semantic token: semantic-success, status-connected

✖ 4 problems (4 errors, 0 warnings)

husky - pre-commit script failed (code 1)
```

**Обхід (тільки у надзвичайних випадках):**
```bash
git commit --no-verify -m "Emergency fix"
```

### 📋 Що робить lint-staged

Перевіряє **тільки staged files** (не весь проект):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",  // Auto-fix + block if errors
      "bash -c 'tsc --noEmit'"          // Type check
    ]
  }
}
```

**Переваги:**
- ✅ Швидко — перевіряє тільки змінені файли
- ✅ Auto-fix — виправляє що можна автоматично
- ✅ Блокує commit — неможливо закомітити порушення

### 🧪 Тестування Hook

```bash
# Створи файл з порушенням
cat > frontend/src/test.tsx <<EOF
export const Bad = () => <div className="bg-red-500">Test</div>;
EOF

# Спробуй закомітити
git add frontend/src/test.tsx
git commit -m "test"

# Результат: ❌ BLOCKED з описом помилки
```

**Дивись:** `frontend/src/test-violations.tsx` — приклад файлу який блокується

## Active Technologies
- Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, Zustand 5.0, shadcn/ui (001-daily-review-epic)
- Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, shadcn/ui (002-executive-summary)
- Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, shadcn/ui (003-search)
- PostgreSQL 15 with `to_tsvector`/`to_tsquery` for FTS (003-search)
- TypeScript 5.9.3 (frontend) + React 18.3.1, TanStack Query 5.90, shadcn/ui, Zustand 5.0 (004-telegram-integration-ui)
- N/A (backend PostgreSQL already handles persistence) (004-telegram-integration-ui)
- Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, React 18.3.1, react-i18next, Zustand 5.0, langdetec (005-i18n)
- PostgreSQL 15 (user.ui_language, project.language fields) (005-i18n)

**Backend:**
- Python 3.12, FastAPI 0.117.1, SQLModel 0.0.24
- Pydantic 2.10, Alembic 1.16, mypy 1.17 (strict)
- TaskIQ + taskiq-nats, Pydantic AI 1.0.10

**Frontend:**
- React 18.3.1, TypeScript 5.9.3, Vite 7.1.9
- Zustand 5.0, TanStack Query 5.90
- shadcn/ui (Radix), Tailwind CSS 3.4
- Vitest, Playwright

**Infrastructure:**
- PostgreSQL 15 + pgvector 0.4
- NATS JetStream
- Docker Compose + Nginx

## Frontend Design System

> **TL;DR:** Semantic tokens, 4px grid, 44px touch, WCAG AA.

📖 **Читай:** `docs/design-system/README.md` + `frontend/AGENTS.md`

### 🚫 ЗАБОРОНЕНІ Tailwind класи

**ПЕРЕД написанням UI коду — ОБОВ'ЯЗКОВО перевір таблицю:**

| ❌ ЗАБОРОНЕНО | ✅ ВИКОРИСТОВУЙ |
|--------------|-----------------|
| `bg-red-*`, `text-red-*` | `bg-semantic-error`, `text-destructive`, `bg-status-error` |
| `bg-green-*`, `text-green-*` | `bg-semantic-success`, `text-status-connected` |
| `bg-blue-*`, `text-blue-*` | `bg-semantic-info`, `bg-primary`, `text-primary` |
| `bg-yellow-*`, `bg-amber-*` | `bg-semantic-warning`, `bg-status-validating` |
| `bg-gray-*`, `text-gray-*` | `bg-muted`, `text-muted-foreground`, `bg-background` |
| `border-green-*`, `border-red-*` | `border-status-connected`, `border-destructive` |

**Spacing — тільки кратні 4px:**

| ❌ ЗАБОРОНЕНО | ✅ ВИКОРИСТОВУЙ |
|--------------|-----------------|
| `p-3`, `p-5`, `p-7` | `p-2`, `p-4`, `p-6`, `p-8` |
| `gap-3`, `gap-5`, `gap-7` | `gap-2`, `gap-4`, `gap-6`, `gap-8` |
| `m-3`, `m-5`, `m-7` | `m-2`, `m-4`, `m-6`, `m-8` |

**Status indicators — завжди icon + text:**

```tsx
// ❌ НЕПРАВИЛЬНО — тільки колір
<span className="h-2 w-2 rounded-full bg-green-500" />

// ✅ ПРАВИЛЬНО — icon + text
<span className="flex items-center gap-1">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span>Connected</span>
</span>
```

**ESLint перевірка:**
```bash
cd frontend && npm run lint  # покаже порушення
```

> **Правило:** `local-rules/no-raw-tailwind-colors` — автоматично знаходить порушення

### 🎯 TypeScript Design Tokens (РЕКОМЕНДОВАНО)

**Замість** ручного написання Tailwind класів — використовуй **type-safe токени**:

```tsx
// ❌ СТАРИЙ спосіб — схильний до помилок
<Badge className="flex items-center gap-1.5 border-status-connected text-status-connected bg-status-connected/10">

// ✅ НОВИЙ спосіб — type-safe, autocomplete
import { badges } from '@/shared/tokens';
<Badge className={badges.status.connected}>
```

**Доступні токени:**

| Категорія | Імпорт | Приклад використання |
|-----------|--------|----------------------|
| **Кольори** | `import { semantic, status, atom } from '@/shared/tokens'` | `semantic.success.bg`, `status.connected.text` |
| **Spacing** | `import { gap, padding, spacing } from '@/shared/tokens'` | `gap.md`, `padding.card.default`, `spacing.stack.lg` |
| **Patterns** | `import { badges, cards, emptyState } from '@/shared/tokens'` | `badges.status.connected`, `cards.interactive` |

**Приклади:**

```tsx
// Badges з іконками (WCAG compliant)
import { badges } from '@/shared/tokens';
<Badge className={badges.status.connected}>
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>

// Cards з правильним padding
import { cards, gap } from '@/shared/tokens';
<Card className={cards.interactive}>
  <div className={gap.md}>Content</div>
</Card>

// Empty states
import { emptyState } from '@/shared/tokens';
<div className={emptyState.container}>
  <div className={emptyState.icon}>
    <InboxIcon className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className={emptyState.title}>No items</h3>
  <p className={emptyState.description}>Add your first item</p>
</div>

// Responsive grids
import { lists } from '@/shared/tokens';
<div className={lists.grid.responsive}>
  {items.map(item => <Card key={item.id} />)}
</div>
```

**Переваги:**
- ✅ **Autocomplete** — IDE підказує доступні токени
- ✅ **Type safety** — неможливо використати неіснуючий токен
- ✅ **Консистентність** — всі використовують одні patterns
- ✅ **Refactoring** — зміна токена оновлює всі місця
- ✅ **ESLint friendly** — не спрацьовує на raw кольори

**Файли:**
- `frontend/src/shared/tokens/colors.ts` — семантичні кольори
- `frontend/src/shared/tokens/spacing.ts` — відступи, gap, padding
- `frontend/src/shared/tokens/patterns.ts` — готові UI patterns
- `frontend/src/shared/tokens/index.ts` — центральний експорт

### 🧩 Composition Patterns (Готові компоненти)

**Замість** ручної композиції — використовуй **готові pattern компоненти**:

```tsx
import { CardWithStatus, ListItemWithAvatar, FormField } from '@/shared/patterns';
```

**CardWithStatus — картка з іконкою та статусом:**
```tsx
<CardWithStatus
  icon={BoltIcon}
  title="OpenAI Provider"
  description="GPT-4 model access"
  status="connected"  // connected | validating | pending | error
  statusLabel="Active"
  footer={<Button>Settings</Button>}
/>
```

**ListItemWithAvatar — елемент списку з аватаром:**
```tsx
<ListItemWithAvatar
  avatar={{ src: user.avatar, fallback: "JD" }}
  title={user.name}
  subtitle={user.email}
  meta={<Badge>Admin</Badge>}
  trailing={<span className="text-xs text-muted-foreground">2m ago</span>}
  onClick={() => selectUser(user.id)}
/>
```

**FormField — поле форми з валідацією:**
```tsx
<FormField
  label="Email"
  error={errors.email?.message}
  required
  description="We'll never share your email"
>
  <Input {...register('email')} type="email" />
</FormField>
```

**Допоміжні компоненти:**
```tsx
// Standalone status badge
<StatusBadge status="connected" label="Online" />

// Status dot (мінімальний індикатор)
<StatusDot status="validating" pulse />

// Form section (група полів)
<FormSection title="Account Settings">
  <FormField .../>
</FormSection>

// List container з dividers
<ListContainer divided>
  <ListItemWithAvatar .../>
</ListContainer>

// Empty state (порожній список)
<EmptyState
  icon={InboxIcon}
  title="No messages yet"
  description="Messages will appear here"
  action={<Button>Add first message</Button>}
/>

// Empty state variants: default, card, compact, inline
<EmptyState variant="compact" icon={SearchIcon} title="No results" />
```

**Файли:**
- `frontend/src/shared/patterns/CardWithStatus.tsx`
- `frontend/src/shared/patterns/ListItemWithAvatar.tsx`
- `frontend/src/shared/patterns/FormField.tsx`
- `frontend/src/shared/patterns/EmptyState.tsx`
- `frontend/src/shared/patterns/index.ts`
- `frontend/src/shared/patterns/README.md` — повна документація

**Storybook:** Design System / Patterns (http://localhost:6006)

### 📐 Component Patterns (Cookbook)

**Card з header та content:**
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* content */}
  </CardContent>
</Card>
```

**Status Badge (завжди icon + text):**
```tsx
// Статуси: connected, error, validating, pending
<Badge variant="outline" className="gap-1.5 border-status-connected text-status-connected">
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

**Icon Button (44px touch target):**
```tsx
<Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Delete item">
  <Trash className="h-5 w-5" />
</Button>
```

**Empty State:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <InboxIcon className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium">No items yet</h3>
  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
    Description text here
  </p>
  <Button className="mt-4">Add first item</Button>
</div>
```

**Responsive Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

**Loading Skeleton:**
```tsx
<div className="space-y-4">
  <Skeleton className="h-8 w-48" />      {/* title */}
  <Skeleton className="h-4 w-full" />    {/* line */}
  <Skeleton className="h-4 w-3/4" />     {/* shorter line */}
</div>
```

### ✅ UI Checklist (перед commit)

```
□ Кольори — тільки semantic tokens (bg-semantic-*, text-status-*)
□ Spacing — кратні 4px (gap-2, gap-4, p-4, p-6)
□ Touch targets — кнопки ≥44px (h-11 w-11)
□ Icon buttons — мають aria-label
□ Status — icon + text, не тільки колір
□ Dark mode — перевірено в обох темах
□ Responsive — працює на mobile (375px+)
□ Focus visible — keyboard navigation працює
□ TypeScript — `npx tsc --noEmit` без помилок
□ ESLint — `npm run lint` без помилок
```

### 📱 Responsive Breakpoints

| Breakpoint | Width | Use for |
|------------|-------|---------|
| `xs:` | 375px | Small phones |
| `sm:` | 640px | Phones landscape |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |
| `3xl:` | 1920px | Full HD |
| `4xl:` | 2560px | 2K/4K |

**Mobile-first підхід:**
```tsx
// Base = mobile, потім розширюємо
<div className="p-4 md:p-6 lg:p-8">
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="text-sm md:text-base">
```

### Icons

| ❌ ЗАБОРОНЕНО | ✅ ВИКОРИСТОВУЙ |
|--------------|-----------------|
| `@heroicons/react` | `lucide-react` (єдина дозволена) |
| `@radix-ui/react-icons` | `lucide-react` |
| Custom SVG imports | `lucide-react` |

**ESLint правило:** `local-rules/no-heroicons` блокує heroicons імпорти автоматично.

**Dynamic icons:** Для динамічного вибору іконок по імені (без direct import) використовуй утиліту:
```typescript
import { getIconByName } from '@/shared/utils/iconMapping';
const Icon = getIconByName('Folder'); // CamelCase lucide name
```

**Приклад використання:**
```tsx
import { Folder, Check, X, Settings } from 'lucide-react';

// Icon Button (завжди aria-label!)
<Button variant="ghost" size="icon" aria-label="Open folder">
  <Folder className="h-4 w-4" />
</Button>

// Badge з іконкою
<Badge className="gap-1.5">
  <Check className="h-3.5 w-3.5" />
  Connected
</Badge>

// Empty state
<div className="text-center py-12">
  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium">No settings</h3>
</div>
```

**Розмири:** `h-4 w-4` (16px) для buttons, `h-5 w-5` (20px) для inline, `h-8 w-8` (32px) для icons в заголовках.

## 📚 Storybook — Component Library

> **URL:** http://localhost:6006

### Навіщо Storybook?

```
┌─────────────────────────────────────────────────────────────┐
│  БЕЗ Storybook:                                             │
│  • Агент пише Button → не знає які варіанти існують         │
│  • Кожен раз "винаходить" компонент наново                  │
│  • Немає єдиного джерела правди                             │
├─────────────────────────────────────────────────────────────┤
│  ЗІ Storybook:                                              │
│  • Візуальний каталог ВСІХ компонентів                      │
│  • Документація + приклади використання                      │
│  • Тестування в ізоляції (без API)                          │
│  • Visual regression (Chromatic)                            │
└─────────────────────────────────────────────────────────────┘
```

### Команди

```bash
# Запустити Storybook (dev mode)
cd frontend && npm run storybook

# Build static Storybook
npm run build-storybook
```

### Структура stories

```
src/shared/ui/
├── button.tsx           # Компонент
└── button.stories.tsx   # Stories для компонента

src/shared/components/DataTable/
├── index.tsx            # Компонент
└── index.stories.tsx    # Stories
```

### Як писати stories

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',           // Категорія в sidebar
  component: Button,
  tags: ['autodocs'],           // Автодокументація
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Click me' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};
```

### Покриття (~280 stories)

| Категорія | Компоненти |
|-----------|------------|
| **UI/Buttons** | Button, Badge, Card |
| **UI/Form** | Input, Textarea, Select, Checkbox, Switch, Radio, Slider |
| **UI/Overlay** | Dialog, Sheet, AlertDialog, Popover, Tooltip, Dropdown |
| **UI/Navigation** | Tabs, Breadcrumb, Pagination, Collapsible |
| **UI/Data** | Table, Skeleton, Progress, Avatar, Alert |
| **Components** | DataTable, MetricCard, ActivityHeatmap, PageHeader... |

### Для агентів

**ПЕРЕД створенням UI:**
1. Відкрий Storybook → знайди схожий компонент
2. Подивись існуючі варіанти та patterns
3. Використовуй існуючі компоненти, не створюй нові

**ПІСЛЯ створення компонента:**
1. Створи `{component}.stories.tsx`
2. Додай `tags: ['autodocs']`
3. Покрий всі варіанти та стани

**Required Providers для Stories:**

| Hook | Provider | Import |
|------|----------|--------|
| `useTheme` | `ThemeProvider` | `@/shared/components/ThemeProvider` |
| `useLocation`, `Link` | `MemoryRouter` | `react-router-dom` |
| `useQuery` | `QueryClientProvider` | `@tanstack/react-query` |
| `useSidebar` | `SidebarProvider` | `@/shared/ui/sidebar` |

**Template:**
```tsx
const StoryWrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>
);
```

## Документація

- `docs/design-system/` — **Design System** (colors, spacing, components)
- `docs/design-system/references/` — **Референси** (натхнення, не для реалізації!)
- `docs/architecture/OVERVIEW.md` — системна архітектура
- `docs/architecture/NOISE_FILTERING.md` — Phase 2 filtering
- `docs/architecture/adr/001-unified-admin-approach.md` — UI/UX ADR
- `.claude/skills/frontend/SKILL.md` — shadcn/ui, React patterns
- `.artifacts/progress.md` — прогрес стабілізації
- `.artifacts/stabilization.json` — feature tracking

## Робота агентів

### Підхід: Fail-Fast + SPEC-light

**Перед реалізацією — прості перевірки:**
- API endpoint існує? (`curl` → 200?)
- Типи/schemas доступні?
- Залежності на місці?

**Якщо перевірка провалилась → blocker, не обхід.**

### Заборонено при відсутності API:
- ❌ Mock/stub дані
- ❌ Альтернативні endpoints
- ❌ Читати backend код для "обходу"

### Порядок роботи (адаптувати до розміру задачі):
1. **Перевірка** — API, types, dependencies
2. **Контекст** — існуючі паттерни в codebase
3. **Реалізація** — код (Storybook для компонентів)
4. **Верифікація** — typecheck, build, browser

### При оновленні UI концепцій:
1. **Переглянь референси** — `docs/design-system/references/`
2. **Зрозумій патерни** — що спільного між референсами?
3. **Реалізуй в Storybook** — референси інформують, Storybook реалізує

## Recent Changes
- 005-i18n: Added Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, React 18.3.1, react-i18next, Zustand 5.0, langdetec
- 004-telegram-integration-ui: Added TypeScript 5.9.3 (frontend) + React 18.3.1, TanStack Query 5.90, shadcn/ui, Zustand 5.0
- 003-search: Added Python 3.12 (backend), TypeScript 5.9.3 (frontend) + FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, shadcn/ui
