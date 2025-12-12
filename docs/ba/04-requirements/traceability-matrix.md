# Traceability Matrix

**Продукт:** Pulse Radar
**Статус:** 🟢 Approved
**Дата:** 2025-12-10

---

## Purpose

Матриця зв'язків між артефактами для tracking coverage та impact analysis.

```
User Story → Use Case → Acceptance Criteria → Component → Test
```

---

## MVP Stories Traceability

### US-001: Dashboard Overview

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-001 | Dashboard Overview |
| **Use Case** | UC-001 | View Daily Dashboard |
| **Acceptance Criteria** | AC-001.1 | Dashboard loads with metrics |
| | AC-001.2 | Activity chart displays |
| | AC-001.3 | Recent atoms section |
| | AC-001.4 | Empty state handling |
| **Components** | DashboardPage | `frontend/src/pages/DashboardPage.tsx` |
| | MetricCard | `frontend/src/shared/components/MetricCard/` |
| | ActivityChart | `frontend/src/features/dashboard/` |
| **API** | GET /api/v1/dashboard/metrics | Dashboard metrics endpoint |
| **Tests** | dashboard.spec.ts | E2E tests |

---

### US-002: Signal/Noise Filter

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-002 | Signal/Noise Filter |
| **Use Case** | UC-002 | Filter Messages by Signal/Noise |
| **Acceptance Criteria** | AC-002.1 | Default filter shows signals |
| | AC-002.2 | Toggle to show all |
| | AC-002.3 | Badge appearance |
| | AC-002.4 | Noise reclassification |
| **Components** | MessagesPage | `frontend/src/pages/MessagesPage.tsx` |
| | MessageFilter | `frontend/src/features/messages/` |
| | SignalBadge | `frontend/src/shared/components/` |
| **API** | GET /api/v1/messages?classification=signal | Filtered messages |
| | PATCH /api/v1/messages/{id}/classification | Reclassify |
| **Tests** | messages-filter.spec.ts | E2E tests |

---

### US-003: Today's Atoms

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-003 | Today's Atoms |
| **Use Case** | UC-003 | Review Today's Atoms |
| **Acceptance Criteria** | AC-003.1 | Atoms grouped by type |
| | AC-003.2 | Atom card content |
| | AC-003.3 | Approve atom |
| | AC-003.4 | Reject atom |
| | AC-003.5 | Edit atom |
| **Components** | AtomsPage | `frontend/src/pages/AtomsPage.tsx` |
| | AtomCard | `frontend/src/features/atoms/` |
| | AtomDetailModal | `frontend/src/features/atoms/` |
| **API** | GET /api/v1/atoms?date=today | Today's atoms |
| | PATCH /api/v1/atoms/{id}/status | Approve/Reject |
| | PUT /api/v1/atoms/{id} | Edit atom |
| **Tests** | atoms.spec.ts | E2E tests |

---

### US-010: Executive Summary

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-010 | Executive Summary |
| **Use Case** | UC-010 | Generate Weekly Summary |
| **Acceptance Criteria** | AC-010.1 | Weekly summary generation |
| | AC-010.2 | Summary grouped by topic |
| | AC-010.3 | Export summary |
| | AC-010.4 | Drill-down to detail |
| **Components** | ReportsPage | `frontend/src/pages/ReportsPage.tsx` |
| | WeeklySummary | `frontend/src/features/reports/` |
| | ExportButton | `frontend/src/shared/components/` |
| **API** | GET /api/v1/reports/weekly | Weekly summary |
| | GET /api/v1/reports/weekly/export | PDF export |
| **Tests** | reports.spec.ts | E2E tests |

---

### US-020: Keyword Search

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-020 | Keyword Search |
| **Use Case** | UC-020 | Search Knowledge Base |
| **Acceptance Criteria** | AC-020.1 | Search input behavior |
| | AC-020.2 | Search results display |
| | AC-020.3 | Open search result |
| | AC-020.4 | No results handling |
| | AC-020.5 | Search performance |
| **Components** | SearchModal | `frontend/src/features/search/` |
| | SearchResults | `frontend/src/features/search/` |
| | HeaderSearch | `frontend/src/shared/components/` |
| **API** | GET /api/v1/search?q={query} | Search endpoint |
| **Tests** | search.spec.ts | E2E tests |

---

### US-030: User Invitation

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-030 | User Invitation |
| **Use Case** | UC-030 | Invite Team Member |
| **Acceptance Criteria** | AC-030.1 | Invite form validation |
| | AC-030.2 | Send invite via email |
| | AC-030.3 | Copy invite link |
| | AC-030.4 | Invitee registration |
| | AC-030.5 | Duplicate prevention |
| **Components** | UsersSettings | `frontend/src/pages/SettingsPage.tsx` |
| | InviteModal | `frontend/src/features/settings/` |
| | UsersList | `frontend/src/features/settings/` |
| **API** | POST /api/v1/invitations | Create invite |
| | GET /api/v1/invitations | List pending |
| | POST /api/v1/auth/register | Complete registration |
| **Tests** | invitations.spec.ts | E2E tests |

