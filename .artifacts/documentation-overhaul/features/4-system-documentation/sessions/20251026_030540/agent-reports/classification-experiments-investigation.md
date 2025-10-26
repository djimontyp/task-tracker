# Classification Experiments Investigation Report

**Investigation Date**: 2025-10-26
**Investigator**: FastAPI Backend Expert
**Session**: Feature 4 System Documentation - Phase 1 Research

## Executive Summary

Classification experiments provide a systematic framework for evaluating LLM topic classification accuracy. The system processes messages with pre-assigned topics, classifies them using configurable LLM models, and generates comprehensive metrics including accuracy, confidence scores, execution time, and confusion matrices. Experiments run asynchronously via TaskIQ background tasks with real-time WebSocket progress updates.

---

## 1. ClassificationExperiment Model

### Location
`/Users/maks/PycharmProjects/task-tracker/backend/app/models/classification_experiment.py`

### Core Model Fields

```python
class ClassificationExperiment(IDMixin, TimestampMixin, SQLModel, table=True):
    # Configuration
    provider_id: UUID          # LLM provider for classification
    model_name: str            # Model name (e.g., "llama3.2:3b", "gpt-4")
    status: ExperimentStatus   # pending/running/completed/failed
    message_count: int         # Number of messages to classify

    # Topics Snapshot
    topics_snapshot: dict      # Snapshot of all topics at experiment time
                              # Format: {topic_id: {"name": str, "description": str}}

    # Results Metrics
    accuracy: float | None              # Overall accuracy (0.0-1.0)
    avg_confidence: float | None        # Average confidence score (0.0-1.0)
    avg_execution_time_ms: float | None # Average execution time per message

    # Detailed Results
    confusion_matrix: dict | None          # {actual_topic: {predicted_topic: count}}
    classification_results: list[dict]     # Detailed per-message results

    # Execution Tracking
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None
```

### Status Lifecycle

```python
class ExperimentStatus(str, Enum):
    pending = "pending"      # Created, waiting for background task
    running = "running"      # Currently processing messages
    completed = "completed"  # Successfully finished with results
    failed = "failed"        # Failed with error_message populated
```

### Relationships
- **LLMProvider** (via `provider_id`): Specifies which LLM provider and model to use
- **Messages**: Fetches messages with `topic_id IS NOT NULL` for evaluation
- **Topics**: Captured as snapshot at experiment creation time

### Schema Variants

1. **ExperimentCreate**: Input schema for creating experiments
   - `provider_id`, `model_name`, `message_count` (1-1000)

2. **ExperimentPublic**: Summary response (list view)
   - Core fields without detailed results

3. **ExperimentDetailPublic**: Full response (detail view)
   - Includes `confusion_matrix` and `classification_results`

4. **ClassificationResultDetail**: Individual message classification
   - `message_id`, `message_content`, `actual_topic_id/name`
   - `predicted_topic_id/name`, `confidence`, `execution_time_ms`
   - `reasoning`, `alternatives`

---

## 2. Experiment Workflow

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLASSIFICATION EXPERIMENT WORKFLOW            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Client     │
│  (Dashboard) │
└──────┬───────┘
       │
       │ POST /api/v1/experiments/topic-classification
       │ {provider_id, model_name, message_count}
       ▼
┌──────────────────────────────────────────────────────────────┐
│  API Endpoint: create_experiment()                           │
│  - Validate provider exists and is_active=true               │
│  - Validate sufficient messages with topics exist            │
│  - Create experiment record (status=pending)                 │
│  - Trigger background task: execute_classification_experiment│
└──────────┬───────────────────────────────────────────────────┘
           │
           │ Return ExperimentPublic (status=pending, id=X)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│  WebSocket: "experiments" topic                              │
