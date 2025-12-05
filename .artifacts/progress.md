# Pulse Radar - Прогрес стабілізації

## Огляд
- **Розпочато:** 2025-11-30
- **Статус:** ✅ MVP Верифіковано (10/10)
- **Всього features:** 30
- **MVP features:** 10
- **Core Flow:** `Telegram → Інгест → AI-екстракція → Атом → Топік → Дашборд`

---

## 🎯 Roadmap

### MVP (10 features) — Фокус зараз
> Мінімальний продукт: інгест → екстракція → перегляд

| ID | Feature | Статус | Чому критично |
|----|---------|--------|---------------|
| F001 | Telegram інгест | ✅ | Вхідна точка даних |
| F002 | Повідомлення CRUD | ✅ | Бачити що прийшло |
| F003 | AI-екстракція знань | ✅ | **Core value** |
| F004 | Управління топіками | ✅ | Організація знань |
| F005 | Управління атомами | ✅ | Результат екстракції |
| F006 | Дашборд | ✅ | Entry point |
| F008 | LLM-провайдери | ✅ | Без цього F003 не працює |
| F019 | Health Check | ✅ | Діагностика |
| F026 | Фонові задачі (TaskIQ) | ✅ | Критично для F003 |
| F030 | Сторінка налаштувань | ✅ | UI для F008 |

### v1.1 (5 features) — Після MVP
> Покращення UX: реалтайм, пошук, тестування

| ID | Feature | Опис |
|----|---------|------|
| F007 | WebSocket реалтайм | Оновлення без refresh |
| F009 | AI-агенти | Конфігурація та тестування |
| F011 | Семантичний пошук | Векторний пошук по знаннях |
| F018 | API ембедінгів | Потрібно для F011 |
| F024 | API інгесту | Ручний інгест для тестування |

### v1.2 (5 features) — Розширення
> Розширення функціоналу

| ID | Feature | Опис |
|----|---------|------|
| F010 | Призначення задач агентам | Workflow обробки |
| F012 | Повнотекстовий пошук | PostgreSQL FTS |
| F013 | Конфігурація проєктів | Multi-project support |
| F017 | Історія версій | Версіонування атомів/топіків |
| F021 | Управління користувачами | Базовий user management |

### 🕐 Later (5 features) — Відкладено
> Потребує даних або передчасна оптимізація

| ID | Feature | Причина |
|----|---------|---------|
| F014 | Фільтрація шуму | Потребує даних для калібрування |
| F015 | Правила автоматизації | Передчасна оптимізація |
| F016 | Заплановані задачі | Не потрібно для MVP |
| F025 | Авто-затвердження | Передчасно |
| F027 | Скоринг важливості | Оптимізація |

### 💤 Dormant (5 features) — Не чіпаємо
> Код є, але не активний

| ID | Feature | Примітка |
|----|---------|----------|
| F020 | Метрики WebSocket | Не пріоритет |
| F022 | Конфігурація задач | Можливо legacy |
| F023 | Управління промптами | Hardcoded достатньо |
| F028 | RAG Context Builder | Експериментальне |
| F029 | Онбординг автоматизації | Залежить від F015 |

---

## Статистика

```
MVP:     ██████████ 10 features (33%)
v1.1:    █████ 5 features (17%)
v1.2:    █████ 5 features (17%)
Later:   █████ 5 features (17%)
Dormant: █████ 5 features (17%)
```

---

## Наступні кроки

1. **Запустити сервіси:** `just services-dev`
2. **Верифікувати MVP features:** F001 → F030
3. **Приховати dormant з UI** (опціонально)
4. **Після MVP** — перейти до v1.1

---

## Журнал сесій

### 2025-11-30 - Глибока інвентаризація
- [x] Проскановано 23 API router файли (116+ endpoints)
- [x] Проскановано 14 frontend pages
- [x] Ідентифіковано 30 features
- [x] Визначено MVP (10 features)
- [x] Категоризовано решту: v1.1, v1.2, later, dormant
- [x] Оновлено `stabilization.json`

