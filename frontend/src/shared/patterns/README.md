# Composition Patterns

Pre-built UI patterns for common use cases. These patterns combine design tokens with component composition to ensure consistency across the application.

## Installation

All patterns are available from `@/shared/patterns`:

```tsx
import {
  CardWithStatus,
  ListItemWithAvatar,
  FormField,
  EmptyState,
  StatusBadge,
} from '@/shared/patterns';
```

## Available Patterns

### 1. CardWithStatus

Card with icon, title, description, and status indicator. Used for entity displays like providers, sources, and agents.

```tsx
import { CardWithStatus, StatusBadge, StatusDot } from '@/shared/patterns';
import { Zap } from 'lucide-react';

// Full card
<CardWithStatus
  icon={Zap}
  title="OpenAI Provider"
  description="GPT-4 model access"
  status="connected"   // connected | validating | pending | error
  statusLabel="Active" // Optional custom label
  footer={<Button>Settings</Button>}
/>

// Standalone badge
<StatusBadge status="connected" label="Online" />

// Minimal dot indicator
<StatusDot status="validating" pulse />
```

**Variants:**
- `CardWithStatus` - Full card with icon, title, status badge
- `StatusBadge` - Standalone status badge (icon + text)
- `StatusDot` - Minimal dot indicator

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `icon` | ComponentType \| ReactNode | Icon component (e.g., from lucide-react) |
| `title` | string | Card title |
| `description` | string | Optional description |
| `status` | 'connected' \| 'validating' \| 'pending' \| 'error' | Current status |
| `statusLabel` | string | Custom status label (defaults to status name) |
| `footer` | ReactNode | Optional footer content |
| `children` | ReactNode | Optional body content |
| `interactive` | boolean | Enable hover/click effects |
| `onClick` | () => void | Click handler (requires `interactive`) |

---

### 2. ListItemWithAvatar

List item with avatar, title, subtitle, and optional trailing element. Used for user lists, message feeds, activity logs.

```tsx
import {
  ListItemWithAvatar,
  CompactListItem,
  ListContainer,
} from '@/shared/patterns';
import { Badge } from '@/shared/ui/badge';

// Full list item
<ListItemWithAvatar
  avatar={{ src: user.avatar, fallback: user.initials }}
  title={user.name}
  subtitle={user.email}
  meta={<Badge>Admin</Badge>}
  trailing={<span className="text-xs text-muted-foreground">2m ago</span>}
  onClick={() => selectUser(user.id)}
/>

// Compact variant (icon-based)
<CompactListItem
  icon={<MessageCircle className="h-4 w-4" />}
  title="New message"
  subtitle="2m ago"
  onClick={() => {}}
/>

// List container with dividers
<ListContainer divided>
  <ListItemWithAvatar {...props1} />
  <ListItemWithAvatar {...props2} />
</ListContainer>
```

**Variants:**
- `ListItemWithAvatar` - Full list item with avatar
- `CompactListItem` - Smaller, icon-based variant
- `ListItemWithBadge` - Avatar with badge overlay
- `ListContainer` - Wrapper with automatic dividers

**Props (ListItemWithAvatar):**
| Prop | Type | Description |
|------|------|-------------|
| `avatar` | { src?: string; fallback?: string } | Avatar configuration |
| `avatarSize` | 'sm' \| 'md' \| 'lg' \| 'xl' | Avatar size (default: 'md') |
| `title` | string | Main text |
| `subtitle` | string | Secondary text |
| `meta` | ReactNode | Metadata (badge, icon) next to title |
| `trailing` | ReactNode | Right-aligned content |
| `onClick` | () => void | Click handler (makes item interactive) |
| `highlighted` | boolean | Highlight background (e.g., unread) |

---

### 3. FormField

Form field wrapper with label, input, error message, and helper text. Works with any input component.

```tsx
import {
  FormField,
  InlineFormField,
  FormSection,
  FormActions,
  Fieldset,
} from '@/shared/patterns';
import { Input } from '@/shared/ui/input';

// Basic field
<FormField
  label="Email"
  id="email"
  required
  error={errors.email?.message}
  description="We'll never share your email"
>
  <Input id="email" type="email" {...register('email')} />
</FormField>

// Inline variant (label beside input)
<InlineFormField label="Name" id="name" labelWidth="w-40">
  <Input id="name" />
</InlineFormField>

// Form section (group of fields)
<FormSection title="Account Settings" description="Update your info">
  <FormField .../>
  <FormField .../>
</FormSection>

// Form actions (buttons)
<FormActions align="right">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</FormActions>

// Fieldset (bordered group)
<Fieldset legend="Contact Info">
  <FormField .../>
</Fieldset>
```

