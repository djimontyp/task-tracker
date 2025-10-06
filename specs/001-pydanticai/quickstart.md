# Quickstart: LLM Agent Management System

**Feature**: 001-pydanticai
**Purpose**: Validate the implementation end-to-end through user acceptance scenarios

## Prerequisites

- Docker services running (`just services`)
- Database migrations applied (`just alembic-up`)
- Frontend built and served
- Backend API accessible at `http://localhost:8000`

## Scenario 1: Configure Ollama Provider

**Goal**: Create and validate local Ollama provider

### Steps

1. Navigate to Dashboard → Agents tab → Providers section
2. Click "Add Provider"
3. Fill form:
   - Name: "Ollama Local"
   - Type: Select "Ollama"
   - Base URL: "http://localhost:11434"
4. Click "Save"

### Expected Results

- ✅ Provider appears in list with status "Validating..."
- ✅ Within 5 seconds, status updates to "Connected" or "Error"
- ✅ If error, validation error message displayed
- ✅ WebSocket notification received for status change

### API Validation

```bash
# Create provider
curl -X POST http://localhost:8000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ollama Local",
    "type": "ollama",
    "base_url": "http://localhost:11434"
  }'

# Response: 201 Created
# {
#   "id": "uuid",
#   "name": "Ollama Local",
#   "type": "ollama",
#   "validation_status": "validating",
#   ...
# }

# Check status after 5 seconds
curl http://localhost:8000/api/providers/{provider_id}
# validation_status should be "connected"
```

---

## Scenario 2: Create Message Classification Agent

**Goal**: Configure agent for classifying messages

### Steps

1. Navigate to Agents tab → Agents section
2. Click "Add Agent"
3. Fill form:
   - Name: "Message Classifier"
   - Description: "Classifies messages into categories"
   - Provider: Select "Ollama Local"
   - Model Name: "llama3"
   - System Prompt:
     ```
     You are a message classification assistant. Analyze messages and classify them into categories: bug, feature, question, or discussion. Provide confidence score and reasoning.
     ```
4. Click "Save"

### Expected Results

- ✅ Agent appears in agents list
- ✅ Agent card shows name, description, model, provider
- ✅ Edit and Delete buttons available

### API Validation

```bash
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Message Classifier",
    "description": "Classifies messages into categories",
    "provider_id": "{provider_uuid}",
    "model_name": "llama3",
    "system_prompt": "You are a message classification assistant..."
  }'

# Response: 201 Created
```

---

## Scenario 3: Define Classification Task with Pydantic Schema

**Goal**: Create task configuration with structured output schema

### Steps

1. Navigate to Agents tab → Tasks section
2. Click "Add Task"
3. Fill form:
   - Name: "Classify Message"
   - Description: "Categorize incoming messages"
   - Response Schema (JSON):
     ```json
     {
       "$schema": "http://json-schema.org/draft-07/schema#",
       "type": "object",
       "title": "MessageClassification",
       "properties": {
         "category": {
           "type": "string",
           "enum": ["bug", "feature", "question", "discussion"]
         },
         "confidence": {
           "type": "number",
           "minimum": 0,
           "maximum": 1
         },
         "reasoning": {
           "type": "string"
         }
       },
       "required": ["category", "confidence"]
     }
     ```
4. Click "Validate Schema" (schema editor shows checkmark if valid)
5. Click "Save"

### Expected Results

- ✅ Task appears in tasks list
- ✅ Schema validation passes before save
- ✅ If invalid schema, error shown with details

### API Validation

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classify Message",
    "description": "Categorize incoming messages",
    "response_schema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {...},
      "required": ["category", "confidence"]
    }
  }'

# Response: 201 Created
```

---

## Scenario 4: Assign Task to Agent

**Goal**: Link task to agent for execution

### Steps

1. Navigate to Agents tab → Agents section
2. Click "Manage Tasks" on "Message Classifier" agent
3. Click "Assign Task"
4. Select "Classify Message" from dropdown
5. Click "Assign"

### Expected Results

- ✅ Task appears in agent's assigned tasks list
- ✅ Agent instance created in backend registry (check logs)
- ✅ Cannot assign same task twice (409 Conflict)

### API Validation

```bash
curl -X POST http://localhost:8000/api/agents/{agent_id}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "{task_uuid}"
  }'

# Response: 201 Created
# {
#   "id": "assignment_uuid",
#   "agent_id": "...",
#   "task_id": "...",
#   "is_active": true,
#   "assigned_at": "2025-10-04T..."
# }

# Try assigning again - should fail
curl -X POST http://localhost:8000/api/agents/{agent_id}/tasks \
  -H "Content-Type: application/json" \
  -d '{"task_id": "{task_uuid}"}'

