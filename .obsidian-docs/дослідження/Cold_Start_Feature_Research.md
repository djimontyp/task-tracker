---
title: "Cold Start Feature — Дослідження"
created: 2026-01-04
updated: 2026-01-04
tags:
  - дослідження
  - frontend
  - backend
  - onboarding
  - ux
status: completed
---

# Cold Start Feature — Дослідження

> Комплексне дослідження функціоналу Cold Start для Pulse Radar: імпорт історії, налаштування глибини, захищена очистка даних.

## Мета дослідження

Спроектувати UX та технічну архітектуру для:
1. **History Import** — імпорт історичних повідомлень з Telegram при першому запуску
2. **Per-Source Depth** — налаштування глибини імпорту для кожного джерела
3. **Data Wipe** — очистка даних з multi-step confirmation (admin only)

## Контекст

**Проблема:** При холодному старті система порожня. Користувач підключає Telegram, але має чекати на нові повідомлення — немає негайної цінності.

**Рішення:** Після підключення джерела — опція імпорту історії з налаштуванням глибини.

## Знахідки

### Поточний стан Backend

| Компонент | Статус | Файл |
|-----------|--------|------|
| `POST /api/v1/ingestion/telegram` | ✅ Готовий | `backend/app/api/v1/ingestion.py` |
| `MessageIngestionJob` model | ✅ Готовий | `backend/app/models/message_ingestion.py` |
| `TelegramIngestionService` | ✅ Готовий | `backend/app/services/telegram_ingestion_service.py` |
| WebSocket events | ✅ Готовий | `ingestion.started/progress/completed` |
| Time-based depth | ❌ Потрібно | Додати `time_since` filter |
| Data Wipe endpoint | ❌ Потрібно | З confirmation token |

### Поточний стан Frontend

| Компонент | Статус | Примітки |
|-----------|--------|----------|
| Admin Mode toggle | ✅ Готовий | `useAdminMode()` hook, Cmd+Shift+A |
| SetupWizard | ❌ Потрібно | Epic [[task-tracker-hk8]] |
| History Import UI | ❌ Потрібно | Wizard Step 1 |
| Data Wipe UI | ❌ Потрібно | Settings (admin only) |

### Admin Mode

Існуючий механізм:
- Hook: `useAdminMode()` з `frontend/src/shared/hooks/useAdminMode.ts`
- Toggle: Cmd+Shift+A (macOS) / Ctrl+Shift+A (Win/Linux)
- Store: `uiStore.isAdminMode`
- UI: `AdminPanel` компонент показує admin-only features

## User Flows

### Cold Start Import

```
Dashboard (empty)
      ↓
SetupWizard (4-step grid)
      ↓
Step 1: Connect Sources
├─ Connect Telegram (existing)
└─ [NEW] Import History
    ├─ Depth: 24h / 7d / 30d / All
    ├─ Warning для "All" (rate limits)
    └─ Start Import
      ↓
Progress (WebSocket real-time)
      ↓
Step 2: Create First Project
```

### Data Wipe (Admin Only)

```
Settings → Sources → Telegram
      ↓
[Admin Mode активний]
      ↓
Danger Zone (visible only in admin)
      ↓
"Clear All Data"
      ↓
Step 1: Intent Confirmation
├─ Показати affected counts
└─ Cancel | Continue
      ↓
Step 2: Type Confirmation
├─ Input: type "DELETE"
└─ Button disabled until match
      ↓
Step 3: Cooldown (5 sec)
├─ Countdown + progress bar
└─ Cancel (auto-focused)
      ↓
Success → return to Settings
```

## Wireframes

### Import Section (Wizard Step 1)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon: Download]  Import Message History                        │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  Import historical messages from connected groups.               │
│                                                                  │
│  How far back?                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ( ) Skip import      (start with new messages only)       │ │
│  │  ( ) Last 24 hours    (47 messages)                        │ │
│  │  (•) Last 7 days      (312 messages)   [Recommended]       │ │
│  │  ( ) Last 30 days     (1,489 messages)                     │ │
│  │  ( ) All available    (4,721 messages) [!] Long processing │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Icon: Info] Counts fetched from Telegram. May vary slightly.   │
│                                                                  │
│  > [!warning] "All available" may hit Telegram API rate limits  │
│  > and require longer processing time for AI analysis.           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Icon: Play]  Start Import                          (h-11) ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Error State (Estimate Failed)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon: Download]  Import Message History                        │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  How far back?                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ( ) Skip import                                           │ │
│  │  ( ) Last 24 hours    (Estimate unavailable)               │ │
│  │  (•) Last 7 days      (Estimate unavailable)               │ │
│  │  ( ) Last 30 days     (Estimate unavailable)               │ │
│  │  ( ) All available    (Estimate unavailable)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  > [!error] Failed to fetch message counts                       │
│  > Rate limited. Try again in 42 seconds.                        │
│  >                                                               │
│  > ┌────────────────────────────┐                                │
│  > │  [Icon: RefreshCw] Retry   │                                │
│  > └────────────────────────────┘                                │
│                                                                  │
│  [Icon: Info] You can still import - counts are for reference.   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Icon: Play]  Start Import Anyway                   (h-11) ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Import Progress

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon: Loader]  Importing...                                    │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 67%      │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Fetched   │  │   Stored    │  │   Skipped   │              │
│  │     234     │  │     220     │  │      14     │              │
│  │ (from API)  │  │   (new)     │  │(duplicates) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  **Skipped** = дублікати (external_message_id вже є в БД)        │
│  Сценарії: re-import, overlap з real-time, часткові імпорти      │
│                                                                  │
│  Elapsed: 1:23                                                   │
│                                                                  │
│  [Cancel Import]                                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Data Wipe Section (Admin Only)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Icon: AlertTriangle]  Danger Zone                              │
│  ─────────────────────────────────────────────────────────────── │
│  (border-destructive)                        [Badge: Admin Only] │
│                                                                  │
│  Clear all imported data. Your Telegram connection               │
│  will remain active.                                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Icon: Trash2]  Clear All Data                      (h-11) ││
│  │                  variant=destructive                        ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Рішення

