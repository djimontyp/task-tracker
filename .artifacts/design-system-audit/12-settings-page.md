# Settings Page Design System Audit

**Дата:** 2025-12-05
**Компоненти:** SettingsPage, GeneralTab, ProvidersTab, PromptTuningTab, SourcesTab, SourceCard, TelegramSettingsSheet

---

## Executive Summary

Settings page демонструє **змішану якість** впровадження Design System:
- ✅ **Tabs component** — правильно використовує global Tabs з shadcn/ui
- ✅ **ProvidersTab** — зразкова responsive grid, правильні semantic tokens
- ⚠️ **GeneralTab** — raw колір warning (`border-semantic-warning/20`), непарні відступи
- ❌ **PromptTuningTab** — hardcoded inline styles, "warning" variant замість semantic
- ⚠️ **SourceCard** — status колір через conditional className (не semantic badge pattern)
- ✅ **TelegramSettingsSheet** — чудова форма з validation states, але validation colors inline

**Ключові проблеми:**
1. Непослідовне використання Badge variants (custom classes vs semantic)
2. Inline hardcoded кольори для validation states
3. Відсутність FormField pattern з shared/patterns
4. Mixing Grid + Card patterns замість CardWithStatus

---

## 1. Main SettingsPage (index.tsx)

### ✅ Strengths

**Tabs структура:**
```tsx
<Tabs defaultValue="general" className="w-full">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="sources">Sources</TabsTrigger>
    <TabsTrigger value="providers">Providers</TabsTrigger>
    {isAdminMode && <TabsTrigger value="prompts">Prompt Tuning</TabsTrigger>}
  </TabsList>
  <TabsContent value="general" className="space-y-4">
```

- ✅ Використовує global `@/shared/ui/tabs`
- ✅ Admin mode conditional tab (приховує Prompts для non-admin)
- ✅ Consistent spacing (`space-y-6`, `space-y-4`)

**PageHeader:**
```tsx
<PageHeader
  title="Settings"
  description="Configure application preferences and integrations"
/>
```
- ✅ Використовує shared PageHeader component
- ✅ Descriptive subtitle

### ⚠️ Issues

**Немає back navigation:**
- Інші pages мають breadcrumbs, Settings — ні
- Inconsistency з navigation patterns

---

## 2. GeneralTab Component

### ✅ Strengths

**Card structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Appearance</CardTitle>
    <CardDescription>Customize how the application looks</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
