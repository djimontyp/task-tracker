# Продуктивність та масштабування

**Останнє оновлення:** 26 жовтня 2025
**Статус:** Повний
**Аудиторія:** Системні адміністратори

## Індексація бази даних

### Критичні індекси для автоматизації

```sql
-- Пошук версій за статусом затвердження
CREATE INDEX idx_versions_approved
ON versions(approved)
WHERE entity_type IN ('topic', 'atom');

-- Пошук правил затвердження
CREATE INDEX idx_approval_rules_is_active
ON approval_rules(is_active)
WHERE is_active = true;

-- Підрахунок незавершених версій
CREATE INDEX idx_versions_approved_created
ON versions(approved, created_at)
WHERE approved = false;

-- Журнал аудиту автоматизації
CREATE INDEX idx_automation_audit_created_at_desc
ON automation_audit_log(created_at DESC);

-- Пошук завдань планувальника
CREATE INDEX idx_apscheduler_jobs_next_run
ON apscheduler_jobs(next_run_time)
WHERE job_state != 'REMOVED';
```

### Перевірка стану індексів

```bash
# Перевірка відсутніх індексів
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE tablename LIKE 'version%' OR tablename LIKE 'approval%';"

# Якщо фрагментація > 10%, перебудуйте індекс:
REINDEX INDEX idx_versions_approved;
```

## Стратегії кешування

### Кеш правила затвердження в пам'яті

```python
# app/services/cache_service.py

class ApprovalRuleCache:
    def __init__(self):
        self._cache = None
        self._cached_at = None
        self._ttl_seconds = 300  # TTL 5 хвилин

    async def get_active_rule(self, db: AsyncSession):
        now = datetime.now()

        # Перевірка валідності кешу
        if self._cache and self._cached_at:
            if (now - self._cached_at).seconds < self._ttl_seconds:
                return self._cache

        # Промах кешу, отримати з БД
        rule = await db.execute(
            select(ApprovalRule).where(ApprovalRule.is_active == true)
        )
        self._cache = rule.scalars().first()
        self._cached_at = now

        return self._cache
```

## Обмеження одночасних завдань

### Конфігурація

```yaml
# backend/.env
SCHEDULER_MAX_CONCURRENT_JOBS=3
AUTOMATION_BATCH_SIZE=500
JOB_TIMEOUT_SECONDS=30
QUEUE_MAX_SIZE=1000
```

### Обмеження швидкості

```python
# Запобігти спаму затвердження
APPROVALS_PER_MINUTE = 100
REJECTIONS_PER_MINUTE = 50

async def bulk_approve_versions(db: AsyncSession, version_ids: list[int]):
    # Підрахувати недавні затвердження
    recent = await count_recent_approvals(db, minutes=1)

    if recent >= APPROVALS_PER_MINUTE:
        raise RateLimitError(f"Обмеження: {recent}/{APPROVALS_PER_MINUTE} затвердження/хв")
```

## Оптимізація високого обсягу

### Пакетна обробка

```python
# Погано: Обробка 1 версії за раз
for version_id in [1, 2, 3, 4, 5]:
    await approve_version(db, version_id)  # 5 транзакцій БД

# Добре: Пакет в одній транзакції
await bulk_approve_versions(db, [1, 2, 3, 4, 5])  # 1 транзакція БД
```

## Метрики моніторингу

### Ключові метрики для відстеження

```yaml
automation:
  job_duration_ms:
    target: p95 < 10ms
    alert: p95 > 30ms

  false_positive_rate:
    target: < 5%
    alert: > 10%

  pending_backlog:
    target: < 20 versions
    alert: > 50 versions

database:
  query_time:
    target: p95 < 100ms
    alert: p95 > 500ms

  connection_pool:
    target: 10-20 підключень
    alert: > 30 підключень
```

## Стратегії масштабування

### Вертикальне масштабування (більший сервер)

Збільшити:
- Ядра CPU (більше одночасних завдань)
- RAM (більші розміри пакетів, кращий кеш)
- Disk IOPS (швидші запити БД)

**Коли використовувати:** Початкове збільшення для обробки 2-3x обсягу

### Горизонтальне масштабування (кілька workers)

```yaml
# docker-compose.yml
services:
  worker-1:
    image: task-tracker-worker
    environment:
      WORKER_ID: 1

  worker-2:
    image: task-tracker-worker
    environment:
      WORKER_ID: 2
```

**Коли використовувати:** Масштаб до 10x+ обсягу

## Планування місткості

### Поточна місткість

```
Один worker може обробити:
├─ 1,000 версій/день (малий)
├─ 10,000 версій/день (середній)
└─ 100,000 версій/день (великий, з оптимізацією)
```

### План дій

| Обсяг | Місяць | Дія |
|--------|-------|--------|
| <5K/день | 0-3 | Один worker, без змін |
| 5-15K/день | 3-6 | Додати індекси, включити кеш |
| 15-50K/день | 6-9 | 2x worker, оптимізація БД |
| 50K+/день | 9+ | Горизонтальне масштабування |

---

**Пов'язане:** [Управління завданнями](job-management.md) | [Журнали аудиту](audit-logs.md)
