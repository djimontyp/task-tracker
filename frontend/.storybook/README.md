# Storybook Configuration

> **Version:** Storybook 10.1.4
> **Framework:** React + Vite
> **URL:** http://localhost:6006

## Quick Start

```bash
# Start Storybook dev server
npm run storybook

# Build static Storybook (for deployment)
npm run build-storybook
```

## Why Storybook?

### For Developers
- **Component Catalog** — Browse all UI components in one place
- **Isolation Testing** — Test components without backend/API dependencies
- **Documentation** — Auto-generated docs from TypeScript props
- **Accessibility** — Built-in a11y testing with axe-core

### For AI Agents
- **Before coding** — Check existing components and patterns
- **Consistency** — Use existing variants instead of creating new ones
- **After coding** — Add stories for new components

## Configuration Files

| File | Purpose |
|------|---------|
| `main.ts` | Storybook config, addons, path aliases |
| `preview.tsx` | Global decorators, viewports, dark mode |

## Addons Installed

- **@storybook/addon-docs** — Auto-documentation
- **@storybook/addon-a11y** — Accessibility testing
- **@chromatic-com/storybook** — Visual regression (optional)
- **@storybook/addon-vitest** — Component testing

## Design System Integration

### Tailwind CSS
All stories use the same Tailwind config and CSS variables as the main app. Dark mode works via background toggle in Storybook toolbar.

### Semantic Tokens
Stories demonstrate correct usage of semantic tokens:
```tsx
// ✅ Correct
<Badge className="bg-semantic-success">

// ❌ Wrong
<Badge className="bg-green-500">
```

### Responsive Viewports
Pre-configured viewports match `tailwind.config.js`:
- **XS** — 375px (phones)
- **SM** — 640px (phones landscape)
- **MD** — 768px (tablets)
- **LG** — 1024px (laptops)
- **XL** — 1280px (desktops)
- **2XL** — 1536px (large screens)

## Writing Stories

### Basic Structure
```tsx
// component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './component';

const meta: Meta<typeof Component> = {
  title: 'Category/Component',  // Sidebar hierarchy
  component: Component,
  tags: ['autodocs'],           // Enable auto-docs
};
export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: { /* props */ },
};
```

### With Decorators
```tsx
export const WithTooltip: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};
```

### Interactive Stories
```tsx
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <Input value={value} onChange={e => setValue(e.target.value)} />;
  },
};
```

## Story Categories

| Category | Path | Components |
|----------|------|------------|
| **UI/Buttons** | `shared/ui/` | Button, Badge, Card |
| **UI/Form** | `shared/ui/` | Input, Textarea, Select, Checkbox... |
| **UI/Overlay** | `shared/ui/` | Dialog, Sheet, Popover, Tooltip... |
| **UI/Navigation** | `shared/ui/` | Tabs, Breadcrumb, Pagination... |
| **UI/Data** | `shared/ui/` | Table, Skeleton, Progress, Avatar... |
| **Components** | `shared/components/` | DataTable, MetricCard, PageHeader... |

## Best Practices

### DO
- Use `tags: ['autodocs']` for auto-documentation
- Include all variants and states
- Add accessibility notes in descriptions
- Show real-world usage examples
- Test in both light and dark modes

### DON'T
- Create stories for trivial components (Separator, Label)
- Duplicate stories across files
- Use hardcoded colors (use semantic tokens)
- Skip error/loading/empty states
- Use i18n keys (`labelKey`) — use direct `label` props instead

### i18n in Stories

Stories run in isolation without real translations. **Always use direct string props:**

```tsx
// ❌ Bad — labelKey won't be translated
const item = { labelKey: 'sidebar.dashboard', label: 'Dashboard' }

// ✅ Good — direct value always works
const item = { label: 'Dashboard' }
```

ESLint rule `stories-no-i18n-keys` enforces this automatically.

## Troubleshooting

### Stories not loading
```bash
# Clear cache and restart
rm -rf node_modules/.cache/storybook
npm run storybook
```

### Path aliases not working
Check that `main.ts` has correct viteFinal config with path aliases.

### Dark mode not working
Ensure `preview.tsx` imports `../src/index.css` for CSS variables.

## Resources

- [Storybook Docs](https://storybook.js.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Design System](../docs/design-system/)
