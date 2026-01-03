# Card Layout Patterns

This document describes the card layout patterns introduced to solve common UI issues like:
- Too many action buttons competing for space
- Truncated titles without tooltips
- Poor visual hierarchy in key-value displays

## Components Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| `TruncatedText` | `@/shared/ui` | Text with auto-tooltip on overflow |
| `CardHeaderWithActions` | `@/shared/ui` | Card header with layout variants |
| `DataList` | `@/shared/patterns` | Semantic key-value display |
| `CardActions` | `@/shared/patterns` | Responsive action buttons |

## TruncatedText

Auto-adds tooltip when text is actually truncated.

```tsx
import { TruncatedText, TruncatedTitle } from '@/shared/ui';

// Single line with tooltip
<TruncatedText text="Very long title that will be truncated" />

// Multi-line (2 or 3 lines)
<TruncatedText text="Long description..." lines={2} />

// As heading
<TruncatedTitle text="Card Title" level="h3" />
```

## CardHeaderWithActions

Three layout strategies for action buttons:

### Inline Layout (1-2 actions)
```tsx
import { CardHeaderWithActions } from '@/shared/ui';

<CardHeaderWithActions
  title="Agent Configuration"
  description="Configure AI settings"
  layout="inline"
  actions={
    <>
      <Button variant="ghost" size="icon" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  }
/>
```

### Stacked Layout (many actions)
```tsx
<CardHeaderWithActions
  title="Knowledge Extraction"
  layout="stacked"
  actions={
    <>
      <Button variant="outline" size="sm">Edit</Button>
      <Button variant="outline" size="sm">Copy</Button>
      <Button variant="outline" size="sm">Configure</Button>
      <Button variant="outline" size="sm">Test</Button>
      <Button variant="destructive" size="sm">Delete</Button>
    </>
  }
/>
```

### Dropdown Layout (compact)
```tsx
<CardHeaderWithActions
  title="GPT-4 Agent"
  layout="dropdown"
  icon={<Bot className="h-5 w-5" />}
  badge={<Badge>Active</Badge>}
  dropdownActions={[
    { label: 'Edit', icon: Pencil, onClick: handleEdit },
    { label: 'Copy', icon: Copy, onClick: handleCopy },
    { label: 'Settings', icon: Settings, onClick: handleSettings },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive', separatorBefore: true },
  ]}
/>
```

## DataList

Semantic HTML (dl/dt/dd) for key-value pairs:

```tsx
import { DataList, KeyValueGrid, StatGrid } from '@/shared/patterns';

// Basic usage
<DataList
  columns={2}
  density="compact"
  items={[
    { label: 'Model', value: 'gpt-4o' },
    { label: 'Temperature', value: '0.7' },
    { label: 'Status', value: <Badge>Active</Badge> },
    { label: 'Created', value: 'Jan 15, 2024', icon: <Calendar /> },
  ]}
/>

// Simple key-value grid
<KeyValueGrid
  data={{
    Model: 'gpt-4o',
    Temperature: 0.7,
    MaxTokens: 4096,
  }}
/>

// Stats display
<StatGrid
  columns={3}
  stats={[
    { label: 'Total Messages', value: '12,345' },
    { label: 'Processed', value: '11,890', description: '+234 today' },
    { label: 'Pending', value: '455' },
  ]}
/>
```

## CardActions

Responsive action buttons that collapse on mobile:

```tsx
import { CardActions, IconButtonGroup, ResponsiveActions } from '@/shared/patterns';

// Primary + secondary with auto-collapse
<CardActions
  primary={<Button>Save</Button>}
  secondary={[
    <Button key="1" variant="outline">Cancel</Button>,
  ]}
  dropdownItems={[
    { label: 'Export', onClick: handleExport },
    { label: 'Delete', onClick: handleDelete, variant: 'destructive' },
  ]}
/>

// Icon buttons with tooltips
<IconButtonGroup
  actions={[
    { icon: Pencil, label: 'Edit', onClick: handleEdit },
    { icon: Copy, label: 'Copy', onClick: handleCopy },
    { icon: Trash2, label: 'Delete', onClick: handleDelete, variant: 'destructive' },
  ]}
/>

// Responsive actions (collapse at breakpoint)
<ResponsiveActions
  visible={[
    { icon: Pencil, label: 'Edit', onClick: handleEdit },
  ]}
  collapsed={[
    { label: 'Copy', icon: Copy, onClick: handleCopy },
    { label: 'Settings', icon: Settings, onClick: handleSettings },
    { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
  ]}
  collapseAt="md"
/>
```

---

## Migration Guide: AgentCard

### Before

```tsx
// Problem: 5 icon buttons compete with title
<Card>
  <CardContent className="pt-6">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
        {agent.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {agent.description}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" onClick={() => onEdit(agent)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onCopy(agent)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onManageTasks(agent)}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onTest(agent)}>
          <TestTube2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(agent.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-foreground">Model</span>
        <p className="font-mono text-xs truncate">{agent.model_name}</p>
      </div>
      {/* ... more fields */}
    </div>
  </CardContent>
</Card>
```

### After

```tsx
import { Card, CardContent, CardHeaderWithActions } from '@/shared/ui';
import { DataList } from '@/shared/patterns';

<Card>
  <CardHeaderWithActions
    title={agent.name}
    description={agent.description}
    layout="dropdown"
    icon={<Bot className="h-5 w-5 text-primary" />}
    badge={
      <Badge variant={agent.is_active ? 'default' : 'secondary'}>
        {agent.is_active ? 'Active' : 'Inactive'}
      </Badge>
    }
    dropdownActions={[
      { label: 'Edit', icon: Pencil, onClick: () => onEdit(agent) },
      { label: 'Duplicate', icon: Copy, onClick: () => onCopy(agent) },
      { label: 'Manage Tasks', icon: Settings, onClick: () => onManageTasks(agent) },
      { label: 'Test Agent', icon: TestTube2, onClick: () => onTest(agent) },
      { label: 'Delete', icon: Trash2, onClick: () => onDelete(agent.id), variant: 'destructive', separatorBefore: true },
    ]}
    dropdownLabel="Agent actions"
  />
  <CardContent>
    <DataList
      density="compact"
      columns={2}
      items={[
        { label: 'Model', value: <code className="text-xs font-mono">{agent.model_name}</code> },
        { label: 'Temperature', value: agent.temperature?.toString() ?? '-' },
        { label: 'Max Tokens', value: agent.max_tokens?.toString() ?? '-' },
      ]}
    />
    {agent.system_prompt && (
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">System Prompt</p>
        <TruncatedText
          text={agent.system_prompt}
          lines={2}
          className="text-sm mt-1"
        />
      </div>
    )}
  </CardContent>
</Card>
```

### Benefits

1. **Title readable** - TruncatedText shows full title on hover
2. **Actions accessible** - All 5 actions in clean dropdown menu
3. **Visual hierarchy** - DataList with consistent spacing and labels
4. **Responsive** - Works on mobile without horizontal scroll
5. **Accessible** - Proper ARIA labels, keyboard navigation
