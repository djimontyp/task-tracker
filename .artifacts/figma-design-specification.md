# Figma Design Specification: Pulse Radar Dashboard Redesign

**Project**: Task Tracker Dashboard
**Design File**: "Пульс Радар" (Team: "Тім Пульс")
**Date**: 2025-10-19
**Based on**: UX Audit findings + existing implementation analysis

---

## 📋 Design System Setup

### 1. Color Styles (Variables)

Create Figma color variables with light/dark mode support:

#### Semantic Colors

**Light Mode:**
```
background/primary     = #FAFAFA
background/secondary   = #F5F5F5
background/tertiary    = #EEEEEE
background/card        = #FFFFFF
background/elevated    = #F7F7F7

text/primary          = #1E1E1E
text/secondary        = #4A4A4A
text/tertiary         = #6B6B6B
text/muted            = #999999

border/primary        = #E0E0E0
border/secondary      = #BDBDBD
border/focus          = #E4572E

accent/primary        = #E4572E (Copper)
accent/secondary      = #F58549 (Light Copper)
accent/success        = #16A34A (Green)
accent/warning        = #F97316 (Orange)
accent/error          = #DC2626 (Red)
```

**Dark Mode:**
```
background/primary     = #1E1E1E
background/secondary   = #252525
background/tertiary    = #2E2E2E
background/card        = #2A2A2A
background/elevated    = #323232

text/primary          = #EBEBEB
text/secondary        = #B8B8B8
text/tertiary         = #8A8A8A
text/muted            = #666666

border/primary        = #2E2E2E
border/secondary      = #3A3A3A
border/focus          = #E4572E

accent/primary        = #E4572E
accent/secondary      = #F58549
accent/success        = #4ADE80
accent/warning        = #FB923C
accent/error          = #F87171
```

### 2. Typography Styles

**Font**: Inter (import from Google Fonts)

```
Heading 1/Display
- Size: 36px
- Weight: Light (300)
- Line Height: 45px (1.25)
- Letter Spacing: -0.72px (-0.02em)

Heading 2/Page Title
- Size: 30px
- Weight: Regular (400)
- Line Height: 38px (1.25)
- Letter Spacing: 0

Heading 3/Section
- Size: 24px
- Weight: Regular (400)
- Line Height: 30px (1.25)
- Letter Spacing: 0

Heading 4/Card Title
- Size: 20px
- Weight: Medium (500)
- Line Height: 30px (1.5)
- Letter Spacing: 0.4px (0.02em)

Heading 5/Subsection
- Size: 18px
- Weight: Medium (500)
- Line Height: 27px (1.5)
- Letter Spacing: 0

Heading 6/Small Title
- Size: 16px
- Weight: Medium (500)
- Line Height: 24px (1.5)
- Letter Spacing: 0.32px (0.02em)

Body 1/Default
- Size: 16px
- Weight: Regular (400)
- Line Height: 24px (1.5)
- Letter Spacing: 0

Body 2/Small
- Size: 14px
- Weight: Regular (400)
- Line Height: 21px (1.5)
- Letter Spacing: 0.28px (0.02em)

Caption/Metadata
- Size: 12px
- Weight: Regular (400)
- Line Height: 18px (1.5)
- Letter Spacing: 0

Overline/Label
- Size: 10px
- Weight: Regular (400)
- Line Height: 15px (1.5)
- Letter Spacing: 1px (0.1em)
- Transform: UPPERCASE

Button Large
- Size: 16px
- Weight: Semibold (600)
- Line Height: 24px (1.5)
- Letter Spacing: 0

Button Medium
- Size: 14px
- Weight: Semibold (600)
- Line Height: 20px (1.43)
- Letter Spacing: 0

Button Small
- Size: 12px
- Weight: Medium (500)
- Line Height: 18px (1.5)
- Letter Spacing: 0
```

### 3. Effect Styles (Shadows)

```
Elevation/sm
- Type: Drop Shadow
- X: 0, Y: 1, Blur: 2
- Color: #0F172A @ 8% opacity

Elevation/md (Card Default)
- Type: Drop Shadow
- X: 0, Y: 10, Blur: 20
- Color: #0F172A @ 8% opacity

Elevation/lg (Card Hover)
- Type: Drop Shadow
- X: 0, Y: 20, Blur: 40
- Color: #0F172A @ 12% opacity

Elevation/xl (Modal)
- Type: Drop Shadow
- X: 0, Y: 32, Blur: 60
- Color: #0F172A @ 16% opacity

Elevation/sidebar
- Type: Drop Shadow
- X: 0, Y: 18, Blur: 40
- Color: #1A2332 @ 12% opacity

Focus Ring
- Type: Drop Shadow
- X: 0, Y: 0, Blur: 0, Spread: 2
- Color: #E4572E @ 100%
- Offset: 4px
```

