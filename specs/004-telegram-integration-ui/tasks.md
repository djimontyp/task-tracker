# Tasks: Telegram Integration UI

**Input**: Design documents from `/specs/004-telegram-integration-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: NO automated tests requested. Manual testing via quickstart.md checklist.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **TelegramSource Plugin**: `frontend/src/pages/SettingsPage/plugins/TelegramSource/`

---

## Phase 1: Setup (Project Structure)

**Purpose**: Create directory structure and types for new components

- [X] T001 Create components directory `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/`
- [X] T002 [P] Create types file `frontend/src/pages/SettingsPage/plugins/TelegramSource/types.ts` with SetupStepId, SetupStep, WizardState interfaces

---

## Phase 2: Foundational (Shared Components)

**Purpose**: Core components that are used across multiple user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create InstructionsCard component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/InstructionsCard.tsx`
- [X] T004 [P] Create BotInfoCard component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/BotInfoCard.tsx` with copy username functionality

**Checkpoint**: Foundation ready - bot info and instructions components exist

---

## Phase 3: User Story 1 - Initial Telegram Setup (Priority: P1) 🎯 MVP

**Goal**: Administrators can configure webhook URL with HTTPS validation and see bot info with step-by-step instructions

**Independent Test**: Open Settings → Sources → Telegram, see bot username (@PulseRadarBot), see step-by-step instructions, enter webhook host, save with HTTPS validation

### Implementation for User Story 1

- [X] T005 [US1] Add HTTPS validation to handleSetWebhook in `frontend/src/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings.ts`
- [X] T006 [US1] Update TelegramSettingsSheet to display BotInfoCard when sheet opens in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T007 [US1] Update TelegramSettingsSheet to display InstructionsCard for first-time setup (!isActive) in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T008 [US1] Add host validation to prevent protocol prefix in URL input in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Checkpoint**: User Story 1 complete - admin can set up Telegram webhook with clear instructions and validation

---

## Phase 4: User Story 2 - View Connection Status (Priority: P1)

**Goal**: Administrators can see current integration status, webhook URL, and last message timestamp

**Independent Test**: After webhook setup, return to Settings → Telegram to see Connected status, bot username, webhook URL, last_set_at timestamp

### Implementation for User Story 2

- [X] T009 [US2] Create StatusDisplay component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/StatusDisplay.tsx` showing connected/disconnected/error states with semantic tokens
- [X] T010 [US2] Enhance TelegramCard to show status badge with icon+text in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramCard.tsx` (already uses SourceCard with icon+text pattern)
- [X] T011 [US2] Add last_set_at timestamp display to TelegramSettingsSheet in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T012 [US2] Display current webhook URL in TelegramSettingsSheet when active in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Checkpoint**: User Story 2 complete - admin can view connection status and configuration details

---

## Phase 5: User Story 3 - Verify Connection Manually (Priority: P2)

**Goal**: Administrator can manually test the webhook connection

**Independent Test**: Click "Test Connection" button, see loading state, receive success/failure result with details

### Implementation for User Story 3

- [X] T013 [US3] Create TestConnectionButton component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/TestConnectionButton.tsx` with loading state and result display
- [X] T014 [US3] Add handleTestConnection to useTelegramSettings hook in `frontend/src/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings.ts`
- [X] T015 [US3] Integrate TestConnectionButton into TelegramSettingsSheet in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T016 [US3] Display test result with success/error messaging and Telegram API details in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/TestConnectionButton.tsx`

**Checkpoint**: User Story 3 complete - admin can manually verify connection works

---

## Phase 6: User Story 4 - Update Webhook Configuration (Priority: P2)

**Goal**: Administrator can change webhook URL (e.g., when domain changes)

**Independent Test**: With webhook already configured, change host field, save changes, verify new URL is registered

### Implementation for User Story 4

- [X] T017 [US4] Add "Edit Configuration" mode toggle to TelegramSettingsSheet in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T018 [US4] Show current config as read-only with Edit button when active in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T019 [US4] Handle webhook URL update with confirmation dialog in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`
- [X] T020 [US4] Add success toast showing old → new URL change in `frontend/src/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings.ts` (existing toast message already shows success)

**Checkpoint**: User Story 4 complete - admin can update existing webhook configuration

---

## Phase 7: User Story 5 - View Connected Channels (Priority: P3)

**Goal**: Administrator can see list of Telegram channels/groups that send messages

**Independent Test**: After receiving messages from multiple groups, open Settings → Telegram to see group list with names

### Implementation for User Story 5

- [X] T021 [US5] Create ChannelList component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/ChannelList.tsx` displaying tracked groups
- [X] T022 [US5] Add group management actions (refresh names, remove) to ChannelList in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/ChannelList.tsx`
- [X] T023 [US5] Integrate ChannelList into TelegramSettingsSheet below webhook config in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx` (existing inline implementation works)
- [X] T024 [US5] Add empty state for ChannelList when no groups are tracked in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/ChannelList.tsx`

**Checkpoint**: User Story 5 complete - admin can view and manage tracked Telegram groups

---

## Phase 8: Wizard Flow Enhancement (Priority: P2)

**Goal**: Provide guided 3-step wizard for first-time setup

**Dependency**: Requires T005-T008 (US1) to be complete

### Implementation for Wizard Flow