### Depth Configuration
**Time-based:** Skip / 24h / 7d / 30d / All available
- **Skip** — пропустити імпорт (може немає історії або хочеться тільки нові)
- При "All" — попередження про rate limits та довгу обробку

### Source Adapter Abstraction (NEW)

**Вимога:** Фетчити реальну кількість повідомлень перед імпортом.

```python
class SourceAdapter(ABC):
    @abstractmethod
    async def get_message_count(self, chat_id: str, since: datetime | None) -> MessageCountResult:
        """Get estimated message count."""
        pass

    @abstractmethod
    async def fetch_history(self, chat_id: str, since: datetime | None) -> AsyncIterator[RawMessage]:
        """Fetch historical messages."""
        pass

@dataclass
class MessageCountResult:
    count: int | None      # None якщо не вдалось
    is_estimate: bool      # True якщо приблизна оцінка
    error: str | None      # Повідомлення про помилку
```

**Error handling:**
- Rate limit → показати retry timer
- Auth error → reconnect prompt
- Network error → retry button
- Unknown → "Estimate unavailable" + дозволити імпорт

**Tests:**
- Unit tests для SourceAdapter implementations
- Integration tests з mocked Telegram API
- E2E tests для повного import flow

### Data Wipe Scope
**Keep sources connected** — видаляти messages/atoms/topics, Telegram bot залишається підключеним

### Admin Implementation
Використати існуючий `useAdminMode()` hook — Data Wipe видимий тільки коли `isAdminMode === true`

### Confirmation Pattern
**3-step confirmation** (industry standard для destructive operations):
1. Intent — показати що буде видалено
2. Explicit — type "DELETE"
3. Cooldown — 5 секунд з можливістю скасувати

## Файли

### Backend (створити)

**Source Adapters:**
| Файл | Призначення |
|------|-------------|
| `backend/app/services/source_adapters/base.py` | Abstract SourceAdapter class |
| `backend/app/services/source_adapters/telegram.py` | TelegramSourceAdapter |
| `backend/tests/services/source_adapters/test_telegram_adapter.py` | Unit tests |

**Admin & Data Wipe:**
| Файл | Призначення |
|------|-------------|
| `backend/app/api/v1/admin.py` | Data wipe endpoints |
| `backend/app/models/confirmation_token.py` | Token model (5 min TTL) |
| `backend/app/services/data_wipe_service.py` | Wipe logic + audit |
| `backend/tests/api/test_admin.py` | Admin API tests |
| `backend/tests/services/test_data_wipe.py` | Wipe service tests |

### Backend (змінити)

| Файл | Зміни |
|------|-------|
| `backend/app/api/v1/ingestion.py` | Add time-based depth + estimate endpoint |
| `backend/app/api/v1/router.py` | Include admin router |

### Frontend (створити)

**Onboarding:**
| Файл | Призначення |
|------|-------------|
| `frontend/src/features/onboarding/components/HistoryImportSection.tsx` | Import UI with counts |
| `frontend/src/features/onboarding/components/ImportProgress.tsx` | Progress tracking |
| `frontend/src/features/onboarding/components/MessageCountDisplay.tsx` | Show estimate/error |
| `frontend/src/features/onboarding/hooks/useHistoryImport.ts` | TanStack Query + WS |
| `frontend/src/features/onboarding/hooks/useMessageEstimate.ts` | Fetch message counts |
| `frontend/src/features/onboarding/__tests__/HistoryImportSection.test.tsx` | Component tests |
| `frontend/src/features/onboarding/__tests__/useMessageEstimate.test.ts` | Hook tests |

**Data Wipe:**
| Файл | Призначення |
|------|-------------|
| `frontend/src/pages/SettingsPage/.../DataWipeSection.tsx` | Admin wipe UI |
| `frontend/src/pages/SettingsPage/.../hooks/useDataWipe.ts` | Wipe hooks |
| `frontend/src/pages/SettingsPage/.../__tests__/DataWipeSection.test.tsx` | Tests |

### Frontend (змінити)

| Файл | Зміни |
|------|-------|
| `frontend/src/pages/DashboardPage/index.tsx` | Conditional wizard render |
| `frontend/src/pages/SettingsPage/.../TelegramSettingsSheet.tsx` | Add DataWipeSection |

## Beads Integration

Розширює існуючий epic [[task-tracker-hk8]]:
- **hk8.3** (Wizard Step 1) → + History Import UI
- **hk8.1** (SetupWizard) → + Progress indicator

## Висновки

1. **Backend 90% готовий** — потрібно тільки time-based depth та Data Wipe endpoint
2. **Admin Mode існує** — використати `useAdminMode()` hook
3. **Import = Wizard Step 1** — після підключення Telegram
4. **3-step confirmation** — стандарт для destructive operations
5. **Keep sources** — wipe видаляє дані, не налаштування

## Пов'язане

- [[task-tracker-hk8]] — Dashboard Cold Start Wizard epic
- [[entity-hierarchy]] — Topics > Atoms > Messages
- [[llm-extraction-pipeline]] — AI processing після імпорту