### 4. Grid & Layout

**Desktop (1440px):**
- Columns: 12
- Gutter: 24px
- Margin: 48px

**Tablet (768px):**
- Columns: 8
- Gutter: 16px
- Margin: 24px

**Mobile (375px):**
- Columns: 4
- Gutter: 16px
- Margin: 16px

**Spacing Scale (8px grid):**
```
4px   - xs
8px   - sm
12px  - md
16px  - lg
24px  - xl
32px  - 2xl
48px  - 3xl
64px  - 4xl
96px  - 5xl
```

---

## 🧩 Component Library

### Atoms (Basic Elements)

#### Button Component

**Variants:**
- Type: Primary | Secondary | Outline | Ghost | Destructive
- Size: Small | Medium | Large
- State: Default | Hover | Pressed | Disabled | Loading
- Icon: None | Left | Right | Only

**Specifications:**

**Primary Button (Large):**
- Background: accent/primary (#E4572E)
- Text: #FFFFFF, Button Large style
- Padding: 16px horizontal, 12px vertical
- Border Radius: 8px
- Shadow: None (default), Elevation/sm (hover)
- Hover: Darken background 10%
- Pressed: Darken background 20%
- Disabled: 50% opacity
- Loading: Spinner icon, text "Loading..."

**Secondary Button (Large):**
- Background: background/tertiary
- Text: text/primary, Button Large style
- Border: 1px solid border/primary
- Padding: 16px horizontal, 12px vertical
- Border Radius: 8px

**Ghost Button (Medium):**
- Background: Transparent
- Text: text/secondary, Button Medium style
- Padding: 12px horizontal, 8px vertical
- Hover: background/secondary

**Destructive Button (Medium):**
- Background: accent/error
- Text: #FFFFFF, Button Medium style
- Padding: 12px horizontal, 8px vertical
- Border Radius: 8px

**Auto Layout:**
- Direction: Horizontal
- Gap: 8px (between icon and text)
- Resizing: Hug contents (vertical), Fill container or Fixed (horizontal)
- Min-width: 120px (Primary Large)

---

#### Input Field Component

**Variants:**
- Type: Text | Email | Password | Search | Textarea
- State: Default | Focus | Error | Disabled
- Size: Small | Medium | Large

**Specifications (Medium):**
- Background: background/card
- Border: 1px solid border/primary
- Border Radius: 6px
- Padding: 12px horizontal, 10px vertical
- Text: Body 2 style, text/primary
- Placeholder: Body 2 style, text/muted

**Focus State:**
- Border: 2px solid accent/primary
- Shadow: Focus Ring effect

**Error State:**
- Border: 2px solid accent/error
- Helper text: Caption style, accent/error color

---

#### Badge Component

**Variants:**
- Type: Default | Success | Warning | Error | Info
- Size: Small | Medium

**Specifications (Medium):**
- Background: accent/primary @ 10% opacity
- Text: Caption style, accent/primary
- Padding: 6px horizontal, 4px vertical
- Border Radius: 4px

**Success Badge:**
- Background: accent/success @ 10%
- Text: accent/success

---

#### Icon System

**Size Scale:**
- xs: 12×12px
- sm: 16×16px
- md: 20×20px
- lg: 24×24px
- xl: 32×32px

**Style**: Lucide Icons (consistent with existing implementation)

**Common Icons Needed:**
- Navigation: Home, Users, MessageSquare, Target, Settings
- Actions: Plus, Edit, Trash, Download, Upload, Refresh
- Status: Check, X, AlertTriangle, Info, HelpCircle
- UI: ChevronDown, ChevronRight, Search, Filter, MoreVertical

---

### Molecules (Combinations)

#### Stat Card Component

**Structure:**
```
Card Container (Auto Layout Vertical, Gap: 12px)
├─ Header (Auto Layout Horizontal, Gap: 8px)
│  ├─ Icon (24×24px, accent/primary)
│  └─ Label (Body 2, text/secondary)
├─ Value (Heading 2, text/primary)
├─ Trend Indicator (Auto Layout Horizontal, Gap: 4px)
│  ├─ Arrow Icon (16×16px, success/error)
│  ├─ Percentage (Caption, success/error)
└─ Subtitle (Caption, text/muted)
```

**Specifications:**
- Background: background/card
- Border: 1px solid border/primary
- Border Radius: 12px
- Padding: 24px
- Shadow: Elevation/md (default), Elevation/lg (hover)
- Min-width: 240px
- Min-height: 160px

**Interactive:**
- Cursor: pointer
- Hover: Lift effect (translateY -2px), shadow increases
- Transition: 250ms cubic-bezier(0.4, 0, 0.2, 1)

**States:**
- Default: All metrics visible
- Loading: Skeleton shimmer animation
- Empty: Show "—" for value, hide trend

---

#### Data Table Row Component

**Structure:**
```
Row Container (Auto Layout Horizontal, Align: Center)
├─ Checkbox (20×20px)
├─ Cell 1 (Text, Body 2)
├─ Cell 2 (Text, Body 2)
├─ Cell 3 (Badge or Text)
├─ Cell 4 (Icon + Text)
└─ Actions Menu (Icon Button)
```

**Specifications:**
- Background: transparent (default), background/secondary (hover)
- Border Bottom: 1px solid border/primary
- Padding: 16px vertical, 12px horizontal
- Min-height: 56px (touch target)

**States:**
- Default: Transparent background
- Hover: background/secondary, show action menu
- Selected: background/tertiary, checkbox checked
- Disabled: 50% opacity

---

#### Empty State Component

**Structure:**
```
Container (Auto Layout Vertical, Gap: 24px, Centered)
├─ Illustration (Icon 64×64px or Image 200×200px)
├─ Title (Heading 4, text/primary)
├─ Description (Body 2, text/secondary, max-width: 400px)
├─ Primary CTA (Button Primary Large)
└─ Secondary Link (Text Link, Body 2)
```

**Specifications:**
- Alignment: Center
- Padding: 48px
- Max-width: 600px

**Variations:**
- No Messages: Mail icon, "No messages yet", "Import from Telegram"
- No Topics: Tag icon, "No topics found", "Create your first topic"
- No Tasks: CheckSquare icon, "No tasks yet", "Add a task"

---

### Organisms (Complex Components)

#### Sidebar Navigation Component

**Structure:**
```
Sidebar Container (Auto Layout Vertical, Fill)
├─ Header (Logo + Service Status)
├─ Navigation Groups (Scrollable)
│  ├─ Section 1: Data Management
│  │  ├─ Nav Item: Dashboard
│  │  ├─ Nav Item: Messages (with count badge)
│  │  ├─ Nav Item: Topics
│  │  └─ Nav Item: Tasks
│  ├─ Section 2: AI Operations
│  │  ├─ Nav Item: Analysis Runs
│  │  ├─ Nav Item: Proposals
│  │  └─ Nav Item: Noise Filtering
│  └─ Section 3: AI Setup
│     ├─ Nav Item: Agents
│     ├─ Nav Item: Providers
│     └─ Nav Item: Projects
└─ Footer
   ├─ Settings Link
   └─ User Profile Button
```

**Specifications:**
- Width: 240px (expanded), 64px (collapsed)
- Background: background/card
- Border Right: 1px solid border/primary
- Shadow: Elevation/sidebar
- Padding: 16px

**Navigation Item:**
- Height: 40px
- Padding: 8px 12px
- Border Radius: 6px
- Gap: 12px (icon to text)

**Active State:**
- Background: accent/primary @ 10%
- Text: accent/primary
- Border Left: 3px solid accent/primary

**Hover State:**
- Background: background/secondary
- Text: text/primary

**Section Header:**
- Text: Overline style, text/muted
- Padding: 16px 12px 8px
- Margin Top: 24px (except first)

---

#### Data Table Component

**Structure:**
```
Table Container (Auto Layout Vertical, Fill)
├─ Toolbar (Auto Layout Horizontal, Space Between)
│  ├─ Left Actions
│  │  ├─ Search Input (fills available space)
│  │  ├─ Filter Button (with dropdown)
│  │  └─ Sort Button
│  └─ Right Actions
│     ├─ Refresh Button (Ghost)
│     └─ Primary Action Button
├─ Table Header Row (Sticky)
├─ Table Rows (Scrollable, virtualized if >50 rows)
└─ Footer (Pagination + Row Count)
```

**Specifications:**
- Background: background/card
- Border: 1px solid border/primary
- Border Radius: 12px
- Shadow: Elevation/md

**Header Row:**
- Background: background/secondary
- Border Bottom: 2px solid border/primary
- Text: Body 2, Weight: Medium (500)
- Padding: 12px
- Sticky Position: top

**Pagination:**
- Position: Bottom right
- Gap: 12px between elements
- Buttons: Ghost Small
- Page indicator: "Page 1 of 10"

---

#### Heatmap Visualization Component

**Structure:**
```
Heatmap Container (Auto Layout Vertical, Gap: 16px)
├─ Header (Auto Layout Horizontal, Space Between)
│  ├─ Title (Heading 4)
│  └─ Controls
│     ├─ Tab Group (Week | Month)
│     └─ Source Checkboxes (Telegram, Slack, Email)
├─ Grid (7 columns × 24 rows)
│  ├─ X-axis labels (Days: Mon-Sun)
│  ├─ Y-axis labels (Hours: 00:00-23:00)
│  └─ Cells (8×8px each, gap: 2px)
└─ Legend (Less → More gradient)
```

**Cell Specifications:**
- Size: 12×12px (desktop), 8×8px (mobile)
- Border Radius: 2px
- Gap: 2px
- Colors (5 levels):
  - Level 0 (empty): background/tertiary
  - Level 1 (1-5): accent/primary @ 20%
  - Level 2 (6-15): accent/primary @ 40%
  - Level 3 (16-30): accent/primary @ 60%
  - Level 4 (31+): accent/primary @ 100%

**Hover State:**
- Tooltip: "15 messages, Mon 14:00"
- Cell border: 1px solid text/primary
- Transition: 150ms

---

## 📱 Responsive Breakpoints

### Desktop (1440px+)
- Sidebar: 240px fixed width
- Main content: Remaining width, max 1200px container
- Stat cards: 3 columns (2×3 grid)
- Data table: Full columns visible
- Heatmap: 12×12px cells

### Tablet (768px - 1439px)
- Sidebar: Collapsible to 64px (icons only)
- Main content: Full width, 24px margin
- Stat cards: 2 columns (3×2 grid)
- Data table: Hide less important columns, horizontal scroll
- Heatmap: 10×10px cells

### Mobile (< 768px)
- Sidebar: Off-canvas drawer (overlay)
- Main content: Full width, 16px margin
- Stat cards: 1 column (6×1 grid)
- Data table: Card view (stack rows as cards)
- Heatmap: Simplified to aggregated view (morning/afternoon/evening)

---

## 🎨 Page Designs

### 1. Dashboard (Homepage)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Breadcrumb: Dashboard                       │
├─────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─│
│ │Stat │ │Stat │ │Stat │ │Stat │ │Stat │ │S│
│ │Card1│ │Card2│ │Card3│ │Card4│ │Card5│ │C│
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─│
├─────────────────────────────────────────────┤
│ ┌───────────────┐  ┌──────────────────────┐│
│ │Recent Messages│  │Recent Tasks          ││
│ │               │  │                      ││
│ │ • Message 1   │  │ • Task 1             ││
│ │ • Message 2   │  │ • Task 2             ││
│ │ • Message 3   │  │ • Task 3             ││
│ │               │  │                      ││
│ │ View All →    │  │ View All →           ││
│ └───────────────┘  └──────────────────────┘│
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐  │
│ │ Message Activity Heatmap              │  │
│ │ ┌─────────────────────────────────┐   │  │
│ │ │         Mon Tue Wed Thu Fri Sat Sun │  │
│ │ │ 00:00   ▪ ▪ ▪ ▪ ▪ ▪ ▪           │  │
│ │ │ 01:00   ▪ ▪ ▪ ▪ ▪ ▪ ▪           │  │
│ │ │ ...                             │   │  │
│ │ │ Less ▪ ▪ ▪ ▪ More  (telegram)   │   │  │
│ │ └─────────────────────────────────┘   │  │
│ └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Key Improvements:**
- Remove breadcrumbs (single level page)
- Add "Quick Actions" section: "Import Messages", "Create Topic", "Run Analysis"
- Empty state: Show onboarding wizard modal on first visit
- Stat cards clickable with hover effect
- Heatmap with time range selector

---

### 2. Messages Page

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Messages                         [Theme Toggle]
├─────────────────────────────────────────────┤
│ [Search......] [Source▾] [Status▾] [Class▾]│
│                                             │
│ Selected: 3 items  [Delete] [Classify] [✓]  │
├─────────────────────────────────────────────┤
│ ┌─┬────────┬──────────┬────────┬──────────┐│
│ │☐│ Author │ Content  │ Source │ Status   ││
│ ├─┼────────┼──────────┼────────┼──────────┤│
│ │☑│ User A │ Message1 │[TG]    │[Pending] ││
│ │☑│ User B │ Message2 │[TG]    │[Active]  ││
│ │☐│ User C │ Message3 │[Email] │[Done]    ││
│ └─┴────────┴──────────┴────────┴──────────┘│
├─────────────────────────────────────────────┤
│ 3 of 150 selected    Rows: [25▾] Page 1/6  │
│                          [◄◄][◄][►][►►]    │
└─────────────────────────────────────────────┘
│ [+ Ingest Messages] (Floating Action Button)
```

**Key Improvements:**
- Floating action bar when items selected
- Primary action "Ingest Messages" → large primary button top-right OR FAB
- Filter dropdowns with count badges "(5)"
- Batch actions: Delete, Classify, Mark as Read
- Empty state: "No messages yet" + "Import from Telegram" CTA

---

### 3. Topics Page (Empty State)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Topics                                      │
│ Manage classification topics for tasks      │
├─────────────────────────────────────────────┤
│                                             │
│             ┌─────────────┐                 │
│             │   [Icon]    │                 │
│             │   64×64px   │                 │
│             └─────────────┘                 │
│                                             │
│          No topics found                    │
│                                             │
│   Create topics to organize your tasks      │
│   by category, project, or priority         │
│                                             │
│       ┌───────────────────────┐             │
│       │  + Create First Topic │             │
│       └───────────────────────┘             │
│                                             │
│            Learn more →                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Improvements:**
- Centered empty state with large icon
- Clear call-to-action
- Link to documentation

---

## 🎭 Interaction States

### Button States
- **Default**: Normal appearance
- **Hover**: Shadow increase, slight lift (-2px Y), brightness +5%
- **Pressed**: Shadow decrease, slight push (+1px Y), brightness -5%
- **Focus**: 2px ring, 4px offset, primary color
- **Disabled**: 50% opacity, cursor: not-allowed
- **Loading**: Spinner icon, text changes, disabled

### Card States
- **Default**: Elevation/md shadow
- **Hover**: Elevation/lg shadow, translateY(-2px), cursor: pointer
- **Active**: Border 2px solid primary, shadow remains
- **Loading**: Skeleton shimmer gradient animation

### Input States
- **Default**: 1px border, border/primary
- **Hover**: Border color darkens 10%
- **Focus**: 2px border, accent/primary, focus ring
- **Error**: 2px border, accent/error, error message below
- **Disabled**: 50% opacity, cursor: not-allowed
- **Success**: 2px border, accent/success, checkmark icon

---

## 📐 Layout Specifications

### Spacing System
- Page padding: 48px (desktop), 24px (tablet), 16px (mobile)
- Section gap: 32px
- Card gap: 24px (desktop), 16px (mobile)
- Component internal padding: 24px (large), 16px (medium), 12px (small)

### Typography Hierarchy
- Page title (H1): 1 per page, top-left
- Section headings (H3-H4): Introduce content blocks
- Body text: 16px minimum for readability
- Metadata: 12px minimum for accessibility

---

## ✅ Accessibility Checklist

### Color Contrast
- [ ] Text on backgrounds: ≥4.5:1 (normal), ≥3:1 (large 18px+)
- [ ] UI components: ≥3:1 contrast to adjacent colors
- [ ] Focus indicators: ≥3:1 to background
- [ ] Use contrast checker: Stark plugin or WebAIM

### Touch Targets
- [ ] All interactive elements: ≥44×44px (48×48px ideal)
- [ ] Spacing between targets: ≥8px
- [ ] Test on real mobile devices

### Keyboard Navigation
- [ ] All features accessible via keyboard only
- [ ] Visible focus indicators on all interactive elements
- [ ] Logical tab order (top→bottom, left→right)
- [ ] Skip-to-content link for screen readers
- [ ] Modal/dialog focus trapping

### Screen Reader
- [ ] Alt text on all images and icons
- [ ] ARIA labels on icon-only buttons
- [ ] Form labels properly associated
- [ ] Landmark regions (header, nav, main, aside, footer)
- [ ] Error messages announced

### Motion & Animation
- [ ] Respect prefers-reduced-motion
- [ ] Animations optional, not essential to understanding
- [ ] Transitions ≤350ms (avoid motion sickness)
- [ ] No auto-playing videos or carousels

---

## 🚀 Figma File Structure

### Recommended Page Organization

```
📄 Pulse Radar Dashboard Redesign
├─ 📄 Cover (Project overview, changelog)
├─ 📄 Design System
│  ├─ 🎨 Colors (Light + Dark mode variables)
│  ├─ 📝 Typography (All text styles)
│  ├─ ✨ Effects (Shadows, glows)
│  ├─ 🔲 Grids (Desktop, Tablet, Mobile)
│  └─ 📦 Spacing (Visual reference)
├─ 📄 Components/Atoms
│  ├─ Buttons (all variants)
│  ├─ Inputs
│  ├─ Badges
│  ├─ Icons
│  └─ Avatars
├─ 📄 Components/Molecules
│  ├─ Stat Cards
│  ├─ Table Rows
│  ├─ Navigation Items
│  └─ Empty States
├─ 📄 Components/Organisms
│  ├─ Sidebar Navigation
│  ├─ Data Table
│  ├─ Heatmap
│  └─ Modals
├─ 📄 Pages/Desktop (1440px)
│  ├─ Dashboard (with data)
│  ├─ Dashboard (empty state + wizard)
│  ├─ Messages
│  ├─ Topics
│  ├─ Tasks
│  ├─ Analysis Runs
│  └─ Proposals
├─ 📄 Pages/Tablet (768px)
│  └─ [Key pages responsive]
├─ 📄 Pages/Mobile (375px)
│  └─ [Key pages responsive]
├─ 📄 Flows (User journeys)
│  ├─ Onboarding wizard
│  ├─ Import messages flow
│  └─ Create agent flow
└─ 📄 Developer Handoff
   ├─ Component specs (measurements)
   ├─ Interaction states
   └─ Edge cases
```

---

## 🎯 Priority Pages to Design

### Phase 1 (MVP)
1. **Dashboard Homepage** (with and without data)
2. **Messages Page** (with bulk actions)
3. **Onboarding Wizard** (4-step flow)
4. **Component Library** (atoms + molecules)

### Phase 2 (Enhanced)
5. **Topics Page** (CRUD operations)
6. **Analysis Runs Page** (lifecycle visualization)
7. **Responsive Versions** (tablet, mobile)

### Phase 3 (Advanced)
8. **Settings Page**
9. **User Profile**
10. **Advanced filters and modals**

---

## 📝 Design Handoff Notes

### For Developers

**Component Implementation:**
- Use shadcn/ui as base (already in project)
- Extend with custom theming (theme.css variables)
- Ensure all components support light/dark mode
- Test keyboard navigation on every component
- Verify WCAG AA compliance with Lighthouse

**State Management:**
- Empty states: Show on data length === 0
- Loading states: Show during API calls
- Error states: Show on API failure, provide retry
- Success feedback: Toast notifications, not modals

**Performance:**
- Virtualize tables with >50 rows (react-window)
- Lazy load images and heavy components
- Debounce search inputs (300ms)
- Optimize re-renders (React.memo, useMemo)

**Testing:**
- Test all breakpoints: 375px, 768px, 1024px, 1440px, 1920px
- Test keyboard navigation (Tab, Shift+Tab, Enter, Esc)
- Test screen readers (VoiceOver on Mac, NVDA on Windows)
- Test color contrast with browser DevTools

---

## 🔗 Resources

**Design Tools:**
- Figma Community: Material Design 3 Kit
- Icons: Lucide Icons (lucide.dev)
- Illustrations: unDraw (undraw.co)
- Contrast Checker: WebAIM Contrast Checker

**Development:**
- shadcn/ui: ui.shadcn.com
- Tailwind CSS: tailwindcss.com
- Radix UI (primitives): radix-ui.com
- React Hook Form: react-hook-form.com

**Accessibility:**
- WCAG 2.1 Guidelines: w3.org/WAI/WCAG21
- ARIA Authoring Practices: w3.org/WAI/ARIA/apg
- Axe DevTools: deque.com/axe/devtools

---

**End of Figma Design Specification**

Next steps:
1. Create Figma file with this structure
2. Build component library (atoms → molecules → organisms)
3. Design key pages (dashboard, messages, onboarding)
4. Create interactive prototype
5. Conduct usability testing
6. Handoff to development team