# Response: 409 Conflict
# {"error": "conflict", "message": "Task already assigned to agent"}
```

---

## Scenario 5: Edit Agent Without Disrupting Running Tasks

**Goal**: Verify agent updates don't affect in-flight operations

### Steps

1. (Assume agent has running task instances in background)
2. Navigate to agent "Message Classifier"
3. Click "Edit"
4. Update System Prompt to add more context
5. Save changes

### Expected Results

- ✅ Agent configuration updated in database
- ✅ Existing agent instances continue with old configuration
- ✅ New task executions use updated configuration
- ✅ No errors or interruptions

### API Validation

```bash
curl -X PUT http://localhost:8000/api/agents/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{
    "system_prompt": "Updated prompt with more context..."
  }'

# Response: 200 OK
# Running instances unaffected (per FR-011)
```

---

## Scenario 6: Delete Agent with Active Tasks

**Goal**: Verify agent deletion behavior per FR-032

### Steps

1. Create test agent and assign task
2. (Simulate running task instance)
3. Navigate to agent
4. Click "Delete"
5. Confirm deletion

### Expected Results

- ✅ Agent removed from database
- ✅ Agent disappears from UI
- ✅ Running instances complete their tasks
- ✅ No cascade deletion of tasks or assignments

### API Validation

```bash
curl -X DELETE http://localhost:8000/api/agents/{agent_id}

# Response: 204 No Content
# Agent deleted, instances continue running
```

---

## Scenario 7: Real-Time Provider Validation Updates

**Goal**: Verify WebSocket notifications for async validation

### Steps

1. Open browser DevTools → Network → WS tab
2. Create new provider via UI (e.g., invalid URL)
3. Observe WebSocket messages

### Expected Results

- ✅ Initial save returns 201 with `validation_status: "validating"`
- ✅ WebSocket message received:
  ```json
  {
    "topic": "providers",
    "event": "validation_update",
    "data": {
      "provider_id": "uuid",
      "validation_status": "error",
      "validation_error": "Connection refused",
      "validated_at": "2025-10-04T..."
    }
  }
  ```
- ✅ UI updates provider card with error badge

---

## Scenario 8: Schema Validation Prevents Invalid Tasks

**Goal**: Verify Pydantic schema validation (FR-029)

### Steps

1. Navigate to Tasks → Add Task
2. Enter invalid JSON Schema:
   ```json
   {
     "type": "invalid_type",
     "properties": "not_an_object"
   }
   ```
3. Click "Save"

### Expected Results

- ✅ Schema validation error displayed
- ✅ Task NOT created
- ✅ Error message indicates specific schema issue

### API Validation

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Task",
    "response_schema": {"invalid": "schema"}
  }'

# Response: 400 Bad Request
# {
#   "error": "validation_error",
#   "message": "Invalid JSON Schema",
#   "details": {...}
# }
```

---

## Scenario 9: Unique Name Validation

**Goal**: Verify global uniqueness constraints (FR-026, FR-027)

### Steps

1. Create agent "Test Agent"
2. Try creating another agent "Test Agent"

### Expected Results

- ✅ Second creation fails with 409 Conflict
- ✅ Error message: "Agent name already exists"
- ✅ Same behavior for tasks and providers

### API Validation

```bash
# Create first agent
curl -X POST http://localhost:8000/api/agents \
  -d '{"name": "Duplicate Test", ...}'
# Response: 201 Created

# Try duplicate
curl -X POST http://localhost:8000/api/agents \
  -d '{"name": "Duplicate Test", ...}'
# Response: 409 Conflict
```

---

## Performance Validation

### API Response Times

```bash
# List agents (should be <200ms p95)
time curl http://localhost:8000/api/agents

# Create agent (should be <200ms p95)
time curl -X POST http://localhost:8000/api/agents -d '{...}'

# WebSocket message latency (should be <100ms)
# Measure time between provider save and WS notification
```

### Expected Benchmarks

- GET `/api/agents`: < 50ms average, < 200ms p95
- POST `/api/agents`: < 100ms average, < 200ms p95
- WebSocket notification: < 100ms from state change
- Provider validation: < 5 seconds for async completion

---

## Test Cleanup

```bash
# Delete all test data
curl -X DELETE http://localhost:8000/api/agents/{agent_id}
curl -X DELETE http://localhost:8000/api/tasks/{task_id}
curl -X DELETE http://localhost:8000/api/providers/{provider_id}
```

---

## Success Criteria

All scenarios must pass with ✅ marks. Any failure indicates implementation issue requiring fix before feature completion.

**Next Steps**: After quickstart validation passes, run automated test suite (`just test`) for contract/integration tests.