│  - experiment_started                                        │
│  - experiment_progress (every 10 messages)                   │
│  - experiment_completed / experiment_failed                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Background Task: execute_classification_experiment()        │
├──────────────────────────────────────────────────────────────┤
│  1. Update experiment.status = "running"                     │
│  2. Load all topics from database                            │
│  3. Fetch random messages with topic_id (limit=message_count)│
│  4. Load LLM provider configuration                          │
│  5. FOR EACH message:                                        │
│     a. Classify using TopicClassificationService             │
│     b. Record result (actual vs predicted topic)             │
│     c. Broadcast progress every 10 messages                  │
│  6. Calculate metrics (accuracy, confusion matrix)           │
│  7. Update experiment.status = "completed"                   │
│  8. Save results to database                                 │
│  9. Broadcast "experiment_completed"                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Results Storage                                             │
│  - accuracy: 0.87 (87% correct classifications)              │
│  - avg_confidence: 0.92                                      │
│  - avg_execution_time_ms: 1250.5                             │
│  - confusion_matrix: {"Work": {"Work": 45, "Personal": 5}}   │
│  - classification_results: [{...}, {...}, ...]               │
└──────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

1. **Experiment Creation** (`POST /api/v1/experiments/topic-classification`)
   - Validate provider exists and is active
   - Validate sufficient messages with `topic_id` exist
   - Create topics snapshot
   - Create experiment record (status=pending)
   - Queue background task via TaskIQ
   - Return experiment ID immediately

2. **Background Execution** (`execute_classification_experiment` task)
   - Update status to "running"
   - Broadcast "experiment_started" WebSocket event
   - Load topics from database
   - Fetch random sample of messages with topics
   - For each message:
     - Classify using LLM (TopicClassificationService)
     - Compare predicted topic with actual topic
     - Record execution time and confidence
     - Broadcast progress every 10 messages
   - Calculate final metrics
   - Update experiment with results
   - Broadcast "experiment_completed"

3. **Metrics Calculation**
   - **Accuracy**: `correct_predictions / total_messages`
   - **Average Confidence**: Mean of all confidence scores
   - **Average Execution Time**: Mean of all execution times
   - **Confusion Matrix**: Actual topic → Predicted topic counts

4. **Error Handling**
   - On classification error: Record as ERROR result with confidence=0.0
   - On critical failure: Update status="failed", set error_message
   - Broadcast "experiment_failed" event

---

## 3. Experiment Configuration

### Required Configuration

```json
{
  "provider_id": "UUID",           // LLM provider UUID
  "model_name": "llama3.2:3b",     // Model name
  "message_count": 100             // Number of messages (1-1000)
}
```

### Configuration Constraints

- **provider_id**: Must exist in `llm_providers` table
- **is_active**: Provider must be active (`is_active=true`)
- **message_count**: Range 1-1000 messages
- **Messages Requirement**: Database must contain at least `message_count` messages with `topic_id IS NOT NULL`

### Topics Snapshot

Captured at experiment creation time to ensure consistency:

```json
{
  "1": {
    "name": "Work",
    "description": "Work-related tasks and discussions"
  },
  "2": {
    "name": "Personal",
    "description": "Personal life and activities"
  }
}
```

**Purpose**: Prevents inconsistencies if topics are modified/deleted during experiment execution.

### LLM Provider Types

Supports two provider types:

1. **Ollama** (Local)
   - Requires `base_url` (e.g., "http://localhost:11434")
   - No API key required
   - Example models: "llama3.2:3b", "llama3.1:8b"

2. **OpenAI** (Cloud)
   - Requires encrypted `api_key`
   - Base URL optional (defaults to OpenAI)
   - Example models: "gpt-4", "gpt-3.5-turbo"

---

## 4. Experiment Execution

### Background Task Architecture

