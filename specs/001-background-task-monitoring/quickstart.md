# Quickstart: Background Task Monitoring System

**Feature**: 001-background-task-monitoring
**Purpose**: Validate end-to-end monitoring flow from task execution to dashboard display

## Prerequisites

- All services running: `just services-dev`
- Database migrated with TaskExecutionLog table: `just alembic-up`
- TaskIQ worker running with logging middleware enabled
- Frontend dashboard accessible at `http://localhost/monitoring`

## Test Scenarios

### Scenario 1: Real-Time Health Metrics Display

**Story**: AS-3 from spec.md - View health cards showing current status counts

**Steps**:
1. Open monitoring dashboard at `http://localhost/monitoring`
2. Observe health cards display for all 10 task types:
   - `ingest_telegram_messages_task`
   - `embed_messages_batch_task`
   - `embed_atoms_batch_task`
   - `score_message_task`
   - `score_unscored_messages_task`
   - `extract_knowledge_from_messages_task`
   - `scheduled_knowledge_extraction_task`
   - `scheduled_auto_approval_task`
   - `scheduled_notification_alert_task`
   - `scheduled_daily_digest_task`

3. Trigger a task manually via Python:
   ```python
   from backend.app.tasks import score_message_task
   await score_message_task.kiq(message_id=1)
   ```

4. Within 1 second, observe dashboard updates:
   - "Pending" count increases by 1 for `score_message_task`
   - Task moves to "Running" when worker picks it up
   - Task moves to "Success" or "Failed" when complete

**Expected Result**:
- ✅ Health cards display current counts for all task types
- ✅ Counts update in real-time via WebSocket (no page refresh needed)
- ✅ Status transitions visible (pending → running → success/failed)

**Acceptance Criteria**: FR-001, FR-002, FR-006, FR-007, FR-008

---

### Scenario 2: Live Activity Feed

**Story**: AS-5 from spec.md - See new task events appear in real-time

**Steps**:
1. Navigate to monitoring dashboard
2. Scroll to "Live Activity Feed" section
3. Trigger multiple tasks in sequence:
   ```python
   await score_message_task.kiq(message_id=1)
   await score_message_task.kiq(message_id=2)
   await extract_knowledge_from_messages_task.kiq(message_ids=[1, 2], provider_id="openai")
   ```

4. Observe activity feed updates with events:
   - "score_message_task started at 10:30:00"
   - "score_message_task completed (success) in 320ms at 10:30:00"
   - "score_message_task started at 10:30:01"
   - "score_message_task completed (success) in 315ms at 10:30:01"
   - "extract_knowledge_from_messages_task started at 10:30:02"
   - "extract_knowledge_from_messages_task completed (success) in 1250ms at 10:30:03"

**Expected Result**:
- ✅ Activity feed shows new events at top (newest first)
- ✅ Events appear within 1 second of occurrence
- ✅ Events include task name, status, timestamp, duration

**Acceptance Criteria**: FR-003, FR-006, FR-008

---

### Scenario 3: Failed Task Error Investigation

**Story**: AS-2 from spec.md - View error details to debug failed task

**Steps**:
1. Trigger a task that will fail:
   ```python
   # Force failure by passing invalid parameters
   await extract_knowledge_from_messages_task.kiq(message_ids=[], provider_id="invalid")
   ```

2. Wait for task to fail (~1 second)
3. Navigate to "Task History" tab
4. Apply filter: Status = "Failed"
5. Click on the failed task row
6. Observe error details panel shows:
   - Error message: "No messages provided for extraction"
   - Full stack trace with file names and line numbers
   - Task parameters: `{"message_ids": [], "provider_id": "invalid"}`
   - Timestamp of failure

**Expected Result**:
- ✅ Failed task appears in history table with status "Failed"
- ✅ Error message is human-readable
- ✅ Stack trace provides debugging context
- ✅ Task parameters show what was passed (for reproduction)

**Acceptance Criteria**: FR-005, FR-011

---

### Scenario 4: Task History Filtering

**Story**: AS-4 from spec.md - Filter history by task type, status, and date range

**Steps**:
1. Navigate to "Task History" tab
2. Generate test data (run multiple tasks over several minutes):
   ```bash
   just db-full-seed  # Seeds messages which trigger background tasks
   ```

