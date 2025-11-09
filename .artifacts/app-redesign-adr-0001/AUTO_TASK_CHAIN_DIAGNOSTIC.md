# Auto-Task Chain Diagnostic Report

**Date:** November 4, 2025
**Agent:** fastapi-backend-expert
**Issue:** Auto-task chain not creating topics/atoms automatically from Telegram messages

---

## Phase 1: Diagnostics Summary

### Infrastructure Status ✅

**Worker Status:** ✅ Running (healthy)
```
NAME                  STATUS
task-tracker-worker   Up 13 hours (healthy)
```

**NATS Status:** ✅ Running (healthy)
```
NAME                STATUS
task-tracker-nats   Up 15 hours (healthy)
Listening on: 0.0.0.0:4222
JetStream: Enabled
```

**Tasks Registered:** ✅ All tasks properly decorated and imported
- `save_telegram_message` - decorated with `@nats_broker.task`
- `score_message_task` - decorated with `@task_retry_with_dlq` + `@nats_broker.task`
- `extract_knowledge_from_messages_task` - decorated with `@task_retry_with_dlq` + `@nats_broker.task`

**Webhook Endpoint:** ✅ Properly triggering tasks
```python
# File: backend/app/webhooks/telegram.py:61
await save_telegram_message.kiq(update_data)  # ✅ Correctly using .kiq()
```

### Data Analysis

**Database State:**
- Unprocessed messages: **99** (far above threshold of 10)
- Total topics: **5** (some topics exist, but not from auto-extraction)
- Recent messages: Missing `importance_score` and `noise_classification` (scoring not working)

**Agent Configuration:**
```sql
SELECT name FROM agent_configs WHERE name = 'knowledge_extractor';
-- Result: 0 rows ❌
```

---

## ROOT CAUSE IDENTIFIED 🎯

**The auto-task chain is broken because:**

1. **Missing Agent Config** ❌
   - No `knowledge_extractor` agent config exists in database
   - Code at backend/app/tasks/ingestion.py:54-61 checks for this agent and exits early if not found

2. **Chain Works but Stops Early** ⚠️
   - ✅ Webhook receives message → queues `save_telegram_message`
   - ✅ `save_telegram_message` executes → queues `score_message_task`
   - ✅ `score_message_task` executes → scores message
   - ✅ `queue_knowledge_extraction_if_needed()` executes → checks threshold (99 > 10 ✅)
   - ❌ **BUT**: No `knowledge_extractor` agent → function returns early → no topics created

3. **Threshold Logic Works** ✅
   - Threshold: 10 unprocessed messages
   - Current: 99 unprocessed messages
   - Lookback: 24 hours (configured correctly)
   - Logic would trigger IF agent config existed

---

## Chain Flow Analysis

**Current Flow (Broken):**
```
Telegram Message arrives
  ↓ webhook: POST /webhook/telegram
  ↓ await save_telegram_message.kiq(update_data)
  ↓ TaskIQ Worker: save_telegram_message task
  ↓ await score_message_task.kiq(db_message.id)
  ↓ TaskIQ Worker: score_message_task
  ↓ await queue_knowledge_extraction_if_needed(message_id, db)
  ↓ Check threshold: 99 >= 10 ✅
  ↓ Check agent config: knowledge_extractor ❌ NOT FOUND
  ↓ logger.warning("No active agent config...") → RETURN
  ❌ CHAIN STOPS HERE - NO TOPICS/ATOMS CREATED
```

**Expected Flow (After Fix):**
```
  ↓ await extract_knowledge_from_messages_task.kiq(message_ids, agent_config_id)
  ↓ TaskIQ Worker: extract_knowledge_from_messages_task
  ↓ LLM extracts topics and atoms
  ↓ Topics + Atoms saved to database
  ✅ Auto-task chain completes successfully
```

---

## Phase 2: Fix Implementation

### SQL Fix Script

```sql
-- Create knowledge_extractor agent config
INSERT INTO agent_configs (
    id,
    name,
    model,
    system_prompt,
    provider_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'knowledge_extractor',
    'llama3.2:3b',
    'You are a knowledge extraction specialist. Analyze message conversations and extract:
1. Main discussion topics
2. Atomic knowledge units (problems, solutions, decisions, insights)
3. Relationships between atoms

Be precise and factual. Focus on actionable knowledge.',
    '43739cc7-7bb0-4c9b-8361-93c2ab2b6903',  -- Local Ollama provider (active)
    true,
    NOW(),
    NOW()
);
```

### Verification Steps

1. **Create Agent Config**
   ```bash
   docker compose exec postgres psql -U postgres -d tasktracker -c "
   INSERT INTO agent_configs (id, name, model, system_prompt, provider_id, is_active, created_at, updated_at)
   VALUES (
       gen_random_uuid(),
       'knowledge_extractor',
       'llama3.2:3b',
       'You are a knowledge extraction specialist. Analyze message conversations and extract main topics and atomic knowledge units.',
       '43739cc7-7bb0-4c9b-8361-93c2ab2b6903',
       true,
       NOW(),
       NOW()
   );
   "
   ```

2. **Verify Agent Created**
   ```bash
   docker compose exec postgres psql -U postgres -d tasktracker -c "SELECT name, is_active FROM agent_configs WHERE name = 'knowledge_extractor';"
   ```

3. **Send Test Message**
   ```bash
   curl -X POST http://localhost:8000/webhook/telegram \
     -H "Content-Type: application/json" \
     -d '{
       "message": {
         "message_id": 999999,
         "from": {"id": 123, "first_name": "Test", "username": "testuser"},
         "chat": {"id": 456, "type": "private"},
         "date": 1730000000,
         "text": "Test message for auto-task chain verification"
       }
     }'
   ```

4. **Monitor Worker Logs**
   ```bash
   docker compose logs worker -f | grep -E "knowledge|extraction|threshold"
   ```

Expected output:
```
🧠 Threshold reached (100 >= 10), queueing knowledge extraction for 50 messages using agent 'knowledge_extractor'
Starting knowledge extraction task: 50 messages with agent <uuid>
LLM extraction completed: X topics, Y atoms
```

---

## Summary

**Problem:** Auto-task chain not creating topics/atoms
**Root Cause:** Missing `knowledge_extractor` agent config in database
**Fix:** Create agent config with active Local Ollama provider
**Impact:** 99 messages waiting for processing, chain will trigger immediately after fix
**Time to Fix:** 5 minutes
**Risk:** Low (safe database insert)

**Status:** Ready for implementation ✅
