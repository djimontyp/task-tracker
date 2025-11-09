# Test Conversation Scenarios

This directory contains realistic Telegram conversation flows for end-to-end testing of the knowledge extraction system.

## Overview

These scenarios test the system's ability to:
- Classify messages by importance (noise, weak_signal, strong_signal)
- Extract knowledge from technical discussions
- Handle bilingual conversations (Ukrainian + English)
- Filter out casual chat while preserving technical content

## Scenarios

### 1. Bug Report Discussions (2 files)

**Files**: `bug-report-uk.json`, `bug-report-en.json`

Typical bug report flow: user reports issue → team investigates → resolution found.
- Mix of noise (greetings, emoji reactions) and signal (technical analysis, solutions)
- 10 messages each
- Tests: classification accuracy, knowledge extraction from debugging discussions

### 2. Feature Planning (2 files)

**Files**: `feature-planning-uk.json`, `feature-planning-en.json`

Feature discussion from idea to implementation plan.
- High signal-to-noise ratio (mostly technical content)
- 11-12 messages each
- Tests: architecture decision extraction, task assignment tracking

### 3. Noise Conversations (2 files)

**Files**: `noise-uk.json`, `noise-en.json`

Pure casual chat without technical value.
- Greetings, small talk, lunch coordination, emoji
- 12-15 messages each
- Tests: noise filtering, ensuring no false knowledge extraction

### 4. Technical Deep-Dive (2 files)

**Files**: `technical-uk.json`, `technical-en.json`

In-depth technical discussions with code, architecture, and resources.
- Code snippets, algorithm analysis, documentation links
- 15 messages each
- Tests: code reference extraction, technical concept tracking, resource link preservation

### 5. Mixed Language (1 file)

**Files**: `mixed-language.json`

Realistic code-switching between Ukrainian and English.
- Common in Ukrainian tech teams
- 14 messages
- Tests: multilingual classification, language detection, context preservation

### 6. Mixed Signal/Noise (1 file)

**Files**: `mixed-signal-noise-uk.json`

Real conversation flow: casual → technical → casual.
- 16 messages with interleaved signal and noise
- Tests: selective knowledge extraction, conversation segmentation

### 7. Architecture Decision (1 file)

**Files**: `architecture-decision-en.json`

Comprehensive architecture decision discussion with trade-offs.
- 15 messages with alternatives, cost analysis, decision rationale
- Tests: ADR extraction, trade-off analysis tracking, decision record creation

## JSON Structure

Each scenario file follows this structure:

```json
{
  "scenario": "scenario_type",
  "language": "uk|en|mixed",
  "description": "Brief description of the conversation flow",
  "messages": [
    {
      "order": 1,
      "text": "Message content",
      "language": "uk|en",
      "expected_label": "noise|weak_signal|strong_signal",
      "metadata": {
        "type": "greeting|bug_report|code_solution|...",
        "content_categories": ["technical_issue", "action_item", ...]
      }
    }
  ],
  "expected_extraction": {
    "topics": [
      {
        "title": "Topic title",
        "atoms": ["Atomic knowledge unit 1", "Atomic knowledge unit 2"]
      }
    ]
  }
}
```

## Usage in Tests

These scenarios can be used for:

1. **Classification Testing**: Verify importance scoring accuracy
   ```python
   from tests.fixtures.scenarios import load_scenario
   scenario = load_scenario("bug-report-en.json")
   for msg in scenario["messages"]:
       assert classify(msg["text"]) == msg["expected_label"]
   ```

2. **Knowledge Extraction Testing**: Validate topic/atom generation
   ```python
   topics = extract_knowledge(scenario["messages"])
   assert len(topics) == len(scenario["expected_extraction"]["topics"])
   ```

3. **E2E Pipeline Testing**: Test full webhook → scoring → extraction flow
   ```python
   for msg in scenario["messages"]:
       await webhook_handler(msg)
   topics = await get_extracted_topics()
   assert topics == scenario["expected_extraction"]["topics"]
   ```

4. **Multilingual Testing**: Validate language detection and handling
   ```python
   scenario = load_scenario("mixed-language.json")
   for msg in scenario["messages"]:
       detected_lang = detect_language(msg["text"])
       assert detected_lang == msg["language"]
   ```

## Statistics

- **Total scenarios**: 11
- **Total messages**: 145
- **Languages**: Ukrainian (5), English (5), Mixed (1)
- **Noise messages**: 46 (31.7%)
- **Weak signal**: 26 (17.9%)
- **Strong signal**: 73 (50.3%)

## Maintenance

When adding new scenarios:
1. Follow the JSON structure above
2. Include realistic, varied conversation flows
3. Provide expected labels for each message
4. Define expected knowledge extraction output
5. Add diverse message types (greetings, code, links, questions, etc.)
6. Balance signal/noise ratios based on scenario type

## Related Documentation

- [Knowledge Extraction Architecture](../../../docs/content/en/architecture/knowledge-extraction.md)
- [Importance Scoring](../../../docs/content/en/architecture/analysis-system.md)
- [LLM Integration](../../../docs/content/en/architecture/llm-architecture.md)
