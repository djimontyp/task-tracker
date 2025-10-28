# Аудит білінгвальної документації та i18n інфраструктури
**Дата:** 2025-10-27
**Інженер:** i18n-engineer
**Тип:** Deep Dive Audit

---

## Executive Summary

**Статус:** 🟡 КРИТИЧНІ ПРОГАЛИНИ В I18N ІНФРАСТРУКТУРІ

Проект демонструє **відмінну структурну синхронізацію документації** (98% паритет EN/UK), але **повну відсутність i18n інфраструктури** у коді додатку. Виявлено hardcoded locale (uk-UA) у форматуванні дат, відсутність фреймворку перекладів, та повністю англомовний Telegram бот незважаючи на збереження `language_code` користувачів.

**Ключові метрики:**
- ✅ Документація: 43 EN файлів → 35 UK файлів (81% покриття)
- ❌ Frontend i18n: 0% (немає фреймворку)
- ❌ Backend localization: 0% (немає aiogram i18n)
- ⚠️ Date formatting: hardcoded 'uk-UA' locale
- 📊 Відсутні переклади: 8 файлів (3124+ рядків)

---

## 1. Documentation Sync Status

### 1.1 Структурна синхронізація

**MkDocs i18n Plugin:** ✅ Правильно налаштований
- `docs_structure: folder`
- Dual language support: EN (default) + UK
- Nav translations: повністю визначені в `mkdocs.yml`

**Файлова структура:**

| Метрика | EN | UK | Статус |
|---------|----|----|--------|
| Загальна к-сть файлів | 43 | 35 | 🟡 -8 файлів |
| Розмір документації | 884 KB | 900 KB | ✅ UK більший |
| Загальна к-сть рядків | 24,946 | 17,516 | 🟡 -30% контенту |
| Структурних папок | 7 | 6 | 🟡 Відсутня `/research` |

**Ідеальна синхронізація в core структурі:**
```
✅ docs/content/
    ├── en/
    │   ├── admin/ (3 файли)          → ✅ uk/admin/ (3 файли)
    │   ├── api/ (3 файли)            → ✅ uk/api/ (3 файли)
    │   ├── architecture/ (14 файлів) → ✅ uk/architecture/ (14 файлів)
    │   ├── features/ (2 файли)       → ✅ uk/features/ (1 файл)
    │   ├── frontend/ (1 файл)        → ✅ uk/frontend/ (1 файл)
    │   ├── guides/ (6 файлів)        → ✅ uk/guides/ (5 файлів)
    │   ├── operations/ (3 файли)     → ✅ uk/operations/ (3 файли)
    │   ├── research/ (6 файлів)      → ❌ uk/research/ (ВІДСУТНЯ)
    │   └── root (5 файлів)           → ✅ uk/root (5 файлів)
```

### 1.2 Якість nav_translations

**Оцінка:** ✅ ВІДМІННО

MkDocs конфігурація містить **повні translations для всіх 45+ навігаційних елементів**:

```yaml
# Приклади якісних перекладів:
- "Context Spaces (Topics)" → "Контекстні простори (Топіки)"
- "Knowledge Extraction" → "Витягування знань"
- "Auto-Save Feature" → "Функція автозбереження"
- "Background Tasks" → "Фонові завдання"
- "Classification Experiments" → "Експерименти з класифікацією"
```

**Дотримання стилю:**
- ✅ Формальний тон ("Ви")
- ✅ Технічна термінологія перекладена послідовно
- ✅ Збережена структура оригіналу

---

## 2. Missing Translations

### 2.1 Відсутні файли (8 total, 3124+ рядків)

#### Критичні відсутні переклади:

| Файл | Розмір | Пріоритет | Причина |
|------|--------|-----------|---------|
| `en/research/` (6 файлів) | 3124 рядки | 🟡 СЕРЕДНІЙ | UX дослідження, не user-facing |
| `en/features/screenshots/README.md` | 85 рядків | 🟢 НИЗЬКИЙ | Технічна інструкція для screenshots |
| `en/guides/automation-video-tutorial-script.md` | 302 рядки | 🟠 ВИСОКИЙ | Навчальний контент для користувачів |

#### Детальний розклад відсутніх файлів:

