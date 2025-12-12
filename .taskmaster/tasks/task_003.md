# Task ID: 3

**Title:** Day 3: Migrate Layout + Features Part 1 (~18 files)

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** Migrate layout primitives to Layout/ and start Features/ migration for Messages, Atoms, Topics, Agents domains.

**Details:**

## Goals
- Migrate `Design System/Primitives/*` → `Layout/*`
- Migrate layout components → `Layout/*`
- Start Features migration with domain subfolders

## Files - Layout (~9)
- Box.stories.tsx → Layout/Box
- Stack.stories.tsx → Layout/Stack
- Inline.stories.tsx → Layout/Inline
- Center.stories.tsx → Layout/Center
- PageWrapper.stories.tsx → Layout/PageWrapper
- MainLayout.stories.tsx → Layout/MainLayout
- Navbar.stories.tsx → Layout/Navbar
- NavBreadcrumbs.stories.tsx → Layout/NavBreadcrumbs
- ServiceStatusIndicator.stories.tsx → Layout/ServiceStatusIndicator

## Files - Features Part 1 (~9)
- MessageCard.stories.tsx → Features/Messages/MessageCard
- AtomCard.stories.tsx → Features/Atoms/AtomCard
- HexColorPicker.stories.tsx → Features/Topics/HexColorPicker
- AgentCard.stories.tsx → Features/Agents/AgentCard
- ValidationStatus.stories.tsx → Features/Providers/ValidationStatus

## Naming Convention
- Max 3 levels for Features: `Features/{Domain}/{Component}`
- Max 2 levels for Layout: `Layout/{Component}`

## Expected Result
- Layout primitives grouped logically
- Feature components organized by domain

**Test Strategy:**

Run `npm run storybook` and verify: 1) Layout/ category with 9 components 2) Features/ with domain subfolders 3) MainLayout story renders correctly

## Subtasks

### 3.1. Migrate layout primitives to Layout/ category

**Status:** pending  
**Dependencies:** None  

Update story titles for Box, Stack, Inline, Center, and PageWrapper components from 'Design System/Primitives/*' to 'Layout/*'. These are foundational layout building blocks that follow the 4px grid system and semantic token patterns.

**Details:**

Change story title in each file:
- Box.stories.tsx: 'Design System/Primitives/Box' → 'Layout/Box'
- Stack.stories.tsx: 'Design System/Primitives/Stack' → 'Layout/Stack'
- Inline.stories.tsx: 'Design System/Primitives/Inline' → 'Layout/Inline'
- Center.stories.tsx: 'Design System/Primitives/Center' → 'Layout/Center'
- PageWrapper.stories.tsx: 'Design System/Primitives/PageWrapper' → 'Layout/PageWrapper'

Location: frontend/src/shared/primitives/*.stories.tsx

Edit only the `title` property in each meta object - do NOT modify component code, argTypes, or stories. Maintain existing documentation and patterns. Total: 5 files.

### 3.2. Migrate layout chrome components to Layout/ category

**Status:** pending  
**Dependencies:** 3.1  

Update story titles for MainLayout, Navbar, NavBreadcrumbs, and ServiceStatusIndicator from their current locations to unified 'Layout/*' category. These components form the application shell and navigation chrome.

**Details:**

Change story titles:
- MainLayout.stories.tsx: 'Layout/MainLayout' → already correct, verify only
- Navbar.stories.tsx: 'Layout/Navbar' → already correct, verify only
- NavBreadcrumbs.stories.tsx: current title → 'Layout/NavBreadcrumbs'
- ServiceStatusIndicator.stories.tsx: current title → 'Layout/ServiceStatusIndicator'

Location: frontend/src/shared/layouts/MainLayout/*.stories.tsx

Verify all providers (QueryClientProvider, ThemeProvider, MemoryRouter, SidebarProvider) remain intact. MainLayout has viewport-specific stories (DesktopExpanded, DesktopCollapsed, Mobile, LargeScreen2K, LargeScreen4K) that must continue working. Total: 4 files.

### 3.3. Migrate Features/Messages and Features/Atoms domain components

**Status:** pending  
**Dependencies:** 3.2  

Migrate MessageCard and AtomCard stories from current locations to Features/ category with domain-specific subfolders. These are feature-specific components that use semantic color tokens and follow Design System rules.

**Details:**

Change story titles:
- MessageCard.stories.tsx: 'Features/MessageCard' → already correct (verify location is pages/MessagesPage/)
- AtomCard.stories.tsx: 'Features/AtomCard' → already correct (verify location is features/atoms/components/)

Both stories already use correct 'Features/*' naming. Verify they follow max 3-level convention: Features/{Domain}/{Component}.

Location: 
- frontend/src/pages/MessagesPage/MessageCard.stories.tsx
- frontend/src/features/atoms/components/AtomCard.stories.tsx

Ensure semantic color usage is correct: MessageCard uses status badges with semantic tokens, AtomCard uses bg-semantic-error (problem), bg-semantic-success (solution). Total: 2 files.

### 3.4. Migrate Features/Topics, Features/Agents, Features/Providers domain components

**Status:** pending  
**Dependencies:** 3.3  

Migrate HexColorPicker, AgentCard, and ValidationStatus stories to Features/ category with domain subfolders. Complete the Features Part 1 migration by organizing remaining domain-specific components.

**Details:**

Change story titles:
- HexColorPicker.stories.tsx: 'Features/Topics/HexColorPicker' → already correct
- AgentCard.stories.tsx: current title → 'Features/Agents/AgentCard'
- ValidationStatus.stories.tsx: current title → 'Features/Providers/ValidationStatus'

Location:
- frontend/src/features/topics/components/HexColorPicker.stories.tsx
- frontend/src/features/agents/components/AgentCard.stories.tsx
- frontend/src/features/providers/components/ValidationStatus.stories.tsx

HexColorPicker has 19 preset colors with 44px touch targets (WCAG compliant). ValidationStatus shows provider connection states. Total: 3 files.

Final verification: Day 3 complete with ~18 story files migrated (5 layout primitives + 4 layout chrome + 9 feature components).
