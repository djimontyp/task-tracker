# Quickstart: Telegram Integration UI

**Feature**: 004-telegram-integration-ui
**Date**: 2025-12-13

## Overview

Enhance the existing Telegram Integration UI with wizard flow, bot info display, and step-by-step instructions.

## Prerequisites

1. **Running Services**
   ```bash
   just services-dev  # Start all services with watch mode
   ```

2. **Storybook** (for component development)
   ```bash
   just storybook  # http://localhost:6006
   ```

3. **Understand Existing Code**
   - `frontend/src/pages/SettingsPage/plugins/TelegramSource/`
     - `TelegramCard.tsx` - Card in Sources tab
     - `TelegramSettingsSheet.tsx` - Configuration sheet
     - `useTelegramSettings.ts` - API integration hook

## Implementation Steps

### Step 1: Add HTTPS Validation (P1)

**File**: `useTelegramSettings.ts`

Add validation to `handleSetWebhook`:

```typescript
// In handleSetWebhook, after parsing baseUrl:
if (effectiveProtocol !== 'https') {
  toast.error('HTTPS is required for production webhooks')
  return
}
```

### Step 2: Create Instructions Component (P1)

**New File**: `components/InstructionsCard.tsx`

```tsx
import { Card } from '@/shared/ui/card'
import { MessageSquare, Bot, CheckCircle } from 'lucide-react'

const INSTRUCTIONS = [
  {
    icon: Bot,
    title: 'Add bot to channel',
    description: 'Add @PulseRadarBot as admin to your Telegram channel/group',
  },
  {
    icon: MessageSquare,
    title: 'Configure webhook',
    description: 'Enter your server URL to receive messages',
  },
  {
    icon: CheckCircle,
    title: 'Test connection',
    description: 'Send a test message to verify the integration',
  },
]

export function InstructionsCard() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">How to connect Telegram</h3>
      <ol className="space-y-4">
        {INSTRUCTIONS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{index + 1}</span>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                {step.title}
              </p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
```

### Step 3: Add Bot Username Display (P1)

**File**: `TelegramSettingsSheet.tsx`

Add bot info section after SheetHeader:

```tsx
const BOT_USERNAME = '@PulseRadarBot'

// In JSX, after SheetHeader:
<Card className="p-4 bg-muted/30 border-dashed">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <Bot className="h-5 w-5 text-primary" />
    </div>
    <div>
      <p className="font-medium">Pulse Radar Bot</p>
      <p className="text-sm text-muted-foreground">{BOT_USERNAME}</p>
    </div>
    <Button variant="ghost" size="sm" onClick={handleCopyBotUsername}>
      <Clipboard className="h-4 w-4" />
    </Button>
  </div>
</Card>
```

### Step 4: Integrate Instructions (P1)

**File**: `TelegramSettingsSheet.tsx`

Add InstructionsCard when not configured:

```tsx
import { InstructionsCard } from './components/InstructionsCard'

// In JSX, before webhook form when !isActive:
{!isActive && (
  <InstructionsCard />
)}
```

### Step 5: Add Wizard Flow (P2) - Optional

If implementing full wizard, add step navigation:

```tsx
const SETUP_STEPS = ['bot-info', 'webhook', 'verify'] as const
type SetupStep = typeof SETUP_STEPS[number]

const [currentStep, setCurrentStep] = useState<SetupStep>('bot-info')

// Progress indicator
<div className="flex items-center gap-2 mb-4">
  {SETUP_STEPS.map((step, index) => (
    <div
      key={step}
      className={cn(
        'h-2 flex-1 rounded-full',
        index <= SETUP_STEPS.indexOf(currentStep) ? 'bg-primary' : 'bg-muted'
      )}
    />
  ))}
</div>
```

## Testing Checklist

### Manual Testing

1. **First-time Setup Flow**
   - [ ] Open Settings → Sources → Telegram
   - [ ] See bot username displayed
   - [ ] See step-by-step instructions
   - [ ] Enter webhook URL
   - [ ] Verify HTTPS-only validation
   - [ ] Click "Update Webhook" → should succeed

2. **Returning User Flow**
   - [ ] Open Settings → Sources → Telegram (already configured)
   - [ ] See "Active" status badge
   - [ ] Groups list displays correctly
   - [ ] "Test Connection" button works

3. **Error Handling**
   - [ ] Enter HTTP URL → should show error
   - [ ] Enter invalid host → should show error from Telegram API
   - [ ] Disconnect while saving → should show retry message

### Unit Tests

Create `InstructionsCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { InstructionsCard } from './InstructionsCard'

describe('InstructionsCard', () => {
  it('renders all instruction steps', () => {
    render(<InstructionsCard />)
    expect(screen.getByText('Add bot to channel')).toBeInTheDocument()
    expect(screen.getByText('Configure webhook')).toBeInTheDocument()
    expect(screen.getByText('Test connection')).toBeInTheDocument()
  })

  it('displays bot username', () => {
    render(<InstructionsCard />)
    expect(screen.getByText('@PulseRadarBot')).toBeInTheDocument()
  })
})
```

### Storybook Stories

Create `TelegramSettingsSheet.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { InstructionsCard } from './components/InstructionsCard'

const meta: Meta<typeof InstructionsCard> = {
  title: 'Settings/Telegram/InstructionsCard',
  component: InstructionsCard,
  tags: ['autodocs'],
}
export default meta

export const Default: StoryObj<typeof InstructionsCard> = {}
```

## Verification Commands

```bash
# Type check
cd frontend && npx tsc --noEmit

# Run linter
just lint

# Run tests
just front-test

# Check Storybook coverage
just story-check
```

## Files Modified Summary

| File | Change |
|------|--------|
| `useTelegramSettings.ts` | Add HTTPS validation |
| `TelegramSettingsSheet.tsx` | Add bot info, integrate instructions |
| `components/InstructionsCard.tsx` | NEW - instructions component |
| `TelegramSettingsSheet.stories.tsx` | NEW - Storybook stories |

## Definition of Done

- [ ] Bot username (@PulseRadarBot) displayed in sheet
- [ ] Step-by-step instructions visible for first-time users
- [ ] HTTPS validation prevents HTTP webhooks
- [ ] Unit tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Storybook story created
- [ ] Manual testing completed on Chrome
