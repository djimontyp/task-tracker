---
title: "Knowledge Extraction Components"
created: 2025-12-28
updated: 2025-12-28
tags:
  - components
  - extraction
  - review
  - onboarding
status: active
---

# Knowledge Extraction Components

> Компоненти для AI extraction workflow

## Розташування

`frontend/src/features/extraction/components/`

## Компоненти

### ExtractionSheet

Sheet panel для запуску AI knowledge extraction.

```tsx
import { ExtractionSheet } from '@/features/extraction/components';

<ExtractionSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  onExtract={(config) => startExtraction(config)}
  totalMessages={500}
/>
```

**Features:**
- Period selector (1h, 24h, 7d, Custom)
- Score filter (All, Medium+, High+)
- Provider selector (GPT-4, Ollama)
- Live preview (messages count, expected atoms)
- Cost/time estimation

**Keyboard shortcuts:**
- `1-4` — quick period select
- `Ctrl/Cmd + Enter` — start extraction
- `Escape` — close sheet

### ReviewQueue

Keyboard-first triage interface для review atoms.

```tsx
import { ReviewQueue } from '@/features/extraction/components';

<ReviewQueue
  atoms={pendingAtoms}
  onApprove={(id) => approveAtom(id)}
  onReject={(id) => rejectAtom(id)}
  onBatchAction={(ids, action) => batchAction(ids, action)}
/>
```

**Features:**
- Split-panel: list + context panel
- "Why important?" AI reasoning
- Progress indicator (3 of 12)
- Bulk selection з range select

**Keyboard shortcuts:**
| Key | Action |
|-----|--------|
| `j / ↓` | Next atom |
| `k / ↑` | Previous atom |
| `a` | Approve current |
| `r` | Reject current |
| `Space` | Toggle selection |
| `Shift+A` | Approve all selected |
| `?` | Show help |

### OnboardingWelcome

First-run experience з value proposition.

```tsx
import { OnboardingWelcome, OnboardingWelcomeCompact } from '@/features/extraction/components';

// Full-page
<OnboardingWelcome
  onTryDemo={() => router.push('/demo')}
  onConnectTelegram={() => router.push('/settings/telegram')}
  currentStep="welcome"
/>

// Card variant
<OnboardingWelcomeCompact ... />
```

**Steps:**
1. Welcome — [Try Demo] / [Connect Telegram]
2. Demo Data — instant value preview
3. Telegram Setup — wizard
4. First Extraction — progress
5. First Review — explain scoring
6. Aha Moment — "You saved X time!"

**Value Proposition:**
```
500 messages → 5 key decisions
89% noise filtered
~2.5 hours saved
```

## Storybook

```bash
just storybook
# http://localhost:6006 → Features/Extraction/
```

## Пов'язане

- [[noise-components]] — Scoring components
- [[../хуки/feature-hooks]] — Custom hooks
- [[../../плани/knowledge-pipeline-roadmap]] — Product roadmap
