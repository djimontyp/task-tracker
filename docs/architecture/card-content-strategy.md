# Card Content Prioritization Strategy

**Version:** 1.0
**Status:** Draft
**Created:** 2026-01-03
**Author:** Business Analyst (A1)

## Executive Summary

This document defines content prioritization for card components across Pulse Radar, ensuring optimal information hierarchy on mobile, tablet, and desktop viewports. Based on analysis of 5 card types (Agent, Atom, Project, Message, Topic), we establish what information is CRITICAL vs OPTIONAL and how it adapts responsively.

**Key Finding:** Current cards show 7-15 fields simultaneously, causing information overload on mobile. Recommendation: 3-tier content strategy (Compact/Default/Expanded).

---

## Stakeholder Analysis

| Role | Interest | Impact | Primary Need |
|------|----------|--------|--------------|
| **End User** | Quick knowledge consumption | High | Fast scanning, minimal cognitive load |
| **Admin** | System debugging, config | Medium | Access to technical details on demand |
| **Product Team** | Feature discovery, adoption | High | Progressive disclosure, clear CTAs |

---

## User Journey Mapping

### Primary Flow: Knowledge Consumption

```
1. User lands on list view (Topics/Atoms/Messages)
   Need: Quick scan to identify relevant items
   Critical: Title + Primary badge + 1-2 key metrics

2. User identifies item of interest
   Need: Enough context to decide if worth exploring
   Critical: Description (1-2 lines) + Status + Key metadata

3. User clicks for detail view
   Need: Full information + available actions
   Critical: All fields + action buttons + related entities
```

### Secondary Flow: Configuration (Agents, Projects)

```
1. Admin reviews agent/project configs
   Need: Technical details, validation status
   Critical: Model name, status, version, key params

2. Admin edits or deletes
   Need: Clear edit/delete actions
   Critical: Action buttons always visible (not on hover)
```

---

## Content Prioritization Matrix

### 1. AgentCard (AI Agents List)

**Current Fields (7):** name, description, model_name, temperature, max_tokens, system_prompt, is_active

| Field | Priority | Visibility Rule | Mobile (375px) | Tablet (768px) | Desktop (1024px+) |
|-------|----------|----------------|----------------|----------------|-------------------|
| **name** | CRITICAL | Always | 1 line, truncate | 2 lines, truncate | 2 lines, truncate |
| **is_active** | CRITICAL | Always | Badge | Badge | Badge |
| **model_name** | HIGH | Default | Hidden | Visible (1 line) | Visible (1 line) |
| **description** | MEDIUM | Default | Hidden | 1 line, truncate | 2 lines, truncate |
| **temperature** | LOW | On Expand | Hidden | Hidden | On expand/tooltip |
| **max_tokens** | LOW | On Expand | Hidden | Hidden | On expand/tooltip |
| **system_prompt** | DEBUG | On Expand | Hidden | Hidden | On expand only |

**Actions:**
- Mobile: 2 primary actions (Edit, Delete) + overflow menu
- Desktop: All 5 actions (Edit, Copy, Manage Tasks, Test, Delete)

**User Story:**
> As an admin viewing agents, I need to quickly identify agent name and status (CRITICAL), understand which model it uses (HIGH), and optionally see config details (LOW) when troubleshooting.

---

### 2. AtomCard (Knowledge Atoms)

**Current Fields (7):** type, title, content, confidence, user_approved, pending_versions_count, detected_language

| Field | Priority | Visibility Rule | Mobile | Tablet | Desktop |
|-------|----------|----------------|--------|--------|---------|
| **type** | CRITICAL | Always | Badge + icon | Badge + icon | Badge + icon |
| **title** | CRITICAL | Always | 2 lines | 2 lines | 2 lines |
| **content** | HIGH | Default | 2 lines | 3 lines | 3 lines |
| **confidence** | MEDIUM | Default | Show if >80% | Always show | Always show |
| **user_approved** | HIGH | Conditional | If true, show checkmark | If true, show checkmark + text | If true, show checkmark + text |
| **pending_versions_count** | HIGH | Conditional | If >0, show badge | If >0, show badge + button | If >0, show badge + button |
| **detected_language** | LOW | Conditional | Hidden | Show if mismatch | Show if mismatch |

**Glow Effect (already implemented):**
- Featured atoms (confidence >80%): `shadow-glow-sm hover:shadow-glow-hover`
- Regular atoms: `hover:shadow-glow-sm`

