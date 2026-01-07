# Progress Log

## 2025-01-06

### Session Start
- [x] Створено Obsidian структуру
- [x] Створено Beads epic: task-tracker-b0p0
- [x] Досліджено стан БД (1378 msgs, 54 atoms, 14 topics)
- [x] Знайдено тестові файли

### Completed ✅
- [x] Очистити atoms (CASCADE cleared all)
- [x] Очистити topics
- [x] Імпортувати test messages (244 msgs via simulate_telegram.py)
- [x] Визначити AI агентів (knowledge_extractor, Витягувач знань)
- [x] Налаштувати агентів (qwen2.5-coder:14b-instruct-q4_K_M)
- [x] Виправити JSON serialization (model_dump_json)
- [x] Виправити Ollama embedding (mxbai-embed-large, /api/embeddings)
- [x] Запустити extraction pipeline
- [x] Верифікувати результати на Dashboard

### Results
- **Messages**: 244
- **Topics**: 3 (Chat Management, User Deletion, Archiving)
- **Atoms**: 9 (3 problems + 6 solutions/decisions)
- **Model**: qwen2.5-coder:14b-instruct-q4_K_M
- **Embedding**: mxbai-embed-large (1024 dims)
- **Provider**: 4070 Ti Super (Ollama @ 192.168.3.27)

### Issues Found & Fixed
1. deepseek-r1:14b - `<think>` tags break JSON → switched to qwen2.5-coder
2. `/api/embed` 404 → `/api/embeddings` (legacy endpoint)
3. `nomic-embed-text` missing → `mxbai-embed-large`
4. `str(result.output)` → `model_dump_json()`
5. `/analysis` route 404 → redirect to /dashboard
6. **Message-Topic linking bug** - `dict[int, int]` → `dict[uuid.UUID, uuid.UUID]` (knowledge_orchestrator.py:583)

---

## Phase 2: Language & Model Research

### Problem: LLM generates English instead of Ukrainian
- qwen2.5-coder:14b optimized for code, not NLP
- Ukrainian not officially supported

### Models Comparison

| Model | Ukrainian | VRAM | Speed |
|-------|-----------|------|-------|
| qwen2.5-coder:14b | Poor | 8GB | 30 t/s |
| qwen2.5:32b offload | Basic | 14+RAM | 10 t/s |
| **qwen3:30b-a3b (MoE)** | **Official (119 langs)** | 6-8GB | 25-35 t/s |
| aya-expanse:8b | Official (23 langs) | 6GB | Fast |
| GPT-4o-mini | Excellent | Cloud | Fast |

### Recommendation: qwen3:30b-a3b
- MoE: 30B total, only 3B active = fast!
- 119 languages including Ukrainian
- Think/no-think mode (`/think`, `/no_think`)
- Fits in 16GB VRAM

### Pending
- [ ] User downloading qwen3:30b-a3b
- [ ] Test Ukrainian extraction with qwen3
- [ ] Re-run extraction to verify message-topic links

### SaaS Considerations
- Language should be configurable per tenant
- API endpoint needs `language` parameter
- Prompt templates per language already exist in `llm_agents.py`
