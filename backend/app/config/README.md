# AI Configuration Module

## Overview

This module centralizes all AI/LLM-related configuration values that control system behavior. All settings include production-tested rationale and support environment variable overrides.

## Configuration Structure

```python
from app.config.ai_config import ai_config

# Access settings via dot notation
threshold = ai_config.knowledge_extraction.message_threshold
```

## Settings Reference

### Knowledge Extraction

Controls automatic topic and atom extraction from messages.

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `message_threshold` | 10 | 5-100 | Min unprocessed messages to trigger extraction |
| `lookback_hours` | 24 | 1-168 | Time window for unprocessed messages |
| `confidence_threshold` | 0.7 | 0.5-1.0 | Auto-approval threshold for topics/atoms |
| `batch_size` | 50 | 10-200 | Max messages per extraction batch |

**Rationale:**
- **10 messages**: Optimal balance - too low = high LLM costs, too high = delayed insights
- **24 hours**: Daily batch processing window
- **0.7 confidence**: Based on experiments - 0.6 = too many false positives, 0.8 = missed valid topics
- **50 batch size**: LLM context window limit

### Message Scoring

Controls importance scoring and noise filtering.

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `noise_threshold` | 0.3 | 0.0-1.0 | Below = noise (exclude from analysis) |
| `signal_threshold` | 0.7 | 0.0-1.0 | Above = signal (high priority) |
| `content_weight` | 0.4 | 0.0-1.0 | Content quality factor (40%) |
| `author_weight` | 0.2 | 0.0-1.0 | Author reputation factor (20%) |
| `temporal_weight` | 0.2 | 0.0-1.0 | Temporal relevance factor (20%) |
| `topics_weight` | 0.2 | 0.0-1.0 | Topic importance factor (20%) |

**Validation:** All weights must sum to 1.0

**Classifications:**
- `score < 0.3` → **noise** (exclude)
- `0.3 ≤ score ≤ 0.7` → **weak_signal** (review)
- `score > 0.7` → **signal** (high priority)

### Analysis System

Controls batch processing for analysis runs.

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `time_gap_seconds` | 600 | 60-3600 | Max gap between messages in same batch |
| `max_batch_size` | 50 | 10-200 | Max messages per batch |

**Rationale:**
- **600 seconds (10 min)**: Typical pause in active conversation
- **50 messages**: Balance between context and LLM cost

### Vector Search

Controls semantic similarity thresholds.

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `semantic_search_threshold` | 0.65 | 0.0-1.0 | Balanced precision/recall |
| `duplicate_detection_threshold` | 0.95 | 0.8-1.0 | High precision for duplicates |
| `exploration_threshold` | 0.50 | 0.0-1.0 | Low threshold for exploratory search |

**Use Cases:**
- `0.65`: General semantic search
- `0.95`: Duplicate/spam detection
- `0.50`: Exploratory discovery

## Environment Variables

Override any setting via environment variables with pattern: `AI_{SUBSECTION}_{FIELD}`

### Examples

```bash
# Knowledge Extraction
export AI_KNOWLEDGE_EXTRACTION_MESSAGE_THRESHOLD=20
export AI_KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS=48
export AI_KNOWLEDGE_EXTRACTION_CONFIDENCE_THRESHOLD=0.8
export AI_KNOWLEDGE_EXTRACTION_BATCH_SIZE=100

# Message Scoring (weights must sum to 1.0)
export AI_MESSAGE_SCORING_NOISE_THRESHOLD=0.4
export AI_MESSAGE_SCORING_SIGNAL_THRESHOLD=0.8
export AI_MESSAGE_SCORING_CONTENT_WEIGHT=0.5
export AI_MESSAGE_SCORING_AUTHOR_WEIGHT=0.3
export AI_MESSAGE_SCORING_TEMPORAL_WEIGHT=0.1
export AI_MESSAGE_SCORING_TOPICS_WEIGHT=0.1

# Analysis System
export AI_ANALYSIS_TIME_GAP_SECONDS=300  # 5 minutes
export AI_ANALYSIS_MAX_BATCH_SIZE=100

# Vector Search
export AI_VECTOR_SEARCH_SEMANTIC_SEARCH_THRESHOLD=0.75
export AI_VECTOR_SEARCH_DUPLICATE_DETECTION_THRESHOLD=0.98
export AI_VECTOR_SEARCH_EXPLORATION_THRESHOLD=0.45
```