**Task**: `execute_classification_experiment(experiment_id: int)`
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py` (lines 524-729)
**Broker**: NATS via TaskIQ
**Async**: Yes

### Execution Flow

```python
async def execute_classification_experiment(experiment_id: int):
    # 1. Load experiment
    experiment = await db.get(ClassificationExperiment, experiment_id)

    # 2. Update status to running
    experiment.status = ExperimentStatus.running
    experiment.started_at = datetime.now(UTC)
    await db.commit()

    # 3. Broadcast start event
    await websocket_manager.broadcast("experiments", {
        "type": "experiment_started",
        "experiment_id": experiment_id,
        "message_count": experiment.message_count
    })

    # 4. Load topics and messages
    topics = await db.execute(select(Topic).order_by(Topic.id))
    messages = await db.execute(
        select(Message)
        .where(Message.topic_id.isnot(None))
        .order_by(func.random())
        .limit(experiment.message_count)
    )

    # 5. Load provider
    provider = await db.get(LLMProvider, experiment.provider_id)
    service = TopicClassificationService(db)

    # 6. Classify each message
    classification_results = []
    for idx, message in enumerate(messages, 1):
        result, exec_time = await service.classify_message(
            message, topics, provider, experiment.model_name
        )

        classification_results.append({
            "message_id": message.id,
            "message_content": message.content[:200],
            "actual_topic_id": message.topic_id,
            "actual_topic_name": actual_topic.name,
            "predicted_topic_id": result.topic_id,
            "predicted_topic_name": result.topic_name,
            "confidence": result.confidence,
            "execution_time_ms": exec_time,
            "reasoning": result.reasoning,
            "alternatives": [alt.model_dump() for alt in result.alternatives]
        })

        # Progress updates every 10 messages
        if idx % 10 == 0:
            await websocket_manager.broadcast("experiments", {
                "type": "experiment_progress",
                "current": idx,
                "total": len(messages),
                "percentage": int((idx / len(messages)) * 100)
            })

    # 7. Calculate metrics
    metrics = await service.calculate_metrics(classification_results)

    # 8. Update experiment with results
    experiment.status = ExperimentStatus.completed
    experiment.completed_at = datetime.now(UTC)
    experiment.accuracy = metrics["accuracy"]
    experiment.avg_confidence = metrics["avg_confidence"]
    experiment.avg_execution_time_ms = metrics["avg_execution_time_ms"]
    experiment.confusion_matrix = metrics["confusion_matrix"]
    experiment.classification_results = classification_results
    await db.commit()

    # 9. Broadcast completion
    await websocket_manager.broadcast("experiments", {
        "type": "experiment_completed",
        "experiment_id": experiment_id,
        "accuracy": metrics["accuracy"]
    })
```

### Classification Service

**Service**: `TopicClassificationService`
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/topic_classification_service.py`

**Key Method**: `classify_message(message, topics, provider, model_name)`

Returns:
- `TopicClassificationResult`: Structured LLM output
- `execution_time_ms`: Classification execution time

**LLM Prompt Structure**:
```
Classify the following message into the most appropriate topic from the list below.

Message:
{message.content}

Available Topics:
- ID: 1, Name: Work, Description: Work-related tasks
- ID: 2, Name: Personal, Description: Personal life

Instructions:
1. Choose the most appropriate topic ID and name
2. Provide a confidence score (0.0-1.0)
3. Explain your reasoning in 1-2 sentences
4. If confidence < 0.9, suggest 1-2 alternative topics
```

**Structured Output**:
```python
class TopicClassificationResult(BaseModel):
    topic_id: int
    topic_name: str
    confidence: float  # 0.0-1.0
    reasoning: str
    alternatives: list[TopicAlternative]
```

### Progress Tracking

**WebSocket Topic**: `"experiments"`

**Events**:

1. **experiment_started**
   ```json
   {
     "type": "experiment_started",
     "experiment_id": 42,
     "message_count": 100
   }
   ```

2. **experiment_progress** (every 10 messages)
   ```json
   {
     "type": "experiment_progress",
     "experiment_id": 42,
     "current": 50,
     "total": 100,
     "percentage": 50
   }
   ```

3. **experiment_completed**
   ```json
   {
     "type": "experiment_completed",
     "experiment_id": 42,
     "accuracy": 0.87
   }
   ```

4. **experiment_failed**
   ```json
   {
     "type": "experiment_failed",
     "experiment_id": 42,
     "error": "Provider connection failed"
   }
   ```

---

## 5. Results Analysis

### Metrics Tracked

#### 1. Accuracy
**Formula**: `correct_predictions / total_messages`

