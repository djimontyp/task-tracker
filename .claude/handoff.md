# Handoff: Pulse Radar

**Гілка:** `006-knowledge-discovery`
**Оновлено:** 2025-12-28 16:30

---

## Що зроблено

### 1. Core Flow Verification ✅

```
Telegram webhook → Message → AI parsing → Atoms/Topics → UI
       ✅            ✅          ✅           ✅        ✅
```

- 4 Atoms, 4 Topics, 2 Links створено через LLM
- UUID serialization bug виправлено

### 2. Unified Scoring Config ✅

Thresholds тепер в одному місці:

| Параметр | Значення |
|----------|----------|
| noise_threshold | 0.25 |
| signal_threshold | 0.65 |

**Коміти:**
- `51a98d0` feat(api): add unified scoring config endpoint
- `07d512e` feat(frontend): integrate scoring config from API
- `cddc96f` docs: add ADR-008 unified scoring config

---

## Що далі

1. **Перевірити UI** — http://localhost/dashboard — тепер має показувати сигнали (score > 0.65)
2. **Re-score messages** — існуючі messages мають старі classifications, потрібно re-run scoring
3. **NOISE filtering** — перевірити що короткі messages ("Ок", "👍") класифікуються як noise

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
| `backend/app/config/ai_config.py` | Source of truth для thresholds |
| `backend/app/api/v1/config.py` | GET /api/v1/config/scoring |
| `frontend/src/shared/api/scoringConfig.ts` | useScoringConfig() hook |
| `docs/architecture/adr/008-unified-scoring-config.md` | ADR |