**User Story:**
> As a user browsing atoms, I need to identify atom type and title (CRITICAL), preview content (HIGH), and see approval status (HIGH). Confidence score is useful context (MEDIUM), language mismatch is edge case (LOW).

---

### 3. ProjectCard (Projects List)

**Current Fields (10+):** name, description, is_active, keywords (array), components (nested), glossary (object), priority_rules (nested), default_assignee_ids, pm_user_id, version

| Field | Priority | Visibility Rule | Mobile | Tablet | Desktop |
|-------|----------|----------------|--------|--------|---------|
| **name** | CRITICAL | Always | 1 line | 2 lines | 2 lines |
| **is_active** | CRITICAL | Always | Badge | Badge | Badge |
| **description** | HIGH | Default | Hidden | 1 line | 2 lines |
| **keywords** | HIGH | Default | First 3 badges | First 5 badges | All badges |
| **components** | MEDIUM | On Expand | Hidden | Collapsed (count) | Expanded |
| **glossary** | LOW | On Expand | Hidden | Hidden | On expand |
| **priority_rules** | LOW | On Expand | Hidden | Hidden | On expand |
| **assignees** | LOW | On Expand | Hidden | Collapsed (count) | Visible |
| **version** | DEBUG | Always (footer) | Text only | Text + date | Text + date |

**Edge Case:** 10+ keywords → "Show more" button after 5 badges

**User Story:**
> As an admin reviewing projects, I need to identify project name and status (CRITICAL), see key keywords (HIGH), and optionally drill into components/glossary (LOW) when configuring.

---

### 4. MessageCard (Message Feed)

**Current Fields (8):** author, avatar_url, content, analyzed, importance_score, noise_classification, topic_name, sent_at

| Field | Priority | Visibility Rule | Mobile | Tablet | Desktop |
|-------|----------|----------------|--------|--------|---------|
| **author** | CRITICAL | Always | 1 line | 1 line | 1 line |
| **avatar_url** | CRITICAL | Always | 32px circle | 32px circle | 32px circle |
| **content** | CRITICAL | Always | 2 lines | 3 lines | 3 lines |
| **analyzed** | HIGH | Always | Badge | Badge | Badge |
| **importance_score** | HIGH | Conditional | If ≥0.65, show badge | If available, show badge | If available, show badge |
| **noise_classification** | MEDIUM | Conditional | If spam/noise, show badge | If available, show badge | If available, show badge |
| **topic_name** | MEDIUM | Default | Hidden | Badge | Badge |
| **sent_at** | LOW | Always | Hidden | Short format | Full format |

**Glow Effect (already implemented):**
- High importance (score ≥ signal_threshold): `shadow-glow-sm`

**Actions (on hover):**
- Mobile: Swipe gestures (future) or tap to reveal
- Desktop: Hover to reveal "Create Atom" + "Dismiss"

**User Story:**
> As a user reviewing messages, I need to identify author and preview content (CRITICAL), understand importance/noise (HIGH), and see topic assignment (MEDIUM). Send time is low priority unless filtering.

---

### 5. TopicSearchCard (Topic Search Results)

**Current Fields (5):** icon, color, name, description, similarity_score

| Field | Priority | Visibility Rule | Mobile | Tablet | Desktop |
|-------|----------|----------------|--------|--------|---------|
| **icon** | CRITICAL | Always | 48px emoji | 48px emoji | 48px emoji |
| **color** | CRITICAL | Always | Background | Background | Background |
| **name** | CRITICAL | Always | 1 line | 2 lines | 2 lines |
| **similarity_score** | HIGH | Always | Badge (%) | Badge (%) | Badge (%) |
| **description** | MEDIUM | Default | Hidden | 1 line | 2 lines |

**User Story:**
> As a user searching topics, I need to identify topic by icon+name (CRITICAL), see search relevance (HIGH), and optionally preview description (MEDIUM).

---

## Recommended Card Variants

### Variant 1: Compact (Mobile, Dense Lists)

**Viewport:** ≤ 640px (sm breakpoint)
**Use Case:** Message feed, Atom lists on mobile

```tsx
<Card className="p-3 space-y-2">
  {/* Title (1 line) + Primary badge */}
  <div className="flex items-center justify-between gap-2">
    <h3 className="text-sm font-semibold truncate">{title}</h3>
    <Badge>{primaryStatus}</Badge>
  </div>

  {/* Preview (1-2 lines) */}
  <p className="text-xs text-muted-foreground line-clamp-2">{content}</p>

  {/* 1-2 key fields */}
  <div className="flex gap-2">
    <Badge variant="outline">{field1}</Badge>
  </div>

  {/* 1 primary action (visible) */}
  <Button size="sm" className="w-full">{primaryAction}</Button>
</Card>
```

