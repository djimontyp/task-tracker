# UX/UI Improvements Checklist

**Track progress:** Check off items as you implement fixes

---

## Week 1: Critical Fixes 🔴

### Accessibility (WCAG 2.1)

#### Color Contrast
- [ ] Update `--muted-foreground` in `/frontend/src/index.css:19` from `0 0% 20%` to `0 0% 35%`
- [ ] Test contrast ratio with Chrome DevTools (target: ≥4.5:1)
- [ ] Verify text readability on light theme across all pages

#### Touch Targets
- [ ] Update button sizes in `/frontend/src/shared/ui/button.tsx`:
  - [ ] Default: `h-[44px]` (currently 42px)
  - [ ] Small: `h-[40px]` (currently 36px)
  - [ ] Icon: `h-[44px] w-[44px]` (currently 36x36px)
- [ ] Audit checkboxes (need min 20x20px with 12px padding)
- [ ] Fix theme toggle button in Header (currently ~30x30px)
- [ ] Update color picker trigger size in TopicsPage

#### Keyboard Navigation
- [ ] Add `onClick` handler to Recent Messages cards in `/frontend/src/pages/DashboardPage/index.tsx:258-266`
- [ ] Test Tab navigation through entire Dashboard
- [ ] Verify Enter/Space keys work on all buttons
- [ ] Test dropdown menus with keyboard (Arrow keys, Enter, Esc)
- [ ] Add skip navigation link ("Skip to main content")

#### ARIA Labels
- [ ] Theme toggle button (`/frontend/src/shared/layouts/MainLayout/Header.tsx:133`)
- [ ] Dropdown menu triggers in Messages table columns
- [ ] Color picker popover in TopicsPage
- [ ] Info circle icons in CreateRunModal tooltips
- [ ] Pagination buttons (Previous/Next)
- [ ] Search input fields (all pages)
- [ ] Filter buttons in DataTableToolbar

#### Focus Indicators
- [ ] Update Input focus ring: `ring-2 ring-primary` (currently `ring-1 ring-primary/80`)
- [ ] Add focus state to Topic cards (currently only hover)
- [ ] Verify focus visible on all interactive elements
- [ ] Test with keyboard navigation (no mouse)

---

### Mobile Experience

#### DataTable Alternative
- [ ] Create `MobileMessageCard` component in `/frontend/src/pages/MessagesPage/`
- [ ] Implement responsive logic: Table (≥768px) / Cards (<768px)
- [ ] Show 5 key fields: Author, Content, Importance, Date, Actions
- [ ] Add expand/collapse for full details
- [ ] Test on iPhone 12 (390px) and Android (360px)

#### Dashboard Layout
- [ ] Split metrics grid:
  - [ ] Primary group (3 metrics): `grid-cols-1 md:grid-cols-3 gap-6`
  - [ ] Secondary group (3 metrics): `grid-cols-2 lg:grid-cols-3 gap-4`
- [ ] Test on mobile devices (check spacing, readability)
- [ ] Verify tap targets on metric cards

---

## Week 2: High Priority 🟡

### User Flows

#### Quick Analysis Presets
- [ ] Add preset buttons to CreateRunModal (`/frontend/src/features/analysis/components/CreateRunModal.tsx`):
  - [ ] "Last 24 hours" button
  - [ ] "Last 7 days" button
  - [ ] "Last 30 days" button
  - [ ] "Custom" (show TimeWindowSelector)
- [ ] Set "Last 24 hours" as default
- [ ] Hide TimeWindowSelector until "Custom" selected

#### Smart Agent Defaults
- [ ] Add `is_recommended` flag to Agent Assignment API
- [ ] Show "Recommended" badge in dropdown
- [ ] Pre-select recommended agent on modal open
- [ ] Add tooltip explaining why agent recommended

---

### Navigation

#### Sidebar Simplification
- [ ] Reduce nav groups from 5 to 3 in `/frontend/src/shared/components/AppSidebar.tsx`:
  - [ ] **Workspace** (5 items): Dashboard, Messages, Topics, Tasks, Analytics
  - [ ] **AI Analysis** (3 items): Analysis Runs, Proposals, Agents
  - [ ] **Settings** (2 items): Providers, Projects
- [ ] Move "Automation" to Settings as tab (currently not implemented)
- [ ] Hide "Noise Filtering", "Versions", "Task Monitoring" in "Advanced" menu
- [ ] Update navigation total from 17 to 10 items

---

### Topic Management

#### Bulk Operations
- [ ] Add multi-select checkboxes to TopicsPage
- [ ] Create bulk actions toolbar (appears when items selected):
  - [ ] Change Color (batch update)
  - [ ] Merge Topics
  - [ ] Delete Selected
