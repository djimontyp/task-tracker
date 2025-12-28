---
title: "Noise Filtering Components"
created: 2025-12-28
updated: 2025-12-28
tags:
  - components
  - noise-filtering
  - scoring
  - bulk-actions
status: active
---

# Noise Filtering Components

> Компоненти для візуалізації scoring та bulk review

## Розташування

`frontend/src/features/noise/components/`

## Компоненти

### ScoreIndicator

5-dot indicator для importance score.

```tsx
import { ScoreIndicator } from '@/features/noise/components';

<ScoreIndicator score={0.85} showLabel size="md" />
```

**Levels:**
| Score | Dots | Label | Color |
|-------|------|-------|-------|
| >= 0.9 | ●●●●● | Critical | `semantic-error` |
| >= 0.7 | ●●●●○ | High | `semantic-warning` |
| >= 0.5 | ●●●○○ | Medium | `semantic-info` |
| >= 0.3 | ●●○○○ | Low | `muted-foreground` |
| < 0.3 | ●○○○○ | Noise | `muted-foreground/50` |

### ScoreBreakdown

Breakdown 4 scoring factors з progress bars.

```tsx
import { ScoreBreakdown } from '@/features/noise/components';

<ScoreBreakdown
  factors={{ content: 0.9, author: 0.7, temporal: 0.5, topics: 0.8 }}
  showWeights
/>
```

**Factors:**
- Content (40%) — length, keywords, questions
- Author (20%) — reputation history
- Temporal (20%) — recency, activity
- Topics (20%) — topic importance

### SignalCard / NoiseCard / MessageCard

Картки повідомлень з візуальним розрізненням signal vs noise.

```tsx
import { MessageCard } from '@/features/noise/components';

<MessageCard
  message={messageData}
  selected={isSelected}
  onSelect={handleSelect}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

**Visual Language:**
| Aspect | Signal | Noise |
|--------|--------|-------|
| Border | `border-l-semantic-success` | `border-l-muted` |
| Background | `bg-semantic-success/5` | `bg-muted/50` |
| Icon | `Sparkles` | `VolumeX` |
| Opacity | 100% | 70% |

### BulkActionBar

Sticky bottom bar для bulk review actions.

```tsx
import { BulkActionBar, BulkActionBarSpacer, useBulkSelection } from '@/features/noise/components';

const { selectedIds, toggle, clearSelection, isSelected } = useBulkSelection();

<div className="space-y-4">
  {messages.map(msg => <MessageCard ... />)}
  <BulkActionBarSpacer visible={selectedCount > 0} />
</div>

<BulkActionBar
  selectedCount={selectedCount}
  totalCount={messages.length}
  onClearSelection={clearSelection}
  onApproveSelected={handleApprove}
  onRejectSelected={handleReject}
/>
```

**Features:**
- Fixed bottom positioning
- `pointer-events-none` gradient для click-through
- `BulkActionBarSpacer` для запобігання перекриття
- Loading states для async actions

## Storybook

```bash
just storybook
# http://localhost:6006 → Features/Noise/
```

## Пов'язане

- [[../якість/storybook]] — Storybook usage
- [[../дизайн-система/patterns]] — UI patterns
- [[../../плани/knowledge-pipeline-roadmap]] — Product roadmap
