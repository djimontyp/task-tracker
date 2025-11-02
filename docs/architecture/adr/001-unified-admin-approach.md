# ADR-0001: Unified Admin Approach для інформаційної архітектури

**Status:** Accepted
**Date:** 2025-11-02
**Deciders:** Product Designer (AI Agent), User
**Context:** Evolution-proof інформаційна архітектура для collection tool з двома фазами (calibration → production)

---

## Context

Task Tracker — це AI-powered інструмент для збору та класифікації знань із Telegram, який еволюціонує через дві фази:

**Фаза 1 (Calibration Phase):** Власний інструмент для калібрування LLM моделей. Користувач (адмін) працює з діагностикою, bulk operations, редагуванням промптів, аналізом якості класифікації. Метрики та дашборди для оптимізації.

**Фаза 2 (Production Consumer Tool):** Публічний продукт для кінцевих користувачів. Вони переглядають згруповані знання (Topics → Atoms), експортують, шукають, але НЕ мають доступу до адмін-інструментів.

**Проблема:** Поточна IA фрагментована (6 top-level розділів) і створена для Фази 1, але не враховує еволюцію до Фази 2. Якщо розробляти тільки під Фазу 1, доведеться повністю переробляти UI при переході. Якщо розробляти тільки під Фазу 2, не будемо мати інструментів для калібрування.

**Вимоги:**
- Zero rework при переході між фазами
- Admin tools для діагностики (Фаза 1)
- Consumer-friendly UI для browsing (Фаза 2)
- Можливість паралельної розробки
- Smooth transition через feature flags

---

## Decision

Обрано **Unified Admin Approach** — архітектура з двома шарами:

1. **Consumer UI Layer (default):** Оптимізований інтерфейс для перегляду знань (Topics, Messages, Search)
2. **Admin Panel Layer (toggle):** Адміністративні інструменти доступні через Cmd+Shift+A або Settings toggle

**Структура:**

```
├─ Topics (Consumer-focused: browse, filter, export)
│  └─ Admin Panel: bulk operations, metrics, topic quality score
│
├─ Messages (Consumer-focused: unified inbox, search)
│  └─ Admin Panel: classification diagnostics, prompt tuning, noise analysis
│
├─ Search (Consumer-focused: semantic + keyword)
│  └─ Admin Panel: vector similarity inspector, embedding quality metrics
│
└─ Settings (Consumer + Admin: shared space)
   ├─ General (both)
   ├─ Knowledge Sources (both)
   └─ Admin Tools (admin only): model configs, API keys, feature flags
```

**Feature flag:**
```typescript
// localStorage (Фаза 1) → backend user roles (Фаза 2)
const isAdminMode = localStorage.getItem('adminMode') === 'true';
```

**Transition plan:**
- **Фаза 1:** Admin Panel показаний за замовчуванням, Consumer UI працює паралельно
- **Фаза 2:** Admin Panel прихований для звичайних users (feature flag), лише власник має доступ

---

## Rationale

### Чому Unified Admin?

**1. Evolution-proof design:**
- Обидві фази розробляються одночасно
- Consumer UI готовий до Фази 2 без rework
- Admin Panel не заважає, просто ховається

**2. Zero technical debt:**
- Немає "тимчасового UI" для Фази 1
- Немає повної переробки при переході до Фази 2
- Ізольовані компоненти (Consumer + Admin) не конфліктують

**3. Parallel development:**
- Frontend team може розробляти Consumer UI
- Backend team може додавати admin APIs паралельно
- Testing: обидві фази тестуються окремо

**4. Smooth transition:**
- Feature flag (localStorage → backend roles) = плавний перехід
- User experience: звичайні користувачі не бачать admin complexity
- Owner зберігає доступ до діагностики

**5. Real-world precedent:**
- WordPress: Consumer (blog) + Admin Panel (/wp-admin)
- Notion: Page view + Database properties panel
- Linear: Issue view + Admin settings