**Variants:**
- `FormField` - Standard vertical layout
- `InlineFormField` - Horizontal layout (label beside input)
- `FormSection` - Group with title/description
- `FormActions` - Button container with alignment
- `Fieldset` - Bordered group with legend

**Props (FormField):**
| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Field label |
| `id` | string | Input ID (for label association) |
| `required` | boolean | Show required indicator (*) |
| `error` | string | Error message |
| `description` | string | Helper text |
| `children` | ReactNode | Input element |
| `disabled` | boolean | Disable entire field |

---

### 4. EmptyState

Placeholder for empty lists, search results, or first-time user experiences.

```tsx
import { EmptyState, IllustratedEmptyState, LoadingEmptyState } from '@/shared/patterns';
import { Inbox } from 'lucide-react';
import { Button } from '@/shared/ui/button';

// Default empty state
<EmptyState
  icon={Inbox}
  title="No messages yet"
  description="Messages will appear here once you receive them"
  action={<Button>Add first message</Button>}
/>

// Card variant (with border)
<EmptyState
  variant="card"
  icon={Folder}
  title="No projects"
  description="Create your first project"
  action={<Button>Create Project</Button>}
/>

// Compact variant (smaller padding)
<EmptyState variant="compact" icon={Search} title="No results" />

// Inline variant (horizontal layout)
<EmptyState
  variant="inline"
  icon={MessageSquare}
  title="No comments"
  action={<Button size="sm">Add Comment</Button>}
/>

// With custom illustration
<IllustratedEmptyState
  illustration={<MyCustomSVG />}
  title="All done!"
  description="You've completed all tasks"
/>

// Loading skeleton
<LoadingEmptyState />
```

**Variants:**
- `EmptyState` - Default, card, compact, inline
- `IllustratedEmptyState` - Custom illustration support
- `LoadingEmptyState` - Skeleton placeholder

**Props (EmptyState):**
| Prop | Type | Description |
|------|------|-------------|
| `icon` | ComponentType | Icon component |
| `title` | string | Main message |
| `description` | string | Additional context |
| `action` | ReactNode | Action button |
| `variant` | 'default' \| 'card' \| 'compact' \| 'inline' | Visual style |
| `iconSize` | 'sm' \| 'md' \| 'lg' | Icon size |

---

## Design Tokens Integration

All patterns use design tokens from `@/shared/tokens`:

```tsx
// Patterns use these tokens internally:
import { badges, emptyState, forms, avatars } from '@/shared/tokens';

// Status colors
badges.status.connected  // "flex items-center gap-1.5 border-status-connected..."
badges.status.error      // "flex items-center gap-1.5 border-status-error..."

// Empty state layout
emptyState.container     // "flex flex-col items-center justify-center py-12..."
emptyState.icon          // "rounded-full bg-muted p-4 mb-4"

// Form patterns
forms.field              // "space-y-2"
forms.label.required     // "text-sm font-medium after:content-['*']..."
forms.error              // "text-xs text-destructive mt-1"
```

---

## Storybook

All patterns are documented in Storybook:

```bash
npm run storybook
# → http://localhost:6006

# Navigate to: Design System / Patterns
```

Each pattern has:
- Interactive playground
- Multiple variant examples
- Usage documentation
- Composition examples

---

## When to Use Patterns vs Raw Components

| Use Patterns When... | Use Raw Components When... |
|---------------------|---------------------------|
| Building standard UI (lists, cards, forms) | Need complete customization |
| Want consistent spacing/styling | Building one-off UI |
| Working with status indicators | Pattern doesn't fit use case |
| Need WCAG-compliant status display | |

---

## Contributing

When adding new patterns:

1. **Identify repetition** - Pattern should appear 3+ times in codebase
2. **Use tokens** - Import from `@/shared/tokens`, not hardcoded classes
3. **Add variants** - Support common variations (compact, inline, etc.)
4. **Create story** - Document all variants in Storybook
5. **Export properly** - Add to `index.ts` with types

Pattern files structure:
```
patterns/
├── CardWithStatus.tsx           # Main + helpers
├── CardWithStatus.stories.tsx   # Storybook
├── ListItemWithAvatar.tsx
├── ListItemWithAvatar.stories.tsx
├── FormField.tsx
├── FormField.stories.tsx
├── EmptyState.tsx
├── EmptyState.stories.tsx
├── index.ts                     # Central exports
└── README.md                    # This file
```