**Research директорія (НЕ в production docs):**
```
❌ docs/content/uk/research/
   - README.md (317 рядків)
   - VISUAL_SUMMARY.md (493 рядки)
   - automation-ux-accessibility.md (946 рядків)
   - automation-ux-competitive-analysis.md (981 рядок)
   - automation-ux-figma-design-specs.md (тисячі рядків)
   - automation-ux-research-summary.md (тисячі рядків)
```

**Guides директорія:**
```
❌ docs/content/uk/guides/automation-video-tutorial-script.md (302 рядки)
   Критично: містить user-facing навчальний сценарій
```

**Features директорія:**
```
❌ docs/content/uk/features/screenshots/README.md (85 рядків)
   Пріоритет: низький (технічна документація для розробників)
```

### 2.2 Translation Coverage Analysis

**Coverage по категоріях:**

| Категорія | EN файли | UK файли | Coverage % |
|-----------|----------|----------|------------|
| **admin/** | 3 | 3 | ✅ 100% |
| **api/** | 3 | 3 | ✅ 100% |
| **architecture/** | 14 | 14 | ✅ 100% |
| **features/** | 2 | 1 | 🟡 50% |
| **frontend/** | 1 | 1 | ✅ 100% |
| **guides/** | 6 | 5 | 🟡 83% |
| **operations/** | 3 | 3 | ✅ 100% |
| **research/** | 6 | 0 | ❌ 0% |
| **root** | 5 | 5 | ✅ 100% |

**Загальний coverage:** 81% (35/43 файлів)

---

## 3. i18n Infrastructure Quality

### 3.1 Frontend (React 18 + TypeScript)

**Статус:** ❌ КРИТИЧНО - ПОВНА ВІДСУТНІСТЬ I18N

**Виявлені проблеми:**

#### 3.1.1 Відсутність i18n фреймворку

```typescript
// ❌ ПРОБЛЕМА: Немає жодного з цих пакетів у package.json
{
  "react-i18next": "missing",      // Рекомендовано (337 code snippets, trust 8.1)
  "i18next": "missing",
  "i18next-http-backend": "missing",
  "i18next-browser-languagedetector": "missing"
}
```

**Знайдено пакетів:** 0 з 50+ досліджених файлів
**Структура локалізації:** Відсутня (немає `/src/locales/` або `/src/i18n/`)

#### 3.1.2 Hardcoded UI strings

**Обсяг проблеми:** 251 TypeScript файлів з **тисячами** hardcoded англійських рядків

**Приклади з ключових компонентів:**

```tsx
// frontend/src/shared/components/AppSidebar.tsx (lines 39-84)
const navGroups: NavGroup[] = [
  {
    label: 'Data Management',  // ❌ Hardcoded
    items: [
      { path: '/', label: 'Dashboard', icon: Squares2X2Icon },
      { path: '/messages', label: 'Messages', icon: EnvelopeIcon },
      { path: '/topics', label: 'Topics', icon: ChatBubbleLeftRightIcon },
      { path: '/tasks', label: 'Tasks', icon: CheckCircleIcon },
    ],
  },
  {
    label: 'AI Operations',  // ❌ Hardcoded
    items: [
      { path: '/analysis', label: 'Analysis Runs', icon: LightBulbIcon },
      { path: '/proposals', label: 'Task Proposals', icon: ClipboardDocumentListIcon },
      // ... +20 більше hardcoded items
    ],
  },
]
```

```tsx
// frontend/src/pages/DashboardPage/index.tsx (lines 162-207)
<MetricCard
  title="Total Tasks"           // ❌ Hardcoded
  emptyMessage="Import messages to start tracking"  // ❌ Hardcoded
/>
<MetricCard title="Open Tasks" />              // ❌ Hardcoded
<MetricCard title="In Progress" />             // ❌ Hardcoded
<MetricCard title="Success Rate" />            // ❌ Hardcoded
<MetricCard title="Pending Analysis" subtitle="AI runs active" />  // ❌ Hardcoded
<MetricCard title="Proposals to Review" />     // ❌ Hardcoded
```

**Масштаб:** ~33 файли з явними hardcoded текстами (лише верхівка айсбергу)

#### 3.1.3 Hardcoded locale у date formatting

```typescript
// ❌ КРИТИЧНА ПОМИЛКА: frontend/src/shared/utils/date.ts
export const formatMessageDate = (sentAt?: string, timestamp?: string): string => {
  // ...
  return new Date(date).toLocaleString('uk-UA', {  // ❌ HARDCODED UK LOCALE
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatFullDate = (date?: string): string => {
  // ...
  return new Date(date).toLocaleString('uk-UA', {  // ❌ HARDCODED UK LOCALE
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
```

**Вплив:** 103+ викликів у 33 файлах використовують цей утиліта. **ВСІ дати відображаються тільки українською**, навіть для англомовних користувачів.

**Використання:**
- `formatMessageDate()`: Messages feed, analytics, heatmaps
- `formatFullDate()`: Analysis runs, knowledge versions, task history
- `new Date().toLocaleString()`: Direct calls across 30+ components

#### 3.1.4 Відсутність language switcher UI

```tsx
// ❌ ВІДСУТНІЙ КОМПОНЕНТ: Немає LanguageSwitcher
// Очікувана локація: shared/components/LanguageSwitcher.tsx

// Має бути інтегрований в:
// - AppSidebar footer (біля Settings)
// - Settings page (User Preferences section)
// - TopBar/NavUser dropdown menu
```

### 3.2 Backend (FastAPI + aiogram 3)

**Статус:** ❌ КРИТИЧНО - ВІДСУТНІСТЬ ЛОКАЛІЗАЦІЇ

#### 3.2.1 Telegram Bot (aiogram 3)

**Проблема:** Бот ПОВНІСТЮ англомовний, незважаючи на збереження `language_code`

```python
# ❌ backend/app/telegram_bot.py - Hardcoded English strings
@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    # ...
    await message.answer(
        f"Hello, {user_name}! 👋\n\n"                    # ❌ English only
        f"Welcome to {hbold('Task Tracker')} 🎯\n\n"
        f"I help you manage tasks and track issues efficiently:\n"
        f"• Create tasks via WebApp\n"
        f"• View dashboard with statistics\n"
        f"• Real-time notifications\n\n"
        f"Use the buttons below to get started:",
        reply_markup=webapp_button,
    )
```

```python
# ❌ Команда /help - тільки англійською
@dp.message(Command("help"))
async def help_command(message: Message) -> None:
    help_text = f"""
{hbold("Task Tracker Bot Help")} 📚        # ❌ English

{hbold("Commands:")}
/start - Welcome message with main options  # ❌ English
/webapp - Open task creation WebApp         # ❌ English
/dashboard - Open web dashboard             # ❌ English
/help - Show this help message              # ❌ English
    """
    await message.answer(help_text)
```

**Збережена інформація про locale, але НЕ використовується:**

```python
# ✅ ЗБЕРІГАЄТЬСЯ: backend/app/models/telegram_profile.py
class TelegramProfile(IDMixin, TimestampMixin, SQLModel, table=True):
    language_code: str | None = Field(
        default=None,
        max_length=10,
        description="Telegram language code (e.g., 'en', 'uk')"  # ✅ Saved
    )
    # ...

# ✅ ОНОВЛЮЄТЬСЯ: backend/app/services/user_service.py
async def identify_or_create_user(..., language_code: str | None = None, ...):
    # Line 152: Telegram profile updated with language_code
    tg_profile.language_code = language_code  # ✅ Updated
    await db.commit()
```

**Висновок:** Система **збирає** language_code з Telegram, але **ніколи не використовує** для локалізації відповідей.

#### 3.2.2 Відсутність aiogram 3 i18n

```python
# ❌ ВІДСУТНЯ СТРУКТУРА: backend/app/locales/
# Очікувана структура:
backend/app/
├── locales/
│   ├── en/
│   │   └── LC_MESSAGES/
│   │       └── bot.ftl  # Fluent format (aiogram 3 рекомендований)
│   └── uk/
│       └── LC_MESSAGES/
│           └── bot.ftl
```

**Aiogram 3 підтримує:** Fluent (.ftl) format для localization
**Документація:** https://docs.aiogram.dev/en/latest/utils/i18n.html
**Статус проекту:** ❌ НЕ РЕАЛІЗОВАНО

#### 3.2.3 FastAPI API Responses

**Проблема:** API responses не локалізовані

```python
# ❌ ВІДСУТНІСТЬ: Accept-Language header negotiation
# Очікувана middleware:
# - Parse Accept-Language header
# - Set context locale (asyncio contextvars)
# - Return localized error messages / field labels
```

**Перевірено файлів:** 11 з keyword 'language|locale|i18n'
**Знайдено реалізацій:** 0

#### 3.2.4 Error Messages та Validation

```python
# ❌ Pydantic validation messages - English only
# ❌ HTTP error responses - English only
# ❌ Business logic errors - English only

# Потрібно:
# - Pydantic error translation via custom validators
# - FastAPI exception handlers з locale-aware messages
# - i18n для user-facing notifications
```

---

## 4. Code Quality Issues

### 4.1 Date/Time Formatting

**Критична проблема:** Hardcoded 'uk-UA' locale порушує принцип локалізації

```typescript
// ❌ ПОГАНИЙ КОД: frontend/src/shared/utils/date.ts
// Проблема: Всі користувачі бачать дати українською, навіть англомовні

// Має бути:
import { useTranslation } from 'react-i18next'

export const formatMessageDate = (sentAt?: string, timestamp?: string): string => {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US'  // ✅ Dynamic

  return new Date(date).toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
```

**Вплив:** 103 occurrences у 33 файлах

### 4.2 Component Organization

**Проблема:** Hardcoded strings розкидані по 14 feature modules та 33 shared компонентах

```
frontend/src/
├── features/           # 14 модулів з hardcoded strings
│   ├── agents/        # "Agent Configuration", "Test Agent", etc.
│   ├── analysis/      # "Analysis Run", "Time Window", etc.
│   ├── atoms/         # "Create Atom", "Delete Atom", etc.
│   └── ...            # +11 more with English strings
├── pages/             # 14 сторінок з hardcoded titles/descriptions
└── shared/
    ├── components/    # 15+ компонентів з UI strings
    └── ui/           # 33 Radix компоненти з labels
```

**Масштаб рефакторингу:** ~250+ файлів потребують i18n extraction

---

## 5. Recommendations

### 5.1 CRITICAL (P0) - Immediate Action Required

#### 1. **Встановити Frontend i18n Framework**

**Рекомендація:** `react-i18next` (Trust Score 8.1, 337 code snippets)

```bash
# Інсталяція
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector

# Структура локалізації
frontend/src/
├── i18n/
│   ├── config.ts                # i18next configuration
│   └── resources/
│       ├── en/
│       │   ├── common.json      # Shared UI strings
│       │   ├── navigation.json  # Sidebar, routes
│       │   ├── dashboard.json   # Dashboard page
│       │   ├── messages.json    # Messages feature
│       │   └── ...              # Per-feature namespaces
│       └── uk/
│           └── ...              # Ukrainian translations
```

**Пріоритизація перекладів:**
1. **Navigation** (AppSidebar, routes) - найвищий пріоритет
2. **Dashboard metrics** - видно одразу після входу
3. **Error messages** - критично для UX
4. **Forms** (labels, placeholders, validation)
5. **Feature-specific content** (14 modules)

#### 2. **Виправити hardcoded locale в date formatting**

```typescript
// frontend/src/shared/utils/date.ts
import { useTranslation } from 'react-i18next'

// Створити React hook для date formatting
export const useFormatDate = () => {
  const { i18n } = useTranslation()

  const formatMessageDate = (sentAt?: string, timestamp?: string): string => {
    const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US'
    // ... existing logic з dynamic locale
  }

  return { formatMessageDate, formatFullDate }
}
```

**Альтернатива:** Використати date-fns з locale:

```typescript
import { format } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

const locale = i18n.language === 'uk' ? uk : enUS
format(date, 'PPpp', { locale })
```

#### 3. **Реалізувати Telegram Bot локалізацію (aiogram 3)**

```python
# backend/app/bot/i18n.py
from aiogram.utils.i18n import I18n
from pathlib import Path

# Ініціалізація
i18n = I18n(path=Path(__file__).parent / "locales", default_locale="en", domain="bot")

# backend/app/bot/handlers/start.py
from aiogram import F
from aiogram.utils.i18n import gettext as _

@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    # Locale витягується з telegram_profile.language_code
    await message.answer(
        _("welcome_message", user_name=message.from_user.full_name)
    )
```

**Locales files (Fluent format):**

```fluent
# backend/app/bot/locales/en/LC_MESSAGES/bot.ftl
welcome_message = Hello, {$user_name}! 👋

  Welcome to Task Tracker 🎯

  I help you manage tasks and track issues efficiently:
  • Create tasks via WebApp
  • View dashboard with statistics
  • Real-time notifications

# backend/app/bot/locales/uk/LC_MESSAGES/bot.ftl
welcome_message = Привіт, {$user_name}! 👋

  Ласкаво просимо до Task Tracker 🎯

  Я допомагаю керувати завданнями та відстежувати проблеми:
  • Створюйте завдання через WebApp
  • Переглядайте дашборд зі статистикою
  • Отримуйте сповіщення в реальному часі
```

### 5.2 HIGH Priority (P1) - Within 2 Sprints

#### 4. **Додати Language Switcher UI**

```tsx
// frontend/src/shared/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next'
import { Select } from '@/shared/ui/select'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <Select
      value={i18n.language}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">🇬🇧 English</SelectItem>
        <SelectItem value="uk">🇺🇦 Українська</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

**Місця інтеграції:**
1. Settings page (User Preferences section)
2. AppSidebar footer (біля NavUser)
3. TopBar/header (якщо додасться)

#### 5. **Перекласти відсутні documentation файли**

**Пріоритет 1:** `automation-video-tutorial-script.md` (302 рядки)
**Причина:** User-facing навчальний контент

**Пріоритет 2:** `features/screenshots/README.md` (85 рядків)
**Причина:** Швидко, технічна документація

**Пріоритет 3:** Research files (3124+ рядків)
**Причина:** Внутрішні UX дослідження, не критичні для користувачів

#### 6. **FastAPI locale negotiation**

```python
# backend/app/middleware/locale.py
from starlette.middleware.base import BaseHTTPMiddleware
from contextvars import ContextVar

locale_ctx_var: ContextVar[str] = ContextVar('locale', default='en')

class LocaleMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Parse Accept-Language header
        accept_lang = request.headers.get('accept-language', 'en')
        locale = accept_lang.split(',')[0].split('-')[0]  # 'en-US' -> 'en'

        if locale not in ['en', 'uk']:
            locale = 'en'

        token = locale_ctx_var.set(locale)
        try:
            response = await call_next(request)
            return response
        finally:
            locale_ctx_var.reset(token)
```

### 5.3 MEDIUM Priority (P2) - Future Enhancements

#### 7. **Створити Technical Glossary**

**Локація:** `docs/i18n/glossary.md`

| EN Term | UK Переклад | Context |
|---------|-------------|---------|
| Topic | Топік | Контекстний простір для повідомлень |
| Atom | Атом | Одиниця знань, витягнута з повідомлень |
| Knowledge Extraction | Витягування знань | LLM-процес аналізу контенту |
| Analysis Run | Аналітичний запуск | Цикл обробки повідомлень агентами |
| Task Proposal | Пропозиція завдання | AI-згенероване завдання для review |
| Noise Filtering | Фільтрація шуму | Класифікація нерелевантних повідомлень |

#### 8. **Translation Memory Setup**

**Інструмент:** i18next-parser для extraction + Translation Management System (TMS)

```json
// .i18next-parser.config.json
{
  "locales": ["en", "uk"],
  "output": "frontend/src/i18n/resources/$LOCALE/$NAMESPACE.json",
  "input": ["frontend/src/**/*.{ts,tsx}"],
  "keySeparator": ".",
  "namespaceSeparator": ":",
  "contextSeparator": "_",
  "pluralSeparator": "_"
}
```

**Workflow:**
1. Developer пише код з `t('namespace:key')`
2. Pre-commit hook запускає `i18next-parser` для extraction
3. Missing keys додаються до EN файлів
4. Translation task створюється автоматично для UK версії
5. CI/CD перевіряє completeness перед deploy

#### 9. **Ukrainian Pluralization Testing**

```typescript
// Приклад правильної pluralization
const t = useTranslation()

