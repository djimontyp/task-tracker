---
title: "Manual Regression & Development Roadmap"
created: 2025-12-28
updated: 2025-12-28
tags:
  - план
  - qa
  - roadmap
  - пріоритети
status: active
---

# Manual Regression & Development Roadmap

> ==QA Checklist + Product Direction==

## 📊 Поточний стан системи

| Метрика | Значення |
|---------|----------|
| Сторінок | 15 |
| API endpoints | 26+ |
| Backend tests | 996 |
| Frontend tests | 51 unit + E2E stubs |
| Stories | 280+ |
| Topics | 5 |
| Atoms | 50 (16 pending, 34 approved) |
| Messages | 100+ (seed) |

**Сервіси:** Всі healthy (postgres, nats, api, worker, dashboard, nginx)

---

## 🧪 Manual Regression Test Plan

### Priority 1: Core User Flows (Critical)

Ці flows **MUST** працювати без збоїв:

#### 1.1 Dashboard → Overview

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Відкрити `/` | Hero greeting + metrics завантажились | ⬜ |
| 2 | Перевірити "Today's Focus" | Показує pending atoms (якщо є) | ⬜ |
| 3 | Перевірити "Recent Insights" | Показує останні atoms | ⬜ |
| 4 | Перевірити метрики | Messages, Atoms, Topics counts | ⬜ |
| 5 | Theme toggle | Light ↔ Dark працює | ⬜ |
| 6 | Language switch | UK ↔ EN працює | ⬜ |

#### 1.2 Messages → Signal Detection

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Відкрити `/messages` | Список messages з'явився | ⬜ |
| 2 | Smart Filters tabs | "Усі / Сигнали / Шум" працюють | ⬜ |
| 3 | Filter persistence | URL params зберігаються | ⬜ |
| 4 | Message card | Content, timestamp, source видно | ⬜ |
| 5 | Empty state | "Тиша в ефірі" якщо пусто | ⬜ |

#### 1.3 Topics → Knowledge Organization

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Відкрити `/topics` | Grid карток topics | ⬜ |
| 2 | Smart Filters | "Усі / Активні / Архівовані" | ⬜ |
| 3 | Topic card | Name, icon, color, counts | ⬜ |
| 4 | Click topic | Redirect to `/topics/:id` | ⬜ |
| 5 | Topic detail | Messages + Atoms пов'язані | ⬜ |
| 6 | Create topic | Form validation + save | ⬜ |

#### 1.4 Atoms → Knowledge Extraction

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Відкрити `/atoms` | Список atoms | ⬜ |
| 2 | Smart Filters | "Усі / Pending / Approved / Rejected" | ⬜ |
| 3 | Atom card | Type badge, title, confidence | ⬜ |
| 4 | Approve atom | Status → Approved | ⬜ |
| 5 | Reject atom | Status → Rejected | ⬜ |
| 6 | Create atom | Dialog + validation | ⬜ |

### Priority 2: Settings & Configuration

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Settings page | Tabs: General, Sources | ⬜ |
| 2 | Theme setting | Persist across sessions | ⬜ |
| 3 | Language setting | Persist across sessions | ⬜ |
| 4 | Telegram integration | Status indicator works | ⬜ |
| 5 | Admin mode (⌘⇧A) | Toggle advanced features | ⬜ |

### Priority 3: Search & Navigation

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Global search | Dropdown з results | ⬜ |
| 2 | Search topics | Filter by name | ⬜ |
| 3 | Search atoms | Filter by title/content | ⬜ |
| 4 | Breadcrumbs | Path navigation works | ⬜ |
| 5 | Sidebar navigation | All links work | ⬜ |
| 6 | Mobile menu | Responsive collapse | ⬜ |

### Priority 4: LLM & AI Features

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Providers page | List LLM providers | ⬜ |
| 2 | Provider status | Connected/Error badge | ⬜ |
| 3 | Add Ollama | Validation + model list | ⬜ |
| 4 | Add OpenAI | API key validation | ⬜ |
| 5 | Agents page | List AI agents | ⬜ |
| 6 | Agent config | Prompt, model selection | ⬜ |

### Priority 5: Edge Cases & Error States

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | API down | Error boundary + retry | ⬜ |
| 2 | Empty lists | Humanized empty states | ⬜ |
| 3 | Long content | Truncation + tooltip | ⬜ |
| 4 | Invalid route | 404 page | ⬜ |
| 5 | Form validation | Error messages visible | ⬜ |
| 6 | Network slow | Loading skeletons | ⬜ |

---

## 🎯 Development Vectors (Priority Order)

### Vector 1: 🔥 Telegram Integration (HIGH)

**Чому важливо:** Основне джерело даних для продукту

