---
name: brainstorming
description: Fast ideation and problem exploration. Triggers on Ukrainian/English phrases like "подумай", "поміркуй", "брейнштормінг", "brainstorm", "think through", "накидай ідеї", "generate ideas". Rapid divergent thinking to uncover insights, problems, and solutions through interactive dialogue.
---

# Brainstorming

## Overview

Quick, interactive ideation for exploring problems and generating solutions. Focus on speed, quantity, and dialogue - not lengthy analysis.

## When to Use

- User asks: "подумай", "поміркуй", "brainstorm this"
- Need to explore problem space rapidly
- Generate multiple ideas quickly
- Uncover hidden insights or issues
- User explicitly requests brainstorming

## Core Principles

1. **Quantity over quality** - Generate many ideas fast
2. **No judgment during ideation** - Wild ideas welcome
3. **Interactive** - Communicate with user frequently
4. **Iterative** - Build on ideas through dialogue
5. **Fast** - Minutes, not hours

## Workflow

### Step 1: Rapid Dump (1-2 minutes)

Immediately generate 5-10 initial ideas without overthinking:

```
Quick ideas:
• [Idea 1]
• [Idea 2]
• [Idea 3]
• [Idea 4]
• [Idea 5]
...
```

**Rules:**
- Write first idea that comes to mind
- No filtering or judgment
- Include obvious AND wild ideas
- One line per idea

### Step 2: Communicate & Explore

Share ideas with user and ask:
- Which direction interests you?
- What concerns do you have?
- What am I missing?
- Should we explore deeper or pivot?

**Keep it conversational** - don't wait to have "perfect" analysis.

### Step 3: Iterate Based on Feedback

Depending on user response:
- **Expand promising direction** - Generate more variations
- **Find problems** - What could break? What's risky?
- **Challenge assumptions** - What if we did opposite?
- **Combine ideas** - Mix two approaches

### Step 4: Quick Synthesis (when needed)

If user asks for recommendation, provide:
```
Top pick: [Option X]
Why: [1-2 sentence reason]
Next step: [Immediate action]
```

Keep it short - avoid long justifications unless requested.

## Techniques

### Random Prompts
- "What if we did the opposite?"
- "How would [different domain] solve this?"
- "What's the simplest version?"
- "What's the most expensive/complex version?"

### SCAMPER (quick version)
- **S**ubstitute - swap components
- **C**ombine - merge ideas
- **A**dapt - borrow from elsewhere
- **M**odify - change scale/attribute
- **P**ut to other use - repurpose
- **E**liminate - remove parts
- **R**everse - flip it around

### 5 Whys (fast)
Ask "why?" 3-5 times to find root issue.

### Perspective Shifts
- User perspective
- Developer perspective
- Future-self perspective

## Output Style

**Good:**
```
Ideas:
• Use caching
• Pre-compute results
• Lazy load data

Which feels right? Or should we explore something else?
```

**Bad:**
```
# Comprehensive Analysis of Caching Strategies

After extensive research into caching mechanisms, we can evaluate several approaches...

[5 more paragraphs]
```

## Anti-Patterns

- ❌ Writing long analysis before sharing ideas
- ❌ Waiting for "complete" answer before engaging user
- ❌ Judging ideas during generation phase
- ❌ Fixating on first solution
- ❌ Over-explaining instead of asking

## Example Session

**User:** "подумай як зробити швидший пошук"

**Skill:**
```
Ideas for faster search:
• Add database indexes
• Cache popular queries
• Use full-text search engine (Elasticsearch)
• Pre-compute search results
• Reduce search scope with filters
• Client-side filtering for small datasets

Which direction makes sense for your use case?
How much data are we talking about?
```

**User:** "Maybe 10K items, need instant results"

**Skill:**
```
For 10K items, instant results:

Top 3 approaches:
• Client-side search (send all data, filter in browser) - simplest
• Add indexes + optimize query - medium effort
• Redis cache for popular searches - fastest for repeated queries

Concerns:
• 10K items might be too much for client-side if complex objects
• Need to know query patterns

What kind of queries? Full-text? Exact match? Filters?
```

## Notes

- Brainstorming is **dialogue**, not monologue
- Share incomplete thoughts - perfection kills speed
- Ask questions frequently
- User steers direction, not you
- Stop when user has enough to proceed
