# Handoff: Pulse Radar

**Гілка:** `006-knowledge-discovery`
**Оновлено:** 2025-12-28 16:10

---

## Поточна задача: Unified Scoring Configuration

### Прогрес

| Крок | Статус | Деталі |
|------|--------|--------|
| Backend API endpoint | ✅ | `/api/v1/config/scoring` працює |
| Backend importance_scorer.py | ✅ | Вже використовує ai_config |
| Backend noise.py | 🔄 | Агент працює |
| Frontend fetch config | 🔄 | Агент працює |
| Frontend statusBadges.ts | 🔄 | Агент працює |
| ADR документація | ⏳ | Очікує |

### Що зроблено

1. **API endpoint:** `GET /api/v1/config/scoring`
   ```json
   {
     "noise_threshold": 0.25,
     "signal_threshold": 0.65,
     "weights": {"content": 0.4, "author": 0.2, "temporal": 0.2, "topics": 0.2}
   }
   ```

2. **Файли створені/змінені:**
   - `backend/app/api/v1/config.py` — новий endpoint
   - `backend/app/api/v1/router.py` — підключено роутер
   - `backend/app/services/importance_scorer.py` — оновлено docstrings

---

## Попередня задача: Core Flow Verification ✅

Core flow працює end-to-end:
- 4 Atoms, 4 Topics, 2 Links
- UUID serialization bug виправлено (коміт `47f9ba7`)

---

## Thresholds (source of truth)

| Параметр | Значення | Опис |
|----------|----------|------|
| `noise_threshold` | 0.25 | Нижче = шум |
| `signal_threshold` | 0.65 | Вище = сигнал |
| `content_weight` | 0.4 | 40% |
| `author_weight` | 0.2 | 20% |
| `temporal_weight` | 0.2 | 20% |
| `topics_weight` | 0.2 | 20% |

**Source:** `backend/app/config/ai_config.py`

---

## Команди

```bash
# Перевірити config endpoint
curl http://localhost/api/v1/config/scoring | jq .

# Messages stats
curl http://localhost/api/v1/messages | jq '[.items[] | .noise_classification] | group_by(.) | map({classification: .[0], count: length})'
```
