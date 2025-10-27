# Topics Page: Search, Pagination & Sorting - Task Breakdown

**Feature:** Додати пошук, пагінацію та сортування для масштабованості 10,000+ топіків
**Complexity:** Level 2 (Score 9/20)
**Total Estimate:** 5-6 годин з тестуванням

---

## Phase 1: Backend Foundation (60 хв) - SEQUENTIAL

### Batch 1: TopicCRUD Search & Sort Logic
- **Agent:** fastapi-backend-expert
- **Time:** 25 хв
- **Files:** `backend/app/services/topic_crud.py`
- **Tasks:**
  - Додати параметри `search: str | None`, `sort_by: str | None` до `list()` методу
  - Реалізувати ILIKE фільтри для name/description (case-insensitive)
  - Додати динамічний `order_by` для 5 варіантів сортування:
    - `name_asc` - Name A-Z
    - `name_desc` - Name Z-A
    - `created_desc` - Newest first (default)
    - `created_asc` - Oldest first
    - `updated_desc` - Recently updated
  - Зберегти існуючу пагінацію (skip/limit)
- **Acceptance:**
  - ✅ Search фільтрує по name OR description
  - ✅ Всі 5 sort варіантів працюють
  - ✅ Backward compatibility (виклики без параметрів працюють)

### Batch 2: API Endpoint Parameters
- **Agent:** fastapi-backend-expert
- **Time:** 15 хв
- **Files:** `backend/app/api/v1/topics.py`
- **Dependencies:** Batch 1
- **Tasks:**
  - Додати Query parameters: `search`, `sort_by` до `list_topics()`
  - Передати параметри в `TopicCRUD.list()`
  - Додати FastAPI документацію для параметрів
- **Acceptance:**
  - ✅ `/api/v1/topics?search=test&sort_by=name_asc` працює
  - ✅ OpenAPI docs показують нові параметри

### Batch 3: Backend Testing
- **Agent:** fastapi-backend-expert
- **Time:** 20 хв
- **Dependencies:** Batch 1, 2
- **Tasks:**
  - Протестувати пошук з кириличними символами
  - Перевірити всі 5 варіантів сортування
  - Протестувати пагінацію на великому датасеті
- **Acceptance:**
  - ✅ Кириличний пошук працює (укр/рос тексти)
  - ✅ Сортування коректне для всіх 5 опцій
  - ✅ Пагінація працює на 100+ топіках

---

## SYNC POINT: API Contract Share

**Output від Backend:**
- Query параметри: `?search={str}&sort_by={enum}&skip={int}&limit={int}`
- Response структура: `TopicListResponse` (без змін)
- Нові поля сортування enum значення

**Передати Frontend Agent:**
- API endpoint signature
- Sort enum значення для dropdown
- Pagination logic (skip = (page-1) * page_size)

---

## Phase 2: Frontend Implementation (100 хв) - PARTIALLY PARALLEL

### Batch 4: Service Layer Integration
- **Agent:** react-frontend-architect
- **Time:** 15 хв
- **Files:** `frontend/src/features/topics/api/topicService.ts`
- **Dependencies:** Batch 2 (API contract)
- **Tasks:**
  - Створити інтерфейс `ListTopicsParams { page?, page_size?, search?, sort_by? }`
  - Оновити `listTopics()` для прийому параметрів
  - Побудувати query string з параметрів
  - Додати TypeScript типи відповідно до backend
- **Acceptance:**
  - ✅ TypeScript компілюється без помилок
  - ✅ Query string формується правильно

### Batch 5: Search Bar UI
- **Agent:** react-frontend-architect
- **Time:** 30 хв
- **Files:** `frontend/src/pages/TopicsPage/index.tsx`
- **Dependencies:** Batch 4
- **Tasks:**
  - Додати Input компонент з іконкою пошуку
  - Реалізувати debouncing 300ms (useState + useEffect або useDebouncedValue)
  - Placeholder: "Пошук топіків за назвою чи описом..."
  - Показувати кількість результатів
  - Опціонально: keyboard shortcut `/` для фокусу
