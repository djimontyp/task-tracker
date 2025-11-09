# Validation Checklist - Navigation Fixes

## Pre-Deployment Validation

### Static Analysis ✅

- [x] **TypeScript Compilation**
  ```bash
  npx tsc --noEmit
  ```
  **Result**: ✅ No errors

- [x] **Import Resolution**
  - All new imports resolved correctly
  - Collapsible component imported from `@/shared/ui/collapsible`
  - ChevronRightIcon from `@heroicons/react/24/outline`

- [x] **Code Quality**
  - No TypeScript `any` types
  - All props properly typed
  - useState and useEffect dependencies correct

### Build Validation

- [ ] **Development Build**
  ```bash
  just services-dev dashboard
  ```
  **Expected**: No console errors, hot reload works

- [ ] **Production Build**
  ```bash
  cd frontend && npm run build
  ```
  **Expected**: Build successful, no warnings

## Runtime Testing

### Navigation Labels (Desktop)

**Main Sidebar**:
- [ ] Path `/` shows "Dashboard" (not "Overview")
- [ ] Path `/messages` shows "Messages"
- [ ] Path `/topics` shows "Topics"
- [ ] Path `/tasks` shows "Tasks"

**Automation Section**:
- [ ] Section header shows "Automation"
- [ ] Path `/automation/dashboard` shows "Overview" (not "Dashboard")
- [ ] Path `/automation/rules` shows "Rules"
- [ ] Path `/automation/scheduler` shows "Scheduler"
- [ ] Path `/automation/notifications` shows "Notifications"

**Other Sections**:
- [ ] No duplicate labels across entire sidebar
- [ ] All labels are clear and descriptive

### Breadcrumb Validation

**2-Level Pages**:
- [ ] `/` → Home > Dashboard
- [ ] `/messages` → Home > Messages
- [ ] `/topics` → Home > Topics
- [ ] `/analysis` → Home > Analysis Runs
- [ ] `/proposals` → Home > Task Proposals
- [ ] `/agents` → Home > Agents
- [ ] `/analytics` → Home > Analytics
- [ ] `/settings` → Home > Settings

**3-Level Pages (Automation)**:
- [ ] `/automation/dashboard` → Home > Automation > Overview
- [ ] `/automation/rules` → Home > Automation > Rules
- [ ] `/automation/scheduler` → Home > Automation > Scheduler
- [ ] `/automation/notifications` → Home > Automation > Notifications

**Dynamic Pages**:
- [ ] `/topics/{id}` → Home > Topics > {Topic Name}

### Collapsible Functionality

**Initial State**:
- [ ] Navigate to `/` - Automation section collapsed
- [ ] Navigate to `/messages` - Automation section collapsed
- [ ] Navigate to `/automation/dashboard` - Automation section expanded

**Click Interaction**:
- [ ] Click "Automation" header - section toggles open/close
- [ ] Chevron icon rotates 90° when opening
- [ ] Chevron icon rotates back when closing
- [ ] Animation is smooth (200ms)

**Auto-Expand Behavior**:
- [ ] On collapsed Automation, navigate to `/automation/rules` - section expands
- [ ] While expanded, navigate to `/messages` - section stays expanded (user control)
- [ ] Refresh page on `/automation/scheduler` - section auto-expands

**Visual Feedback**:
- [ ] Hover over "Automation" header shows `bg-accent/50`
- [ ] Transition is smooth
- [ ] No layout shift when expanding/collapsing

### Active State Highlighting

**Top-Level Pages**:
- [ ] Navigate to `/` - "Dashboard" highlighted
- [ ] Navigate to `/messages` - "Messages" highlighted
- [ ] Navigate to `/topics` - "Topics" highlighted

**Nested Pages**:
- [ ] Navigate to `/automation/dashboard` - "Overview" highlighted
- [ ] Navigate to `/automation/rules` - "Rules" highlighted
- [ ] Automation section auto-expanded

**Active Styling**:
- [ ] Active item has `bg-primary/10` background
- [ ] Active item has `text-primary` color
- [ ] Active item has `font-semibold` weight
- [ ] Badge on active item has `bg-primary` color

### Badge Tooltips

**Analysis Runs**:
- [ ] Badge shows count (e.g., "5")
- [ ] Hover shows tooltip: "X unclosed analysis run(s)"
- [ ] Singular form: "1 unclosed analysis run"
- [ ] Plural form: "5 unclosed analysis runs"

**Task Proposals**:
- [ ] Badge shows count (e.g., "12")
- [ ] Hover shows tooltip: "X proposal(s) awaiting review"
- [ ] Singular form: "1 proposal awaiting review"
- [ ] Plural form: "12 proposals awaiting review"