**Example**:
- 100 messages classified
- 87 predictions matched actual topics
- Accuracy = 87 / 100 = 0.87 (87%)

**Interpretation**:
- 1.0 (100%): Perfect classification
- 0.8-0.95: Good performance
- < 0.7: Poor performance, model/prompt adjustment needed

#### 2. Average Confidence
**Formula**: `sum(confidence_scores) / total_messages`

**Example**:
- Message 1: confidence=0.95
- Message 2: confidence=0.88
- Message 3: confidence=0.91
- Average = (0.95 + 0.88 + 0.91) / 3 = 0.913

**Interpretation**:
- High confidence (>0.9): Model is certain
- Medium confidence (0.7-0.9): Model is moderately certain
- Low confidence (<0.7): Model is uncertain, may need clarification

**Analysis Pattern**:
- High confidence + High accuracy = Excellent model performance
- High confidence + Low accuracy = Overconfident model (false positives)
- Low confidence + Low accuracy = Model struggling with topic definitions
- Low confidence + High accuracy = Model is cautious but correct

#### 3. Average Execution Time
**Formula**: `sum(execution_times_ms) / total_messages`

**Example**:
- Message 1: 1200ms
- Message 2: 1350ms
- Message 3: 1100ms
- Average = (1200 + 1350 + 1100) / 3 = 1216.67ms

**Interpretation**:
- < 500ms: Fast (Ollama small models)
- 500-2000ms: Moderate (Ollama medium models, OpenAI)
- > 2000ms: Slow (large models, complex prompts)

#### 4. Confusion Matrix
**Structure**: `{actual_topic: {predicted_topic: count}}`

**Example**:
```json
{
  "Work": {
    "Work": 45,      // Correctly predicted as Work
    "Personal": 5    // Incorrectly predicted as Personal
  },
  "Personal": {
    "Personal": 38,  // Correctly predicted as Personal
    "Work": 2        // Incorrectly predicted as Work
  }
}
```

**Analysis**:
- **Diagonal values**: Correct predictions (Work→Work, Personal→Personal)
- **Off-diagonal values**: Misclassifications
- **Pattern Detection**: If "Work" frequently misclassified as "Personal", topic definitions may overlap

**Derived Metrics**:
- **Precision** (per topic): `true_positives / (true_positives + false_positives)`
- **Recall** (per topic): `true_positives / (true_positives + false_negatives)`
- **F1 Score**: `2 * (precision * recall) / (precision + recall)`

#### 5. Per-Message Results

Each classification result contains:

```json
{
  "message_id": 123,
  "message_content": "Need to finish the Q4 report by Friday...",
  "actual_topic_id": 1,
  "actual_topic_name": "Work",
  "predicted_topic_id": 1,
  "predicted_topic_name": "Work",
  "confidence": 0.95,
  "execution_time_ms": 1230.5,
  "reasoning": "Message discusses work deadline and quarterly report",
  "alternatives": [
    {
      "topic_id": 3,
      "topic_name": "Projects",
      "confidence": 0.75
    }
  ]
}
```

**Usage**:
- Identify systematic misclassification patterns
- Review low-confidence predictions
- Analyze reasoning for model decision-making
- Discover topic definition ambiguities

### Result Storage

**Database**: All results stored in `classification_experiments` table

**JSONB Fields**:
- `confusion_matrix`: Allows SQL queries for metric analysis
- `classification_results`: Full detail for individual message review

**Retention**: No automatic cleanup (manual deletion via API)

---

## 6. API Endpoints

### Create Experiment
**Endpoint**: `POST /api/v1/experiments/topic-classification`

**Request**:
```json
{
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "model_name": "llama3.2:3b",
  "message_count": 100
}
```

**Response** (201 Created):
```json
{
  "id": 42,
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "model_name": "llama3.2:3b",
  "status": "pending",
  "message_count": 100,
  "accuracy": null,
  "avg_confidence": null,
  "avg_execution_time_ms": null,
  "started_at": null,
  "completed_at": null,
  "created_at": "2025-10-26T12:30:00Z",
  "updated_at": "2025-10-26T12:30:00Z"
}
```

