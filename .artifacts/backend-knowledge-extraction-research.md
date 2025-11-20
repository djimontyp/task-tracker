# Backend Implementation Analysis - Knowledge Extraction Pipeline

## 1. Data Models

### Topics
**File:** `backend/app/models/topic.py`

**Schema fields:**
- `id`: UUID (primary key)
- `name`: str (unique, max 100 chars)
- `description`: Text
- `icon`: str | None (Heroicon name, max 50 chars)
- `color`: str | None (hex format #RRGGBB, max 7 chars)
- `embedding`: list[float] | None (Vector 1536 dimensions for semantic search)
- `created_at`, `updated_at`: auto-managed timestamps

**Relationships:**
- `versions: list[TopicVersion]` - One-to-many relationship for versioning

**Auto-selection logic:**
- `auto_select_icon(name, description)` - Keyword matching from `TOPIC_ICONS` dictionary (shopping → ShoppingCartIcon, etc.)
- `auto_select_color(icon)` - Icon to color mapping from `ICON_COLORS`
- `validate_hex_color(color)` - Validates format #RRGGBB
- `convert_to_hex_if_needed(color)` - Supports Tailwind color names for backward compatibility

**Schemas:**
- `TopicCreate` - name, description, icon (optional), color (optional) with hex validation
- `TopicUpdate` - all fields optional, hex validation
- `TopicPublic` - response schema with all fields

---

### Messages
**File:** `backend/app/models/message.py`

**Schema fields:**
- `id`: UUID (primary key)
- `external_message_id`: str (indexed, max 100 chars)
- `content`: Text
- `sent_at`: datetime
- `source_id`: int (FK to sources.id)
- `author_id`: int (FK to users.id)
- `telegram_profile_id`: int | None (FK to telegram_profiles.id)
- `avatar_url`: str | None (cached from User)
- `classification`: str | None (AI classification result)
- `confidence`: float | None (0.0-1.0)
- `analyzed`: bool (default False)
- `analysis_status`: str | None (pending/analyzed/spam/noise)
- `included_in_runs`: list[str] | None (JSONB - UUIDs of AnalysisRuns)
- `topic_id`: UUID | None (FK to topics.id)
- `embedding`: list[float] | None (Vector 1536)
- `importance_score`: float | None (0.0-1.0, noise filtering)
- `noise_classification`: str | None (signal/noise/spam/low_quality/high_quality)
- `noise_factors`: dict[str, float] | None (JSONB)
- `status`: str | None (pending/approved/rejected)
- `approved_at`, `rejected_at`: datetime | None
- `rejection_reason`, `rejection_comment`: str | None

**Key insight:** Messages are the SOURCE for extraction, with rich metadata for filtering and approval workflow.

---

### Atoms
**File:** `backend/app/models/atom.py`

**Schema fields:**
- `id`: UUID (primary key)
- `type`: str (max 20 chars - problem/solution/decision/question/insight/pattern/requirement)
- `title`: str (max 200 chars, indexed)
- `content`: Text (full description)
- `confidence`: float | None (0.0-1.0, AI confidence)
- `user_approved`: bool (default False)
- `archived`: bool (default False)
- `archived_at`: datetime | None
- `meta`: dict | None (JSON - tags, sources, etc.)
- `embedding`: list[float] | None (Vector 1536)
- `created_at`, `updated_at`: auto-managed

**Relationships:**
- `versions: list[AtomVersion]` - One-to-many for versioning

**Enums:**
- `AtomType`: problem, solution, decision, question, insight, pattern, requirement
- `LinkType`: continues, solves, contradicts, supports, refines, relates_to, depends_on

**Related tables:**
- `AtomLink` - Bidirectional links between atoms (from_atom_id, to_atom_id, link_type, strength)
- `TopicAtom` - Many-to-many: Topics ↔ Atoms (with position, note)

**Bulk operations:**
- `BulkApproveRequest/Response` - Partial success strategy
- `BulkArchiveRequest/Response` - Idempotent archiving
- `BulkDeleteRequest/Response` - Cascade delete (links, versions, topic relationships)

---

### AtomVersions
**File:** `backend/app/models/atom_version.py`

**Schema fields:**
- `id`: int (primary key)
- `atom_id`: UUID (FK to atoms.id, indexed)
- `version`: int (incremental per atom)
- `data`: dict (JSON - full snapshot: type, title, content, confidence, meta)
- `created_at`: datetime (server default)
- `created_by`: str | None (max 100 chars)
- `approved`: bool (default False)
- `approved_at`: datetime | None

**Key insight:** Immutable snapshots, version numbers auto-increment per atom.

---

### TopicVersions
**File:** `backend/app/models/topic_version.py`

**Schema:** Identical structure to AtomVersions but for Topics
- `topic_id` instead of `atom_id`
- `data`: dict (name, description, icon, color)

---

## 2. API Endpoints

### Extraction (Background Task)
**File:** `backend/app/api/v1/knowledge.py`

**Endpoint:** `POST /api/v1/knowledge/extract` (202 Accepted)

**Request:**
```json
{
  "message_ids": [1, 2, 3],  // or
  "period": {
    "period_type": "last_24h" | "last_7d" | "last_30d" | "custom",
    "topic_id": null,  // optional filter
    "start_date": "2025-01-01T00:00:00Z",  // required for custom
    "end_date": "2025-01-10T23:59:59Z"
  },
  "agent_config_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Knowledge extraction queued for 50 messages",
  "message_count": 50,
  "agent_config_id": "uuid"
}
```

**Logic:**
1. Validate agent config exists and is active
2. Resolve message IDs (direct or period-based via `get_messages_by_period()`)
3. Queue background task: `extract_knowledge_from_messages_task.kiq()`
4. Return 202 Accepted

**WebSocket events:**
- `knowledge.extraction_started`
- `knowledge.topic_created`
- `knowledge.atom_created`
- `knowledge.version_created`
- `knowledge.extraction_completed`
- `knowledge.extraction_failed`

---

### Atoms CRUD
**File:** `backend/app/api/v1/atoms.py`

**Endpoints:**
- `GET /api/v1/atoms` - List with pagination (skip, limit)
- `GET /api/v1/atoms/{atom_id}` - Get by ID
- `POST /api/v1/atoms` - Create (201 Created)
- `PATCH /api/v1/atoms/{atom_id}` - Update (partial)
- `DELETE /api/v1/atoms/{atom_id}` - Delete (204 No Content)
- `POST /api/v1/atoms/bulk-approve` - Bulk approve atoms
- `POST /api/v1/atoms/bulk-archive` - Bulk archive atoms
- `POST /api/v1/atoms/bulk-delete` - Bulk delete atoms (cascade)
- `POST /api/v1/atoms/{atom_id}/topics/{topic_id}` - Link atom to topic (201 Created)

**Bulk operations:**
- Partial success strategy (continue on errors)
- Return `approved_count`/`archived_count`/`deleted_count` + `failed_ids` + `errors`
- Idempotent for approve/archive, NOT idempotent for delete

**Cascade delete logic:**
- Deletes `atom_links` (both from/to)
- Deletes `atom_versions`
- Deletes `topic_atoms` relationships
- Then deletes atom itself

---

### Versioning (Approval Workflow)
**File:** `backend/app/api/v1/versions.py`

**Endpoints:**
- `GET /api/v1/topics/{topic_id}/versions` - List topic versions
- `GET /api/v1/topics/{topic_id}/versions/{version}/diff?compare_to={version}` - Diff between versions
- `POST /api/v1/topics/{topic_id}/versions/{version}/approve` - Approve topic version
- `POST /api/v1/topics/{topic_id}/versions/{version}/reject` - Reject topic version
- `GET /api/v1/atoms/{atom_id}/versions` - List atom versions
- `GET /api/v1/atoms/{atom_id}/versions/{version}/diff?compare_to={version}` - Diff between versions
- `POST /api/v1/atoms/{atom_id}/versions/{version}/approve` - Approve atom version
- `POST /api/v1/atoms/{atom_id}/versions/{version}/reject` - Reject atom version
- `POST /api/v1/versions/bulk-approve` - Bulk approve versions (entity_type: topic/atom)
- `POST /api/v1/versions/bulk-reject` - Bulk reject versions
- `GET /api/v1/versions/pending-count` - Get pending versions count (total + breakdown)

**Approval workflow:**
1. Fetch version by ID
2. Validate not already approved
3. Apply `version.data` to main entity (Topic/Atom)
4. Mark `approved=True`, set `approved_at`
5. Commit transaction
6. Broadcast WebSocket update (pending count)

**Diff logic:**
- Uses DeepDiff library
- Returns `from_version`, `to_version`, `changes` (formatted), `summary` (human-readable)

---

### Messages
**File:** `backend/app/api/v1/messages.py`

**Endpoints:**
- `POST /api/v1/messages` - Create message (broadcasts WebSocket)
- `GET /api/v1/messages` - List with filters (pagination, author, source, topic, date range, importance, classification)
- `GET /api/v1/messages/filters` - Get filter options (unique authors, sources, date range)
- `GET /api/v1/messages/{message_id}` - Get message details
- `GET /api/v1/messages/{message_id}/inspect` - Full inspection (atoms, history, classification)
- `PUT /api/v1/messages/{message_id}/reassign` - Reassign to different topic (logs history)
- `POST /api/v1/messages/{message_id}/approve` - Approve classification (stores feedback)
- `POST /api/v1/messages/{message_id}/reject` - Reject classification (stores feedback)

**Key insight:** Approval/rejection stores classification feedback for model retraining.

---

## 3. LLM Integration

### Files
- `backend/app/services/knowledge/llm_agents.py` - Model building
- `backend/app/services/knowledge/knowledge_orchestrator.py` - Extraction orchestration
- `backend/app/services/knowledge/knowledge_schemas.py` - Pydantic schemas for LLM output

---

### Providers & Models
**Supported:**
- **Ollama** - Requires `base_url` (e.g., http://localhost:11434)
- **OpenAI** - Requires encrypted `api_key`

**Model building:**
```python
def build_model_instance(agent_config, provider, api_key):
    if provider.type == ProviderType.ollama:
        ollama_provider = OllamaProvider(base_url=provider.base_url)
        return OpenAIChatModel(model_name=agent_config.model_name, provider=ollama_provider)
    elif provider.type == ProviderType.openai:
        openai_provider = OpenAIProvider(api_key=api_key)
        return OpenAIChatModel(model_name=agent_config.model_name, provider=openai_provider)
```

**Uses pydantic-ai library** (OpenAIChatModel with custom providers)

---

### System Prompt
**Location:** `backend/app/services/knowledge/llm_agents.py:13-54`

**Key requirements:**
- Respond ONLY with JSON (no markdown, no explanations)
- Extract topics (2-4 words each) and atoms
- All fields must be present (use empty arrays)
- confidence: 0.0-1.0
- type: problem|solution|insight|decision|question|pattern|requirement
- If no extraction possible: `{"topics": [], "atoms": []}`

**Fallback:** If LLM fails validation, returns empty result

---

### Extraction Flow
**Service:** `KnowledgeOrchestrator` in `backend/app/services/knowledge/knowledge_orchestrator.py`

**Steps:**
1. **Build prompt** from messages (ID, author, timestamp, content)
2. **Decrypt API key** (if OpenAI)
3. **Create agent:**
   ```python
   agent = PydanticAgent(
       model=model,
       system_prompt=agent_config.system_prompt,
       output_type=KnowledgeExtractionOutput,
       output_retries=5  # Validation retries
   )
   ```
4. **Run extraction** with model settings (temperature, max_tokens)
5. **Parse output:** `KnowledgeExtractionOutput(topics, atoms)`
6. **Error handling:**
   - Logs agent name, model, provider type, message count
   - Detects validation errors (ToolRetryError)
   - Suggests using more capable models for validation failures

---

### LLM Output Schemas
**File:** `backend/app/services/knowledge/knowledge_schemas.py`

**ExtractedTopic:**
- `name`: str (max 100)
- `description`: str
- `confidence`: float (0.0-1.0, default 0.7)
- `keywords`: list[str]
- `related_message_ids`: list[UUID]

**ExtractedAtom:**
- `type`: str (problem/solution/decision/...)
- `title`: str (max 200)
- `content`: str
- `confidence`: float (0.0-1.0, default 0.7)
- `topic_name`: str (parent topic)
- `related_message_ids`: list[UUID]
- `links_to_atom_titles`: list[str]
- `link_types`: list[str]

**KnowledgeExtractionOutput:**
- `topics`: list[ExtractedTopic]
- `atoms`: list[ExtractedAtom]

---

### Error Handling
**Where LLM fails:**
1. Invalid JSON response → Output validation error → 5 retries → Return empty result
2. Missing fields → Validation error → Retry
3. Wrong types (confidence not 0-1, type not enum) → Validation error → Retry
4. Network errors → Logged with provider details → Exception raised

**Logging:**
- Agent name, model name, provider type, message count
- Exception type and details
- Root cause (if chained exception)
- Suggests GPT-4/Claude for persistent validation failures

---

## 4. Business Logic

### KnowledgeOrchestrator Methods
**File:** `backend/app/services/knowledge/knowledge_orchestrator.py`

---

#### `save_topics()`
**Input:** `list[ExtractedTopic]`, session, confidence_threshold (default 0.7), created_by

**Logic:**
1. Filter by confidence threshold
2. For each topic:
   - Check if exists by name (`select(Topic).where(Topic.name == name)`)
   - **If exists:** Create version snapshot (NOT direct update)
     - Auto-select icon/color
     - Create `TopicVersion` via `VersioningService.create_topic_version()`
     - Append to `version_created_topic_ids`
   - **If new:** Create `Topic` directly with auto-selected icon/color
3. Commit transaction
4. Return `(topic_map: dict[name -> Topic], version_created_topic_ids: list[int])`

**Key insight:** Existing topics NEVER updated directly - versioning workflow required.

---

#### `save_atoms()`
**Input:** `list[ExtractedAtom]`, topic_map, session, confidence_threshold, created_by

**Logic:**
1. Filter by confidence threshold
2. For each atom:
   - Validate `topic_name` exists in `topic_map` (skip if not)
   - Check if exists by title (`select(Atom).where(Atom.title == title)`)
   - **If exists:** Create version snapshot (NOT direct update)
     - Create `AtomVersion` via `VersioningService.create_atom_version()`
     - Append to `version_created_atom_ids`
   - **If new:** Create `Atom` + `TopicAtom` link
     - Set `meta = {"source": "llm_extraction", "message_ids": [...]}`
     - Set `user_approved = False`
     - Create `TopicAtom` with note: "Auto-extracted with confidence X"
3. Commit transaction
4. Return `(saved_atoms: list[Atom], version_created_atom_ids: list[int])`

**Key insight:** Existing atoms NEVER updated directly - versioning workflow required.

---

#### `link_atoms()`
**Input:** `list[ExtractedAtom]`, saved_atoms, session

**Logic:**
1. Build title→ID map from saved atoms
2. For each atom:
   - Validate `links_to_atom_titles` and `link_types` arrays match length
   - For each link target:
     - Check target exists in saved atoms (skip if not)
     - Check not self-referential
     - Check link doesn't already exist (`select(AtomLink).where(...)`)
     - Create `AtomLink(from_atom_id, to_atom_id, link_type, strength=None)`
3. Commit transaction
4. Return link count

**Edge cases:**
- Mismatched array lengths → Skip atom links
- Target not found → Skip link
- Self-referential → Skip link
- Duplicate link → Skip link

---

#### `update_messages()`
**Input:** messages, topic_map, extracted_topics, session

**Logic:**
1. Build `message_id → topic_id` map from `extracted_topics.related_message_ids`
2. For each message:
   - If message ID in map: set `message.topic_id`
   - First assignment wins (no overwrite)
3. Commit transaction
4. Return updated count

**Key insight:** Messages linked to topics based on LLM extraction.

---

### Background Task
**File:** `backend/app/tasks/knowledge.py` (inferred from API endpoint)

**Task:** `extract_knowledge_from_messages_task`

**Steps (inferred from orchestrator methods):**
1. Fetch messages by IDs
2. Instantiate `KnowledgeOrchestrator(agent_config, provider)`
3. Call `extract_knowledge(messages)` → Returns `KnowledgeExtractionOutput`
4. Call `save_topics()` → Returns topic_map + version_created_topic_ids
5. Call `save_atoms()` → Returns saved_atoms + version_created_atom_ids
6. Call `link_atoms()` → Returns link count
7. Call `update_messages()` → Returns updated message count
8. Broadcast WebSocket events for each step

**WebSocket broadcasting:**
- `knowledge.extraction_started` (before extraction)
- `knowledge.topic_created` (for each new topic)
- `knowledge.atom_created` (for each new atom)
- `knowledge.version_created` (for each version snapshot)
- `knowledge.extraction_completed` (after all steps)
- `knowledge.extraction_failed` (on exception)

---

### Versioning Workflow
**File:** `backend/app/services/versioning_service.py`

**Approval process:**
1. Fetch version by ID
2. Validate: version exists, not already approved
3. **Apply to main entity:**
   ```python
   entity = await db.get(Entity, entity_id)
   for key, value in version.data.items():
       if hasattr(entity, key):
           setattr(entity, key, value)
   ```
4. Mark `version.approved = True`, set `version.approved_at`
5. Commit transaction
6. Broadcast WebSocket update (`versions.pending_count_updated`)

**Rejection process:**
- Fetch version, commit (no changes to main entity)
- Broadcast WebSocket update

**Diff generation:**
- Uses DeepDiff library (`ignore_order=True, view="tree"`)
- Formats changes: `[{type, path, old_value, new_value}, ...]`
- Generates summary: "Changes detected: 3 values changed, 1 item added"

---

### Atom CRUD Service
**File:** `backend/app/services/atom_crud.py`

**Key methods:**
- `get_atom(atom_id)` - Returns `AtomPublic` or None
- `list_atoms(skip, limit)` - Returns `(list[AtomPublic], total)` ordered by `created_at DESC`
- `create_atom(atom_data)` - Creates Atom from `AtomCreate` schema
- `update_atom(atom_id, atom_data)` - Partial update from `AtomUpdate` schema
- `link_to_topic(atom_id, topic_id, position, note)` - Creates `TopicAtom` (returns False if exists)
- `list_by_topic(topic_id)` - Returns atoms for topic, ordered by position (nulls last), then created_at
- `bulk_approve_atoms(atom_ids)` - Partial success, returns `BulkApproveResponse`
- `bulk_archive_atoms(atom_ids)` - Partial success, returns `BulkArchiveResponse`
- `bulk_delete_atoms(atom_ids)` - Partial success, cascade delete, returns `BulkDeleteResponse`

**Cascade delete logic:**
```python
async def _cascade_delete_atom_relations(atom_id):
    # Delete atom_links (from_atom_id)
    # Delete atom_links (to_atom_id)
    # Delete atom_versions
    # Delete topic_atoms
    # Then flush
```

---

## 5. Edge Cases & Validation

### Empty Messages → Atoms?
**Handled:** No explicit check in orchestrator. LLM expected to return empty arrays.
- If messages = [], orchestrator returns `KnowledgeExtractionOutput(topics=[], atoms=[])`
- If LLM extracts atoms from empty messages, validation passes (no content check)

**Potential issue:** Empty content messages could create low-confidence atoms.

**Mitigation:** Confidence threshold (default 0.7) filters low-quality extractions.

---

### Duplicate Atoms Detection?
**Current logic:** Checks by `title` ONLY (`select(Atom).where(Atom.title == title)`)

**Edge case:** Same title, different content → Creates version snapshot (not duplicate)
- LLM extracts "Implement dark mode" twice with different content
- First creates Atom
- Second creates AtomVersion (because title exists)
- User must manually approve/reject version

**Potential issue:** True duplicates (same title + content) still create versions.

**Missing:** Content-based deduplication (e.g., embedding similarity check).

---

### Concurrent Version Edits?
**Current handling:** NONE

**Race condition scenario:**
1. User A extracts knowledge → Creates AtomVersion #1
2. User B extracts knowledge (same atom) → Creates AtomVersion #2
3. User A approves version #1 → Applies to Atom
4. User B approves version #2 → Overwrites User A's changes

**Mitigation:** Last-write-wins (no optimistic locking)

**Potential issue:** Silent data loss on concurrent approvals.

**Missing:** Version conflict detection or merge workflow.

---

### Rollback Mechanism?
**Current implementation:** NONE

**Approval is one-way:**
- `version.approved = True` → Applies to entity
- No "unapprove" or "rollback to version N"

**Workaround:** Create new version with old data, approve it.

**Potential issue:** Accidental approval cannot be reverted.

**Missing:** `POST /api/v1/{entity}/rollback-to-version/{version}` endpoint.

---

### Topic Name Uniqueness Conflict?
**Database constraint:** `name` is UNIQUE in `topics` table

**Scenario:**
1. LLM extracts Topic "Machine Learning"
2. User manually creates Topic "machine learning" (lowercase)
3. LLM extracts "Machine Learning" again → **IntegrityError**

**Handling:** NOT handled in code (will raise exception)

**Missing:** Case-insensitive check before insert or `UNIQUE` constraint with `LOWER(name)`.

---

### Atom Type Validation?
**Validation:** Pydantic validator in `AtomCreate/AtomUpdate` schemas

```python
@field_validator("type", mode="before")
def validate_atom_type(cls, v):
    if v not in [t.value for t in AtomType]:
        raise ValueError(f"Invalid atom type: {v}")
    return v
```

**Enforced at:**
- API level (FastAPI Pydantic validation)
- NOT enforced in database (no CHECK constraint)

**Edge case:** Direct database insert with invalid type → Succeeds (validation bypassed)

---

### Confidence Threshold Edge Case?
**Config:** Default 0.7 in `ai_config.knowledge_extraction.confidence_threshold`

**Scenario:**
- LLM extracts Topic with confidence 0.69
- Atom referencing that topic with confidence 0.8
- Topic skipped (below threshold)
- Atom also skipped (topic not in `topic_map`)

**Logging:** "Atom 'X' references unknown topic 'Y', skipping"

**Potential issue:** High-confidence atoms lost due to low-confidence topic.

**Mitigation:** User can manually create topic, re-extract atoms.

---

### Link Array Mismatch?
**Handled:** Validation in `link_atoms()`

```python
if len(extracted_atom.links_to_atom_titles) != len(extracted_atom.link_types):
    logger.warning("Mismatched link arrays, skipping links")
    continue
```

**Result:** ALL links for that atom skipped (not partial).

**Potential issue:** One bad link breaks all links for atom.

**Missing:** Partial success (skip malformed link, process others).

---

### Message → Topic Assignment?
**Logic:** First assignment wins (`update_messages()`)

**Scenario:**
- Message #1 appears in 2 topics' `related_message_ids`
- First topic processed assigns `message.topic_id`
- Second topic skipped (already assigned)

**Logging:** "Message X already assigned to a topic, keeping first assignment"

**Potential issue:** Multi-topic messages forced to single topic.

**Missing:** Many-to-many Message ↔ Topic relationship.

---

## 6. Issues Found

### Critical

**1. No transaction isolation for concurrent approvals**
- **File:** `backend/app/services/versioning_service.py:168-225`
- **Issue:** Multiple users approving versions concurrently → last-write-wins, silent data loss
- **Fix:** Add optimistic locking (version number check) or row-level locking

**2. Topic name uniqueness not case-insensitive**
- **File:** `backend/app/models/topic.py:207-211`
- **Issue:** "Machine Learning" vs "machine learning" causes IntegrityError
- **Fix:** Add case-insensitive unique constraint or normalize name before insert

**3. No rollback mechanism for approved versions**
- **File:** `backend/app/services/versioning_service.py`
- **Issue:** Accidental approval cannot be reverted
- **Fix:** Add `rollback_to_version()` method + API endpoint

---

### Major

**4. Duplicate atoms only checked by title**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:276-282`
- **Issue:** Same title + different content creates version (not duplicate detection)
- **Fix:** Add content similarity check (embedding-based) before versioning

**5. Link array mismatch skips ALL links**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:357-363`
- **Issue:** One malformed link breaks all links for atom
- **Fix:** Partial success (skip bad link, process valid ones)

**6. Message-topic assignment is one-to-one**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:426-452`
- **Issue:** Multi-topic messages forced to single topic
- **Fix:** Create many-to-many `message_topics` junction table

**7. No LLM cost tracking**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py`
- **Issue:** No logging of tokens used, costs incurred
- **Fix:** Log `result.usage` (from pydantic-ai) to database for cost analysis

---

### Minor

**8. Empty message content not validated**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:47-70`
- **Issue:** Empty/whitespace messages sent to LLM (wasted cost)
- **Fix:** Filter messages with `content.strip() == ""` before extraction

**9. Atom type not enforced in database**
- **File:** `backend/app/models/atom.py:56-59`
- **Issue:** Direct DB insert bypasses Pydantic validation
- **Fix:** Add `CHECK` constraint: `type IN ('problem', 'solution', ...)`

**10. No rate limiting on extraction endpoint**
- **File:** `backend/app/api/v1/knowledge.py:69-151`
- **Issue:** User can trigger unlimited LLM requests
- **Fix:** Add rate limiting (e.g., 10 requests/hour per user)

**11. Confidence threshold applied independently**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:166-172, 261-267`
- **Issue:** High-confidence atoms lost if topic below threshold
- **Fix:** Accept atoms if topic confidence ≥ 0.5 OR atom confidence ≥ 0.9

**12. No embedding generation in extraction**
- **File:** `backend/app/services/knowledge/knowledge_orchestrator.py:208-221, 304-327`
- **Issue:** Topics/Atoms created without embeddings (semantic search broken)
- **Fix:** Call embedding service after creation, update entity

---

## 7. Missing Pieces for Production-Ready

### High Priority

1. **Embedding generation pipeline**
   - After topic/atom creation, generate embeddings via `EmbeddingService`
   - Background task or sync in creation flow
   - Required for semantic search functionality

2. **Cost tracking & monitoring**
   - Log LLM usage (tokens, cost, latency) per extraction
   - Dashboard for cost analysis
   - Alerts for unexpected spikes

3. **Rate limiting & quotas**
   - Per-user extraction limits (e.g., 10/hour)
   - Per-agent daily quotas
   - Queue depth limits (prevent NATS overflow)

4. **Rollback workflow**
   - `POST /api/v1/{entity}/{id}/rollback-to-version/{version}` endpoint
   - UI for "Undo approval"
   - History tracking for rollback events

5. **Duplicate detection**
   - Content similarity check (embedding cosine distance > 0.95)
   - UI prompt: "Similar atom exists, merge or create version?"
   - Batch deduplication job

---

### Medium Priority

6. **Concurrent approval handling**
   - Optimistic locking (check version number on approve)
   - Return 409 Conflict if version changed since read
   - UI refresh + retry prompt

7. **Multi-topic message support**
   - Create `message_topics` junction table
   - Update extraction logic to assign multiple topics
   - UI shows all assigned topics

8. **Partial link success**
   - Process valid links even if some malformed
   - Return warnings for skipped links

9. **Case-insensitive topic names**
   - Add functional index: `CREATE UNIQUE INDEX ON topics (LOWER(name))`
   - Normalize `topic.name` before insert

10. **Atom type database constraint**
    - Add `CHECK (type IN ('problem', 'solution', ...))`
    - Prevents invalid data via direct DB writes

---

### Low Priority

11. **Empty message filtering**
    - Pre-filter messages with `content.strip() == ""` before LLM
    - Log skipped message count

12. **Confidence threshold adjustment**
    - Accept atoms if `topic_confidence >= 0.5 OR atom_confidence >= 0.9`
    - Config per agent (different models = different confidence calibration)

13. **LLM provider failover**
    - Retry with backup provider if primary fails
    - Config: `agent_config.fallback_provider_id`

14. **Extraction resumption**
    - If background task crashes mid-extraction, resume from last saved entity
    - Store extraction progress in database

15. **Batch size optimization**
    - Auto-tune batch size (10-50 messages) based on model context window
    - Warn if batch too large (>100 messages)

---

## Files Researched

**Models:**
- `backend/app/models/topic.py` (Topic, TopicVersion schemas)
- `backend/app/models/message.py` (Message schema)
- `backend/app/models/atom.py` (Atom, AtomLink, TopicAtom, bulk operations)
- `backend/app/models/atom_version.py` (AtomVersion schema)
- `backend/app/models/topic_version.py` (TopicVersion schema)

**Services:**
- `backend/app/services/knowledge/knowledge_orchestrator.py` (Extraction flow)
- `backend/app/services/knowledge/llm_agents.py` (Model building, system prompt)
- `backend/app/services/knowledge/knowledge_schemas.py` (Pydantic LLM output)
- `backend/app/services/atom_crud.py` (Atom CRUD, bulk operations)
- `backend/app/services/versioning_service.py` (Versioning logic, diff, approval)
- `backend/app/services/versioning/atom_versioning.py` (Atom-specific versioning)

**API Endpoints:**
- `backend/app/api/v1/atoms.py` (Atom CRUD endpoints)
- `backend/app/api/v1/knowledge.py` (Extraction trigger endpoint)
- `backend/app/api/v1/versions.py` (Versioning approval endpoints)
- `backend/app/api/v1/messages.py` (Message CRUD, approval, rejection)

**Background Tasks:**
- `backend/app/tasks/knowledge.py` (Background extraction task - inferred structure)

---

**Total files:** 14