```

- ✅ Правильна Card композиція
- ✅ Semantic spacing (`space-y-4`, `space-y-6`)

**Theme RadioGroup:**
```tsx
<RadioGroup value={theme} onValueChange={setTheme}>
  {themeOptions.map(({ value, label }) => (
    <div key={value} className="flex items-center space-x-2">
      <RadioGroupItem value={value} id={`theme-${value}`} />
      <Label htmlFor={`theme-${value}`}>
```

- ✅ Accessibility (`htmlFor` linkage)
- ✅ Clean data-driven rendering

**Switch pattern:**
```tsx
<div className="flex items-center justify-between rounded-lg border p-4">
  <div className="space-y-0.5">
    <Label htmlFor="admin-mode">Enable Admin Mode</Label>
    <p className="text-sm text-muted-foreground">...</p>
  </div>
  <Switch id="admin-mode" checked={isAdminMode} />
</div>
```

- ✅ Standard list item pattern (label + description + control)
- ✅ Semantic tokens (`text-muted-foreground`)

### ❌ Issues

**1. Warning box з raw кольорами:**
```tsx
<div className="rounded-lg border border-semantic-warning/20 bg-semantic-warning/10 p-4">
```

**Проблема:** Використовує opacity modifiers `/20`, `/10` замість predefined semantic tokens.

**Має бути:**
```tsx
<Alert variant="warning">
  <AlertDescription>
    <strong>Keyboard shortcut:</strong> Press <Kbd>Cmd+Shift+A</Kbd>...
  </AlertDescription>
</Alert>
```

**2. Kbd component hardcoded:**
```tsx
<kbd className="px-2 py-2 text-xs font-semibold bg-background border border-border rounded">
```

**Має бути:** Окремий `Kbd` component у `shared/ui/` з semantic tokens.

**3. Непарний spacing:**
```tsx
<div className="space-y-0.5">  {/* ❌ 2px — не кратне 4px */}
```

**Має бути:**
```tsx
<div className="space-y-1">  {/* ✅ 4px */}
```

---

## 3. ProvidersTab Component

### ✅ Strengths (Зразковий приклад!)

**Responsive Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

- ✅ Mobile-first breakpoints
- ✅ Semantic gap (`gap-4` = 16px)

**Card hover effect:**
```tsx
<Card key={provider.id} className="hover:shadow-lg transition-shadow">
```

- ✅ Правильна інтерактивність

**Empty state:**
```tsx
<Card className="col-span-full">
  <CardContent className="py-8">
    <p className="text-center text-muted-foreground">
      No providers found. Create one to get started.
    </p>
  </CardContent>
</Card>
```

- ✅ Centered empty state
- ✅ Semantic foreground token

**Badge variants:**
```tsx
<Badge variant="outline">{provider.type}</Badge>
```

- ✅ Використовує predefined variant

**ValidationStatus component:**
```tsx
<ValidationStatus
  status={provider.validation_status}
  error={provider.validation_error}
/>
```

- ✅ Делегує до feature-specific component (encapsulation)

**Icon buttons:**
```tsx
<Button size="icon" variant="ghost" aria-label="Edit provider">
  <PencilIcon className="h-4 w-4" />
</Button>
```

- ✅ Accessibility (`aria-label`)
- ✅ Правильний розмір іконки (16px)

### ❌ Issues

**1. Active badge з inline кольорами:**
```tsx
<Badge
  variant="outline"
  className={provider.is_active
    ? 'bg-semantic-success text-white border-semantic-success'
    : 'bg-muted text-muted-foreground border-border'
  }
>
  {provider.is_active ? 'Yes' : 'No'}
</Badge>
```

**Проблема:**
- Hardcoded conditional classes замість semantic badge pattern
- "Yes/No" text не інформативний

**Має бути:**
```tsx
import { badges } from '@/shared/tokens';
<Badge className={provider.is_active ? badges.status.connected : badges.status.inactive}>
  {provider.is_active ? 'Active' : 'Inactive'}
</Badge>
```

**2. Polling з magic numbers:**
```tsx
refetchInterval: (query) => {
  const hasActiveValidation = query.state.data?.some(...)
  return hasActiveValidation ? 2000 : false  // ❌ Magic number
}
```

**Має бути:**
```tsx
const VALIDATION_POLL_INTERVAL_MS = 2000;
return hasActiveValidation ? VALIDATION_POLL_INTERVAL_MS : false
```

---

## 4. PromptTuningTab Component

### ✅ Strengths

**AdminFeatureBadge:**
```tsx
<div className="flex items-center">
  <CardTitle>LLM Prompt Tuning</CardTitle>
  <AdminFeatureBadge variant="inline" size="sm" />
</div>
```

- ✅ Правильне використання feature badge

**Select з descriptions:**
```tsx
<SelectItem key={type} value={type}>
  <div>
    <div className="font-medium">{PROMPT_TYPE_LABELS[type]}</div>
    <div className="text-xs text-muted-foreground">
      {PROMPT_TYPE_DESCRIPTIONS[type]}
    </div>
  </div>
</SelectItem>
```

- ✅ Rich dropdown options
- ✅ Semantic text colors

**Character counter:**
```tsx
<span className={`text-sm ${
  isWithinLimits ? 'text-muted-foreground' : 'text-destructive font-medium'
}`}>
  {charCount} / {CHARACTER_LIMITS.max} characters
</span>
```

- ✅ Dynamic validation feedback
- ✅ Semantic color (`text-destructive`)

**Validation errors display:**
```tsx
<div className="rounded-lg border border-destructive bg-destructive/10 p-4">
  <p className="text-sm font-medium text-destructive">Validation Errors:</p>
  <ul className="list-disc list-inside space-y-2">
    {validationErrors.map((error, idx) => (
      <li key={idx} className="text-sm text-destructive">{error.message}</li>
    ))}
  </ul>
</div>
```

- ✅ Семантичний destructive колір
- ✅ Accessibility (list structure)

**Required placeholders display:**
```tsx
<div className="rounded-lg border border-muted bg-muted/50 p-4">
  <p className="text-sm font-medium">Required Placeholders:</p>
  <div className="flex flex-wrap gap-2">
    {promptConfig.placeholders.map((placeholder) => (
      <Badge key={placeholder} variant="outline">{placeholder}</Badge>
    ))}
  </div>
</div>
```

- ✅ Info box styling
- ✅ Flex-wrap для багатьох badges

**AlertDialog для confirmations:**
```tsx
<AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Save Prompt Changes?</AlertDialogTitle>
```

- ✅ Використовує shadcn AlertDialog
- ✅ Controlled state

### ❌ Issues

**1. "Unsaved Changes" badge з non-semantic variant:**
```tsx
{isDirty && <Badge variant="warning">Unsaved Changes</Badge>}
```

**Проблема:** `variant="warning"` не існує в shadcn Badge API. Це custom variant або typo.

**Badge API (shadcn):**
- `default`, `secondary`, `destructive`, `outline`

**Має бути:**
```tsx
{isDirty && (
  <Badge variant="outline" className="border-semantic-warning text-semantic-warning">
    Unsaved Changes
  </Badge>
)}
```

**АБО** створити semantic warning badge в `shared/tokens/patterns.ts`:
```tsx
export const badges = {
  warning: 'border-semantic-warning text-semantic-warning bg-semantic-warning/10'
}
```

**2. Inline validation styles:**
```tsx
className={`text-sm ${
  isWithinLimits ? 'text-muted-foreground' : 'text-destructive font-medium'
}`}
```

**Має бути:** Utility function або component:
```tsx
// shared/utils/validation.ts
export const validationTextClass = (isValid: boolean) =>
  cn(isValid ? 'text-muted-foreground' : 'text-destructive font-medium')

// Usage
<span className={validationTextClass(isWithinLimits)}>
```

**3. Magic opacity `/10`, `/50`:**
```tsx
bg-destructive/10
bg-muted/50
```

**Має бути:** Predefined semantic tokens:
```tsx
// tailwind.config.js
colors: {
  'destructive-subtle': 'hsl(var(--destructive) / 0.1)',
  'muted-subtle': 'hsl(var(--muted) / 0.5)',
}
```

---

## 5. SourcesTab Component

### ✅ Strengths

**Clean delegation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {sourcePlugins.map((plugin) => {
    const CardComponent = plugin.CardComponent
    return <CardComponent key={plugin.id} />
  })}
</div>
```

- ✅ Plugin architecture (extensible)
- ✅ Responsive grid

### ⚠️ Issues

**Section header не в Card:**
```tsx
<div>
  <h2 className="text-lg font-semibold">Data Sources</h2>
  <p className="text-sm text-muted-foreground mt-2">...</p>
</div>
```

**Має бути:** Використати PageHeader pattern або Card wrapper для consistency.

---

## 6. SourceCard Component

### ✅ Strengths

**Icon display:**
```tsx
<div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
  <Icon className="h-6 w-6 text-primary" />
</div>
```

- ✅ Centered icon з semantic background
- ✅ Shrink-0 запобігає деформації

**Header layout:**
```tsx
<CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
```

- ✅ Horizontal flex layout
- ✅ Reset default spacing (`space-y-0`)

**Switch accessibility:**
```tsx
<Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${name}`} />
```

- ✅ Dynamic aria-label

**Hover effect:**
```tsx
<Card className="flex flex-col h-full hover:shadow-md transition-shadow">
```

- ✅ Interactive feedback

### ❌ Issues

**1. Status колір через conditional className:**
```tsx
const statusColors = {
  active: 'bg-status-connected',
  inactive: 'bg-muted-foreground',
  'not-configured': 'bg-status-pending',
} as const

<div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
```

**Проблема:**
- Status indicator — тільки колір (не WCAG compliant)
- Badge також має conditional classes

```tsx
<Badge
  variant="outline"
  className={`text-xs ${
    status === 'active' ? 'border-status-connected bg-status-connected/10 text-status-connected' :
    status === 'inactive' ? 'border-muted-foreground bg-muted text-muted-foreground' :
    status === 'not-configured' ? 'border-status-pending bg-status-pending/10 text-status-pending' : ''
  }`}
>
  {badgeText}
</Badge>
```

**Має бути:** Використати StatusBadge pattern:
```tsx
import { StatusBadge } from '@/shared/patterns';

<StatusBadge
  status={status === 'active' ? 'connected' : status === 'inactive' ? 'error' : 'pending'}
  label={badgeText}
/>
```

**2. Empty CardContent:**
```tsx
<CardContent className="flex-1 pb-4">
</CardContent>
```

**Питання:** Чому порожній CardContent? Якщо для spacing — краще через padding на CardFooter.

**3. Немає icon + text для status:**
```tsx
<div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
```

**WCAG violation:** Status індикатор тільки через колір.

**Має бути:**
```tsx
<div className="flex items-center gap-1.5">
  {status === 'active' && <CheckCircleIcon className="h-3.5 w-3.5 text-status-connected" />}
  {status === 'inactive' && <XCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />}
  {status === 'not-configured' && <ClockIcon className="h-3.5 w-3.5 text-status-pending" />}
  <Badge ...>{badgeText}</Badge>
</div>
```

---

## 7. TelegramSettingsSheet Component

### ✅ Strengths (Дуже добре!)

**Sheet accessibility:**
```tsx
<SheetContent className="sm:max-w-2xl overflow-y-auto" aria-describedby="telegram-sheet-description">
  <SheetHeader>
    <SheetTitle>Telegram Integration</SheetTitle>
  </SheetHeader>
  <p id="telegram-sheet-description" className="text-sm text-muted-foreground mt-2">
    Configure your Telegram bot webhook URL and manage monitored groups
  </p>
```

- ✅ `aria-describedby` linkage
- ✅ Responsive width (`sm:max-w-2xl`)
- ✅ Scroll для довгого контенту

**Status badge динаміка:**
```tsx
<Badge
  variant={isActive ? 'default' : 'secondary'}
  className={cn(
    'flex items-center gap-2',
    isActive && 'bg-status-connected hover:bg-status-connected/90 text-white border-status-connected'
  )}
>
  <div className={cn('h-2 w-2 rounded-full', isActive ? 'bg-white' : 'bg-muted-foreground')} />
  {isActive ? 'Active' : 'Inactive'}
</Badge>
```

- ✅ Icon + text (WCAG compliant)
- ✅ Conditional semantic colors
- ✅ Hover state

**Copy button з feedback:**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleCopyWebhookUrl}
  aria-label={copiedWebhookUrl ? 'Webhook URL copied' : 'Copy webhook URL to clipboard'}
  title={copiedWebhookUrl ? 'Copied!' : 'Copy to clipboard'}
>
  {copiedWebhookUrl ? (
    <CheckIcon className="h-4 w-4" />
  ) : (
    <ClipboardIcon className="h-4 w-4" />
  )}
</Button>
```

- ✅ Dynamic aria-label
- ✅ Icon swap для feedback

**Input з validation:**
```tsx
<Input
  id="new-group-id"
  placeholder="Paste group URL or enter -100XXXXXXXXX"
  value={newGroupId}
  onChange={(e) => handleGroupInputChange(e.target.value)}
  className={cn(
    'flex-1',
    inputValidation === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
    inputValidation === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
  )}
/>
{inputValidation === 'valid' && (
  <p className="text-xs text-semantic-success mt-2 flex items-center gap-2">
    <CheckIcon className="h-3 w-3" />
    Valid group ID
  </p>
)}
{inputValidation === 'invalid' && (
  <p className="text-xs text-semantic-error mt-2">
    Invalid format. Paste a Telegram group link or enter -100XXXXXXXXX
  </p>
)}
```

- ✅ Semantic validation colors
- ✅ Icon + text feedback
- ✅ Focus ring sync з border color

**Empty state:**
```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
    <ChatBubbleLeftRightIcon className="h-8 w-8 text-muted-foreground" />
  </div>
  <h4 className="text-sm font-medium text-foreground mb-2">No groups yet</h4>
  <p className="text-xs text-muted-foreground max-w-xs">
    Paste a Telegram group URL or enter a group ID to start monitoring messages
  </p>
</div>
```

- ✅ Centered з padding
- ✅ Icon в круглому background
- ✅ Semantic tokens

**Group Card:**
```tsx
<Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
  <div className="flex items-center gap-4">
    <div className="text-2xl shrink-0">🔵</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-sm font-medium text-foreground break-words">
          {group.name || `Group ${group.id}`}
        </p>
        {!group.name && (
          <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Active • Messages being monitored
      </p>
    </div>
```

- ✅ `min-w-0` для text truncation
- ✅ `break-words` для довгих назв
- ✅ Conditional badge для pending state

### ❌ Issues

**1. Validation colors inline:**
```tsx
inputValidation === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
inputValidation === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
```

**Має бути:** Predefined Input variants або FormField pattern:
```tsx
import { FormField } from '@/shared/patterns';

<FormField
  label="Telegram Group"
  error={inputValidation === 'invalid' ? 'Invalid format...' : undefined}
  success={inputValidation === 'valid' ? 'Valid group ID' : undefined}
>
  <Input ... />
</FormField>
```

**2. Magic emoji `🔵`:**
```tsx
<div className="text-2xl shrink-0">🔵</div>
```

**Має бути:** Icon component або dynamic icon based on group type.

**3. Gap непарний:**
```tsx
<div className="flex items-center gap-2 mb-0.5">  {/* ❌ mb-0.5 = 2px */}
```

**Має бути:**
```tsx
<div className="flex items-center gap-2 mb-1">  {/* ✅ mb-1 = 4px */}
```

---

## Comparison: SourceCard vs CardWithStatus Pattern

**SourceCard (current):**
```tsx
<Card className="flex flex-col h-full hover:shadow-md transition-shadow">
  <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
    <div className="h-12 w-12 bg-primary/10">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div className="flex-1">
      <h3>{name}</h3>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-status-connected" />
        <Badge ...>{statusLabel}</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent />
  <Separator />
  <CardFooter>
    <Button>Settings</Button>
    <Switch />
  </CardFooter>
</Card>
```

**CardWithStatus pattern (recommended):**
```tsx
import { CardWithStatus } from '@/shared/patterns';

<CardWithStatus
  icon={TelegramIcon}
  title="Telegram"
  description="Connect Telegram bot for message ingestion"
  status="connected"  // connected | pending | error
  statusLabel="Active"
  footer={
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" size="sm">Settings</Button>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  }
/>
```

**Переваги CardWithStatus:**
1. ✅ Status badge автоматично semantic (icon + text)
2. ✅ Consistent layout across app
3. ✅ Менше boilerplate коду
4. ✅ WCAG compliant out-of-the-box

**Міграція:**
1. Перевести SourceCard на CardWithStatus
2. Custom footer через render prop
3. Видалити SourceCard.tsx (reduce duplication)

---

## Form Patterns Inconsistency

**Проблема:** Кожен tab має свій підхід до forms:

### GeneralTab:
- Manual `<div className="flex items-center justify-between">`
- Hardcoded padding `p-4`

### ProvidersTab:
- Uses ProviderForm (dialog-based)
- Not visible in Settings tab (opens separately)

### PromptTuningTab:
- Manual layout з `<Label>` + validation feedback
- Inline validation styles

### TelegramSettingsSheet:
- Sheet-based form
- Best validation UX (success/error states)

**Рекомендація:** Використати FormField pattern скрізь:

```tsx
import { FormField, FormSection } from '@/shared/patterns';

// GeneralTab
<FormSection title="Appearance">
  <FormField label="Theme">
    <RadioGroup .../>
  </FormField>
</FormSection>

<FormSection title="Admin Settings">
  <FormField
    label="Enable Admin Mode"
    description="Show admin tools, bulk operations, and diagnostic features"
  >
    <Switch ... />
  </FormField>
</FormSection>

// PromptTuningTab
<FormField
  label="Prompt Text"
  error={!isWithinLimits ? 'Prompt must be 50-5000 characters' : undefined}
  description={`${charCount} / ${CHARACTER_LIMITS.max} characters`}
>
  <Textarea rows={12} ... />
</FormField>

// TelegramSettingsSheet
<FormField
  label="Telegram Group"
  error={inputValidation === 'invalid' ? 'Invalid format...' : undefined}
  success={inputValidation === 'valid' ? 'Valid group ID' : undefined}
>
  <Input ... />
</FormField>
```

**Переваги:**
1. ✅ Consistent layout (label, description, error, field)
2. ✅ Semantic validation colors built-in
3. ✅ Accessibility (label linkage)
4. ✅ Менше duplicated code

---

## Plugin Architecture Assessment

### SourcesTab Plugin System

**Registry pattern:**
```tsx
// plugins/registry.ts
export const sourcePlugins = [
  {
    id: 'telegram',
    CardComponent: TelegramSourceCard
  }
  // Extensible: add Slack, Discord, etc.
]

// SourcesTab
{sourcePlugins.map((plugin) => {
  const CardComponent = plugin.CardComponent
  return <CardComponent key={plugin.id} />
})}
```

**✅ Strengths:**
- Clean separation (each source = plugin)
- Easy to add new sources
- No hard dependencies

**⚠️ Potential improvements:**

**1. Type safety:**
```tsx
interface SourcePlugin {
  id: string;
  name: string;
  CardComponent: React.ComponentType;
  SettingsComponent?: React.ComponentType<{ open: boolean; onOpenChange: (open: boolean) => void }>;
}
```

**2. Lazy loading:**
```tsx
const sourcePlugins: SourcePlugin[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    CardComponent: lazy(() => import('./TelegramSource/TelegramSourceCard')),
    SettingsComponent: lazy(() => import('./TelegramSource/TelegramSettingsSheet')),
  }
]
```

**3. Plugin metadata:**
```tsx
{
  id: 'telegram',
  name: 'Telegram',
  description: 'Connect Telegram bot for message ingestion',
  icon: TelegramIcon,
  status: 'stable', // stable | beta | experimental
  requiredEnvVars: ['TELEGRAM_BOT_TOKEN'],
  CardComponent: ...
}
```

**4. Registry validation:**
```tsx
// Ensure all plugins have unique IDs
const pluginIds = new Set(sourcePlugins.map(p => p.id));
if (pluginIds.size !== sourcePlugins.length) {
  throw new Error('Duplicate plugin IDs detected');
}
```

---

## Recommendations

### Priority 1: Critical Fixes

1. **PromptTuningTab Badge variant:**
   ```diff
   - <Badge variant="warning">Unsaved Changes</Badge>
   + <Badge variant="outline" className="border-semantic-warning text-semantic-warning">
   ```

2. **SourceCard status indicator (WCAG):**
   ```diff
   - <div className="h-2 w-2 rounded-full bg-status-connected" />
   + <StatusBadge status="connected" label="Active" />
   ```

3. **GeneralTab spacing:**
   ```diff
   - <div className="space-y-0.5">
   + <div className="space-y-1">
   ```

### Priority 2: Pattern Adoption

1. **Migrate SourceCard → CardWithStatus:**
   - Use shared pattern
   - Remove custom conditional className logic
   - Automatic WCAG compliance

2. **Adopt FormField pattern:**
   - GeneralTab: wrap Switch in FormField
   - PromptTuningTab: use FormField for Textarea
   - TelegramSettingsSheet: use FormField for inputs

3. **Create Kbd component:**
   ```tsx
   // shared/ui/kbd.tsx
   export const Kbd = ({ children }: { children: React.ReactNode }) => (
     <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
       {children}
     </kbd>
   )
   ```

### Priority 3: Semantic Tokens

1. **Replace opacity modifiers:**
   ```diff
   - bg-semantic-warning/10
   + bg-semantic-warning-subtle  // Add to tailwind.config.js
   ```

2. **Extract validation utils:**
   ```tsx
   // shared/utils/validation.ts
   export const inputValidationClass = (state: 'valid' | 'invalid' | null) =>
     cn(
       state === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
       state === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
     )
   ```

3. **Magic numbers → constants:**
   ```tsx
   const VALIDATION_POLL_INTERVAL_MS = 2000;
   const MAX_POLLING_ATTEMPTS = 15;
   const POLLING_INTERVAL_MS = 1000;
   ```

### Priority 4: Architecture

1. **Plugin lazy loading:**
   - Reduce initial bundle size
   - Faster Settings page load

2. **Plugin metadata:**
   - Document required env vars
   - Status badges (stable/beta)
   - Prerequisites check

3. **FormSection component:**
   ```tsx
   <FormSection title="Appearance" description="Customize theme">
     <FormField .../>
     <FormField .../>
   </FormSection>
   ```

---

## Summary Table

| Component | Tabs | Card Patterns | Semantic Tokens | WCAG | Forms | Score |
|-----------|------|---------------|-----------------|------|-------|-------|
| **SettingsPage** | ✅ Good | ✅ Good | ✅ Good | ✅ Good | N/A | 4/4 |
| **GeneralTab** | N/A | ✅ Good | ⚠️ Raw warning | ⚠️ Spacing | ⚠️ Manual | 2/4 |
| **ProvidersTab** | N/A | ✅ Excellent | ⚠️ Active badge | ✅ Good | ✅ Dialog | 3.5/4 |
| **PromptTuningTab** | N/A | ✅ Good | ❌ Warning variant | ✅ Good | ⚠️ Manual | 2.5/4 |
| **SourcesTab** | N/A | ✅ Plugin | ✅ Good | N/A | N/A | 3/3 |
| **SourceCard** | N/A | ⚠️ Custom | ⚠️ Conditional | ❌ Color-only | N/A | 1.5/4 |
| **TelegramSheet** | N/A | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Excellent | 4/4 |

**Overall:** 20.5 / 31 (~66%) — **Needs improvement**

**Best practices:**
- TelegramSettingsSheet (4/4)
- ProvidersTab (3.5/4)
- SettingsPage structure (4/4)

**Worst offenders:**
- SourceCard (1.5/4) — WCAG + pattern issues
- PromptTuningTab (2.5/4) — variant + inline styles
- GeneralTab (2/4) — raw colors + spacing

---

## Action Items Checklist

**Code fixes (1-2 hours):**
- [ ] Fix PromptTuningTab Badge variant (`warning` → `outline` + semantic class)
- [ ] Replace SourceCard status dot з StatusBadge (icon + text)
- [ ] Fix GeneralTab spacing (`space-y-0.5` → `space-y-1`)
- [ ] Extract Kbd component
- [ ] Replace `/10`, `/20` opacity → semantic tokens

**Pattern adoption (2-4 hours):**
- [ ] Migrate SourceCard → CardWithStatus
- [ ] Wrap forms in FormField pattern (GeneralTab, PromptTuningTab)
- [ ] Create FormSection component
- [ ] Extract inputValidationClass utility

**Architecture (4-6 hours):**
- [ ] Add plugin lazy loading
- [ ] Plugin metadata (status, env vars)
- [ ] Registry validation (unique IDs)
- [ ] Document plugin creation guide

**Testing:**
- [ ] E2E: Settings tab navigation
- [ ] E2E: Provider card interactions
- [ ] E2E: Telegram sheet form validation
- [ ] Accessibility: keyboard navigation через tabs
- [ ] Accessibility: status indicators readable без color

---

**Next Steps:**
1. Prioritize TelegramSettingsSheet pattern adoption (it's the best example)
2. Create unified FormField pattern
3. Migrate all forms to consistent structure
4. Add Storybook stories for Settings components
