# Design Patterns

## Common UI Patterns Used in Pulse Radar

---

## 1. Form Pattern

**Used for:** User input, configuration, settings

### Structure

```jsx
<form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
  {/* Form fields with 16px gap */}

  <div className="space-y-2">
    {/* Label + Input + Helper with 8px gap */}
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" placeholder="Enter value" />
    <span className="text-xs text-muted-foreground">
      Optional helper text
    </span>
  </div>

  {/* Error message if validation fails */}
  {error && (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}

  {/* Action buttons (right-aligned) */}
  <div className="flex justify-end gap-2">
    <Button variant="outline" type="button">Cancel</Button>
    <Button type="submit" loading={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  </div>
</form>
```

### Variations

**Two-column form (responsive):**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FormField label="First Name" />
  <FormField label="Last Name" />
</div>
```

**Inline form (search bar):**
```jsx
<form className="flex gap-2">
  <Input placeholder="Search..." className="flex-1" />
  <Button type="submit">Search</Button>
</form>
```

---

## 2. Card Grid Pattern

**Used for:** Displaying collections (topics, atoms, messages, providers)

### Structure

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card
      key={item.id}
      className="p-4 space-y-3 hover:shadow-md cursor-pointer transition-shadow"
      onClick={() => navigate(`/items/${item.id}`)}
    >
      {/* Header with badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold flex-1 min-w-0 line-clamp-2">
          {item.title}
        </h3>
        <Badge className="flex-shrink-0">{item.type}</Badge>
      </div>

      {/* Metadata */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {item.description}
      </p>

      {/* Metadata indicators */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>{item.count} items</span>
        <span>•</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>

      {/* Action footer */}
      <Button variant="ghost" size="sm" className="w-full justify-start">
        View details →
      </Button>
    </Card>
  ))}
</div>
```

### Key Points

- Responsive grid: 1 col mobile → 2 cols tablet → 3 cols desktop
- 16px gap between cards
- Hover shadow effect (elevation change)
- Action button at card bottom
- Badge for type/status top-right

---

## 3. List Item Pattern

**Used for:** Sidebar navigation, message lists, filter options

### Structure

```jsx
<div className="space-y-2">
  {/* 8px gap between items */}
  {items.map(item => (
    <div
      key={item.id}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        "hover:bg-accent focus-visible:ring-2",
        selectedId === item.id && "bg-accent"
      )}
      role="button"
      tabIndex={0}
      onClick={() => select(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          select(item.id)
        }
      }}
    >
      {/* Optional icon */}
      <Icon className="h-4 w-4 flex-shrink-0" />

      {/* Content */}
      <span className="flex-1 min-w-0 text-sm font-medium">
        {item.name}
      </span>

      {/* Optional badge/count */}
      <Badge variant="outline" className="flex-shrink-0">
        {item.count}
      </Badge>
    </div>
  ))}
</div>
```

### Variations

**Nested list (indented):**
```jsx
<div className="space-y-2">
  {groups.map(group => (
    <div key={group.id}>
      {/* Group header */}
      <div className="px-3 py-2 font-semibold text-xs text-muted-foreground">
        {group.name}
      </div>

      {/* Indented items */}
      <div className="space-y-1">
        {group.items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-6 py-2">
            {/* Item content */}
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

## 4. Modal Pattern (Confirmation)

**Used for:** Dangerous actions (delete, reject, confirm)

### Structure

```jsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>

  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete item?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. The item will be permanently deleted.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive">
        Delete Permanently
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Variations