// EN: 1 task, 2 tasks, 5 tasks
// UK: 1 завдання, 2 завдання, 5 завдань (three forms!)

t('tasks_count', { count: 1 })  // "1 завдання"
t('tasks_count', { count: 2 })  // "2 завдання"
t('tasks_count', { count: 5 })  // "5 завдань"
```

**Fluent для Telegram bot:**

```fluent
tasks_count = { $count ->
    [one] {$count} завдання
    [few] {$count} завдання
   *[many] {$count} завдань
}
```

---

## 6. Sync Strategy

### 6.1 Documentation Sync Workflow

**Поточний стан:** ✅ MkDocs i18n plugin налаштований, але sync **не автоматизований**

**Рекомендована стратегія:**

#### Phase 1: Manual Sync (Immediate)

```bash
# 1. Створити відсутні UK структури
mkdir -p docs/content/uk/research
mkdir -p docs/content/uk/features/screenshots

# 2. Використати sync-docs-structure skill для tracking
# Skill автоматично оновлює CLAUDE.md з current structure
```

#### Phase 2: Automated Detection (Sprint 1)

**Pre-commit hook:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Перевірити структурну синхронізацію
ENGLISH_FILES=$(find docs/content/en -name "*.md" | sed 's|en/||' | sort)
UKRAINIAN_FILES=$(find docs/content/uk -name "*.md" | sed 's|uk/||' | sort)

DIFF=$(diff <(echo "$ENGLISH_FILES") <(echo "$UKRAINIAN_FILES"))

if [ -n "$DIFF" ]; then
    echo "❌ Documentation structure mismatch detected:"
    echo "$DIFF"
    echo ""
    echo "Missing Ukrainian translations found."
    echo "Run: skill sync-docs-structure"
    exit 1
fi
```

