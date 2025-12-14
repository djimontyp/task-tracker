# Research: Telegram Integration UI

**Feature**: 004-telegram-integration-ui
**Date**: 2025-12-13
**Status**: Complete

## Research Questions

### 1. Backend API for Bot Info

**Question**: Does `/api/v1/webhook-settings/telegram/info` return bot_username?

**Finding**: The `/api/v1/webhook-settings/telegram/info` endpoint calls Telegram's `getWebhookInfo` API which returns webhook URL and pending updates, but **does NOT include bot_username**.

**Decision**: Bot username should be sourced from:
- Environment variable `TELEGRAM_BOT_TOKEN` (format: `123456:ABC-DEF...`)
- Or added as a new field in backend config
- Or hardcoded as `@PulseRadarBot` since it's a known constant

**Rationale**: For MVP, hardcode bot username. It rarely changes and can be made configurable later.

**Alternatives Considered**:
1. ❌ Call `getMe` Telegram API - adds complexity, extra API call
2. ❌ Add to WebhookConfigResponse - requires backend change
3. ✅ Frontend constant - simple, works for MVP

---

### 2. Message Counts per Source

**Question**: Does Sources table have message_count or need aggregation?

**Finding**: Reviewed backend models. The `Source` model tracks `telegram_chat_id` and `name`, but does not have a `message_count` field. Messages are linked via `source_id` FK.

**Decision**: Message counts need aggregation query. Two options:
1. Add `message_count` to `/api/v1/webhook-settings` response
2. Frontend fetches counts via existing messages API

**Rationale**: Option 2 (frontend aggregation) avoids backend changes for MVP. Can optimize with backend aggregation in P3.

**Alternatives Considered**:
1. ❌ Backend aggregation in webhook-settings - requires backend change
2. ✅ Frontend counts via messages API - works with existing endpoints
3. ❌ Real-time counts via WebSocket - over-engineering for this feature

---

### 3. Existing Wizard/Stepper Patterns

**Question**: What wizard patterns exist in the codebase?

**Finding**: Two wizard implementations found:

| Pattern | Location | Structure |
|---------|----------|-----------|
| Dialog Wizard | `OnboardingWizard.tsx` | Dialog + Progress bar + step content |
| Page Wizard | `AutomationOnboardingWizard.tsx` | Full page + numbered steps + Card content |

**Decision**: Use Sheet-based wizard (hybrid approach) since TelegramSettingsSheet already uses Sheet component.

**Rationale**: Consistent with existing TelegramSource plugin. Users expect settings in a sheet, not a full page.

**Pattern to follow**:
```tsx
// Sheet with internal step navigation
const SETUP_STEPS = [
  { id: 'bot-info', title: 'Bot Info' },
  { id: 'webhook', title: 'Configure' },
  { id: 'verify', title: 'Verify' },
]

// Progress indicator
<Progress value={(currentStep + 1) / STEPS.length * 100} />

// Step navigation
<Button onClick={prevStep}>Back</Button>
<Button onClick={nextStep}>Continue</Button>
```

---

### 4. Design System Compliance

**Question**: Confirm all new components use semantic tokens.

**Finding**: Reviewed Design System requirements from CLAUDE.md:

| Requirement | Implementation |
|-------------|----------------|
| Colors | Use `bg-semantic-*`, `text-status-*`, not raw Tailwind |
| Spacing | Use 4px grid (gap-2, gap-4, gap-6) |
| Status | Icon + text, not color alone |
| Patterns | Use `FormField`, `CardWithStatus` from `@/shared/patterns` |

**Decision**: All new components will use:
- `@/shared/patterns` for FormField, EmptyState
- `@/shared/tokens` for semantic colors
- `lucide-react` for icons (MessageSquare, Check, AlertCircle, Bot)
- Status badges with icon + text per Design System

**Checklist for new components**:
- [ ] No raw Tailwind colors (bg-green-*, text-red-*)
- [ ] Spacing uses 4px grid
- [ ] Status indicators have icon + text
- [ ] Touch targets >= 44px
- [ ] aria-labels on icon buttons

---

## Scope Refinement

Based on research findings, refined implementation scope:

### P1 (Must Have)
1. **Bot Username Display** - Static constant `@PulseRadarBot` in UI
2. **Instructions Component** - Step-by-step guide using existing card pattern
3. **HTTPS Validation** - Frontend validation in useTelegramSettings hook

### P2 (Should Have)
4. **Wizard Flow** - Sheet-based 3-step wizard following AutomationWizard pattern
5. **Last Message Timestamp** - Fetch from `/api/v1/webhook-settings/telegram/info` (`last_error_date` available)

### P3 (Could Have)
6. **Channel Message Counts** - Frontend aggregation via messages API (defer to v2)

### Deferred
- Automatic channel detection
- Backend aggregation endpoints

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bot username source | Frontend constant | Simple, bot name rarely changes |
| Message counts | Defer to P3 | Requires API aggregation, not critical |
| Wizard pattern | Sheet-based | Consistent with existing TelegramSource plugin |
| Step navigation | Internal state | Like OnboardingWizard, not URL-based |
| Design System | Semantic tokens | Mandatory per CLAUDE.md |

---

## Implementation Notes

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `TelegramSettingsSheet.tsx` | MODIFY | Add wizard flow, bot info, instructions |
| `useTelegramSettings.ts` | MODIFY | Add HTTPS validation |
| `components/InstructionsCard.tsx` | NEW | Step-by-step instructions component |
| `TelegramSettingsSheet.stories.tsx` | NEW | Storybook stories |

### Dependencies
- No new npm packages needed
- No backend changes required for P1
- All components use existing shadcn/ui primitives

---

**Next Step**: Generate data-model.md and quickstart.md
