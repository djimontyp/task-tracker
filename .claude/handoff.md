# Handoff: Pulse Radar

**Гілка:** `006-knowledge-discovery`
**Оновлено:** 2025-12-28 17:00

---

## Що зроблено

### 1. Core Flow Verification ✅

```
Telegram webhook → Message → AI parsing → Atoms/Topics → UI
       ✅            ✅          ✅           ✅        ✅
```

- 4 Atoms, 4 Topics, 2 Links створено через LLM
- UUID serialization bug виправлено

### 2. Unified Scoring Config ✅ (Calibrated)

Thresholds **оптимізовано** під weighted scoring algorithm:

| Параметр | Старе | Нове | Причина |
|----------|-------|------|---------|
| noise_threshold | 0.25 | **0.30** | "Ок", "👍" (score ~0.28) мають бути noise |
| signal_threshold | 0.65 | **0.60** | "Критичний баг" (score 0.63) має бути signal |

**Результат:**

| Classification | Count | Examples |
|---------------|-------|----------|
| signal | 1 | "Критичний баг в production" |
| weak_signal | 20 | General messages |
| noise | 2 | "Ок", "👍" |

**Коміти:**
- `51a98d0` feat(api): add unified scoring config endpoint
- `07d512e` feat(frontend): integrate scoring config from API
- `cddc96f` docs: add ADR-008 unified scoring config

---

## Що далі

1. **Verify UI** — http://localhost/dashboard — перевірити що signal/noise відображаються коректно
2. **Add more noise patterns** — "Хто хоче каву?" (score 0.43) все ще weak_signal, можна додати patterns
3. **Create re-score endpoint** — зараз немає способу re-score всі messages (тільки reclassify)

---

## Швидкий старт

```bash
# Сервіси вже running, перевір:
docker ps | grep task-tracker

# Якщо не running:
just services

# Перевірити scoring config:
curl http://localhost/api/v1/config/scoring | jq .

# Статистика messages:
curl http://localhost/api/v1/messages | jq '[.items[] | .noise_classification] | group_by(.) | map({c: .[0], n: length})'
```

---

## Ключові файли

| Файл | Що |
|------|-----|
| `backend/app/config/ai_config.py` | Source of truth для thresholds (0.30/0.60) |
| `backend/app/api/v1/config.py` | GET /api/v1/config/scoring |
| `frontend/src/shared/api/scoringConfig.ts` | useScoringConfig() hook + fallback defaults |
| `docs/architecture/adr/008-unified-scoring-config.md` | ADR з калібрацією |