**Validation**:
- Provider must exist (404 if not found)
- Provider must be active (400 if inactive)
- Sufficient messages with topics (400 if insufficient)

**Side Effects**:
- Creates experiment record
- Queues background task via `execute_classification_experiment.kiq()`

---

### List Experiments
**Endpoint**: `GET /api/v1/experiments/topic-classification`

**Query Parameters**:
- `skip` (int, default=0): Pagination offset
- `limit` (int, default=50, max=100): Page size
- `status` (optional): Filter by ExperimentStatus

**Example**:
```
GET /api/v1/experiments/topic-classification?skip=0&limit=10&status=completed
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 42,
      "provider_id": "...",
      "model_name": "llama3.2:3b",
      "status": "completed",
      "message_count": 100,
      "accuracy": 0.87,
      "avg_confidence": 0.92,
      "avg_execution_time_ms": 1250.5,
      "started_at": "2025-10-26T12:30:00Z",
      "completed_at": "2025-10-26T12:35:00Z",
      "created_at": "2025-10-26T12:30:00Z",
      "updated_at": "2025-10-26T12:35:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 10
}
```

**Ordering**: Results sorted by `created_at DESC` (newest first)

---

### Get Experiment Details
**Endpoint**: `GET /api/v1/experiments/topic-classification/{experiment_id}`

**Response** (200 OK):
```json
{
  "id": 42,
  "provider_id": "...",
  "model_name": "llama3.2:3b",
  "status": "completed",
  "message_count": 100,
  "accuracy": 0.87,
  "avg_confidence": 0.92,
  "avg_execution_time_ms": 1250.5,
  "confusion_matrix": {
    "Work": {"Work": 45, "Personal": 5},
    "Personal": {"Personal": 38, "Work": 2}
  },
  "classification_results": [
    {
      "message_id": 123,
      "message_content": "Need to finish Q4 report...",
      "actual_topic_id": 1,
      "actual_topic_name": "Work",
      "predicted_topic_id": 1,
      "predicted_topic_name": "Work",
      "confidence": 0.95,
      "execution_time_ms": 1230.5,
      "reasoning": "Message discusses work deadline",
      "alternatives": []
    }
  ],
  "started_at": "2025-10-26T12:30:00Z",
  "completed_at": "2025-10-26T12:35:00Z",
  "created_at": "2025-10-26T12:30:00Z",
  "updated_at": "2025-10-26T12:35:00Z"
}
```

**Errors**:
- 404: Experiment not found

**Use Cases**:
- View detailed results for analysis
- Download confusion matrix for visualization
- Review individual message classifications
- Debug misclassification patterns

---

### Delete Experiment
**Endpoint**: `DELETE /api/v1/experiments/topic-classification/{experiment_id}`

**Response** (204 No Content)

**Validation**:
- Cannot delete running experiments (400 Bad Request)
- Experiment must exist (404 Not Found)

**Side Effects**:
- Permanently removes experiment record
- Deletes all associated results (confusion matrix, classification results)

---

## 7. Services Handling Experiments

### TopicClassificationService
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/topic_classification_service.py`

**Key Methods**:

1. **`run_experiment(provider_id, model_name, message_count)`**
   - Creates experiment record
   - Validates provider and message availability
   - Captures topics snapshot
   - Returns experiment with status=pending

2. **`classify_message(message, topics, provider, model_name)`**
   - Builds classification prompt
   - Configures LLM model (Ollama or OpenAI)
   - Executes classification via pydantic-ai Agent
   - Returns structured result + execution time

3. **`calculate_metrics(classification_results)`**
   - Calculates accuracy, average confidence, average execution time
   - Generates confusion matrix
   - Handles empty results gracefully

**Dependencies**:
- `pydantic-ai` for structured LLM outputs
- `CredentialEncryption` for API key decryption
- `OllamaProvider` / `OpenAIProvider` for model configuration

---

### WebSocketManager
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/websocket_manager.py`

**Usage in Experiments**:
```python
await websocket_manager.broadcast("experiments", {
    "type": "experiment_started",
    "experiment_id": experiment_id,
    "message_count": 100
})
```