**Characteristics:**
- Padding: 12px (p-3)
- Title: 1 line, 14px font
- Content: 2 lines max
- Actions: 1 primary CTA
- Touch targets: ≥44px

---

### Variant 2: Default (Tablet, Desktop Lists)

**Viewport:** 768px - 1280px
**Use Case:** Topic lists, Agent cards, Project cards

```tsx
<Card className="p-4 space-y-4">
  {/* Header: Title (2 lines) + Badges + Actions */}
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
      <div className="flex gap-2 mt-2">
        <Badge>{status}</Badge>
        <Badge variant="outline">{type}</Badge>
      </div>
    </div>
    <div className="flex gap-2">
      <Button size="icon" variant="ghost">...</Button>
      <Button size="icon" variant="ghost">...</Button>
    </div>
  </div>

  {/* Content preview (3 lines) */}
  <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>

  {/* 3-5 key fields */}
  <div className="grid grid-cols-2 gap-2 text-sm">
    <div>
      <span className="text-muted-foreground">Field 1</span>
      <p className="font-mono text-xs">{value1}</p>
    </div>
    <div>
      <span className="text-muted-foreground">Field 2</span>
      <p className="font-mono text-xs">{value2}</p>
    </div>
  </div>

  {/* 2-3 actions */}
  <div className="flex gap-2 pt-2 border-t">
    <Button size="sm" variant="outline">{action1}</Button>
    <Button size="sm" variant="outline">{action2}</Button>
  </div>
</Card>
```

**Characteristics:**
- Padding: 16px (p-4)
- Title: 2 lines, 18px font
- Content: 3 lines max
- Fields: Grid layout (2 cols)
- Actions: 2-3 visible + overflow

---

### Variant 3: Expanded (Detail View, Modals)

**Viewport:** Any (triggered by user action)
**Use Case:** Agent detail modal, Project settings, Atom version history

```tsx
<Card className="p-6 space-y-6">
  {/* Full header (no truncation) */}
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Badge>{status}</Badge>
    </div>
    <p className="text-muted-foreground">{fullDescription}</p>
  </div>

  {/* All fields (no truncation) */}
  <div className="space-y-4">
    <div>
      <Label>Field 1</Label>
      <p>{value1}</p>
    </div>
    <div>
      <Label>Field 2</Label>
      <p>{value2}</p>
    </div>
    {/* ... all fields ... */}
  </div>

  {/* All actions */}
  <div className="flex justify-between pt-4 border-t">
    <div className="flex gap-2">
      <Button>{primaryAction}</Button>
      <Button variant="outline">{secondaryAction}</Button>
    </div>
    <Button variant="destructive">{destructiveAction}</Button>
  </div>
</Card>
```

**Characteristics:**
- Padding: 24px (p-6)
- No truncation
- All fields visible
- All actions visible
- Clear visual hierarchy

---

## Edge Case Analysis

### 1. Very Long Names (50+ chars)

**Scenario:** Agent name "Production-Grade Multi-Model Knowledge Extraction Agent with Advanced RAG Capabilities v2.3"

| Viewport | Strategy |
|----------|----------|
| Mobile | Truncate at 20 chars + ellipsis → "Production-Grade M..." |
| Tablet | Truncate at 40 chars → "Production-Grade Multi-Model Knowledge..." |
| Desktop | 2 lines max → Line 1: "Production-Grade Multi-Model Knowledge", Line 2: "Extraction Agent with..." |

**Implementation:**
```tsx
<h3 className="text-lg font-semibold line-clamp-2 max-w-full">{name}</h3>
```

---

### 2. Missing Optional Fields

**Scenario:** Agent without description, Atom without confidence score

