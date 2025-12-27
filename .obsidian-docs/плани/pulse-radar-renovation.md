---
title: "Pulse Radar Renovation"
created: 2025-12-27
tags:
  - план
  - ux
  - локалізація
  - humanizing
status: active
---

# Pulse Radar Renovation

> ==Від "CRUD-адмінки" до "Розумного Асистента"==

## Проблеми (Audit Summary)

| Проблема | Опис |
|----------|------|
| 🔴 Мовна каша | 50% укр / 50% англ |
| 🔴 Візуальний шум | Різні кнопки, конфлікт кольорів |
| 🔴 "Адмінка" | Сухі таблиці, технічні терміни |
| 🟡 Tech debt | Legacy `Task` model |

---

## Фаза 1: Фундамент (Consistency)

### 1.1 Локалізація 🇺🇦 ✅ DONE (005-i18n)

- [x] Sidebar, Header, Footer — українською
- [x] Dashboard — бейджі ("Critical" → "Критично")
- [x] Messages — кнопки ("Ingest" → "Завантажити")
- [x] Atoms — типи ("Problem" → "Проблема")
- [x] Винести хардкод-рядки в i18n словник

> Реалізовано через feature 005-i18n: react-i18next, 8 namespace файлів (uk/en)

### 1.2 Візуальна уніфікація 🎨

- [x] Кнопки: `h-10` primary, `h-9` secondary ✅ 2025-12-27
- [x] Кольори зафіксувати: ✅ 2025-12-27 (100% semantic tokens)
  - 🔵 Primary (дія) — Indigo/Blue
  - 🟠 Warning — Amber/Orange
  - 🔴 Critical — Red
  - 🟢 Success — Emerald
- [x] Typography: Sentence case ✅ 2025-12-27 (62 fixes)

---

## Фаза 2: Humanizing (UX)

### 2.1 Messages → News Feed 📰

- [x] Header з зведенням ("Сьогодні: 5 сигналів, 2 потребують уваги") ✅ 2025-12-27
- [x] Empty State: "Тиша в ефірі ☕️" ✅ 2025-12-27
- [x] Action Cards з кнопками ("Створити Атом", "Ігнорувати") ✅ 2025-12-27

### 2.2 Dashboard → Живий пульс 🫀

**Status:** 75% реалізовано ✅ 2025-12-27

- [x] Hero greeting: "Добрий ранок/день/вечір, Макс!" ✅ (DashboardPresenter.tsx:75)
- [x] Hero subtitle динамічний: ✅ 2025-12-27 (i18n keys додано)
  - **Варіанти:** "Проєкт рухається стабільно" / "Є 3 сигнали що потребують уваги" / "Тиша в ефірі ☕️"
  - **Логіка:** на основі `insights.data` та `metrics.data`
  - **Компонент:** `DashboardHeroSubtitle.tsx`
- [x] Today's Focus блок: ✅ 2025-12-27
  - **Компонент:** `pages/DashboardPage/components/TodaysFocus.tsx`
  - **Stories:** 7 variants (Default, AllTypes, SingleItem, Loading, Empty, LongTitles, MoreThanThree)
  - **i18n:** uk/en localization
  - **Link:** `/atoms?status=pending_review`
- [x] Microcopy для RecentInsights: ✅ 2025-12-28
  - **Було:** "Останні важливі"
  - **Стане:** "Що нового" / "What's New"
  - **i18n:** Full localization з atom types
  - **Компонент:** `RecentInsights.tsx` refactored

### 2.3 Навігація 🧭

**Status:** Smart Filters реалізовано! ✅ 2025-12-27

- [x] NavBreadcrumbs компонент ✅ (shared/layouts/MainLayout/NavBreadcrumbs.tsx)
- [x] useBreadcrumbs hook ✅ (shared/layouts/MainLayout/useBreadcrumbs.ts)
- [x] Mobile/Desktop variants ✅
- [x] Smart Filters для MessagesPage: ✅ 2025-12-27
  - **Компоненти:** `SmartFilters.tsx`, `useFilterParams.ts`
  - **Pattern:** Radix Tabs з count badges
  - **UX:** `[Усі (124)] [Сигнали (47)] [Шум (77)]`
  - **Spec:** [[../знання/ux/smart-filters-spec]] — повна специфікація
- [x] Filter persistence: ✅ 2025-12-27
  - **Store:** URL query params (`?filter=signals`, `?filter=noise`)
  - **Hook:** `useFilterParams()` з react-router-dom
  - **i18n:** uk/en локалізація