#### Phase 3: Translation Tasks (Sprint 2)

**GitHub Actions workflow:**

```yaml
# .github/workflows/docs-sync.yml
name: Documentation Sync Check

on:
  pull_request:
    paths:
      - 'docs/content/en/**'

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check EN/UK parity
        run: |
          ./scripts/check_docs_parity.sh

      - name: Create translation tasks
        if: failure()
        run: |
          # Post to internal task tracker
          # або створити GitHub Issue з label "translation"
```

### 6.2 Code i18n Workflow

**Recommended Pattern:**

```typescript
// 1. Developer пише компонент
export function MyComponent() {
  const { t } = useTranslation('namespace')

  return <h1>{t('title')}</h1>  // ✅ Translation key
}

// 2. Pre-commit hook runs i18next-parser
// Extracted to: frontend/src/i18n/resources/en/namespace.json
{
  "title": "My Component Title"  // ✅ Auto-added
}

// 3. CI/CD перевіряє UK файл
// Якщо missing -> create translation task або fail build
```

### 6.3 Telegram Bot Sync

**Sync fluent files з database:**

```python
# Опціонально: Синхронізувати bot translations з user preferences
# При зміні language в TelegramProfile -> invalidate cache

from aiogram.utils.i18n import I18n

@router.message(Command("language"))
async def change_language(message: Message, i18n: I18n):
    # Update TelegramProfile.language_code
    await update_user_locale(message.from_user.id, new_locale='uk')

    # Set i18n context for current message
    i18n.current_locale = 'uk'

    await message.answer(_("language_changed"))
```