**Generic modal (non-destructive):**
```jsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Optional description</DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Modal body */}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 5. Table Pattern

**Used for:** Data display (messages, results, logs)

### Structure

```jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          {/* Checkbox for select all */}
        </TableHead>
        <TableHead>Column 1</TableHead>
        <TableHead>Column 2</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {items.map(item => (
        <TableRow key={item.id}>
          <TableCell>
            <Checkbox checked={selected.includes(item.id)} />
          </TableCell>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>{item.value}</TableCell>
          <TableCell className="text-right">
            <Button size="sm" variant="ghost">Edit</Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### Responsive Table (Mobile)

```jsx
// On mobile: Stack table as cards
<div className="space-y-3">
  {items.map(item => (
    <Card key={item.id} className="p-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.value}</p>
        </div>
        <Button size="sm" variant="ghost">Edit</Button>
      </div>
    </Card>
  ))}
</div>
```

---

## 6. Tabs Pattern

**Used for:** Switching between related content sections

### Structure

```jsx
<Tabs defaultValue="tab1" className="w-full">
  <TabsList>
    {/* Tab buttons */}
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>

  {/* Tab content */}
  <TabsContent value="tab1" className="space-y-4 py-4">
    <p>Content for tab 1</p>
  </TabsContent>

  <TabsContent value="tab2" className="space-y-4 py-4">
    <p>Content for tab 2</p>
  </TabsContent>

  <TabsContent value="tab3" className="space-y-4 py-4">
    <p>Content for tab 3</p>
  </TabsContent>
</Tabs>
```

### Key Points

- One tab active at a time
- Arrow keys navigate between tabs
- Content hidden/shown (not loaded/unloaded, preserve state)
- Smooth tab switch (fade transition)

---

## 7. Sidebar Navigation Pattern

**Used for:** Primary app navigation

### Structure

```jsx
<aside className="h-screen w-64 border-r bg-sidebar flex flex-col">
  {/* Header */}
  <div className="p-4 border-b">
    <Logo />
  </div>

  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto space-y-2 p-4">
    {navItems.map(item => (
      <NavLink
        key={item.id}
        to={item.href}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent"
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>

  {/* Footer */}
  <div className="p-4 border-t">
    <UserMenu />
  </div>
</aside>
```

### Collapsed Sidebar

```jsx
<aside className={cn(
  "h-screen border-r bg-sidebar flex flex-col transition-all duration-200",
  isOpen ? "w-64" : "w-0 overflow-hidden"
)}>
  {/* Same content, width animates */}
</aside>
```

---

## 8. Status Indicator Pattern

**Used for:** Provider status, message classification, validation state

### Structure

```jsx
{/* Status badge with icon + text + color */}
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100">
  <span className="h-2 w-2 rounded-full bg-green-600" />
  <span className="text-xs font-medium text-green-900">Connected</span>
</div>

// Or using semantic tokens
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--status-connected))/0.1]">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span className="text-xs font-medium text-status-connected">Connected</span>
</div>
```

### Key Points

- Always: color + icon + text (never color alone)
- Background: Color at 10% opacity (subtle)
- Icon: 16px, filled (not outline)
- Text: 12px, bold

---

## 9. Empty State Pattern

**Used for:** No data, no results, initial state

### Structure

```jsx
<div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
  {/* Icon (optional) */}
  <div className="mb-4 text-muted-foreground">
    <EmptyIcon className="h-12 w-12 mx-auto opacity-50" />
  </div>

  {/* Title */}
  <h3 className="text-lg font-semibold mb-2">
    No providers found
  </h3>

  {/* Description */}
  <p className="text-sm text-muted-foreground mb-4 max-w-md">
    Get started by adding your first LLM provider to enable AI features.
  </p>

  {/* CTA button */}
  <Button onClick={handleCreate}>
    <Plus className="h-4 w-4 mr-1" />
    Add Provider
  </Button>
</div>
```

### Key Points

- Centered in available space (min-height 400px)
- Large icon (h-12) with low opacity (50%)
- Clear, helpful copy
- Single CTA button (call-to-action)
- Optional illustration (not required)

---

## 10. Toast Notification Pattern

**Used for:** Feedback messages (success, error, info)

### Structure

```jsx
import { toast } from 'sonner'

// Success
toast.success('Item saved!')

// Error
toast.error('Something went wrong', {
  description: 'Please try again or contact support'
})

// Loading (promise-based)
toast.promise(
  fetchData(),
  {
    loading: 'Loading...',
    success: 'Data loaded!',
    error: 'Failed to load data'
  }
)
```

### Key Points

- Auto-dismiss after 3-4 seconds
- Multiple toasts stack vertically
- Bottom-right corner (default)
- No action buttons (use Alert for persistent)
- Automatically respect reduced motion

---

## 11. Dropdown Menu Pattern

**Used for:** Quick actions, context menus

### Structure

```jsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="icon" variant="ghost">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Key Points

- 3-dot icon (⋮) triggers menu
- Arrow keys navigate
- Escape closes
- Destructive actions at bottom, separated
- Max 5-6 items (use submenus if more)

---

## 12. Loading State Pattern

**Used for:** Async operations (fetch, save, delete)

### Structure

```jsx
// Option 1: Skeleton (content loading)
{isLoading ? (
  <div className="space-y-3">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
) : (
  <Card>Content</Card>
)}

// Option 2: Spinner (action loading)
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// Option 3: Disabled state
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  Action
</Button>
```

---

## Pattern Checklist

- [ ] Forms: space-y-4 between fields, error messages visible
- [ ] Cards: Hover shadow, click action, responsive grid
- [ ] Lists: 8px gap, selected state, keyboard navigation
- [ ] Modals: Confirm before destructive action, footer buttons
- [ ] Tables: Sortable headers, selectable rows, mobile stacked
- [ ] Tabs: Arrow navigation, keyboard support, smooth transition
- [ ] Sidebar: Collapsible on mobile, navigation items
- [ ] Status: Color + icon + text (never color alone)
- [ ] Empty: Icon, title, description, CTA button
- [ ] Toasts: Auto-dismiss, stack, responsive
- [ ] Dropdowns: Keyboard navigation, max 5-6 items
- [ ] Loading: Skeleton or spinner, clear feedback