---

### US-031: LLM Provider Setup

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-031 | LLM Provider Setup |
| **Use Case** | UC-031 | Configure LLM Provider |
| **Acceptance Criteria** | AC-031.1 | Add OpenAI provider |
| | AC-031.2 | Add Ollama provider |
| | AC-031.3 | Connection test failure |
| | AC-031.4 | Set default provider |
| | AC-031.5 | API key security |
| **Components** | ProvidersSettings | `frontend/src/pages/SettingsPage.tsx` |
| | ProviderForm | `frontend/src/features/settings/` |
| | ProviderCard | `frontend/src/features/settings/` |
| **API** | POST /api/v1/providers | Create provider |
| | POST /api/v1/providers/{id}/test | Test connection |
| | PATCH /api/v1/providers/{id}/default | Set default |
| **Tests** | providers.spec.ts | E2E tests |

---

### US-033: Telegram Integration

| Layer | ID | Description |
|-------|-----|-------------|
| **Story** | US-033 | Telegram Integration |
| **Use Case** | UC-033 | Connect Telegram Channel |
| **Acceptance Criteria** | AC-033.1 | Setup wizard display |
| | AC-033.2 | Verify connection |
| | AC-033.3 | Verification failure |
| | AC-033.4 | Multiple channels |
| | AC-033.5 | Message ingestion |
| | AC-033.6 | Disconnect channel |
| **Components** | TelegramSettings | `frontend/src/pages/SettingsPage.tsx` |
| | SetupWizard | `frontend/src/features/settings/` |
| | ChannelsList | `frontend/src/features/settings/` |
| **API** | POST /webhook/telegram | Webhook receiver |
| | POST /api/v1/integrations/telegram/verify | Verify |
| | DELETE /api/v1/integrations/telegram/{id} | Disconnect |
| **Tests** | telegram.spec.ts | E2E tests |

---

## Coverage Summary

### By Story

| Story | UC | AC Count | Components | API Endpoints | Tests |
|-------|-----|----------|------------|---------------|-------|
| US-001 | UC-001 | 4 | 3 | 1 | 1 |
| US-002 | UC-002 | 4 | 3 | 2 | 1 |
| US-003 | UC-003 | 5 | 3 | 3 | 1 |
| US-010 | UC-010 | 4 | 3 | 2 | 1 |
| US-020 | UC-020 | 5 | 3 | 1 | 1 |
| US-030 | UC-030 | 5 | 3 | 3 | 1 |
| US-031 | UC-031 | 5 | 3 | 3 | 1 |
| US-033 | UC-033 | 6 | 3 | 3 | 1 |
| **Total** | **8** | **38** | **24** | **18** | **8** |

### Coverage Gaps

| Gap | Status | Action |
|-----|--------|--------|
| NFR tests | ⚠️ | Add performance tests |
| Mobile E2E | ⚠️ | Add mobile viewport tests |
| Error scenarios | ⚠️ | Add error handling tests |

---

## Impact Analysis

Якщо змінюється артефакт — що ще потрібно оновити:

### Story Change Impact

```
US-XXX змінюється
    │
    ├─► UC-XXX: Оновити flows
    ├─► AC-XXX.*: Оновити criteria
    ├─► Components: Можлива зміна UI
    ├─► API: Можлива зміна endpoints
    └─► Tests: Обов'язкове оновлення
```

### API Change Impact

```
API endpoint змінюється
    │
    ├─► Components: Оновити fetch calls
    ├─► Tests: Оновити API mocks
    └─► AC: Перевірити criteria
```

### Component Change Impact

```
Component змінюється
    │
    ├─► Storybook: Оновити stories
    ├─► Tests: Оновити component tests
    └─► AC: Перевірити UI criteria
```

---

## How to Use This Matrix

### For Developers
1. Перед implementation — знайди Story в матриці
2. Подивись linked AC — це твої test cases
3. Подивись Components — це файли для зміни
4. Після implementation — перевір всі AC

### For QA
1. Знайди Story для testing
2. Використовуй AC як test cases
3. Перевір linked API endpoints
4. Mark AC as tested

### For BA
1. При зміні requirements — use Impact Analysis
2. Оновлюй всі linked артефакти
3. Notify affected team members

---

**Related:** [User Stories](./user-stories.md) | [Use Cases](./use-cases.md) | [Acceptance Criteria](./acceptance-criteria.md)
