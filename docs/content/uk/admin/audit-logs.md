# Журнали аудиту

**Останнє оновлення:** 26 жовтня 2025
**Статус:** Повний
**Аудиторія:** Системні адміністратори

## Що реєструється

Кожне рішення автоматизації записується в таблиці `automation_audit_log`.

### Структура записів журналу

```sql
CREATE TABLE automation_audit_log (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP,      -- Коли прийнято рішення
    rule_id INT,               -- Яке правило спрацьовало
    action VARCHAR(50),        -- approve/reject/manual
    version_id INT,            -- Яку версію обробляли
    entity_type VARCHAR(50),   -- topic/atom
    confidence FLOAT,          -- Оцінка впевненості
    similarity FLOAT,          -- Оцінка схожості
    is_success BOOLEAN,        -- Дія завершена?
    error_message TEXT,        -- Якщо помилка, опис
    execution_time_ms INT      -- Час виконання
);
```

## Приклади запитів

### Щоденна статистика

```sql
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count,
  ROUND(AVG(confidence), 1) as avg_confidence,
  ROUND(AVG(similarity), 1) as avg_similarity
FROM automation_audit_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC;
```

### Найбільш спрацьовані правила

```sql
SELECT
  r.name,
  COUNT(*) as times_triggered,
  SUM(CASE WHEN aal.is_success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT aal.is_success THEN 1 ELSE 0 END) as failed
FROM automation_audit_log aal
JOIN approval_rules r ON aal.rule_id = r.id
WHERE aal.created_at >= NOW() - INTERVAL '30 days'
GROUP BY r.id, r.name
ORDER BY COUNT(*) DESC;
```

### Помилкові дії

```sql
SELECT created_at, rule_id, action, version_id, error_message
FROM automation_audit_log
WHERE is_success = false
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Політика зберігання журналів

### Стандартні налаштування

```yaml
retention:
  keep_for_days: 90        # Зберігати 90 днів журналів
  archive_after_days: 30   # Архівувати після 30 днів
  delete_after_days: 365   # Повне видалення після 1 року
```

### Ручне очищення

```sql
-- Видалити журнали старше 90 днів
DELETE FROM automation_audit_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Архівувати в окрему таблицю
INSERT INTO automation_audit_log_archive
SELECT * FROM automation_audit_log
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Вимоги відповідності

Журнали підтримують відповідність для:
- **SOC 2**: Документовані зміни системи
- **HIPAA**: Відстеження дій користувачів
- **GDPR**: Історія модифікації даних

---

**Пов'язане:** [Управління завданнями](job-management.md) | [Продуктивність](performance-scaling.md)