---

## Alternatives Considered

### Option A: Conservative (Merge Analysis + Proposals)

**Опис:** Мінімальні зміни, об'єднання Analysis Runs та Topic Proposals у вкладки.

**Pros:**
- Низький ризик
- Швидка реалізація (2 тижні)

**Cons:**
- Не вирішує фрагментацію (залишається 5 top-level розділів)
- Не враховує Фазу 2 (доведеться переробляти)
- Admin tools змішані з consumer content

**Чому відхилено:** Тактичне рішення, яке створює tech debt. Не вирішує проблему еволюції.

---

### Option B: Moderate (Views-Based, Airtable-style)

**Опис:** Topics як центральний розділ із Views (Grid, Board, Timeline). Settings із Knowledge Sources + Admin Tools.

**Pros:**
- Consumer-focused структура
- Гнучкі Views для різних use cases
- Зменшення top-level розділів до 3

**Cons:**
- Views підходять для production, але НЕ для calibration
- Діагностичні інструменти (Analysis Runs, Proposals) не вписуються в Views
- Доведеться додавати Admin Panel окремо пізніше = rework

**Чому відхилено:** Ідеально для Фази 2, але ігнорує Фазу 1. Створює необхідність переробки.

---

### Option C: Radical (Complete Redesign)

**Опис:** Повна переробка IA з нуля під consumer use case. Atoms → Knowledge Cards, Messages → Inbox 2.0, Topics → Collections.

**Pros:**
- Modern patterns (Notion, Obsidian, Capacities)
- Semantic relationships як first-class citizen
- Ідеально для production consumer tool

**Cons:**
- Високий ризик (4+ тижні розробки)
- Ігнорує Фазу 1 (calibration tools відсутні)
- Tech debt: доведеться додавати admin інструменти "костилями"

**Чому відхилено:** Ідеально для Фази 2, але робить Фазу 1 неможливою. Занадто амбітно.

---

## Consequences

### Positive

✅ **Admin tools ready:**
- Classification diagnostics (Message Inspect modal)
- Bulk operations (multi-select + batch actions)
- Prompt tuning interface (Analysis Runs → Prompts tab)
- Quality metrics (Topic score, noise analysis)

✅ **Consumer UI ready:**
- Topics browsing (grid/list views)
- Unified Messages inbox (search, filter, export)
- Semantic search (hybrid keyword + vector)
- Export functionality (Markdown, JSON)

✅ **Seamless transition:**
- Feature flag: `isAdminMode` → localStorage (Фаза 1) → backend roles (Фаза 2)
- Zero rework: просто hide Admin Panel для звичайних users
- Owner зберігає admin access для діагностики

✅ **Parallel development:**
- Consumer components: `<TopicCard>`, `<MessageCard>`, `<SearchBar>`
- Admin components: `<AdminPanel>`, `<BulkActions>`, `<MetricsDashboard>`
- Isolated: можна розробляти незалежно

### Negative

❌ **Більше компонентів:**
- Треба розробити Admin Panel infrastructure
- Consumer + Admin = 2 UI systems для підтримки
- Testing: обидві фази потрібно покрити тестами

❌ **Feature flag infrastructure:**
- localStorage (тимчасово) → backend user roles (production)
- Потрібно розробити role-based access control (RBAC)
- Edge case: якщо user отримає admin права, треба оновити UI

❌ **Complexity для розробників:**
- Потрібно розуміти обидва режими (Consumer + Admin)
- Code organization: як уникнути дублювання?
- Documentation: треба описати обидва підходи

### Mitigation

**Для зменшення негативів:**

1. **Shared components:**
   - `<TopicCard>` використовується в обох режимах
   - `variant="consumer"` vs `variant="admin"` props
   - Одна кодова база, різні behaviors

