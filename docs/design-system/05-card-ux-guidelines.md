# Card UX Guidelines

> **Industry Best Practices for Card-Based Interfaces**
> Based on Material Design 3, shadcn/ui patterns, and WCAG 2.1 AA compliance research

---

## Table of Contents

1. [Information Hierarchy](#information-hierarchy)
2. [Truncation Strategy](#truncation-strategy)
3. [Action Button Guidelines](#action-button-guidelines)
4. [Progressive Disclosure](#progressive-disclosure)
5. [Touch Target Requirements](#touch-target-requirements)
6. [Keyboard Navigation](#keyboard-navigation)
7. [Screen Reader Considerations](#screen-reader-considerations)
8. [Responsive Breakpoints](#responsive-breakpoints)
9. [Decision Tree](#decision-tree)
10. [Do's and Don'ts](#dos-and-donts)
11. [Before/After Examples](#beforeafter-examples)
12. [Research Citations](#research-citations)

---

## Information Hierarchy

### Core Principle

Cards organize information hierarchically to direct users' attention to the most important content first. Material Design 3 recommends placing primary content at the top and using typography to emphasize key information.

### Hierarchy Levels

| Level | Content | Typography | Visibility |
|-------|---------|------------|------------|
| **Primary** | Title, main identifier | `text-lg font-semibold` | Always visible |
| **Secondary** | Key metadata (status, type) | `text-sm font-medium` | Always visible |
| **Tertiary** | Supporting details | `text-sm text-muted` | Visible on default |
| **Quaternary** | Extended metadata | `text-xs text-muted` | Show on expand/hover |

### Maximum Fields Per View

| Card State | Recommended Fields | Maximum Fields |
|------------|-------------------|----------------|
| **Collapsed** | 3-4 | 5 |
| **Default** | 4-5 | 6 |
| **Expanded** | Unlimited | - |

### Visual Hierarchy Example

```
+--------------------------------------------------+
| [Badge: Type]                    [Score: 0.85]   |  <- Secondary (metadata)
|                                                  |
| Card Title Here (2 lines max)                    |  <- Primary (attention)
|                                                  |
| Brief description text that provides             |  <- Tertiary (context)
| context for the card content...                  |
|                                                  |
| [Primary Action]        ... [Overflow Menu]      |  <- Actions
+--------------------------------------------------+
```

---

## Truncation Strategy

### When to Truncate

| Content Type | Lines | Truncation Method | Full Access |
|--------------|-------|-------------------|-------------|
| **Title** | 1-2 | `line-clamp-2` | Tooltip |
| **Description** | 2-3 | `line-clamp-3` | Expand/Detail view |
| **Metadata** | 1 | `truncate` | Tooltip |
| **Tags/Labels** | 1 row | Count overflow (`+3 more`) | Expand |

### CSS Implementation

```tsx
// Single-line truncation with tooltip
<span className="truncate" title={fullText}>
  {text}
</span>

// Multi-line truncation
<p className="line-clamp-2">
  {description}
</p>

// Accessible truncation with expand
<p className="line-clamp-3">
  {longContent}
</p>
{needsExpand && (
  <button
    className="text-sm text-primary"
    aria-expanded="false"
  >
    Show more
  </button>
)}
```

### Tooltip Strategy

**When to Use Tooltips:**

| Scenario | Tooltip Required |
|----------|------------------|
| Truncated text | Yes |
| Icon-only buttons | Yes |
| Abbreviated labels | Yes |
| Status indicators (icon only) | Yes |
| Timestamps (relative) | Yes (show absolute) |

**When NOT to Use Tooltips:**

| Scenario | Reason |
|----------|--------|
| Full visible text | Redundant |
| Self-explanatory icons | Unnecessary |
| Buttons with text labels | Already clear |
| Touch-only interfaces | Cannot hover |

### Accessible Tooltip Requirements (WCAG 2.1 SC 1.4.13)

1. **Dismissable**: Close with Escape key
2. **Hoverable**: Content stays visible when mouse moves to tooltip
3. **Persistent**: Remains visible until user dismisses or moves away

```tsx
// Accessible tooltip implementation
<Tooltip>
  <TooltipTrigger asChild>
    <span className="truncate cursor-help">
      {truncatedText}
    </span>
  </TooltipTrigger>
  <TooltipContent
    className="max-w-xs"
    onEscapeKeyDown={() => setOpen(false)}
  >
    {fullText}
  </TooltipContent>
</Tooltip>
```

### Screen Reader Considerations for Truncation

```tsx
// Replace visual ellipsis with semantic markup
<span className="line-clamp-2">
  {text}
  <span className="sr-only"> (text truncated)</span>
</span>

// Provide full content access
<details className="mt-2">
  <summary className="text-sm text-primary cursor-pointer">
    Show full content
  </summary>
  <p className="mt-2 text-sm">{fullContent}</p>
</details>
```

---

## Action Button Guidelines

### The 1-2-3 Rule

| Action Type | Visibility | Placement |
|-------------|------------|-----------|
| **Primary** (1) | Always visible | Right side of header OR footer |
| **Secondary** (2) | Show on hover/focus | Next to primary OR overflow |
| **Tertiary** (3+) | Overflow menu | Kebab menu (vertical ellipsis) |

### When to Use Overflow Menu

| Number of Actions | Strategy |
|-------------------|----------|
| 1-2 actions | Show all visible |
| 3-4 actions | Show 2 + overflow |
| 5+ actions | Show 1-2 + overflow |

**Do NOT use overflow menu when:**
- There are 2 or fewer actions (PatternFly guideline)
- Actions are critical and must be immediately visible
- Primary action would be hidden

### Action Placement Patterns

**Pattern A: Header Actions (Compact Cards)**

```
+--------------------------------------------------+
| [Title]                    [Edit] [Delete] [...] |
| Description text                                 |
+--------------------------------------------------+
```

**Pattern B: Footer Actions (Content Cards)**

```
+--------------------------------------------------+
| [Header]                                         |
| Content area with more detail                    |
|                                                  |
+--------------------------------------------------+
| [Secondary]                        [Primary CTA] |
+--------------------------------------------------+
```

**Pattern C: Contextual Actions (List Items)**

```
+--------------------------------------------------+
| [Title]                                          |
| Metadata                                    [...] <- Appears on hover
+--------------------------------------------------+
```

### Overflow Menu Structure

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label="More actions"
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy className="h-4 w-4 mr-2" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Text Guidelines for Actions

- Keep text short and direct for quick scanning
- Use sentence case ("View details" not "VIEW DETAILS")
- Start with action verb ("Edit", "Delete", "View")
- Be specific ("Delete topic" not just "Delete")

---

## Progressive Disclosure

### Core Principle

Progressive disclosure defers advanced or rarely-used features to secondary views, reducing cognitive load while maintaining access to full functionality.

### Implementation Levels

**Level 1: Default View (Essential)**

- Title (2 lines max)
- Primary identifier/status
- 3-4 key fields
- Primary action
- Expand indicator

**Level 2: Expanded View (Additional)**

- Full title (no truncation)
- All metadata fields
- All actions
- Related items
- History/timeline

**Maximum Disclosure Depth: 2 Levels**

Research shows designs exceeding 2 disclosure levels have low usability because users get lost navigating between them.

### Progressive Disclosure Patterns

**Pattern A: Expandable Card**

```tsx
const [expanded, setExpanded] = useState(false);

<Card className="transition-all">
  {/* Always visible */}
  <CardHeader>
    <CardTitle className={cn(
      expanded ? "" : "line-clamp-2"
    )}>
      {title}
    </CardTitle>
  </CardHeader>

  {/* Always visible summary */}
  <CardContent>
    <p className={cn(
      "text-sm text-muted-foreground",
      expanded ? "" : "line-clamp-2"
    )}>
      {description}
    </p>
  </CardContent>

  {/* Expanded content */}
  {expanded && (
    <CardContent className="pt-0 border-t mt-4">
      <dl className="space-y-2">
        {additionalFields.map(field => (
          <div key={field.label}>
            <dt className="text-xs uppercase text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm">{field.value}</dd>
          </div>
        ))}
      </dl>
    </CardContent>
  )}

  <CardFooter>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
    >
      {expanded ? (
        <>
          <ChevronUp className="h-4 w-4 mr-1" />
          Show less
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4 mr-1" />
          Show more
        </>
      )}
    </Button>
  </CardFooter>
</Card>
```

**Pattern B: Click-to-Detail**

```tsx
<Card
  className="cursor-pointer hover:shadow-md transition-shadow"
  onClick={() => navigate(`/items/${id}`)}
  role="link"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') navigate(`/items/${id}`);
  }}
>
  {/* Summary view */}
  <CardContent>
    <h3 className="font-semibold line-clamp-2">{title}</h3>
    <p className="text-sm text-muted-foreground line-clamp-2">
      {description}
    </p>
  </CardContent>
</Card>
```

**Pattern C: Hover Reveal**

```tsx
<Card className="group relative">
  <CardContent>
    <h3>{title}</h3>
    <p>{description}</p>
  </CardContent>

  {/* Actions revealed on hover/focus */}
  <div className={cn(
    "absolute top-2 right-2",
    "opacity-0 group-hover:opacity-100",
    "group-focus-within:opacity-100",
    "transition-opacity"
  )}>
    <Button variant="ghost" size="icon" aria-label="Edit">
      <Edit className="h-4 w-4" />
    </Button>
  </div>
</Card>
```

---

## Touch Target Requirements

### WCAG 2.5.5: Target Size

| Level | Minimum Size | Recommendation |
|-------|--------------|----------------|
| **AAA** | 44x44px | Preferred for all interactive elements |
| **AA** | 24x24px | Minimum acceptable |
| **Apple iOS** | 44x44px | Human Interface Guidelines |
| **Android** | 48x48dp (~48px) | Material Design |

### Pulse Radar Standard: 44x44px

All interactive elements on cards must have a minimum touch target of 44x44 CSS pixels.

### Implementation

```tsx
// Icon button - explicit size
<Button
  variant="ghost"
  size="icon"
  className="h-11 w-11" // 44px
  aria-label="Delete"
>
  <Trash className="h-4 w-4" />
</Button>

// Small visual, large target (padding approach)
<button
  className="p-3 -m-3" // 24px padding = 48px total target
  aria-label="Menu"
>
  <MoreVertical className="h-4 w-4" />
</button>

// Action row with proper spacing
<div className="flex gap-2"> {/* 8px gap minimum */}
  <Button size="icon" className="h-11 w-11">
    <Edit className="h-4 w-4" />
  </Button>
  <Button size="icon" className="h-11 w-11">
    <Trash className="h-4 w-4" />
  </Button>
</div>
```

### Touch Target Spacing

Minimum 8px gap between adjacent touch targets to prevent mis-taps.

```tsx
// Correct - 8px gap
<div className="flex gap-2">
  {actions.map(action => (
    <Button key={action.id} size="icon" className="h-11 w-11" />
  ))}
</div>

// Incorrect - no gap
<div className="flex gap-0">
  {/* Touch targets overlap */}
</div>
```

---

## Keyboard Navigation

### WCAG 2.1.1: Keyboard Accessible

All card interactions must be operable via keyboard.

### Navigation Pattern

| Key | Action |
|-----|--------|
| **Tab** | Move focus to next interactive element |
| **Shift+Tab** | Move focus to previous element |
| **Enter** | Activate focused button/link |
| **Space** | Activate button, toggle checkbox |
| **Escape** | Close expanded content, dismiss tooltip |
| **Arrow keys** | Navigate within menus |

### Focus Management

```tsx
// Focusable card (if clickable)
<Card
  tabIndex={0}
  role="button"
  className="focus-visible:ring-2 focus-visible:ring-ring"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {content}
</Card>

// Focus within for nested interactive elements
<Card className="focus-within:ring-2 focus-within:ring-ring">
  <input type="text" />
  <Button>Submit</Button>
</Card>
```

### Roving Tabindex for Card Grids

When navigating card grids, use roving tabindex pattern:

```tsx
// Tab moves between cards, arrows move within
const [focusedIndex, setFocusedIndex] = useState(0);

<div role="grid" className="grid grid-cols-3 gap-4">
  {cards.map((card, index) => (
    <Card
      key={card.id}
      tabIndex={index === focusedIndex ? 0 : -1}
      role="gridcell"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          setFocusedIndex((index + 1) % cards.length);
        }
        if (e.key === 'ArrowLeft') {
          setFocusedIndex((index - 1 + cards.length) % cards.length);
        }
      }}
    >
      {card.content}
    </Card>
  ))}
</div>
```

---

## Screen Reader Considerations

### Semantic Structure

```tsx
// Proper heading hierarchy within cards
<Card>
  <CardHeader>
    <CardTitle as="h3">Topic Name</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Use definition lists for key-value pairs */}
    <dl>
      <div>
        <dt className="sr-only">Status</dt>
        <dd><Badge>Active</Badge></dd>
      </div>
      <div>
        <dt className="sr-only">Message count</dt>
        <dd>42 messages</dd>
      </div>
    </dl>
  </CardContent>
</Card>
```

### ARIA Labels

```tsx
// Status indicators need text alternative
<span
  className="h-2 w-2 rounded-full bg-status-connected"
  role="img"
  aria-label="Status: Connected"
/>

// Icon-only buttons require labels
<Button size="icon" aria-label="Delete topic">
  <Trash className="h-4 w-4" />
</Button>

// Truncated text should indicate truncation
<p className="truncate" aria-label={`${fullText} (truncated)`}>
  {truncatedText}
</p>
```

### Live Regions for Dynamic Content

```tsx
// Announce status changes
<div role="status" aria-live="polite">
  {status === 'loading' && <span>Loading...</span>}
  {status === 'success' && <span>Saved successfully</span>}
  {status === 'error' && <span>Error: {errorMessage}</span>}
</div>
```

---

## Responsive Breakpoints

### Card Layout Breakpoints

| Breakpoint | Grid Columns | Card Padding | Actions |
|------------|--------------|--------------|---------|
| **Mobile** (< 640px) | 1 | `p-3` | Stacked/overflow |
| **Tablet** (640-1024px) | 2 | `p-4` | Inline with overflow |
| **Desktop** (> 1024px) | 3-4 | `p-4` | Full inline |

### Implementation

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {cards.map(card => (
    <Card
      key={card.id}
      className="p-3 sm:p-4"
    >
      {/* Mobile: stacked actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h3 className="flex-1">{card.title}</h3>

        {/* Mobile: overflow all, Desktop: show primary */}
        <div className="hidden sm:flex gap-2">
          <Button size="sm">Primary</Button>
        </div>
        <OverflowMenu className="sm:hidden" />
      </div>
    </Card>
  ))}
</div>
```

### Content Adaptation

| Content | Mobile | Desktop |
|---------|--------|---------|
| Title | 2 lines | 1 line (wider) |
| Description | 2 lines | 3 lines |
| Metadata | Stacked | Inline |
| Actions | Overflow only | 2 visible + overflow |

---

## Decision Tree

### Choosing Card Layout

```
START: What content does this card display?

Is it a simple item (1-2 fields)?
  YES -> Use list item, not card
  NO -> Continue

Does it have related grouped information?
  YES -> Use Card
  NO -> Consider simpler component

How many actions are needed?
  |
  +-- 0 actions -> Display-only card (no hover effect)
  |
  +-- 1-2 actions -> Show all visible
  |
  +-- 3-4 actions -> Show 2 + overflow menu
  |
  +-- 5+ actions -> Show 1 + overflow menu, consider redesign

Does content exceed 2 lines?
  YES -> Implement truncation + expansion
  NO -> Show full content

Is the card interactive (clickable)?
  YES -> Add hover state, focus ring, role="button"
  NO -> No interaction states needed
```

### Choosing Truncation Method

```
START: Is the text potentially long?

Is it a title/heading?
  YES -> line-clamp-2 + tooltip on truncation
  NO -> Continue

Is it a description?
  YES -> line-clamp-3 + expand button if needed
  NO -> Continue

Is it metadata (single value)?
  YES -> truncate (single line) + tooltip
  NO -> Consider restructuring

Is full content critical?
  YES -> Expand in place or link to detail view
  NO -> Tooltip sufficient
```

---

## Do's and Don'ts

### Do's

| Practice | Reason |
|----------|--------|
| Use consistent padding (`p-4` default) | Visual rhythm |
| Show hover effect on interactive cards | Affordance |
| Use semantic HTML (`article`, `h3`) | Accessibility |
| Truncate with tooltip or expand | Full content access |
| Place primary action on right | Scanning pattern |
| Use 44x44px touch targets | Touch accessibility |
| Provide visible focus indicator | Keyboard users |
| Test with screen reader | Full accessibility |

### Don'ts

| Anti-pattern | Reason |
|--------------|--------|
| Nest cards inside cards | Confusion, complexity |
| Show 5+ visible actions | Decision paralysis |
| Use color-only status | Color blindness |
| Truncate without access to full text | Information loss |
| Use tiny touch targets (< 44px) | Frustration, mis-taps |
| Remove focus outlines | Keyboard inaccessibility |
| Use `title` attribute alone | Poor screen reader support |
| Exceed 2 disclosure levels | User gets lost |

---

## Before/After Examples

### Example 1: Action Button Overload

**Before (Problem):**
```
+--------------------------------------------------+
| Title          [Edit] [Copy] [Share] [Archive] [X]|
| Description                                       |
| Metadata: value | Status: active                  |
+--------------------------------------------------+
```
- 5 buttons in header
- Visual clutter
- Small touch targets
- Overwhelming

**After (Solution):**
```
+--------------------------------------------------+
| Title                              [Edit]   [...] |
| Description                                       |
| Metadata: value | Status: active                  |
+--------------------------------------------------+
                                        |
                              +------------------+
                              | Copy             |
                              | Share            |
                              | Archive          |
                              |------------------|
                              | Delete           |
                              +------------------+
```
- 1 primary action visible
- Overflow menu for secondary actions
- Clean visual hierarchy
- Adequate touch targets

### Example 2: Truncation Without Access

**Before (Problem):**
```
+--------------------------------------------------+
| Very long title that gets cut off without any... |
| Description text also truncated without any w... |
| No way to see full content                       |
+--------------------------------------------------+
```
- Truncated without access to full text
- Information permanently hidden
- Poor accessibility

**After (Solution):**
```
+--------------------------------------------------+
| Very long title that gets cut off... [i]         |
|                                      |           |
| Description text with proper truncation...       |
|                                                  |
| [Show more]                                      |
+--------------------------------------------------+
       |                              |
       v                              v
    Tooltip:                   Expands to show
    "Very long title that      full description
     gets cut off without      inline
     any indication..."
```
- Title has tooltip on truncation
- Description has expand option
- Full content always accessible

### Example 3: Information Hierarchy

**Before (Problem):**
```
+--------------------------------------------------+
| Created: 2024-01-15 | Updated: 2024-01-20        |
| ID: abc-123-def | Type: PROBLEM | Priority: HIGH |
| This is the actual title of the item             |
| Some description text here                       |
+--------------------------------------------------+
```
- Metadata before title
- Title not prominent
- Poor visual scanning

**After (Solution):**
```
+--------------------------------------------------+
| [PROBLEM]                              [HIGH]    |
|                                                  |
| This is the actual title of the item             |
|                                                  |
| Some description text here                       |
|                                                  |
| Updated 5 days ago                      ID: abc  |
+--------------------------------------------------+
```
- Type badge prominent (category)
- Title is focal point
- Metadata in secondary position
- Clean hierarchy

---

## Research Citations

### Material Design 3

- [Cards - Guidelines](https://m3.material.io/components/cards/guidelines) - Content hierarchy, action placement, visual structure
- [Typography](https://m3.material.io/styles/typography/applying-type) - Type scale and hierarchy

### shadcn/ui

- [Card Component](https://ui.shadcn.com/docs/components/card) - Component structure, subcomponents, semantic HTML

### Nielsen Norman Group

- [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) - Show essential features first, defer advanced options

### PatternFly

- [Overflow Menu Guidelines](https://www.patternfly.org/components/overflow-menu/design-guidelines/) - When to use, placement, content guidelines

### WCAG 2.1

- [SC 1.4.13 Content on Hover or Focus](https://www.wcag.com/authors/1-4-13-content-on-hover-or-focus/) - Tooltip requirements
- [SC 2.1.1 Keyboard](https://wcag.dock.codes/documentation/wcag211/) - Full keyboard accessibility
- [SC 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) - 44x44px minimum

### Accessibility Specialists

- [Tooltips in WCAG 2.1 - Sarah Higley](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) - Dismissable, hoverable, persistent
- [Truncating Text Accessibly - SiteLint](https://www.sitelint.com/blog/truncating-text-and-making-it-accessible) - Screen reader considerations

### Touch Target Research

- [Smashing Magazine Tap Target Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) - Position-based recommendations
- [Steven Hoober's Touch Research](https://www.uxmatters.com/mt/archives/2017/03/design-for-fingers-touch-and-people-part-1.php) - Optimal target sizes by screen position

### Linear

- [How We Redesigned Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) - Information density, visual hierarchy, action patterns

---

## Checklist

### Card Design Review

- [ ] Information hierarchy: title > status > description > metadata
- [ ] Title truncated at 2 lines max with tooltip
- [ ] Description truncated at 3 lines with expand option
- [ ] Maximum 2 visible action buttons
- [ ] Overflow menu for 3+ actions
- [ ] Touch targets >= 44x44px
- [ ] 8px minimum gap between touch targets
- [ ] Focus indicator visible on all interactive elements
- [ ] Status shown with icon + text (not color only)
- [ ] Screen reader tested
- [ ] Keyboard navigation works
- [ ] Progressive disclosure max 2 levels
- [ ] Responsive layout tested (mobile/tablet/desktop)

---

## Related Documentation

- [Card Component](/docs/design-system/05-components/card.md) - Base component documentation
- [Card Typography](/docs/design-system/04-card-typography.md) - Typography tokens and contrast
- [Accessibility](/docs/design-system/08-accessibility.md) - WCAG compliance details
- [Spacing](/docs/design-system/03-spacing.md) - Grid system and padding

---

*Last updated: January 2026*
*Based on research from Material Design 3, shadcn/ui, WCAG 2.1, and industry leaders*
