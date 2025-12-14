# Implementation Plan: Telegram Integration UI

**Branch**: `004-telegram-integration-ui` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-telegram-integration-ui/spec.md`

## Summary

Enhance the existing Telegram Integration UI in Settings → Sources with missing features from US-033 requirements. The core functionality (webhook configuration, group management) already exists. This plan focuses on filling the gaps: wizard flow, bot info display, step-by-step instructions, last message timestamp, and channel message counts.

**Existing Implementation:**
- `TelegramCard.tsx` - Integration card in Sources tab
- `TelegramSettingsSheet.tsx` - Configuration sheet with webhook URL and group management
- `useTelegramSettings.ts` - Complete API hook with all backend integrations
- Backend API - Fully implemented (8 endpoints)

**Gap Analysis:**
| Requirement | Status | Gap |
|-------------|--------|-----|
| FR-001: Status display | DONE | - |
| FR-002: Configure webhook URL | DONE | - |
| FR-003: HTTPS validation | PARTIAL | Frontend validation needed |
| FR-004: Register webhook | DONE | - |
| FR-005: Bot username display | MISSING | Need to show @PulseRadarBot |
| FR-006: Error messages | DONE | - |
| FR-007: Persist configuration | DONE | - |
| FR-008: Test Connection | DONE | - |
| FR-009: Last message timestamp | MISSING | Need new API/UI |
| FR-010: Channel list with counts | MISSING | Groups shown but no counts |
| FR-011: Step-by-step instructions | MISSING | Need instructions component |

## Technical Context

**Language/Version**: TypeScript 5.9.3 (frontend)
**Primary Dependencies**: React 18.3.1, TanStack Query 5.90, shadcn/ui, Zustand 5.0
**Storage**: N/A (backend PostgreSQL already handles persistence)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (responsive, mobile-friendly)
**Project Type**: Web application (frontend enhancement)
**Performance Goals**: Page load <3s, API response <500ms
**Constraints**: Must integrate with existing TelegramSource plugin architecture
**Scale/Scope**: Single page enhancement (~5 components to modify/add)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Constitution template is not customized for this project. Using default gates:

| Gate | Status | Notes |
|------|--------|-------|
| Feature starts as standalone | PASS | Enhancement to existing feature module |
| Independently testable | PASS | Component tests + Storybook stories |
| Clear purpose | PASS | Close gaps in US-033 requirements |
| Type safety | PASS | TypeScript strict mode enforced |

## Project Structure

### Documentation (this feature)

```text
specs/004-telegram-integration-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output - gap analysis
├── data-model.md        # Phase 1 output - entity updates
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - API contracts (minimal - mostly exists)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/src/pages/SettingsPage/plugins/TelegramSource/
├── index.ts                      # Plugin registration (EXISTS)
├── TelegramCard.tsx              # Source card (EXISTS - minor updates)
├── TelegramSettingsSheet.tsx     # Configuration sheet (EXISTS - enhance)
├── useTelegramSettings.ts        # API hook (EXISTS - add features)
├── components/                   # NEW directory
│   ├── SetupWizard.tsx           # NEW - 3-step wizard
│   ├── BotInfoStep.tsx           # NEW - Bot info + instructions
│   ├── WebhookConfigStep.tsx     # NEW - Extracted from Sheet
│   ├── VerifyConnectionStep.tsx  # NEW - Connection verification
│   ├── ChannelList.tsx           # NEW - Channels with message counts
│   └── InstructionCard.tsx       # NEW - Step-by-step instructions
└── TelegramSettingsSheet.stories.tsx  # NEW - Storybook stories

frontend/src/shared/api/generated/webhook-settings/
└── webhook-settings.ts           # EXISTS - orval generated types
```

**Structure Decision**: Extend existing TelegramSource plugin with new components directory. Maintain plugin architecture pattern used by SettingsPage.

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Research Summary

### Research Items

1. **Backend API for bot info** - Does `/api/v1/webhook-settings/telegram/info` return bot_username?
2. **Message counts per source** - Does Sources table have message_count or need aggregation?
3. **Existing component patterns** - What wizard/stepper patterns exist in codebase?
4. **Design System compliance** - Confirm all new components use semantic tokens

### Findings

**See [research.md](./research.md) for full details**

| Research Item | Decision |
|---------------|----------|
| Bot username source | Frontend constant `@PulseRadarBot` |
| Message counts | Defer to P3 (needs backend aggregation) |
| Wizard pattern | Sheet-based (like existing TelegramSource) |
| Design System | Use semantic tokens, patterns from `@/shared` |

---

## Phase 1: Design Artifacts

### Data Model Updates

**See [data-model.md](./data-model.md)** - No backend changes needed. Uses existing `TelegramWebhookConfig` schema.

### API Contracts

**Existing endpoints (no changes needed):**
- `GET /api/v1/webhook-settings` - Returns TelegramWebhookConfig with groups
- `GET /api/v1/webhook-settings/telegram/info` - Returns Telegram API webhook info
- `POST /api/v1/webhook-settings/telegram/set` - Activates webhook

**New/Enhanced endpoints needed:**
- None - all required data available through existing endpoints

### Quickstart Guide

**See [quickstart.md](./quickstart.md)** - Step-by-step implementation guide with code samples.

---

## Implementation Scope

### Must Have (P1)

1. **Bot Info Display** - Show bot username from environment/config
2. **Step-by-step Instructions** - Clear guide for adding bot to channels
3. **HTTPS Validation** - Frontend validation before save

### Should Have (P2)

4. **Wizard Flow** - 3-step setup (Bot Info → Configure → Verify)
5. **Last Message Timestamp** - Display in channel list

### Could Have (P3)

6. **Channel Message Counts** - Aggregate and display message counts per channel

### Deferred

7. **Automatic channel detection** - Out of scope for this feature