| Field Missing | Strategy |
|---------------|----------|
| description | Collapse space (no empty state) |
| confidence | Hide badge (don't show "N/A") |
| avatar_url | Show default avatar (User icon) |

**Implementation:**
```tsx
{agent.description && (
  <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
)}
```

---

### 3. Multiple Statuses/Badges

**Scenario:** Atom with type badge + language mismatch badge + pending versions badge + approval checkmark

| Viewport | Strategy |
|----------|----------|
| Mobile | Stack badges vertically (2 rows max) |
| Tablet | Inline badges with wrap (gap-2) |
| Desktop | Inline badges with wrap |

**Current Implementation (AtomCard):**
```tsx
<div className="flex items-center gap-2 flex-wrap">
  <Badge variant="outline" className={badges.atom[atom.type]}>
    {React.createElement(atomTypeIcons[atom.type], { className: 'h-3.5 w-3.5' })}
    {getTypeLabel(atom.type)}
  </Badge>
  <LanguageMismatchBadge ... />
</div>
```

✅ **Already handles this well** with `flex-wrap`

---

### 4. 10+ Action Buttons

**Scenario:** AgentCard shows Edit, Copy, Manage Tasks, Test, Delete (5 buttons)

| Viewport | Strategy |
|----------|----------|
| Mobile | 1 primary action + overflow menu with 4 secondary actions |
| Tablet | 2 primary actions (Edit, Delete) + overflow menu (3 actions) |
| Desktop | All 5 actions visible |

**Recommendation:**
```tsx
{/* Mobile */}
<div className="flex gap-2 sm:hidden">
  <Button size="sm" className="flex-1" onClick={onEdit}>
    <Pencil className="h-4 w-4 mr-2" />Edit
  </Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="sm" variant="outline">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={onCopy}>Copy</DropdownMenuItem>
      <DropdownMenuItem onClick={onManageTasks}>Manage Tasks</DropdownMenuItem>
      <DropdownMenuItem onClick={onTest}>Test</DropdownMenuItem>
      <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

{/* Desktop */}
<div className="hidden sm:flex gap-2">
  {/* All 5 icon buttons */}
</div>
```

---

### 5. Mobile Viewport (375px)

**Challenge:** 5 action buttons × 44px = 220px width (>50% of viewport)

| Component | Mobile Strategy |
|-----------|-----------------|
| AgentCard | 1 primary button + overflow menu |
| AtomCard | Swipe actions (left: Approve, right: Reject) OR reveal on tap |
| MessageCard | Hover actions → Tap to reveal actions bar |
| ProjectCard | Edit button only (delete in overflow) |

**Touch Targets:**
- All buttons: `h-11 w-11` (44px) minimum
- Badge tappable areas: `min-h-11 px-4`

---

### 6. Tablet Viewport (768px)

**Optimal Balance:** Show core info + 2-3 actions

| Field Category | Strategy |
|----------------|----------|
| Title | 2 lines max |
| Description | 1 line preview |
| Metadata | Grid (2 cols) |
| Actions | 2 primary + overflow |

---

### 7. Desktop (1024px+)

**Maximum Information Density:**
- Title: 2 lines
- Description: 2-3 lines
- Metadata: Grid (2-3 cols)
- Actions: All visible (hover states)

---

## Responsive Content Rules

### Breakpoint Strategy

| Breakpoint | Tailwind Class | Target Devices | Content Strategy |
|------------|----------------|----------------|------------------|
| **xs** | `< 640px` | Mobile phones | COMPACT: Title + 1 badge + 1 action |
| **sm** | `≥ 640px` | Large phones, small tablets | DEFAULT: Title + badges + 2-3 fields |
| **md** | `≥ 768px` | Tablets | DEFAULT: + Description (1 line) |
| **lg** | `≥ 1024px` | Desktop, laptops | DEFAULT: + Description (2 lines) + Grid layout |
| **xl** | `≥ 1280px` | Large desktops | DEFAULT: + All metadata visible |

### Progressive Disclosure Pattern

```
Mobile (xs):     Title + Badge + [Tap to expand]
Tablet (md):     Title + Badge + Description (1 line) + Key field
Desktop (lg):    Title + Badge + Description (2 lines) + All fields + Actions
Expanded (any):  [Modal/Sheet] Full content + All fields + All actions
```

---

## Default vs Expanded State Specs

### AgentCard States

**Default (List View):**
```tsx
✅ Always visible: name, is_active (badge)
✅ Desktop only: model_name, description (2 lines)
❌ Hidden: temperature, max_tokens, system_prompt
```

**Expanded (Detail Modal):**
```tsx
✅ All fields visible without truncation
✅ Full system prompt (code block with syntax highlighting)
✅ All 5 actions visible
✅ Version history, audit log
```

---

### AtomCard States

**Default (List View):**
```tsx
✅ Always: type (badge), title (2 lines), content (3 lines)
✅ Conditional: confidence (if >80%), user_approved (checkmark), pending_versions (badge)
❌ Hidden: Full content, related atoms, version diffs
```

**Expanded (Detail View):**
```tsx
✅ Full content (no truncation)
✅ Related atoms (links)
✅ Full version history with diffs
✅ All approval actions
```

---

### ProjectCard States

**Default (List View):**
```tsx
✅ Always: name, is_active, version
✅ Desktop: description (2 lines), keywords (first 5)
❌ Hidden: components (nested), glossary, priority_rules
```

**Expanded (Settings Page):**
```tsx
✅ All fields visible in accordions
✅ Inline editing
✅ Component editor (add/remove/reorder)
✅ Glossary editor (add/remove terms)
```

---

### MessageCard States

**Default (Feed View):**
```tsx
✅ Always: author, avatar, content (3 lines), analyzed badge
✅ Conditional: importance (if ≥0.65), noise classification (if spam/noise)
❌ Hidden: Full content, related atoms, message metadata
```

**Expanded (Detail Drawer):**
```tsx
✅ Full message content
✅ All metadata (sent_at, channel, thread)
✅ Extracted entities
✅ Related atoms (if any)
✅ Create Atom form
```

---

## Migration Plan

### Phase 1: Audit Existing Cards (Week 1)

**Goal:** Identify current deviations from this spec

| Task | Owner | Status |
|------|-------|--------|
| 1. Audit AgentCard mobile rendering | Frontend Dev | Pending |
| 2. Audit AtomCard badge overflow | Frontend Dev | Pending |
| 3. Audit ProjectCard keyword truncation | Frontend Dev | Pending |
| 4. Audit MessageCard action visibility | Frontend Dev | Pending |
| 5. Document findings in Beads | BA (A1) | Pending |

**Deliverable:** List of card components with violations + severity

---

### Phase 2: Implement Compact Variant (Week 2-3)

**Goal:** Create mobile-optimized compact card variant

| Task | Acceptance Criteria |
|------|---------------------|
| 1. Create `<CardCompact>` wrapper component | - Padding: 12px<br>- Title: 1 line truncate<br>- Content: 2 lines max<br>- Touch targets ≥44px |
| 2. Add responsive logic to AgentCard | - Mobile: Hide description, model_name<br>- Tablet: Show model_name (1 line)<br>- Desktop: Show description (2 lines) |
| 3. Add action overflow menu | - Mobile: 1 primary + overflow<br>- Desktop: All actions visible |
| 4. Update Storybook stories | - Add "Mobile (375px)" story<br>- Add "Tablet (768px)" story<br>- Add "Desktop (1280px)" story |

**E2E Test:**
```typescript
test('AgentCard adapts to viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
  await expect(page.locator('.agent-card .description')).toBeHidden()

  await page.setViewportSize({ width: 1280, height: 720 }) // Desktop
  await expect(page.locator('.agent-card .description')).toBeVisible()
})
```

---

### Phase 3: Implement Expanded Variant (Week 4)

**Goal:** Create detail view modals/sheets

| Task | Component | Pattern |
|------|-----------|---------|
| 1. AgentCard detail modal | `<AgentDetailModal>` | Dialog with tabs (Config, History, Tests) |
| 2. AtomCard detail drawer | `<AtomDetailDrawer>` | Sheet from right with version history |
| 3. ProjectCard settings page | `<ProjectSettingsPage>` | Full page with accordions |
| 4. MessageCard detail drawer | `<MessageDetailDrawer>` | Sheet with Create Atom form |

**Pattern:**
```tsx
// List view (compact)
<AgentCard agent={agent} onViewDetails={() => setSelectedAgent(agent)} />

// Detail view (expanded)
<AgentDetailModal
  agent={selectedAgent}
  open={!!selectedAgent}
  onClose={() => setSelectedAgent(null)}
/>
```

---

### Phase 4: Testing & Validation (Week 5)

**Goal:** Ensure responsive behavior works across devices

| Test Type | Coverage |
|-----------|----------|
| **Unit Tests** | Each card variant renders correctly |
| **Storybook** | All viewport sizes documented |
| **E2E (Playwright)** | Responsive breakpoints tested |
| **Manual QA** | Real device testing (iPhone, iPad, Android) |

**Playwright Test Matrix:**

| Card | Mobile (375px) | Tablet (768px) | Desktop (1280px) |
|------|----------------|----------------|------------------|
| AgentCard | ✅ Title + Badge | ✅ + Model | ✅ + Description |
| AtomCard | ✅ Title + Type | ✅ + Content (3 lines) | ✅ + Confidence |
| ProjectCard | ✅ Name + Status | ✅ + Keywords (5) | ✅ + All fields |
| MessageCard | ✅ Author + Preview | ✅ + Badges | ✅ + Actions (hover) |

---

## RACI Matrix

| Activity | BA (A1) | F1 (Frontend) | Q1 (QA) | PM |
|----------|---------|---------------|---------|-----|
| **Content prioritization** | R | C | I | A |
| **Responsive design specs** | C | R | I | A |
| **Card variant implementation** | I | R | C | A |
| **Storybook documentation** | I | R | I | I |
| **E2E test creation** | I | C | R | I |
| **Migration plan execution** | C | R | C | A |
| **User acceptance testing** | I | C | R | A |

**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## Recommendations

### 1. Establish Card Component Library

**Create unified card primitives:**

```tsx
// src/shared/components/cards/BaseCard.tsx
<BaseCard
  variant="compact" | "default" | "expanded"
  title={string}
  badges={Badge[]}
  content={ReactNode}
  fields={Field[]}
  actions={Action[]}
  onExpand={() => void}
/>
```

**Benefits:**
- ✅ Consistent behavior across features
- ✅ Single source of truth for responsive rules
- ✅ Easier to maintain

---

### 2. Document in Storybook

**Add "Content Strategy" documentation page:**

```tsx
// .storybook/stories/ContentStrategy.stories.mdx
# Card Content Strategy

## Viewports
- Mobile: 375px - 640px
- Tablet: 768px - 1024px
- Desktop: 1280px+

## Examples
<Canvas>
  <Story name="AgentCard - All Viewports">
    {/* Responsive preview */}
  </Story>
</Canvas>
```

---

### 3. Enforce via Design System Linting

**Add ESLint rule:**

```javascript
// local-rules/card-content-limits.js
module.exports = {
  create(context) {
    return {
      JSXElement(node) {
        if (isCardComponent(node)) {
          const fields = extractFields(node)
          if (fields.length > 7) {
            context.report({
              node,
              message: `Card has ${fields.length} fields (max 7 visible). Use expand pattern for extra fields.`
            })
          }
        }
      }
    }
  }
}
```

---

### 4. Track Compliance in Beads

**Create tracking issues:**

```bash
bd create --title "Audit AgentCard responsive behavior" \
  --type task \
  --labels "frontend,design-system,cards" \
  --priority medium

bd create --title "Implement CardCompact variant" \
  --type feature \
  --labels "frontend,design-system,cards" \
  --priority high
```

---

## Open Questions

| # | Question | Decision Needed By | Impact |
|---|----------|---------------------|--------|
| 1 | Should we use Sheet (right drawer) or Dialog (center modal) for expanded views? | F1 + PM | UX pattern consistency |
| 2 | Do we need "Medium" variant between Compact and Default? | BA (A1) + F1 | Implementation complexity |
| 3 | Should confidence score be visible on all atoms or only >80%? | PM + End User | Information clarity |
| 4 | How to handle swipe gestures on mobile (approve/reject atoms)? | F1 + PM | Mobile interaction pattern |

---

## Success Metrics

| Metric | Current (Estimated) | Target (6 weeks) | Measurement Method |
|--------|---------------------|------------------|-------------------|
| **Mobile usability score** | 60/100 | 85/100 | User testing (5 participants) |
| **Cards adhering to spec** | 20% (1/5) | 100% (5/5) | Code audit |
| **Storybook viewport coverage** | 40% | 100% | Story count |
| **E2E responsive tests** | 0 | 20+ | Playwright test count |

---

## Conclusion

This content prioritization strategy balances **information density** with **cognitive load**, ensuring users can quickly scan cards on mobile while accessing full details on desktop. Key principles:

1. **Progressive Disclosure:** Show critical info first, expand on demand
2. **Responsive Behavior:** Adapt content to viewport, not just layout
3. **Touch Targets:** All interactive elements ≥44px on mobile
4. **Consistent Patterns:** 3-tier variant system (Compact/Default/Expanded)

**Next Steps:**
1. Review this document with PM and F1
2. Create Beads tasks for Phase 1 audit
3. Prioritize migration in roadmap
4. Begin Storybook documentation updates

---

**References:**
- ADR-002: Entity Hierarchy (Topics > Atoms > Messages)
- AGENTS.md: Design System rules (touch targets, spacing)
- Existing card implementations (5 components analyzed)

**Document Version History:**
- 1.0 (2026-01-03): Initial draft by BA (A1)