## Usage Examples

### Python Code

```python
from app.config.ai_config import ai_config

# Knowledge Extraction
if unprocessed_count >= ai_config.knowledge_extraction.message_threshold:
    await extract_knowledge(messages[:ai_config.knowledge_extraction.batch_size])

# Message Scoring
score = (
    content_score * ai_config.message_scoring.content_weight +
    author_score * ai_config.message_scoring.author_weight +
    temporal_score * ai_config.message_scoring.temporal_weight +
    topics_score * ai_config.message_scoring.topics_weight
)

if score < ai_config.message_scoring.noise_threshold:
    classification = "noise"
elif score > ai_config.message_scoring.signal_threshold:
    classification = "signal"

# Vector Search
results = await search_service.search_messages(
    session,
    query="bug in production",
    threshold=ai_config.vector_search.semantic_search_threshold
)
```

### Docker Compose

```yaml
services:
  worker:
    environment:
      # Increase extraction threshold for high-traffic environments
      AI_KNOWLEDGE_EXTRACTION_MESSAGE_THRESHOLD: 50
      AI_KNOWLEDGE_EXTRACTION_BATCH_SIZE: 100

      # Stricter noise filtering
      AI_MESSAGE_SCORING_NOISE_THRESHOLD: 0.4
      AI_MESSAGE_SCORING_SIGNAL_THRESHOLD: 0.8
```

## Validation

### Weight Sum Validation

Message scoring weights are automatically validated to sum to 1.0:

```python
from app.config.ai_config import MessageScoringSettings
from pydantic import ValidationError

try:
    # Invalid: weights sum to 1.2
    settings = MessageScoringSettings(
        content_weight=0.5,
        author_weight=0.3,
        temporal_weight=0.2,
        topics_weight=0.2
    )
except ValidationError as e:
    # Error: "Scoring weights must sum to 1.0, got 1.20"
    print(e)
```

### Range Validation

All numeric settings have enforced bounds via Pydantic `Field` validators:

```python
# Invalid: threshold below minimum
ai_config.knowledge_extraction.message_threshold = 3  # Raises ValidationError (min=5)

# Invalid: confidence above maximum
ai_config.knowledge_extraction.confidence_threshold = 1.5  # Raises ValidationError (max=1.0)
```

## Testing

```bash
# Test config loads correctly
cd backend
uv run python -c "from app.config.ai_config import ai_config; print(ai_config)"

# Test weight validation
uv run python -c "
from app.config.ai_config import MessageScoringSettings
from pydantic import ValidationError
try:
    MessageScoringSettings(content_weight=0.5, author_weight=0.3, temporal_weight=0.2, topics_weight=0.2)
except ValidationError as e:
    print(f'✅ Validation working: {e.errors()[0][\"msg\"]}')
"
```

## Migration Guide

**Before:**
```python
# Hardcoded magic numbers
KNOWLEDGE_EXTRACTION_THRESHOLD = 10
confidence_threshold = 0.7
score = content * 0.4 + author * 0.2 + temporal * 0.2 + topics * 0.2
```

**After:**
```python
from app.config.ai_config import ai_config

threshold = ai_config.knowledge_extraction.message_threshold
confidence = ai_config.knowledge_extraction.confidence_threshold
score = (
    content * ai_config.message_scoring.content_weight +
    author * ai_config.message_scoring.author_weight +
    temporal * ai_config.message_scoring.temporal_weight +
    topics * ai_config.message_scoring.topics_weight
)
```

## Future Enhancements

Potential additions:
- LLM provider-specific settings (temperature, max_tokens)
- Rate limiting thresholds
- Caching configuration
- A/B testing support for different threshold values