2. **Feature flag abstraction:**
   ```typescript
   // hooks/useAdminMode.ts
   export const useAdminMode = () => {
     const [isAdmin, setIsAdmin] = useState(() =>
       localStorage.getItem('adminMode') === 'true'
     );
     // Later: replace with backend roles check
     return { isAdmin, toggleAdmin: () => setIsAdmin(!isAdmin) };
   };
   ```

3. **Progressive disclosure:**
   - Admin Panel спочатку hidden (collapse by default)
   - Keyboard shortcut (Cmd+Shift+A) для швидкого доступу
   - Settings toggle для permanent visibility

---

## Implementation

### Timeline: 11 тижнів (розбито на 6 фаз)

**Phase 1: Foundation (2 тижні)**
- Створити Admin Panel component infrastructure
- Feature flag system (localStorage-based)
- Keyboard shortcuts (Cmd+Shift+A)

**Phase 2: Admin Panel Components (2 тижні)**
- BulkActionsToolbar (multi-select + batch operations)
- MetricsDashboard (topic quality, noise stats)
- PromptTuningInterface (Analysis Runs → Prompts tab)

**Phase 3: Message Inspect Modal (2 тижні)**
- Classification diagnostics (confidence, reasoning)
- Atom extraction review (entities, keywords)
- Bulk edit (reassign topic, approve/reject)

**Phase 4: Topics Enhancement (1.5 тижні)**
- Topic quality score (admin metric)
- Bulk operations (merge, archive, delete)
- Consumer view: grid/list toggle

**Phase 5: Analysis Runs + Proposals (1.5 тижні)**
- Переробити Analysis Runs → Topics admin tab
- Proposals → inline cards у Topics
- LLM reasoning transparency

**Phase 6: Export + API (2 тижні)**
- Export page (Markdown, JSON, API)
- API documentation (RESTful endpoints)
- Settings → Knowledge Sources + Admin Tools

### Технічні деталі

**Feature Flag:**
```typescript
// Phase 1: localStorage (immediate)
const isAdminMode = localStorage.getItem('adminMode') === 'true';

// Phase 2: backend roles (production)
const isAdminMode = user.role === 'admin' || user.role === 'owner';
```

**Admin Panel Component:**
```tsx
<AdminPanel
  visible={isAdminMode}
  onToggle={toggleAdminMode}
  sections={['bulk-actions', 'metrics', 'prompt-tuning']}
/>
```

**Shared Component Pattern:**
```tsx
<TopicCard
  topic={topic}
  variant={isAdminMode ? 'admin' : 'consumer'}
  showMetrics={isAdminMode}
  enableBulkSelect={isAdminMode}
/>
```

---

## References

- **Full research proposal:** `.artifacts/product-designer-research/ia-restructuring-proposal.md` (1800+ рядків, українською)
- **UX audit reports:** `.artifacts/ux-audit/` (аналіз поточної IA)
- **Wireframes:** Section "ВІЗУАЛІЗАЦІЯ" у research proposal
- **User flow diagrams:** Mermaid diagrams у proposal (Admin vs Consumer paths)

---

## Зв'язані ADR

- Майбутній ADR-0002: Vector Search UI/UX patterns (semantic similarity visualization)
- Майбутній ADR-0003: Role-Based Access Control (RBAC) implementation
- Майбутній ADR-0004: Export formats and API design

---

## Notes

**Для майбутніх розробників:**

Якщо ви читаєте це через рік і думаєте "навіщо два шари UI?" — згадайте:
- Система починалася як collection tool для власного використання
- Transition до consumer product був заплановний
- Unified Admin = еволюція без переробки, не over-engineering

Якщо виникають питання про Admin Panel complexity — згадайте Фазу 1 (calibration). Без діагностичних інструментів калібрувати LLM неможливо.

Якщо хочете прибрати Admin Panel — переконайтеся, що Фаза 2 (production) вже настала, іowner не потребує доступу до metrics.

---

**Status:** Accepted
**Last Updated:** 2025-11-02
