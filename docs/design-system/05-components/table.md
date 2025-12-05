# DataTable UX Guidelines

## Overview

DataTable is the primary component for displaying tabular data. Built on TanStack Table v8 with shadcn/ui primitives.

## Core Principles

### 1. Column Visibility (View Dropdown)

**Pattern:** Popover + Command (NOT DropdownMenu)

```tsx
// ✅ CORRECT - stays open for multi-select
<Popover>
  <PopoverTrigger>
    <Button>View</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search columns..." />
      <CommandList>
        {columns.map(col => (
          <CommandItem onSelect={() => col.toggleVisibility()}>
            <Checkbox checked={col.getIsVisible()} />
            {col.id}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>

// ❌ INCORRECT - closes after each click
<DropdownMenu>
  <DropdownMenuCheckboxItem />
</DropdownMenu>
```

**Rationale:** Users often want to toggle multiple columns. DropdownMenu closes after each selection, forcing repeated clicks.

---

### 2. Header Actions (Sorting Only)

**Pattern:** Header dropdown shows ONLY sorting options

```tsx
// ✅ CORRECT
<DropdownMenuContent>
  <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
    <ArrowUpIcon /> Asc
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
    <ArrowDownIcon /> Desc
  </DropdownMenuItem>
</DropdownMenuContent>

// ❌ INCORRECT - duplicates View dropdown functionality
<DropdownMenuContent>
  <DropdownMenuItem>Asc</DropdownMenuItem>
  <DropdownMenuItem>Desc</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Hide</DropdownMenuItem>  // ← Remove this!
</DropdownMenuContent>
```

**Rationale:** "Hide" duplicates the View dropdown. Each action should have one clear location.

---

### 3. Complex Filters (Range, Multi-value)

**Requirements:**
- Separate toggle for null/undefined values
- Clear reset button
- Visual indicator when filter is active

```tsx
// ✅ CORRECT - ImportanceFilterValue type
interface ImportanceFilterValue {
  range: [number, number] | null  // null = no range filter
  showUnscored: boolean           // toggle for null values
}

// Filter UI structure:
// [x] Show unscored (checkbox)
// ---
// Quick filters: Noise | Neutral | Signal
// ---
// Slider: [0] ────●────● [100]
// ---
// [Reset] button
```

**Rationale:** Null values should be handled explicitly. Range filters should not hide data unexpectedly.

---

### 4. Column Resizing

**Pattern:** TanStack Table native resizing with `onEnd` mode

```tsx
const table = useReactTable({
  enableColumnResizing: true,
  columnResizeMode: 'onEnd', // More performant
  state: { columnSizing },
  onColumnSizingChange: setColumnSizing,
})

// Resize handle in header
<TableHead style={{ width: header.getSize() }}>
  {/* Header content */}
  <div
    onMouseDown={header.getResizeHandler()}
    onTouchStart={header.getResizeHandler()}
    onDoubleClick={() => header.column.resetSize()}
    className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
  />
</TableHead>
```

**Interactions:**
- Drag handle to resize
- Double-click to reset to default size

---

### 5. Large Screen Column Sizing

**Principle:** Columns should expand on large screens (2K, 4K), not remain fixed width.

```tsx
// ✅ CORRECT - Data columns without maxSize
{
  accessorKey: 'content',
  size: 400,       // Default size
  minSize: 200,    // Minimum for readability
  // NO maxSize - allows expansion on large screens
}

{
  accessorKey: 'topic_name',
  size: 150,
  minSize: 100,
  // NO maxSize - badge can expand to show full text
}

// ✅ CORRECT - Control columns with fixed size
{
  id: 'select',
  size: 40,
  minSize: 40,
  maxSize: 40,      // Fixed - checkbox doesn't need to expand
  enableResizing: false,
}

{
  id: 'actions',
  size: 60,
  minSize: 60,
  maxSize: 60,      // Fixed - actions menu button
  enableResizing: false,
}
```

**Rules:**
| Column Type | minSize | maxSize | enableResizing |
|-------------|---------|---------|----------------|
| Content/Text | ✅ Yes | ❌ No | ✅ Yes |
| Badge/Status | ✅ Yes | ❌ No | ✅ Yes |
| ID | ✅ Yes | ⚠️ Optional | ✅ Yes |
| Checkbox (select) | ✅ Yes | ✅ Yes (fixed) | ❌ No |
| Actions | ✅ Yes | ✅ Yes (fixed) | ❌ No |

**Badge with Tooltip for Long Text:**

```tsx
// For columns that might truncate
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge className="truncate max-w-[150px] lg:max-w-[180px] 2xl:max-w-[250px]">
        {value}
      </Badge>
    </TooltipTrigger>
    {value.length > 20 && (
      <TooltipContent>
        <p>{value}</p>
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

**Rationale:** On 2K/4K monitors with 2560px+ width, tables with fixed `maxSize` columns leave 60-80% of the screen empty. Only control elements (checkboxes, action buttons) should have fixed widths.

**⚠️ CRITICAL: DataTable Component Styling**

When column resizing is enabled, the `<Table>` element must use `minWidth`, NOT `width`:

```tsx
// ❌ WRONG - Table won't expand beyond column sum
<Table style={{ width: table.getCenterTotalSize() }} />

// ✅ CORRECT - Table expands to fill container, columns have minimum width
<Table style={{ minWidth: table.getCenterTotalSize() }} />
```

**Why:** `getCenterTotalSize()` returns the sum of all column `size` values (~800-1000px). Using `width` locks the table to this size. Using `minWidth` ensures columns don't collapse below their minimum but allows the table to expand on larger screens.

**Implementation** (`shared/components/DataTable/index.tsx`):
```tsx
<Table
  className="w-full"
  style={isResizingEnabled ? {
    minWidth: table.getCenterTotalSize(),  // NOT width!
    tableLayout: 'fixed',
  } : undefined}
>
```

---

### 6. Filter Reset

**Every complex filter must have a reset mechanism:**

```tsx
// In filter component
const resetAll = () => column?.setFilterValue(undefined)

// In UI
{hasFilter && (
  <Button variant="ghost" size="sm" onClick={resetAll}>
    <XMarkIcon /> Reset
  </Button>
)}
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Space | Toggle checkbox, activate button |
| Enter | Activate button, open dropdown |
| Escape | Close popover/dropdown |
| Arrow Up/Down | Navigate dropdown items |

### ARIA Attributes

```tsx
<Table role="grid" aria-label="Data table">
  <TableHead role="columnheader" scope="col">
  <TableRow role="row">
  <TableCell role="cell">
```

### Focus Indicators

All interactive elements must have visible focus:
```tsx
className="focus-visible:ring-2 focus-visible:ring-ring"
```

---

## Related Components

- `DataTableToolbar` - Search + filters + View dropdown
- `DataTableColumnHeader` - Sortable header with dropdown
- `DataTableFacetedFilter` - Multi-select filter
- `DataTablePagination` - Page navigation
- `ImportanceScoreFilter` - Range filter with quick presets

---

## Implementation Files

| Component | Location |
|-----------|----------|
| DataTable | `shared/components/DataTable/index.tsx` |
| DataTableToolbar | `shared/components/DataTableToolbar/index.tsx` |
| DataTableColumnHeader | `shared/components/DataTableColumnHeader/index.tsx` |
| ImportanceScoreFilter | `pages/MessagesPage/importance-score-filter.tsx` |