**Поточний стан:**
- ✅ Webhook endpoint (`/webhook/telegram`)
- ✅ Message ingestion pipeline
- ⚠️ UI для конфігурації (Settings → Telegram tab)
- ❌ Bot token validation UI
- ❌ Channel/group selection UI
- ❌ Real-time ingestion status

**Задачі:**
1. [ ] Telegram Bot setup wizard в Settings
2. [ ] Channel selector з preview
3. [ ] Ingestion status dashboard (real-time)
4. [ ] Error handling + retry UI

**Impact:** Без Telegram — немає свіжих даних

---

### Vector 2: 📊 Executive Summary (HIGH)

**Чому важливо:** Ключова цінність для користувача

**Поточний стан:**
- ✅ Backend endpoint (`/api/v1/executive-summary`)
- ✅ ExecutiveSummaryPage stub
- ❌ LLM-generated insights
- ❌ Time period selector
- ❌ Export to PDF/Markdown

**Задачі:**
1. [ ] Wire up LLM для генерації summary
2. [ ] Period picker (Today/Week/Month)
3. [ ] Key metrics visualization
4. [ ] Action items extraction
5. [ ] Share/Export functionality

**Impact:** Головна причина використовувати продукт

---

### Vector 3: 🔍 Search Enhancement (MEDIUM)

**Чому важливо:** Швидкий доступ до накопичених знань

**Поточний стан:**
- ✅ Search API (`/api/v1/search`)
- ✅ SearchBar component
- ⚠️ Basic keyword search
- ❌ Semantic search (embeddings)
- ❌ Filters in search

**Задачі:**
1. [ ] Semantic search with pgvector
2. [ ] Search filters (type, date, topic)
3. [ ] Search history
4. [ ] Keyboard shortcuts (⌘K)

**Impact:** Productivity boost для daily use

---

### Vector 4: 🤖 AI Pipeline Reliability (MEDIUM)

**Чому важливо:** Core intelligence системи

**Поточний стан:**
- ✅ Classification agent
- ✅ Extraction agent
- ⚠️ Error handling в pipeline
- ❌ Retry mechanism UI
- ❌ Quality metrics dashboard

**Задачі:**
1. [ ] Pipeline health dashboard
2. [ ] Retry failed extractions UI
3. [ ] Quality score tracking
4. [ ] A/B testing prompts

**Impact:** Reliable knowledge extraction

---

### Vector 5: 📱 Mobile UX (LOW but VISIBLE)

**Чому важливо:** Telegram users = mobile users

**Поточний стан:**
- ✅ Responsive breakpoints
- ⚠️ Touch targets (44px mostly)
- ⚠️ Mobile navigation
- ❌ PWA manifest
- ❌ Offline support

**Задачі:**
1. [ ] PWA configuration
2. [ ] Touch gesture navigation
3. [ ] Bottom navigation bar
4. [ ] Offline cached dashboard

**Impact:** Mobile-first audience

---

### Vector 6: 🔔 Notifications & Alerts (LOW)

**Чому важливо:** Proactive value delivery

**Поточний стан:**
- ✅ WebSocket infrastructure
- ❌ Push notifications
- ❌ Email digests
- ❌ Telegram bot replies

**Задачі:**
1. [ ] Daily digest email
2. [ ] Critical alert notifications
3. [ ] Telegram bot for queries
4. [ ] Notification preferences

**Impact:** Engagement & retention

---

## 📋 Recommended Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Foundation (Q1 2025)                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ 1. Telegram Setup   │──│ 2. Executive Summary│          │
│  │    Wizard           │  │    MVP              │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  PHASE 2: Intelligence (Q1 2025)                           │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ 3. Semantic Search  │──│ 4. AI Pipeline      │          │
│  │                     │  │    Dashboard        │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  PHASE 3: Engagement (Q2 2025)                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ 5. Mobile PWA       │──│ 6. Notifications    │          │
│  │                     │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Quick Wins (можна зробити зараз)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Telegram bot token input | 2h | HIGH |
| 2 | Executive Summary skeleton | 2h | HIGH |
| 3 | ⌘K search shortcut | 30min | MEDIUM |
| 4 | PWA manifest | 1h | LOW |
| 5 | Daily digest email stub | 2h | MEDIUM |

---

## 🚫 Не робити зараз

| Feature | Причина |
|---------|---------|
| Multi-user auth | Поки solo use case |
| Slack integration | Focus on Telegram first |
| Custom AI models | Ollama/OpenAI достатньо |
| Mobile native apps | PWA first |
| Analytics dashboard | Executive Summary важливіше |

---

## Пов'язане

- [[pulse-radar-renovation]] — UI/UX план (✅ completed)
- [[frontend-transformation]] — Code quality (✅ completed)
- [[../знання/архітектура/features]]
- [[../знання/якість/playwright]] — E2E testing

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2025-12-28 | Initial plan created |
