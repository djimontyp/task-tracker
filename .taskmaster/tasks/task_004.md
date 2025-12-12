# Task ID: 4

**Title:** Day 4: Migrate Features Part 2 + Dashboard (~14 files)

**Status:** pending

**Dependencies:** 3

**Priority:** high

**Description:** Complete Features migration for Providers, Projects, Automation, Search domains. Migrate Pages/ to Features/Dashboard/.

**Details:**

## Goals
- Complete Features migration
- Move Pages/Dashboard/* → Features/Dashboard/*
- Remove Pages/ category entirely

## Files - Features Part 2 (~6)
- ProjectCard.stories.tsx → Features/Projects/ProjectCard
- ProjectForm.stories.tsx → Features/Projects/ProjectForm
- RuleActions.stories.tsx → Features/Automation/RuleActions
- RuleBasicInfo.stories.tsx → Features/Automation/RuleBasicInfo
- RuleConditions.stories.tsx → Features/Automation/RuleConditions
- SearchBar.stories.tsx → Features/Search/SearchBar

## Files - Dashboard (~4)
- DashboardMetrics.stories.tsx → Features/Dashboard/DashboardMetrics
- TrendsList.stories.tsx → Features/Dashboard/TrendsList
- TopTopics.stories.tsx → Features/Dashboard/TopTopics
- RecentInsights.stories.tsx → Features/Dashboard/RecentInsights

## Cleanup
- Remove `Automation/` top-level (now under Features/)
- Remove `Pages/` category entirely
- Verify no orphan stories

## Expected Result
- All feature components under Features/{Domain}/
- Clean 5-category sidebar: Docs, Primitives, Patterns, Layout, Features

**Test Strategy:**

Run `npm run storybook` and verify: 1) Only 5 top-level categories 2) All Dashboard components under Features/Dashboard/ 3) No Pages/ or Automation/ top-level

## Subtasks

### 4.1. Migrate Features/Projects and Features/Providers stories

**Status:** pending  
**Dependencies:** None  

Update title prefix for ProjectCard, ProjectForm from 'Features/ProjectCard' to 'Features/Projects/ProjectCard'. Verify SearchBar already uses correct 'Features/Search/SearchBar' pattern.

**Details:**

Files to update:
- frontend/src/features/projects/components/ProjectCard.stories.tsx: Change title from 'Features/ProjectCard' to 'Features/Projects/ProjectCard'
- frontend/src/features/projects/components/ProjectForm.stories.tsx: Change title from 'Features/ProjectForm' to 'Features/Projects/ProjectForm'
- frontend/src/features/providers/components/ValidationStatus.stories.tsx: Verify title is 'Features/Providers/ValidationStatus'
- frontend/src/features/search/components/SearchBar.stories.tsx: Already correct at 'Features/Search/SearchBar' - no changes needed

Pattern to follow: Only change the 'title' property in the meta object, do not modify component imports or code.

### 4.2. Migrate Automation stories from top-level to Features/Automation/

**Status:** pending  
**Dependencies:** 4.1  

Move RuleActions, RuleBasicInfo, RuleConditions from 'Automation/*' top-level category to 'Features/Automation/*' to consolidate all feature components under Features/.

**Details:**

Files to update:
- frontend/src/features/automation/components/RuleActions.stories.tsx: Change title from 'Automation/RuleActions' to 'Features/Automation/RuleActions'
- frontend/src/features/automation/components/RuleBasicInfo.stories.tsx: Change title from 'Automation/RuleBasicInfo' to 'Features/Automation/RuleBasicInfo'
- frontend/src/features/automation/components/RuleConditions.stories.tsx: Change title from 'Automation/RuleConditions' to 'Features/Automation/RuleConditions'

This removes the 'Automation/' top-level category and consolidates under Features/ as per the 5-category structure (Docs, Primitives, Patterns, Layout, Features).

### 4.3. Migrate Dashboard stories from Pages/ to Features/Dashboard/

**Status:** pending  
**Dependencies:** 4.2  

Move DashboardMetrics, TrendsList, TopTopics, RecentInsights from 'Pages/Dashboard/*' to 'Features/Dashboard/*' and remove Pages/ category entirely.

**Details:**

Files to update:
- frontend/src/pages/DashboardPage/components/DashboardMetrics.stories.tsx: Change title from 'Pages/Dashboard/DashboardMetrics' to 'Features/Dashboard/DashboardMetrics'
- frontend/src/pages/DashboardPage/components/TrendsList.stories.tsx: Change title from 'Pages/Dashboard/TrendsList' to 'Features/Dashboard/TrendsList'
- frontend/src/pages/DashboardPage/components/TopTopics.stories.tsx: Change title from 'Pages/Dashboard/TopTopics' to 'Features/Dashboard/TopTopics'
- frontend/src/pages/DashboardPage/components/RecentInsights.stories.tsx: Change title from 'Pages/Dashboard/RecentInsights' to 'Features/Dashboard/RecentInsights'

Final verification: Ensure no orphan stories remain under Pages/ or Automation/ top-level categories. The sidebar should show only 5 top-level categories: Docs, Primitives, Patterns, Layout, Features.