**Topics**:
- `"experiments"`: Experiment lifecycle events

**Events**:
- `experiment_started`
- `experiment_progress`
- `experiment_completed`
- `experiment_failed`

---

### CredentialEncryption
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/credential_encryption.py`

**Usage**:
```python
encryptor = CredentialEncryption()
api_key = encryptor.decrypt(provider.api_key_encrypted)
```

**Purpose**: Securely decrypt API keys for OpenAI providers

---

## 8. Testing

### Test Coverage
**Location**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/api/v1/test_classification_experiments.py`

**Test Cases**:

1. **Creation Tests**
   - `test_create_experiment_success`: Valid creation
   - `test_create_experiment_invalid_provider_404`: Non-existent provider
   - `test_create_experiment_inactive_provider_400`: Inactive provider
   - `test_create_experiment_insufficient_messages_400`: Not enough messages

2. **Listing Tests**
   - `test_list_experiments_pagination`: Pagination works correctly
   - `test_list_experiments_status_filter`: Status filtering

3. **Retrieval Tests**
   - `test_get_experiment_details`: Detailed response
   - `test_get_experiment_not_found_404`: Non-existent experiment

4. **Deletion Tests**
   - `test_delete_experiment_success`: Successful deletion
   - `test_delete_running_experiment_400`: Cannot delete running
   - `test_delete_experiment_not_found_404`: Non-existent experiment

5. **Metrics Tests**
   - `test_calculate_metrics_accuracy`: Correct accuracy calculation
   - `test_calculate_metrics_empty_results`: Handles empty results

---

## 9. Key Insights

### Strengths
1. **Asynchronous Execution**: Background tasks prevent API blocking
2. **Real-time Progress**: WebSocket updates enable live monitoring
3. **Comprehensive Metrics**: Accuracy, confidence, confusion matrix, execution time
4. **Structured LLM Output**: Pydantic-ai ensures consistent, type-safe results
5. **Topics Snapshot**: Prevents inconsistencies during long-running experiments
6. **Error Resilience**: Individual message failures don't crash entire experiment

### Limitations
1. **No Experiment Comparison**: No built-in comparison between experiments
2. **No Parameter Tuning**: Cannot adjust prompt or temperature during experiment
3. **Random Sampling**: No stratified sampling to ensure topic balance
4. **Single Model**: Cannot test multiple models in one experiment
5. **No A/B Testing**: Cannot compare different prompts or configurations

### Optimization Opportunities
1. **Batch Classification**: Process multiple messages in parallel
2. **Result Caching**: Cache topic snapshots to avoid repeated DB queries
3. **Streaming Results**: Stream results to frontend as they're generated
4. **Experiment Templates**: Save/reuse experiment configurations
5. **Comparative Analysis**: Compare experiments side-by-side

---

## 10. Documentation Recommendations

### User Guide Sections

1. **Getting Started**
   - Prerequisites (topics, messages with topics, active LLM provider)
   - Creating your first experiment
   - Interpreting results

2. **Configuration Guide**
   - Choosing appropriate message_count
   - Provider selection (Ollama vs OpenAI)
   - Model selection best practices

3. **Results Interpretation**
   - Understanding accuracy metrics
   - Reading confusion matrices
   - Analyzing confidence scores
   - Identifying misclassification patterns

4. **Troubleshooting**
   - "Not enough messages with topics" error
   - Provider connection failures
   - Low accuracy troubleshooting
   - Performance optimization

5. **API Reference**
   - Complete endpoint documentation
   - Request/response schemas
   - WebSocket event specifications
   - Error codes and meanings

---

## Appendix: File References

### Models
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/classification_experiment.py`

### API
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/experiments.py`

### Services
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/topic_classification_service.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/websocket_manager.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/credential_encryption.py`

### Background Tasks
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py` (lines 524-729)

### Tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/api/v1/test_classification_experiments.py`

---

**Report Completed**: 2025-10-26
**Next Steps**: Document experiment workflow in user-facing documentation