- [ ] Add keyboard shortcuts (Cmd/Ctrl+A for select all)
- [ ] Test with 50+ topics

---

### Error Handling

#### User-Friendly Messages
- [ ] Create `ErrorState` component with structure:
  - [ ] User-friendly title
  - [ ] Actionable description
  - [ ] Retry button
  - [ ] Technical details (collapsed <details>)
- [ ] Replace generic error in TopicsPage (`/frontend/src/pages/TopicsPage/index.tsx:137-152`)
- [ ] Update AnalysisRunsPage error state
- [ ] Add error recovery in all data-fetching pages

#### Actionable Toasts
- [ ] Update toast messages in AnalysisRunsPage:
  - [ ] "Created" → include message count + View button
  - [ ] "Failed" → explain reason + Adjust dates button
- [ ] Add success toast action: `onClick: () => navigate()`
- [ ] Include progress description when appropriate

---

## Week 3-4: Enhancements 🟢

### Visual Design

#### Topic Cards Color Emphasis
- [ ] Add left border accent: `border-l-4` with topic color
- [ ] Add subtle background tint (5% opacity of topic color)
- [ ] Update heading color to match topic color
- [ ] Test color blindness accessibility

#### Metric Cards Size Variants
- [ ] Add `size` prop to MetricCard component:
  - [ ] `hero` (2x2 grid cells, large text)
  - [ ] `primary` (default, 1x1)
  - [ ] `secondary` (smaller, compact)
- [ ] Apply to Dashboard: Success Rate = hero, others = primary/secondary

#### Content-Aware Skeletons
- [ ] Create `MetricCard.Skeleton` with icon, value, trend placeholders
- [ ] Update Recent Messages skeleton to match card structure
- [ ] Ensure no layout shift on load

---

### Forms

#### Inline Validation
- [ ] Add real-time validation to CreateRunModal:
  - [ ] Time window: "Please select a time range"
  - [ ] Agent: "Please select an agent"
- [ ] Show validation on blur, not on every keystroke
- [ ] Display error message below field (red text)
- [ ] Disable submit button until valid

#### Better Labels
- [ ] Change "When should we analyze?" → "Which messages to analyze?"
- [ ] Add helper text under labels explaining field purpose
- [ ] Mark required fields with explanation at form top

---

### Navigation

#### Auto-Generated Breadcrumbs
- [ ] Create route config in `/frontend/src/app/routes.tsx`
- [ ] Add `breadcrumb` property to each route
- [ ] Update Header to use `generateBreadcrumbsFromRoute()`
- [ ] Remove hardcoded breadcrumbMap

---

## Testing & Validation

### Automated Tests
- [ ] Run Lighthouse accessibility audit (target: 95+)
- [ ] Check WAVE (WebAIM) for violations (target: 0 errors)
- [ ] Verify color contrast with Chrome DevTools
- [ ] Test responsive breakpoints (320px → 1920px)

### Manual Tests
- [ ] Complete keyboard navigation (Tab through all pages, no mouse)
- [ ] Test with NVDA or JAWS screen reader
- [ ] Verify on real iPhone (Safari)
- [ ] Verify on real Android device (Chrome)
- [ ] Test forms on mobile (check if keyboard covers inputs)

### User Testing
- [ ] Onboarding flow: new user 0→first analysis (target: <5 min)
- [ ] Time to create analysis run (target: <1 min)
- [ ] Error recovery test (fail → retry → success)
- [ ] Mobile session duration (target: -10% vs desktop, not -40%)

---

## Metrics Tracking

### Before Implementation (Baseline)
- [ ] Record Lighthouse accessibility score: ____
- [ ] Measure task completion rate (analytics): ____%
- [ ] Survey mobile satisfaction (NPS): ____/5
- [ ] Count WCAG violations (WAVE): ____

### After Implementation (Target)
- [ ] Lighthouse accessibility: 95+
- [ ] Task completion: 85%+
- [ ] Mobile NPS: 4.5/5
- [ ] WCAG violations: 0 critical

---

## Documentation

- [ ] Update CHANGELOG.md with accessibility improvements
- [ ] Add accessibility section to README.md
- [ ] Document keyboard shortcuts in user guide
- [ ] Create mobile design guidelines doc
- [ ] Update component library with ARIA examples

---

**Progress Tracking:**
- Total items: 80+
- Completed: __ / 80
- Current phase: Week ___
- Estimated completion: ________

**Notes:**
Use this checklist as daily TODO list. Check off items as completed. Update metrics weekly.
