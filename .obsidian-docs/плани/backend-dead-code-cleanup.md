# Backend Dead Code Cleanup Plan

> **Створено:** 2025-12-28
> **Статус:** draft
> **Пріоритет:** medium

## Контекст

Проведено аналіз backend директорії на мертвий код. Знайдено ~8-12% коду який можна оптимізувати.

## Завдання

### 1. Критичне — Видалити невикористовуваний код

- [ ] **Видалити `VectorQueryBuilder`**
  - Файл: `services/vector_query_builder.py` (49 LOC)
  - Статус: експортується, але ніде не використовується
  - Дія: видалити файл + прибрати з `services/__init__.py`

### 2. Високий пріоритет — Консолідувати дублювання

#### Енуми (3 дублювання)
- [ ] `ProviderType` — залишити в `models/enums.py`, видалити з `models/llm_provider.py`
- [ ] `ValidationStatus` — залишити в `models/enums.py`, видалити з `models/llm_provider.py`
- [ ] `IngestionStatus` — залишити в `models/enums.py`, видалити з `models/message_ingestion.py`

#### Response схеми (4 дублювання)
- [ ] `DashboardMetricsResponse` — консолідувати в `api/v1/schemas/dashboard.py`
- [ ] `StatsResponse` — консолідувати в `api/v1/response_models.py`
- [ ] `MessageFiltersResponse` — консолідувати в `api/v1/response_models.py`
- [ ] `TrendData` — консолідувати в `api/v1/schemas/dashboard.py`

#### Search результати (3 дублювання)
- [ ] `MessageSearchResult`, `AtomSearchResult`, `TopicSearchResult`
  - Визначити в `api/v1/schemas/search.py` (новий файл)
  - Використовувати в `search.py` та `semantic_search.py`

### 3. Середній пріоритет — Очистити закоментований код

- [ ] `api/v1/stats.py:146-154` — видалити коментарі про task classification
- [ ] `services/knowledge/llm_agents.py` — видалити англійську версію промпту (залишити українську)
- [ ] `services/agent_registry.py:108-114` — замінити TODO блок на лінк до issue

### 4. Низький пріоритет — Моделі з низькою утилізацією

Залишити до фази 2, але задокументувати:
- `ApprovalRule` — потрібна для F015 Auto-approve
- `ClassificationFeedback` — потрібна для ML retraining
- `MessageIngestionJob` — потрібна для batch ingestion
- `AgentTaskAssignment` — ревью чи потрібна взагалі

### 5. Технічний борг — Незавершені реалізації

- [ ] `provider_validator.py:141-143` — створити issue T032 (OpenAI validation)
- [ ] `agent_registry.py:90-125` — створити issue T033 (PydanticAI integration)
- [ ] `metrics_broadcaster.py:45-66` — замінити hardcoded на реальні розрахунки

## Порядок виконання

```
1. VectorQueryBuilder (5 хв) — безпечне видалення
2. Енуми (15 хв) — мінімальний ризик
3. Search результати (20 хв) — новий файл + рефактор імпортів
4. Response схеми (30 хв) — потребує перевірки використання
5. Закоментований код (10 хв) — косметичне
```

## Ризики

| Зміна | Ризик | Мітігація |
|-------|-------|-----------|
| Видалення VectorQueryBuilder | Низький | grep підтвердив невикористання |
| Консолідація енумів | Середній | Перевірити всі імпорти |
| Консолідація схем | Високий | Може зламати API contracts |

## Definition of Done

- [ ] Всі зміни пройшли `just typecheck`
- [ ] Всі тести зелені
- [ ] API contracts не змінились (openapi.json diff = 0)
- [ ] PR review від другого розробника

## Пов'язані файли

- [[regression-and-roadmap]] — загальний roadmap
- [[frontend-transformation]] — паралельна трансформація

---

*Оцінка: 1.5-2 години роботи*