**Versions**:
- [ ] Badge shows count (e.g., "3")
- [ ] Hover shows detailed tooltip: "X versions awaiting approval (Y topics, Z atoms)"
- [ ] Example: "3 versions awaiting approval (2 topics, 1 atoms)"
- [ ] Click navigates to `/versions?status=pending`

**Badge Visibility**:
- [ ] Badges only show when count > 0
- [ ] Badges hide when count = 0
- [ ] No badges show "0"

## Mobile Testing (375px width)

### Sidebar Behavior
- [ ] Sidebar opens on mobile menu trigger
- [ ] Sidebar closes on backdrop click
- [ ] Sidebar closes when navigating to new page

### Collapsible on Mobile
- [ ] "Automation" header clickable on mobile
- [ ] Chevron visible and rotates
- [ ] Touch interaction smooth
- [ ] Auto-expand works on mobile

### Breadcrumbs on Mobile
- [ ] Breadcrumbs don't overflow
- [ ] Text truncates gracefully if needed
- [ ] Separator icons visible

### Touch Targets
- [ ] Navigation items have adequate touch area (min 44px height)
- [ ] Collapsible trigger easy to tap
- [ ] No accidental clicks

## Cross-Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android

### Issues to Check
- [ ] Chevron rotation animation works
- [ ] Collapsible transition smooth
- [ ] Active state styles render correctly
- [ ] Tooltips appear on hover

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through navigation items
- [ ] Enter/Space on "Automation" toggles collapse
- [ ] Arrow keys navigate items
- [ ] Focus visible on all interactive elements

### Screen Reader
- [ ] Sidebar announces "Navigation"
- [ ] Active item announced as "current page"
- [ ] Badge tooltips announced on focus
- [ ] Collapsible state announced (expanded/collapsed)

### Color Contrast
- [ ] Active item text meets WCAG AA (4.5:1)
- [ ] Badge text meets WCAG AA
- [ ] Hover states visible to colorblind users

## WebSocket Integration

### Real-Time Badge Updates
- [ ] Create new analysis run - badge count increments
- [ ] Close analysis run - badge count decrements
- [ ] Create proposal - proposals badge updates
- [ ] Approve version - versions badge decrements

### Sidebar Re-Render
- [ ] Badge updates don't cause full sidebar re-render
- [ ] Collapsible state persists during badge updates
- [ ] Active state persists during badge updates

## Performance Testing

### Initial Load
- [ ] Sidebar renders within 100ms
- [ ] No layout shift
- [ ] Auto-expand doesn't delay render

### Navigation Performance
- [ ] Route changes update breadcrumbs immediately
- [ ] Active state updates without flicker
- [ ] Auto-expand triggers smoothly

### Animation Performance
- [ ] Chevron rotation at 60fps
- [ ] Collapsible transition smooth (no jank)
- [ ] No performance issues with multiple rapid clicks

## Regression Testing

### Existing Features
- [ ] Theme toggle works
- [ ] User dropdown works
- [ ] Knowledge extraction dialog opens
- [ ] Settings navigation works
- [ ] Footer items work

### WebSocket Status
- [ ] Service status indicator updates
- [ ] Connection state shows correctly
- [ ] Reconnection works

### Other Components
- [ ] Data tables not affected
- [ ] Modals open/close correctly
- [ ] Toast notifications appear

## Edge Cases

### URL Edge Cases
- [ ] Direct navigation to `/automation/dashboard` - expands section
- [ ] Invalid route - shows fallback breadcrumb
- [ ] Route with query params - active state works
- [ ] Hash fragments - active state works

### State Edge Cases
- [ ] Collapse Automation, navigate away, navigate back - stays collapsed
- [ ] Expand Automation, navigate to automation route - stays expanded
- [ ] Refresh page on automation route - auto-expands

### Badge Edge Cases
- [ ] Count = 0 - badge hidden
- [ ] Count = 1 - singular tooltip
- [ ] Count = 999 - shows "999"
- [ ] Count = 1000 - shows "999+"

## Documentation Validation

- [x] README.md created
- [x] navigation-fixes.md created with technical details
- [x] validation-checklist.md (this file) created
- [ ] Feature 2 progress updated
- [ ] NEXT_SESSION_TODO.md updated (if applicable)

## Sign-Off

### Developer Checklist
- [x] Code follows TypeScript strict mode
- [x] All imports use absolute paths
- [x] No console.log statements
- [x] No commented-out code
- [x] Code formatted with Prettier

### QA Checklist
- [ ] All acceptance criteria met
- [ ] No regressions detected
- [ ] Performance acceptable
- [ ] Accessibility requirements met

### Deployment Checklist
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Ready for production

## Test Results

**Date Tested**: _____________
**Tested By**: _____________
**Browser**: _____________
**Device**: _____________

**Pass/Fail**: _____________

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
