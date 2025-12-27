---
title: "Storybook"
created: 2025-12-27
tags:
  - storybook
  - components
  - документація
status: active
---

# Storybook

==Component library== з документацією та тестуванням.

> [!note] URL
> http://localhost:6006

## Команди

```bash
npm run storybook       # Dev mode
npm run build-storybook # Static build
npm run story:check     # Coverage audit
```

## Addons

| Addon | Призначення |
|-------|-------------|
| addon-docs | Autodocs з MDX |
| addon-themes | Dark mode toggle |
| addon-a11y | [[wcag\|WCAG]] тести |
| addon-vitest | Integration |

## Покриття

| Tier | Покриття |
|------|----------|
| Shared UI | 29/34 ✅ |
| Shared Components | 16/33 ⚠️ |
| [[patterns\|Patterns]] | 4/4 ✅ |

**Всього:** ==82 story файли==

## CSF3 формат

```tsx
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs']
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Click me' }
};
```

## Пов'язане

- [[storybook-mdx]] — документація
- [[patterns]] — composition stories
- [[eslint-правила]] — stories-require-autodocs