- [x] Smart Filters для інших сторінок: ✅ 2025-12-28
  - **TopicsPage:** `[Усі] [Активні] [Архівовані]` + URL sync
  - **AtomsPage:** `[Усі] [Pending] [Approved] [Rejected]` + URL sync
  - **Компоненти:** TopicsSmartFilters.tsx, AtomsSmartFilters.tsx
  - **Stories:** 22 total (11 + 11)

### 2.4 Juice ✨

**Status:** CSS анімації вже є, framer-motion — опціонально

- [x] CSS `animate-fade-in-up` ✅ (DashboardPresenter, PageWrapper)
- [x] Staggered animations (animationDelay) ✅
- [ ] Framer Motion (OPTIONAL):
  - **Встановлення:** `npm install framer-motion`
  - **Використання:** Складні transitions, gesture animations
  - **Priority:** Low (CSS достатньо для MVP)
- [x] Humanized Loading states: ✅ 2025-12-27
  - **Компонент:** `shared/components/HumanizedLoader/`
  - **Stories:** 10 variants (Analyzing, Loading, Connecting, Processing, Ukrainian)
- [x] **Content-aware Skeletons:** ✅ 2025-12-27
  - **Папка:** `shared/components/ContentSkeletons/`
  - **Компоненти:** 5 skeleton груп (MetricCard, Insight, Topic, Message, TodaysFocus)
  - **Stories:** 20+ variants в `ContentSkeletons.stories.tsx`
  - **Exports:** через `shared/components/index.ts`

---

## Фаза 3: Tech Cleanup 🧹

**Status:** Потребує координації backend + frontend

### 3.1 Legacy Task/Source Models

- [ ] Видалити `backend/app/models/legacy.py`:
  - **Містить:** `Task`, `Source` classes
  - **Використовується:** `scripts/seed_db.py`
  - **Залежності:** перевірити чи є API endpoints
- [ ] Оновити `scripts/seed_db.py`:
  - **Замінити:** Task → Message/Atom seeding
  - **Альтернатива:** видалити повністю, використовувати `seed_topics_atoms.py`
- [ ] Видалити frontend залишки:
  - **Перевірити:** `features/tasks/` — чи є dead code
  - **Store:** `tasksStore.ts` — чи використовується

### 3.2 Dead Dependencies

- [x] Видалити `socket.io-client`: ✅ 2025-12-28
  - **Причина:** Використовується Native WebSocket
  - **Статус:** Вже видалено раніше, підтверджено
- [ ] Аудит невикористаних пакетів:
  - **Інструмент:** `npx depcheck`
  - **Дія:** Видалити все що не imports

### 3.3 Database Migrations

- [ ] Перевірити чи є Task таблиця в PostgreSQL
- [ ] Створити міграцію для видалення (якщо є)
- [ ] Оновити `just db-*` команди

---

## 📊 Progress Summary

| Фаза | Виконано | Залишилось | Прогрес |
|------|----------|------------|---------|
| 1.1 Локалізація | 5/5 | 0 | ✅ 100% |
| 1.2 Візуальна уніфікація | 3/3 | 0 | ✅ 100% |
| 2.1 Messages | 3/3 | 0 | ✅ 100% |
| 2.2 Dashboard | 4/4 | 0 | ✅ 100% |
| 2.3 Навігація | 6/6 | 0 | ✅ 100% |
| 2.4 Juice | 4/4 | 0 | ✅ 100% |
| 3 Tech Cleanup | 3/8 | 5 | ⏳ 38% |

**Total: 28/33 (85%)**

---

## 🎯 Quick Wins (наступні кроки)

1. ~~**Smart Filters tabs** — 1h, better UX~~ ✅ 2025-12-27
2. ~~**Today's Focus блок** — 1h, dashboard value~~ ✅ 2025-12-27
3. ~~**Content-aware Skeletons** — 1h, better UX~~ ✅ 2025-12-27
4. **socket.io-client removal** — 5 min, cleanup
5. **Microcopy RecentInsights** — 15 min, localization
6. **Framer Motion** — optional polish

---

## Порядок виконання

```
Фаза 2.2 (Dashboard) → Фаза 2.3 (Filters) → Фаза 3 (Cleanup) → Фаза 2.4 (Polish)
```

> Спочатку user-facing improvements, потім tech debt

---

## Microcopy приклади

| Було (Database View) | Стане (Product View) |
|---------------------|---------------------|
| "Список повідомлень (0)" | "Тиша в ефірі ☕️" |
| "Atom ID: 5543 (Problem)" | "🔴 Виявлено проблему в Auth" |
| Кнопка "Create" | "Зафіксувати думку" |

---

## Пов'язане

- [[frontend-transformation]] — технічний план (архітектура, ESLint)
- [[../знання/дизайн-система/patterns]] — UI patterns
- [[../знання/якість/eslint-правила]] — Design System enforcement