### 2025-11-30 - MVP Верифікація (Playwright)
- [x] F001 Telegram інгест - API endpoints ready, Settings UI
- [x] F002 Messages CRUD - DataTable, фільтри, пагінація
- [x] F003 AI-екстракція - `/api/v1/knowledge/extract` endpoint
- [x] F004 Topics - Grid/List view, пошук
- [x] F005 Atoms - `/api/v1/atoms` API working
- [x] F006 Dashboard - Heatmap, Recent sections, WebSocket
- [x] F008 LLM Providers - Settings → Providers tab
- [x] F019 Health Check - `{"status":"healthy"}`
- [x] F026 TaskIQ Worker - Container healthy
- [x] F030 Settings - General, Sources, Providers tabs

**Результат:** 10/10 MVP features працюють ✅

### 2025-11-30 - Приховання dormant features
- [x] Закоментовано AI Operations (Noise Filtering - F014)
- [x] Закоментовано Automation group (F015, F016)
- [x] Перевірено UI через Playwright - sidebar чистий
- [x] Код залишено для майбутнього використання

**Sidebar після cleanup:**
- Data Management: Overview, Messages, Topics
- AI Setup: Agents, Task Templates, Projects

### 2025-11-30 - Clean shadcn UI Theme (F031) ⚠️ PARTIAL
- [x] Видалено `theme.css` (340 рядків Material Design)
- [x] Замінено `index.css` на shadcn Orange theme (288→89 рядків)
- [x] Очищено `tailwind.config.js` (198→75 рядків)
- [x] Видалено brand colors: `br-orange`, `br-peach`, `br-navy`, etc.
- [x] Замінено `badge-*` класи на Tailwind colors в 4 компонентах
- [ ] **UI НЕ ВІДОБРАЖАЄТЬСЯ КОРЕКТНО** — потребує фіксу

### 2025-11-30 - F031 UI Stabilization ✅ COMPLETE
**Координатор:** Claude (Opus 4.5)
**Агенти:** F1 (React Frontend Expert), U1 (UX/UI Expert)

**Phase 0: Critical Fix**
- [x] Видалено `App.css` (1006 рядків legacy CSS з dead vars)
- [x] Файл не імпортувався — безпечне видалення
- [x] Верифікація: UI рендериться коректно

**Phase 1A: Navbar Cleanup (F1)**
- [x] Heroicons → Lucide (Settings, Search, Menu)
- [x] Hover: `hover:bg-accent/40` → `hover:bg-muted`
- [x] Borders: `border-border/60` → `border-border`
- [x] Видалено dead files: NavbarActions.tsx, NavbarBreadcrumb.tsx, NavbarLogo.tsx