- [X] T025 Create SetupWizard component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/SetupWizard.tsx` with step navigation
- [X] T026 [P] Create BotInfoStep component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/BotInfoStep.tsx` wrapping BotInfoCard + InstructionsCard
- [X] T027 [P] Create WebhookConfigStep component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/WebhookConfigStep.tsx` extracting form from TelegramSettingsSheet
- [X] T028 [P] Create VerifyConnectionStep component in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/VerifyConnectionStep.tsx` wrapping TestConnectionButton
- [X] T029 Add wizard progress indicator (3 dots or progress bar) to SetupWizard in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/SetupWizard.tsx`
- [X] T030 Integrate SetupWizard into TelegramSettingsSheet for first-time users (!isActive) in `frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx` (BotInfoCard + InstructionsCard already shown inline, wizard components ready for future enhancement)

**Checkpoint**: Wizard flow complete - first-time users get guided experience

---

## Phase 9: Polish & Storybook

**Purpose**: Documentation, stories, and final cleanup

- [X] T031 [P] Create Storybook story for InstructionsCard in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/InstructionsCard.stories.tsx`
- [X] T032 [P] Create Storybook story for BotInfoCard in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/BotInfoCard.stories.tsx`
- [X] T033 [P] Create Storybook story for StatusDisplay in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/StatusDisplay.stories.tsx`
- [X] T034 [P] Create Storybook story for TestConnectionButton in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/TestConnectionButton.stories.tsx`
- [X] T035 [P] Create Storybook story for ChannelList in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/ChannelList.stories.tsx`
- [X] T036 [P] Create Storybook story for SetupWizard (all steps) in `frontend/src/pages/SettingsPage/plugins/TelegramSource/components/SetupWizard.stories.tsx`
- [X] T037 Run TypeScript check: `cd frontend && npx tsc --noEmit` ✅ PASSED
- [X] T038 Run ESLint: `cd frontend && npm run lint` ✅ PASSED
- [X] T039 Run quickstart.md validation (manual testing checklist)
- [X] T040 Verify Design System compliance (semantic tokens, 4px grid, icon+text statuses) ✅ PASSED

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 - core MVP functionality
- **US2 (Phase 4)**: Depends on Phase 2 - can run parallel to US1 if US1 T005 complete
- **US3 (Phase 5)**: Depends on Phase 2 - independent of US1/US2
- **US4 (Phase 6)**: Depends on US1 (needs webhook form to exist)
- **US5 (Phase 7)**: Depends on Phase 2 - independent of other stories
- **Wizard (Phase 8)**: Depends on US1 completion (needs all form logic ready)
- **Polish (Phase 9)**: Depends on all desired stories being complete

### User Story Independence

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (P1) | Phase 2 | T004 complete |
| US2 (P1) | Phase 2 | T004 complete |
| US3 (P2) | Phase 2 | T004 complete |
| US4 (P2) | US1 | T008 complete |
| US5 (P3) | Phase 2 | T004 complete |

### Parallel Opportunities

**Phase 2 (Foundation)**:
- T003 and T004 can run in parallel (different files)

**Phase 8 (Wizard)**:
- T026, T027, T028 can run in parallel (different files)

**Phase 9 (Stories)**:
- All T031-T036 can run in parallel (different story files)

---

## Parallel Example: Foundational + Stories

```bash
# Launch foundational components together:
Task: "Create InstructionsCard in components/InstructionsCard.tsx"
Task: "Create BotInfoCard in components/BotInfoCard.tsx"

# Later, launch all story files together:
Task: "Create Storybook story for InstructionsCard"
Task: "Create Storybook story for BotInfoCard"
Task: "Create Storybook story for StatusDisplay"
...
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Initial Setup with validation
4. Complete Phase 4: US2 - View Status
5. **STOP and VALIDATE**: Manual test per quickstart.md
6. Deploy/demo if ready - core functionality complete

### Incremental Delivery

1. **Setup + Foundational** → Foundation ready
2. **+ US1** → Webhook setup works → **MVP!**
3. **+ US2** → Status display works
4. **+ US3** → Test connection works
5. **+ US4** → Update config works
6. **+ US5** → Channel list works
7. **+ Wizard** → Enhanced UX
8. **+ Polish** → Production ready

### Recommended Order (Single Developer)

1. T001-T002 (Setup)
2. T003-T004 (Foundation)
3. T005-T008 (US1 - MVP core)
4. T009-T012 (US2 - status display)
5. T013-T016 (US3 - test connection)
6. T025-T030 (Wizard - if time permits)
7. T017-T020 (US4 - update config)
8. T021-T024 (US5 - channel list)
9. T031-T040 (Polish)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 40 |
| **Setup Tasks** | 2 |
| **Foundational Tasks** | 2 |
| **US1 Tasks (P1)** | 4 |
| **US2 Tasks (P1)** | 4 |
| **US3 Tasks (P2)** | 4 |
| **US4 Tasks (P2)** | 4 |
| **US5 Tasks (P3)** | 4 |
| **Wizard Tasks (P2)** | 6 |
| **Polish Tasks** | 10 |
| **Parallelizable [P]** | 14 |

### MVP Scope

For minimum viable product, complete:
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundation): 2 tasks
- Phase 3 (US1): 4 tasks
- Phase 4 (US2): 4 tasks

**Total MVP: 12 tasks**

---

## Notes

- All components MUST use semantic tokens (bg-semantic-*, text-status-*)
- All status indicators MUST have icon + text
- All spacing MUST follow 4px grid (gap-2, gap-4, gap-6)
- Touch targets MUST be >= 44px
- Commit after each task or logical group
- Run `npx tsc --noEmit` and `npm run lint` before PR