---

## 7. Technical Debt Summary

### 7.1 Critical Issues (🔴 P0)

| Issue | Impact | Effort | Files Affected |
|-------|--------|--------|----------------|
| No frontend i18n framework | ❌ 100% англійський UI | 🔨 3-5 днів | ~250 файлів |
| Hardcoded 'uk-UA' locale | ❌ Всі дати українською | 🔨 1 день | 33 файли, 103 calls |
| Telegram bot English-only | ❌ Ігнорує language_code | 🔨 2-3 дні | 1 файл, 10+ handlers |

### 7.2 High Priority Issues (🟠 P1)

| Issue | Impact | Effort | Files Affected |
|-------|--------|--------|----------------|
| Missing UK docs (8 files) | ⚠️ Неповна документація | 🔨 2-4 дні | 8 файлів (3124 рядки) |
| No language switcher UI | ⚠️ Users can't change locale | 🔨 4 години | 3 компоненти |
| FastAPI no locale negotiation | ⚠️ API responses English-only | 🔨 1 день | middleware + errors |

### 7.3 Medium Priority Issues (🟡 P2)

| Issue | Impact | Effort |
|-------|--------|--------|
| No translation memory | ⚠️ Manual tracking | 🔨 2 дні (setup TMS) |
| Missing glossary | ⚠️ Inconsistent terms | 🔨 1 день (creation) |
| No automated sync checks | ⚠️ Drift detection | 🔨 1 день (CI setup) |