- **Acceptance:**
  - ✅ Пошук не спамить API (debounced)
  - ✅ Результати оновлюються після 300ms простою
  - ✅ UI responsive та зручний

### Batch 6: Sort Dropdown (МОЖЕ БУТИ ПАРАЛЕЛЬНО З BATCH 5)
- **Agent:** react-frontend-architect
- **Time:** 20 хв
- **Files:** `frontend/src/pages/TopicsPage/index.tsx`
- **Dependencies:** Batch 4
- **Tasks:**
  - Додати shadcn Select компонент
  - 5 опцій сортування:
    - "Спочатку нові" (created_desc) - default
    - "Спочатку старі" (created_asc)
    - "Назва А-Я" (name_asc)
    - "Назва Я-А" (name_desc)
    - "Недавно оновлені" (updated_desc)
  - Зміна відразу оновлює результати
- **Acceptance:**
  - ✅ Dropdown працює без глюків
  - ✅ Зміна сортування тригерить новий запит
  - ✅ UI відповідає shadcn стилям

### Batch 7: Pagination Controls
- **Agent:** react-frontend-architect
- **Time:** 35 хв
- **Files:** `frontend/src/pages/TopicsPage/index.tsx`
- **Dependencies:** Batch 4
- **Tasks:**
  - Додати shadcn Pagination компонент (Previous/Next + page numbers)
  - Показувати "Showing X-Y of Z topics"
  - pageSize = 24 топіки (оптимально для grid layout)
  - Обчислювати skip = (page - 1) * page_size
  - Навігація Previous/Next + клік по номеру сторінки
- **Acceptance:**
  - ✅ Pagination показує правильні діапазони
  - ✅ Навігація працює коректно
  - ✅ Стан зберігається при зміні search/sort

### Batch 8: State Management Integration
- **Agent:** react-frontend-architect
- **Time:** 25 хв
- **Files:** `frontend/src/pages/TopicsPage/index.tsx`
- **Dependencies:** Batch 5, 6, 7
- **Tasks:**
  - Інтегрувати state: searchQuery, sortBy, currentPage, pageSize
  - Оновити useQuery queryKey: `['topics', { page, search, sort_by }]`
  - Зміна search/sort скидає page на 1
  - Loading states для UX
  - Error handling для порожніх результатів
- **Acceptance:**
  - ✅ Query caching працює правильно
  - ✅ Search/sort скидають пагінацію
  - ✅ Loading spinners показуються
  - ✅ "No results" state для порожніх пошуків

---

## Phase 3: Integration & Testing (15 хв)

### Manual E2E Testing
- Протестувати на великому датасеті (створити 100+ топіків через seed)
- Перевірити performance (<1s load time)
- Кириличний пошук працює
- Всі комбінації search + sort + pagination
- Keyboard shortcuts (якщо реалізовані)

---

## Parallelization Matrix

| Batch | Backend-1 | Backend-2 | Backend-3 | Frontend-4 | Frontend-5 | Frontend-6 | Frontend-7 | Frontend-8 |
|-------|-----------|-----------|-----------|------------|------------|------------|------------|------------|
| Backend-1 | - | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Backend-2 | ✗ | - | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Backend-3 | ✗ | ✗ | - | ✓ | ✓ | ✓ | ✓ | ✗ |
| Frontend-4 | ✗ | ✗ | ✓ | - | ✗ | ✗ | ✗ | ✗ |
| Frontend-5 | ✗ | ✗ | ✓ | ✗ | - | ✓ | ✓ | ✗ |
| Frontend-6 | ✗ | ✗ | ✓ | ✗ | ✓ | - | ✓ | ✗ |
| Frontend-7 | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | - | ✗ |
| Frontend-8 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | - |

✗ = Sequential (must wait)
✓ = Can parallelize

---

## Success Criteria

✅ Пошук працює з кириличними символами
✅ 5 варіантів сортування коректні
✅ Пагінація показує 24 топіки/сторінку
✅ Load time <1s для 1000+ топіків
✅ Backward compatibility (існуючі виклики працюють)
✅ TypeScript компілюється без помилок
✅ No regression в існуючому UI