3. Apply filter: Task Type = "score_message_task"
   - Observe only score_message_task rows displayed
   - Verify other task types hidden

4. Add filter: Status = "Success"
   - Observe only successful score_message_task rows
   - Verify failed tasks filtered out

5. Add date range filter: Last 1 hour
   - Observe only recent tasks shown
   - Verify older tasks filtered out

6. Clear all filters
   - Observe full history restored

**Expected Result**:
- ✅ Filters apply immediately (no page refresh)
- ✅ Multiple filters combine with AND logic
- ✅ Filter results paginated (50 per page)
- ✅ Clear filters restores full history

**Acceptance Criteria**: FR-009, FR-012

---

### Scenario 5: Performance Metrics Calculation

**Story**: Verify average execution time and success rate calculations

**Steps**:
1. Generate controlled test data:
   ```sql
   -- Via database for precise control
   INSERT INTO task_execution_logs (task_name, status, duration_ms, created_at)
   VALUES
     ('test_task', 'success', 100, NOW()),
     ('test_task', 'success', 200, NOW()),
     ('test_task', 'success', 300, NOW()),
     ('test_task', 'failed', 150, NOW());
   ```

2. Navigate to health metrics
3. Find "test_task" card
4. Verify calculated metrics:
   - Total executions: 4
   - Success: 3
   - Failed: 1
   - Avg duration: 200ms (average of 100, 200, 300)
   - Success rate: 75% (3/4 * 100)

**Expected Result**:
- ✅ Average duration excludes failed tasks (only successful)
- ✅ Success rate = success / total * 100
- ✅ Metrics match calculated values

**Acceptance Criteria**: FR-013, FR-014

---

### Scenario 6: WebSocket Reconnection

**Story**: NFR-005 - Handle disconnections gracefully

**Steps**:
1. Open monitoring dashboard
2. Open browser DevTools → Network tab
3. Disconnect WebSocket manually (or stop/restart backend)
4. Observe frontend shows "Disconnected" indicator
5. Trigger a task while disconnected
6. Reconnect WebSocket (or restart backend)
7. Observe:
   - Frontend shows "Connected" indicator
   - Dashboard refetches latest data
   - Missed task events backfilled (via API call on reconnect)

**Expected Result**:
- ✅ Disconnection visible to user (indicator)
- ✅ Automatic reconnection after 3 seconds
- ✅ Data synchronized on reconnect (no missed events)

**Acceptance Criteria**: NFR-005

---

## Performance Validation

### Dashboard Load Time (NFR-001)

**Test**:
```bash
# Measure initial page load time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost/monitoring
```

**Acceptance**: Total time < 2 seconds

---

### WebSocket Latency (NFR-002)

**Test**:
1. Add timestamp logging to backend WebSocket broadcast
2. Add timestamp logging to frontend WebSocket message handler
3. Calculate delta: `frontend_timestamp - backend_timestamp`

**Acceptance**: Delta < 100ms for 95th percentile

---

### History Query Performance (NFR-003)

**Test**:
```python
# Backend test with 1M records
import time
start = time.time()
response = await monitoring_service.get_task_history(
    start_date=datetime.now() - timedelta(days=7),
    page_size=50
)
duration = time.time() - start
assert duration < 0.5, f"Query took {duration}s (threshold: 0.5s)"
```

**Acceptance**: Query time < 500ms for 7-day range

---

## Cleanup

```bash
# Remove test data
DELETE FROM task_execution_logs WHERE task_name = 'test_task';
```

---

## Success Criteria Summary

All scenarios MUST pass for feature acceptance:

- ✅ Scenario 1: Health metrics display and update in real-time
- ✅ Scenario 2: Live activity feed shows new events instantly
- ✅ Scenario 3: Failed task errors fully debuggable
- ✅ Scenario 4: Multi-filter history queries work correctly
- ✅ Scenario 5: Performance metrics calculated accurately
- ✅ Scenario 6: WebSocket reconnection handled gracefully
- ✅ Performance: Dashboard <2s load, WebSocket <100ms latency, queries <500ms

**Feature complete when all ✅ achieved.**