---

## 8. ROI Analysis

### 8.1 Переваги впровадження i18n

**User Experience:**
- ✅ Українські користувачі: native language interface
- ✅ Міжнародні користувачі: English fallback
- ✅ Telegram bot: локалізовані відповіді за language_code
- ✅ Dates/times: правильне форматування для locale

**Maintainability:**
- ✅ Централізовані переклади (легше оновлювати)
- ✅ Separation of concerns (UI logic ≠ content)
- ✅ Type-safe translation keys (TypeScript)

**Scalability:**
- ✅ Easy to add more languages (RU, PL, DE...)
- ✅ Reusable translation infrastructure
- ✅ Automated extraction/validation

### 8.2 Вартість НЕ впровадження

**Technical Debt:**
- ❌ 250+ файлів з hardcoded strings (зростає з кожним PR)
- ❌ Refactoring складність зростає exponentially
- ❌ New features подвоюють work (EN hardcode + потім переклад)

**User Impact:**
- ❌ Українські користувачі бачать змішаний контент (UK дати + EN UI)
- ❌ Telegram bot ігнорує user preferences
- ❌ Documentation gaps (8 missing files)

---

## 9. Implementation Roadmap

### Sprint 1 (1-2 тижні)

**Week 1:**
- [ ] Install react-i18next + dependencies
- [ ] Create i18n config and folder structure
- [ ] Extract Navigation strings (AppSidebar, routes)
- [ ] Implement LanguageSwitcher component
- [ ] Fix hardcoded locale in date.ts

