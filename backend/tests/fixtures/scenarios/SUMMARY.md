# Test Scenarios Summary

## Overview

This directory contains **11 realistic Telegram conversation scenarios** with **145 total messages** designed for comprehensive E2E testing of the knowledge extraction pipeline.

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Scenarios | 11 |
| Total Messages | 145 |
| Ukrainian Scenarios | 5 |
| English Scenarios | 5 |
| Mixed Language | 1 |
| Noise Messages | 46 (31.7%) |
| Weak Signal | 26 (17.9%) |
| Strong Signal | 73 (50.3%) |

## Scenario Types

### 1. Bug Report Discussions (2 scenarios)
- **Files**: `bug-report-uk.json`, `bug-report-en.json`
- **Purpose**: Test classification of debugging conversations with mixed signal/noise
- **Characteristics**:
  - Greetings and acknowledgments (noise)
  - Problem descriptions (strong signal)
  - Diagnostic questions (weak signal)
  - Solutions and fixes (strong signal)

### 2. Feature Planning (2 scenarios)
- **Files**: `feature-planning-uk.json`, `feature-planning-en.json`
- **Purpose**: Test extraction from product/technical planning discussions
- **Characteristics**:
  - High signal-to-noise ratio (>75%)
  - Architecture decisions
  - Technology choices with rationale
  - Task assignments

### 3. Noise Conversations (2 scenarios)
- **Files**: `noise-uk.json`, `noise-en.json`
- **Purpose**: Test that casual chat doesn't produce false extractions
- **Characteristics**:
  - 100% noise messages
  - No expected topic extraction
  - Greetings, small talk, coordination

### 4. Technical Deep-Dive (2 scenarios)
- **Files**: `technical-uk.json`, `technical-en.json`
- **Purpose**: Test handling of complex technical discussions with code
- **Characteristics**:
  - Code snippets in messages
  - Architecture explanations
  - Resource/documentation links
  - Parameter tuning discussions

### 5. Mixed Language (1 scenario)
- **Files**: `mixed-language.json`
- **Purpose**: Test code-switching behavior (UK ↔ EN in same conversation)
- **Characteristics**:
  - Realistic bilingual tech conversation
  - English technical terms in Ukrainian sentences
  - Tests language detection accuracy

### 6. Mixed Signal/Noise (1 scenario)
- **Files**: `mixed-signal-noise-uk.json`
- **Purpose**: Test selective extraction from conversations with interleaved signal/noise
- **Characteristics**:
  - Starts casual, becomes technical, returns to casual
  - Tests conversation segmentation
  - Should extract only middle (technical) portion

### 7. Architecture Decision (1 scenario)
- **Files**: `architecture-decision-en.json`
- **Purpose**: Test ADR (Architecture Decision Record) extraction
- **Characteristics**:
  - Comprehensive decision discussion
  - Alternatives evaluation
  - Cost/performance trade-offs
  - Final decision with rationale

## Usage Examples

### Load and Inspect Scenarios

```python
from tests.fixtures.scenarios import load_scenario, list_scenarios

# List all available scenarios
scenarios = list_scenarios()
print(scenarios)

# Load specific scenario
scenario = load_scenario("bug-report-en.json")
messages = scenario["messages"]
expected = scenario["expected_extraction"]
```

### Filter by Label

```python
from tests.fixtures.scenarios import (
    load_scenario,
    get_messages_by_label,
    get_signal_messages
)

scenario = load_scenario("technical-uk.json")

# Get all noise
noise = get_messages_by_label(scenario, "noise")

# Get all signals (weak + strong)
signals = get_signal_messages(scenario)
```

### Calculate Statistics

```python
from tests.fixtures.scenarios import load_scenario, calculate_signal_ratio

scenario = load_scenario("feature-planning-en.json")
ratio = calculate_signal_ratio(scenario)
# {'noise': 0.09, 'weak_signal': 0.09, 'strong_signal': 0.82}
```

### Visualize Scenarios

```bash
# Overview of all scenarios
python visualize_scenarios.py

# Detailed view of specific scenario
python visualize_scenarios.py bug-report-en.json
```

## Testing Use Cases

### 1. Classification Accuracy Testing

Test importance scorer against expected labels:

```python
@pytest.mark.asyncio
async def test_importance_scoring(importance_scorer):
    scenario = load_scenario("bug-report-en.json")

    for msg in scenario["messages"]:
        result = await importance_scorer.score(msg["text"])
        assert result.label == msg["expected_label"]
```

### 2. Knowledge Extraction Testing

Validate topic/atom extraction:

```python
@pytest.mark.asyncio
async def test_knowledge_extraction(extractor):
    scenario = load_scenario("technical-uk.json")
    signals = get_signal_messages(scenario)

    topics = await extractor.extract(signals)
    expected = scenario["expected_extraction"]["topics"]

    assert len(topics) == len(expected)
```

### 3. End-to-End Pipeline Testing

Test full webhook → scoring → extraction flow:

```python
@pytest.mark.asyncio
async def test_e2e_pipeline():
    scenario = load_scenario("feature-planning-en.json")

    # Simulate webhook ingestion
    for msg in scenario["messages"]:
        await webhook_handler(msg)

    # Wait for background tasks
    await wait_for_task_completion()

    # Verify extraction
    topics = await db.get_topics()
    expected = scenario["expected_extraction"]["topics"]
    assert len(topics) == len(expected)
```

### 4. Multilingual Testing

Test language detection and bilingual handling:

```python
def test_language_detection():
    scenario = load_scenario("mixed-language.json")

    for msg in scenario["messages"]:
        detected = detect_language(msg["text"])
        assert detected == msg["language"]
```

## Key Features

1. **Realistic Conversations**: Based on actual tech team communication patterns
2. **Bilingual**: Ukrainian and English scenarios with realistic code-switching
3. **Diverse Content**: Code snippets, links, emoji, technical jargon
4. **Well-Labeled**: Every message has expected classification label
5. **Expected Outputs**: Each scenario includes expected topic/atom extraction
6. **Metadata Rich**: Message types and content categories for detailed testing
7. **Helper Functions**: Pre-built utilities for common test operations
8. **Visualization**: Script to inspect and understand scenario content

## Maintenance Guidelines

When adding new scenarios:

1. **Follow JSON Structure**: Match existing format
2. **Provide Expected Labels**: Every message needs classification label
3. **Define Extraction**: Specify expected topics and atoms
4. **Add Metadata**: Include message type and content categories
5. **Realistic Content**: Base on real conversations, not synthetic
6. **Balance Distribution**: Consider signal/noise ratio for scenario type
7. **Test Scenarios**: Add corresponding test cases
8. **Update Documentation**: Update this summary with new scenario types

## File Structure

```
scenarios/
├── README.md                          # Detailed documentation
├── SUMMARY.md                         # This file - quick reference
├── __init__.py                        # Helper functions
├── visualize_scenarios.py             # Inspection tool
├── bug-report-uk.json                 # Bug report (Ukrainian)
├── bug-report-en.json                 # Bug report (English)
├── feature-planning-uk.json           # Feature planning (Ukrainian)
├── feature-planning-en.json           # Feature planning (English)
├── noise-uk.json                      # Noise conversation (Ukrainian)
├── noise-en.json                      # Noise conversation (English)
├── technical-uk.json                  # Technical deep-dive (Ukrainian)
├── technical-en.json                  # Technical deep-dive (English)
├── mixed-language.json                # Bilingual conversation
├── mixed-signal-noise-uk.json         # Mixed signal/noise
└── architecture-decision-en.json      # Architecture decision record
```

## Related Files

- **Integration Tests**: `/backend/tests/integration/test_scenario_classification.py`
- **Documentation**: See README.md for comprehensive guide
- **Architecture Docs**:
  - `/docs/content/en/architecture/knowledge-extraction.md`
  - `/docs/content/en/architecture/analysis-system.md`

## Quick Commands

```bash
# Run scenario tests
pytest tests/integration/test_scenario_classification.py -v

# View all scenarios
cd tests/fixtures/scenarios
python visualize_scenarios.py

# Inspect specific scenario
python visualize_scenarios.py mixed-language.json

# Calculate statistics
python -c "from tests.fixtures.scenarios import *; import json; print(json.dumps(calculate_signal_ratio(load_scenario('technical-en.json')), indent=2))"
```

---

**Last Updated**: 2025-10-28
**Total Scenarios**: 11
**Total Messages**: 145
**Coverage**: Bug reports, feature planning, noise filtering, technical discussions, architecture decisions, multilingual handling
