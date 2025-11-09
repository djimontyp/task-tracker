# Message Scoring Validation Dataset

## Overview

This dataset contains 1000 Telegram messages (500 Ukrainian + 500 English) for validating the `ImportanceScorer` classification system. Messages are labeled as `noise`, `weak_signal`, or `signal` based on their informational content.

## Generation

**Generated using**: Claude Sonnet 4.5 / GPT-4 Turbo
**Strategy**: LLM-generated realistic Telegram conversations with diverse patterns
**Purpose**: Measure precision, recall, and F1-score for scoring thresholds (0.3/0.7)

## Distribution

### Per Language (500 messages each)
- **40% noise** (200 messages) - score < 0.3
- **30% weak_signal** (150 messages) - score 0.3-0.7
- **30% signal** (150 messages) - score > 0.7

## Pattern Categories

### Noise Patterns (score < 0.3)

| Pattern Type | Description | Examples |
|-------------|-------------|----------|
| `emoji_spam` | Emoji reactions only | "👍👍👍", "🔥🔥" |
| `short_reactions` | Single word responses | "+1", "ok", "lol", "yeah" |
| `greetings_only` | Just greetings | "hi", "привіт", "good morning" |
| `casual_chat` | Off-topic conversation | "what's for lunch?", "як справи?" |
| `sticker_description` | Sticker/meme with no context | "*sends funny cat meme*" |
| `typing_indicator` | Typing signals | "...", "typing..." |
| `duplicate_reaction` | Repeated text/emoji | "lol lol lol" |
| `empty_context` | No informational value | "hmmm", "🤔" |

**Scoring Logic**: Length < 10 chars (0.1), noise keywords (0.1-0.15)

### Weak Signal Patterns (score 0.3-0.7)

| Pattern Type | Description | Examples |
|-------------|-------------|----------|
| `vague_questions` | Unclear questions | "thoughts?", "що думаєте?" |
| `status_updates` | Brief status | "working on it", "в процесі" |
| `incomplete_info` | Partial information | "about that thing we discussed..." |
| `links_no_context` | URLs without explanation | "https://example.com" |
| `ambiguous_statements` | Needs clarification | "maybe we should try that" |
| `brief_mentions` | Topic mention without details | "the auth issue" |
| `tentative_suggestions` | Uncertain ideas | "not sure but maybe..." |
| `follow_up_needed` | Requires discussion | "depends on the approach" |

**Scoring Logic**: Length 10-50 chars (0.4), 50-200 chars (0.7), no strong signals

### Signal Patterns (score > 0.7)

| Pattern Type | Description | Examples |
|-------------|-------------|----------|
| `bug_report_detailed` | Bug with reproduction | "Found bug in auth - user can login without password if..." |
| `feature_request_rationale` | Feature with business value | "We need dark mode because 60% users requested it..." |
| `technical_discussion` | Code/architecture depth | "We should use Redis for session storage because..." |
| `decision_announcement` | Clear decision + action | "Decision: migrate to PostgreSQL. @user1 will..." |
| `knowledge_sharing` | How-to, explanations | "To fix this, run `npm install` and then..." |
| `architecture_proposal` | System design with tradeoffs | "Hexagonal architecture would decouple..." |
| `debugging_solution` | Problem solutions | "The issue was race condition. Fixed by..." |
| `performance_analysis` | Metrics + optimization | "API latency increased to 2s. Profiling shows..." |
| `security_concern` | Security vulnerabilities | "Potential SQL injection in user input..." |
| `process_improvement` | Workflow improvements | "Let's adopt conventional commits for..." |

**Scoring Logic**: Signal keywords (0.8+), questions (+0.1), URLs/code (+0.15), length > 200 (0.9)

## Edge Cases Included

✅ **Emoji-only messages**: "👍", "🔥🔥🔥"
✅ **Code snippets**: Inline code and code blocks
✅ **URLs**: With and without context
✅ **Mixed languages**: Ukrainian + English in one message
✅ **Markdown formatting**: Bold, italic, lists
✅ **Very long messages**: 500+ characters
✅ **Very short messages**: < 10 characters
✅ **Typos and informal language**: Realistic Telegram style

## Quality Criteria

### Ukrainian Messages
- ✅ Natural tech terminology (баг, фіча, коміт, пуш, мердж)
- ✅ NOT transliterated ("bug" ✗, "баг" ✓)
- ✅ Realistic typos and casual language
- ✅ Context clues for clear labeling

### English Messages
- ✅ Mix of casual and professional tones
- ✅ Realistic Telegram conversation style
- ✅ Varied formality and structure
- ✅ Technical depth where appropriate

## Usage

### Generate Dataset
```bash
# Using Anthropic Claude (default)
uv run python backend/scripts/generate_validation_dataset.py

# Using OpenAI GPT-4
uv run python backend/scripts/generate_validation_dataset.py --api openai

# With reproducible seed
uv run python backend/scripts/generate_validation_dataset.py --seed 42
```

### Review Dataset
```bash
# Interactive review (all messages)
uv run python backend/scripts/review_validation_dataset.py

# Review random sample of 50
uv run python backend/scripts/review_validation_dataset.py --sample 50

# Review only noise messages
uv run python backend/scripts/review_validation_dataset.py --filter noise

# Show statistics
uv run python backend/scripts/review_validation_dataset.py --stats
```

### Run Validation
```bash
# Run scoring validation tests
pytest backend/tests/test_scoring_validation.py -v

# Generate validation report
uv run python backend/scripts/validate_scoring_system.py
```

## Human Review Focus Areas

When reviewing generated messages, pay special attention to:

1. **Boundary Cases**: Messages near threshold scores (0.25-0.35, 0.65-0.75)
2. **Ukrainian Naturalness**: Check for transliteration, unnatural phrasing
3. **Pattern Diversity**: Ensure no repetitive templates within same pattern type
4. **Edge Cases**: Verify emoji, code, URLs, mixed languages are realistic
5. **Rationale Quality**: Ensure rationales are clear and defensible

## Expected Validation Metrics

After human review, the scoring system should achieve:

- **Noise**: Precision > 0.90, Recall > 0.85
- **Weak Signal**: Precision > 0.70, Recall > 0.65
- **Signal**: Precision > 0.85, Recall > 0.80
- **Overall F1-Score**: > 0.80

If metrics are lower, consider:
- Adjusting thresholds (0.3 / 0.7)
- Tuning factor weights (content: 0.4, author: 0.2, temporal: 0.2, topics: 0.2)
- Adding/modifying signal/noise keywords

## Files

- `scoring_validation.json` - Generated dataset (1000 messages)
- `generate_validation_dataset.py` - Generation script
- `review_validation_dataset.py` - Interactive review tool
- `validate_scoring_system.py` - Validation runner (next step)

## Next Steps

1. ✅ Generate dataset
2. ⏳ Human review (focus on 50-100 random samples)
3. ⏳ Implement `ScoringValidator` class
4. ⏳ Run validation and generate metrics report
5. ⏳ Tune thresholds based on results
6. ⏳ Add to CI pipeline for regression testing

## Changelog

- **2025-10-28**: Initial dataset generation with 1000 messages