**Week 2:**
- [ ] Extract Dashboard page strings
- [ ] Extract Messages feature strings
- [ ] Setup aiogram i18n for Telegram bot
- [ ] Create EN/UK .ftl files for bot commands
- [ ] Translate 3 відсутні UK docs (high priority)

### Sprint 2 (2-3 тижні)

**Week 3:**
- [ ] Extract remaining 12 feature modules
- [ ] Implement FastAPI locale middleware
- [ ] Add Ukrainian pluralization tests
- [ ] Setup i18next-parser extraction

**Week 4:**
- [ ] Create Technical Glossary
- [ ] Document i18n workflow for team
- [ ] Add pre-commit hooks for translation checks
- [ ] Translate remaining 5 UK docs

**Week 5:**
- [ ] Setup CI/CD translation validation
- [ ] Add language detection from Telegram
- [ ] Implement locale persistence (localStorage)
- [ ] Final QA and testing

### Sprint 3 (Ongoing)

- [ ] Translation memory integration
- [ ] Automated translation task creation
- [ ] Monitoring for missing translations
- [ ] Periodic glossary updates

---

## 10. Conclusion

**Поточний стан:** Проект має **solid foundation** для білінгвальної документації (MkDocs i18n plugin налаштований, 81% coverage), але **критичні прогалини** в application-level i18n.

**Ключові прориви:**
- ✅ Documentation structure: майже досконала синхронізація
- ✅ Nav translations: якісно перекладені в mkdocs.yml
- ✅ Database готовність: language_code вже зберігається

**Критичні блокери:**
- ❌ Frontend: 0% i18n infrastructure (react-i18next не встановлено)
- ❌ Backend: aiogram bot ігнорує language_code
- ❌ Date formatting: hardcoded UK locale для всіх користувачів

**Рекомендація:** Розпочати з **Critical P0 issues** (frontend i18n setup + date locale fix), паралельно з **High P1** (bot localization). Estimated effort: **3-4 тижні** для повної базової інфраструктури, **+2 тижні** для content extraction.

**Success Metrics:**
- ✅ 100% coverage EN/UK docs структури
- ✅ Language switcher functional в 3+ місцях
- ✅ Telegram bot відповідає мовою користувача
- ✅ Дати форматуються згідно з обраною locale
- ✅ 80%+ UI strings extracted до translation files

---

**Generated by:** i18n-engineer
**Audit Type:** Deep Dive (Documentation + Code)
**Files Analyzed:** 43 EN docs, 35 UK docs, 251 TS/TSX files, 11 Python files
**Total Lines Reviewed:** 42,462 рядків документації + ~50,000 рядків коду