**Phase 1B: Sidebar Cleanup (U1)**
- [x] Видалено `getHoverClasses()` функцію
- [x] Hover → `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
- [x] Видалено `hoverColor` prop з types.ts

**Змінені файли:**
- `frontend/src/App.css` — ВИДАЛЕНО
- `frontend/src/shared/layouts/MainLayout/Navbar.tsx` — icons + hover
- `frontend/src/shared/layouts/MainLayout/NavbarActions.tsx` — ВИДАЛЕНО
- `frontend/src/shared/layouts/MainLayout/NavbarBreadcrumb.tsx` — ВИДАЛЕНО
- `frontend/src/shared/layouts/MainLayout/NavbarLogo.tsx` — ВИДАЛЕНО
- `frontend/src/shared/components/AppSidebar/NavMain.tsx` — hover cleanup
- `frontend/src/shared/components/AppSidebar/NavNotifications.tsx` — hover cleanup
- `frontend/src/shared/components/AppSidebar/index.tsx` — removed hoverColor
- `frontend/src/shared/components/AppSidebar/types.ts` — removed hoverColor prop

**Верифікація:**
- Screenshot: `.playwright-mcp/phase1-verification.png`
- Dashboard, Sidebar, Navbar — все працює

**Результат:** F031 `partial` → `works` ✅

**Додатковий fix (після feedback):**
- [x] Закоментовано AI Operations група (Noise Filtering)
- [x] Закоментовано Automation група
- [x] Закоментовано GlobalKnowledgeExtractionDialog (Extract Knowledge кнопка)
- Screenshot: `.playwright-mcp/dormant-hidden-final.png`

**Фінальний sidebar:**
- Data Management: Overview, Messages, Topics
- AI Setup: Agents, Task Templates, Projects

### 2025-11-30 - F032 UX/UI Accessibility (WCAG 2.1 AA)
**Координатор:** Claude (Opus 4.5)
**Агенти:** U1 (UX/UI Expert), F1 (React Frontend Expert)

**Phase 1: Quick Wins (паралельно)**

*U1 (CSS Foundation):*
- [x] Semantic color tokens (index.css:40-52,88-100)
- [x] Tailwind config color aliases (tailwind.config.js:64-78)
- [x] Focus indicators 3px (index.css:117-129)

*F1 (Component Updates):*
- [x] AtomCard color tokens (AtomCard.tsx:12-20)
- [x] ValidationStatus color tokens + icons (ValidationStatus.tsx:25-38)
- [x] ProjectCard color tokens (ProjectCard.tsx:75)
- [x] Touch targets 44×44px (button.tsx:17, sidebar.tsx:156, NavMain.tsx:22,28)
- [x] Navbar status icons (Navbar.tsx:35-57)

**Phase 2: E2E Tests**
- [x] @axe-core/playwright integration
- [x] accessibility.spec.ts (13 tests across 6 suites)

**WCAG Violations Fixed:**
- ✅ 2.4.7 Focus Visible (3px outline with offset)
- ✅ 2.5.5 Target Size (44×44px minimum)
- ✅ 1.4.1 Use of Color (icons + text, not color-only)
- ✅ 1.4.3 Contrast (semantic tokens, axe-core verified)

**Змінені файли:**
- `frontend/src/index.css` — tokens, focus styles
- `frontend/src/tailwind.config.js` — color aliases
- `frontend/src/shared/ui/button.tsx` — touch targets
- `frontend/src/shared/ui/sidebar.tsx` — touch targets
- `frontend/src/shared/components/AppSidebar/NavMain.tsx` — touch targets
- `frontend/src/shared/layouts/MainLayout/Navbar.tsx` — status icons
- `frontend/src/features/atoms/components/AtomCard.tsx` — color tokens
- `frontend/src/features/providers/components/ValidationStatus.tsx` — tokens, icons
- `frontend/src/features/projects/components/ProjectCard.tsx` — color tokens
- `frontend/tests/e2e/accessibility.spec.ts` — E2E tests

**Тести:** 13 E2E tests (axe-core WCAG scan, focus, touch targets, status icons, theme toggle, keyboard nav)

**Результат:** F032 `in_progress` → `works` ✅

### 2025-11-30 - F033 Dashboard Content Polish
**Координатор:** Claude (Opus 4.5)
**Агенти:** U1 (UX/UI Expert), F1 (React Frontend Expert) — паралельно

**Phase 1: CSS Foundation (U1)**
- [x] `tailwind.config.js` — animations (fade-in, fade-in-up), xs breakpoint
- [x] `index.css` — shadow tokens (--shadow-card), heatmap colors (--heatmap-telegram/slack/email)
- [x] Reduced motion support (prefers-reduced-motion)

**Phase 2: Components (F1)**
- [x] `ActivityHeatmap.tsx` — CSS variables замість hardcoded SOURCE_COLORS, responsive cells
- [x] `TopicCard.tsx` — var(--shadow-card), typography normalization (text-base, text-sm, text-xs)
- [x] `RecentTopics.tsx` — flex overflow-x-auto для tabs, responsive max-height
- [x] `TrendingTopics.tsx` — typography normalization

**Верифікація:**
- TypeScript: ✅ Pass
- Light mode: ✅ Shadows visible
- Dark mode: ✅ Heatmap colors adapt
- Mobile 375px: ✅ Tabs scrollable, layout responsive
- Screenshots: `.playwright-mcp/dashboard-*.png`

**Результат:** F033 `new` → `works` ✅

### 2025-12-01 - F034 Navbar-Sidebar Harmony (TDD) ⚠️ IN PROGRESS
**Координатор:** Claude (Opus 4.5)
**Агенти:** U1 (UX/UI Expert), F1 (React Frontend Expert)

**Дослідження (паралельно):**
- [x] UX аудит: navbar sizes, spacing, transitions
- [x] Frontend аналіз: sidebar collapse mechanism, CSS vars
- [x] shadcn docs: sidebar component patterns

**TDD Тести:**
- [x] `tests/e2e/navbar-sidebar.spec.ts` — 17 тестів
- [x] Logo size consistency
- [x] Smooth transitions
- [x] Visual harmony

**Фікси зроблені:**
- [x] `Navbar.tsx` — unified `size-8` (removed responsive sizing)
- [x] `AppSidebar/index.tsx` — transitions для gap, padding, opacity
- [x] `sidebar.tsx` — `top-14 bottom-0` замість `inset-y-0` (z-index fix)

**⚠️ ПРОБЛЕМА (для наступної сесії):**
- [ ] **DUPLICATE LOGO** — navbar має logo І sidebar header має logo
- [ ] Рішення: прибрати один з логотипів (лишити тільки в navbar АБО sidebar)

**Варіанти рішення:**
1. Прибрати SidebarHeader з логотипом (лишити тільки в navbar)
2. Прибрати логотип з navbar (лишити тільки в sidebar)
3. Показувати sidebar logo тільки в collapsed state

**Скріншоти:**
- `.playwright-mcp/final-fix-expanded.png`
- `.playwright-mcp/final-fix-collapsed.png`

### 2025-12-04 - Design System Full Sync (Epic)
**План:** `~/.claude/plans/frolicking-forging-clarke.md`
**Координатор:** Claude (Opus 4.5)
**Агенти:** U1 (UX/UI Expert), F1 (React Frontend Expert)
**Скіли:** project-stabilizer, agent-coordinator, frontend

**Мета:** Повна синхронізація фронтенду з Design System документацією

**Phase 0: Adapt Frontend-Design Skill ✅ DONE**
- [x] Fetch Anthropic `frontend-design` skill з GitHub
- [x] Merge з нашим `frontend` skill
- [x] Створено merged SKILL.md (6 частин, 290 рядків)
- [x] Додано `references/AESTHETICS_COOKBOOK.md` — brand aesthetics
- [x] Додано `references/ANTI_PATTERNS.md` — що уникати
- [x] Додано `assets/design-tokens.json` — DTCG format tokens

**Структура нового skill:**
```
.claude/skills/frontend/
├── SKILL.md                    # Merged: technical + design thinking
├── references/
│   ├── AESTHETICS_COOKBOOK.md  # Pulse Radar specific aesthetics
│   └── ANTI_PATTERNS.md        # What to avoid
└── assets/
    └── design-tokens.json      # CSS variables export (DTCG format)
```

**SKILL.md Sections:**
1. Technical Foundation (shadcn/ui)
2. Design Thinking (Pulse Radar brand)
3. Critical Rules (WCAG Compliance)
4. Anti-Patterns (FORBIDDEN)
5. Token Reference
6. Hover & Focus States

**Наступні фази:**
- [ ] Phase 1: CSS Foundation (U1) — tokens, Tailwind config ← **NEXT**
- [ ] Phase 2: WCAG Fixes (F1) — touch targets, status icons ← **NEXT**
- [ ] Phase 3: Component Migration (F1) — hardcoded colors → tokens
- [ ] Phase 4: Spacing Grid (F1) — 4px compliance
- [ ] Phase 5: E2E Tests (F1) — accessibility.spec.ts
- [ ] Phase 6: Verification (Coordinator)

**⏸️ PAUSED:** 2025-12-04

**Resume інструкції:**
1. Активувати скіли: `project-stabilizer`, `agent-coordinator`
2. Продовжити план: `~/.claude/plans/frolicking-forging-clarke.md`
3. Запустити Phase 1 (U1) + Phase 2 (F1) паралельно

---

*Джерело: `.artifacts/stabilization.json`*
