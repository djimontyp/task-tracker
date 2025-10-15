# Settings Page - Pluggable Architecture

## Overview
Settings page with tab-based navigation and pluggable data source integrations.

## Structure

```
SettingsPage/
├── index.tsx                   # Main page with Tabs
├── components/
│   ├── GeneralTab.tsx         # Appearance settings
│   ├── SourcesTab.tsx         # Grid of source plugins
│   └── SourceCard.tsx         # Generic source card component
└── plugins/
    ├── registry.ts            # Plugin registration
    └── TelegramSource/
        ├── index.ts
        ├── TelegramCard.tsx           # Compact info card
        ├── TelegramSettingsSheet.tsx  # Full configuration
        └── useTelegramSettings.ts     # API logic hook
```

## Features

### General Tab
- Theme selection (Light/Dark/System)
- Uses existing `useTheme` hook

### Sources Tab
- Responsive grid layout (1/2/3 columns)
- Displays registered source plugins
- Each plugin renders its own card component

## Adding New Source Plugin

1. **Create plugin directory**:
   ```
   plugins/YourSource/
   ```

2. **Create components**:
   - `YourSourceCard.tsx` - Info card (uses SourceCard)
   - `YourSourceSettingsSheet.tsx` - Full settings UI
   - `useYourSourceSettings.ts` - API logic

3. **Register plugin** in `plugins/registry.ts`:
   ```typescript
   {
     id: 'your-source',
     name: 'Your Source',
     icon: YourIcon,
     description: 'Brief description',
     CardComponent: YourSourceCard,
   }
   ```

## SourceCard Props

```typescript
interface SourceCardProps {
  icon: ComponentType<{ className?: string }>
  name: string
  description: string
  status: 'active' | 'inactive' | 'not-configured'
  statusLabel?: string
  enabled: boolean
  onToggle: () => void
  onSettings: () => void
}
```

## Telegram Plugin Example

The Telegram plugin demonstrates:
- Custom hook for API logic (`useTelegramSettings`)
- Compact info card showing status and group count
- Sheet with full configuration (webhook + groups)
- All existing functionality preserved

## Design Principles

1. **Pluggable**: Easy to add new data sources
2. **Type-safe**: Full TypeScript support
3. **Accessible**: Proper ARIA attributes
4. **Responsive**: Mobile-first grid layout
5. **Clean**: No structural comments, self-documenting code
