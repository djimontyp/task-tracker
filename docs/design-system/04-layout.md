# Layout System: Pulse Radar

## Grid System

**Mobile-first, CSS Grid-based responsive layout.**

### Breakpoints

| Breakpoint | Size | Device | Use |
|----------|------|--------|-----|
| **xs** | 375px | Mobile (minimum) | Testing only |
| **sm** | 640px | Mobile/tablet | Navigation collapses |
| **md** | 768px | Tablet | 2-column layouts emerge |
| **lg** | 1024px | Desktop | Full 3-column layouts |
| **xl** | 1280px | Large desktop | Standard max-width |
| **2xl** | 1536px | Extra large | Wider content |
| **3xl** | 1920px | Full HD / 2K | Tables expand fully |
| **4xl** | 2560px | QHD / 4K | Maximum expansion |

### Responsive Classes (Tailwind)

```jsx
// Base = mobile, then breakpoint prefixes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop) */}
</div>

// Hidden on mobile, shown on tablet+
<div className="hidden sm:block">
  {/* Visible only on sm and larger */}
</div>

// Shown on mobile, hidden on desktop+
<div className="sm:hidden">
  {/* Visible only on mobile */}
</div>
```

### Grid Columns

| Columns | Breakpoint | Use |
|---------|-----------|-----|
| **1 col** | xs-sm | Mobile single-column |
| **2 cols** | sm-md | Tablet two-column |
| **3 cols** | lg+ | Desktop three-column |
| **4+ cols** | Very rare (use Flex instead) | Never for responsive |

```jsx
// Standard responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>

// Two-column layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Mobile: 1 col, Desktop: 2 cols */}
</div>
```

---

## Container Max-Width

Constrain content width for readability on ultra-wide screens.

```jsx
// Standard container
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Max-width: 1280px on lg+, responsive padding */}
</div>

// Larger container
<div className="max-w-7xl mx-auto">
  {/* Max-width: 1280px */}
</div>

// Smaller container (for text-heavy content)
<div className="max-w-prose mx-auto">
  {/* Max-width: 56ch (optimal reading width) */}
</div>
```

### Tailwind Container Config

```javascript
// tailwind.config.js
container: {
  center: true,
  padding: {
    DEFAULT: '1rem',      // 16px (mobile)
    sm: '1.5rem',         // 24px (tablet)
    lg: '2rem',           // 32px (desktop)
    xl: '2.5rem',         // 40px (large)
    '2xl': '3rem',        // 48px (extra large)
  },
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',      // Full HD / 2K monitors
    '4xl': '2560px',      // QHD / 4K monitors
  }
}
```

### Large Screen Support (2K, 4K)

Data-heavy dashboards with tables should utilize available screen width on large monitors.

**Key principles:**
- **No fixed max-width** — Remove `max-w-screen-2xl` from main content areas
- **Responsive padding** — Increase padding progressively: `px-4 lg:px-6 xl:px-8 2xl:px-10`
- **Tables expand** — DataTable columns should have `minSize` but NO `maxSize` (except control columns)

```jsx
// MainLayout - content area (NO container constraint)
<main className="flex flex-1 flex-col gap-4 px-4 lg:px-6 xl:px-8 2xl:px-10 w-full">
  {/* Content expands to fill available width */}
</main>

// DataTable columns - flexible sizing
{
  accessorKey: 'content',
  size: 400,
  minSize: 200,
  // NO maxSize - allows column to expand
}

// Only fixed-width columns have maxSize
{
  id: 'select',
  size: 40,
  minSize: 40,
  maxSize: 40,  // Fixed control column
}
```

---

## Page Layout

### Main Layout Structure

```jsx
// frontend/src/shared/layouts/MainLayout.tsx
<div className="flex h-screen bg-background">
  {/* Sidebar (collapsible on mobile) */}
  <aside className="hidden md:flex w-64 border-r">
    <AppSidebar />
  </aside>

  {/* Main content area */}
  <div className="flex flex-col flex-1 overflow-hidden">
    {/* Navbar */}
    <header className="h-14 border-b sticky top-0 z-40">
      <Navbar />
    </header>

    {/* Page content */}
    <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      {/* Page-specific content */}
    </main>
  </div>
</div>
```

### Heights

| Component | Height | Size | Sticky? |
|-----------|--------|------|---------|
| **Navbar** | h-14 | 56px | Yes (z-40) |
| **Sidebar** | Full screen | Fill available | No |
| **Main** | `flex-1` | Remaining space | No |
| **Footer** | h-10 | 40px (if present) | No |

### Z-Index Scale

```css
:root {
  --z-base: 0;           /* z-0 */
  --z-dropdown: 10;      /* z-10 (dropdown menus) */
  --z-sticky: 20;        /* z-20 (sticky header) */
  --z-fixed: 30;         /* z-30 (fixed navbar) */
  --z-modal-overlay: 40; /* z-40 (modal backdrop) */
  --z-modal: 50;         /* z-50 (modal content) */
  --z-toast: 60;         /* z-60 (toast notifications) */
}
```

**Tailwind z-index classes:**
```jsx
<header className="sticky top-0 z-40">
  {/* Navbar (z-40) */}
</header>

<div className="fixed z-50 bg-black/50">
  {/* Modal overlay (z-50) */}
</div>

<div className="z-50 bg-white">
  {/* Modal content (z-50, on top of overlay) */}
</div>

<div className="fixed bottom-4 right-4 z-60">
  {/* Toast (z-60, highest) */}
</div>
```

---

## Common Layouts

### Two-Column (Main + Sidebar)

```jsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Mobile: 1 col, Desktop: 4 cols (1fr + 3fr) */}
  <aside className="lg:col-span-1 h-fit sticky top-20">
    {/* Sidebar (1/4 width on desktop) */}
  </aside>

  <main className="lg:col-span-3">
    {/* Main content (3/4 width on desktop) */}
  </main>
</div>
```

Or using explicit widths:

```jsx
<div className="flex gap-6">
  <aside className="w-64 flex-shrink-0 h-fit sticky top-20">
    {/* Fixed 256px sidebar */}
  </aside>

  <main className="flex-1">
    {/* Remaining space */}
  </main>
</div>
```

### Three-Column (Left + Main + Right)

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {/* Mobile: 1 col, Tablet: 3 cols, Desktop: 4 cols */}
  <aside className="md:col-span-1">
    {/* Left sidebar (1/3 or 1/4) */}
  </aside>

  <main className="md:col-span-1 lg:col-span-2">
    {/* Main content (1/3 or 2/4) */}
  </main>

  <aside className="md:col-span-1">
    {/* Right sidebar (1/3 or 1/4) */}
  </aside>
</div>
```

### Card Grid

```jsx
// Responsive card grid (1 col mobile → 3 cols desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4">
      {/* Card content */}
    </Card>
  ))}
</div>
```

### List Layout

```jsx
// Single-column list with padding
<div className="space-y-2 max-w-2xl">
  {items.map(item => (
    <div
      key={item.id}
      className="flex items-center gap-4 px-4 py-2 rounded-md hover:bg-accent"
    >
      {/* List item content */}
    </div>
  ))}
</div>
```

---

## Sidebar Layout

### Sidebar Collapse (Mobile)

```jsx
// Sidebar visible only on md+
<div className="hidden md:flex w-64 border-r">
  <aside className="w-full">
    {/* Sidebar content */}
  </aside>
</div>

// On mobile, sidebar triggered by hamburger menu
<button className="md:hidden" onClick={toggleSidebar}>
  <Menu />
</button>
```

### Sidebar Dimensions

| Metric | Size | Class |
|--------|------|-------|
| **Width (expanded)** | 256px | `w-64` |
| **Width (collapsed)** | 60px | `w-15` (if implemented) |
| **Height** | Full screen | `h-screen` |
| **Transition** | 200ms | `transition-all duration-200` |

```jsx
// Sidebar with collapse animation
<aside
  className={cn(
    "h-screen border-r transition-all duration-200",
    isOpen ? "w-64" : "w-0 overflow-hidden"
  )}
>
  {/* Sidebar content */}
</aside>
```

### Sidebar Items

```jsx
// Sidebar menu item
<button
  className="w-full flex items-center gap-3 px-3 py-2 rounded-md
             hover:bg-sidebar-accent focus-visible:outline-3
             text-sidebar-foreground text-sm font-medium"
>
  <Icon className="h-5 w-5 flex-shrink-0" />
  <span>Menu Item</span>
</button>

// Nested menu (indented)
<button className="w-full flex items-center gap-3 px-6 py-2 ml-3 border-l-2">
  {/* 6px left padding for sub-items */}
</button>
```

---

## Navbar Layout

### Navbar Structure

```jsx
<header className="h-14 border-b sticky top-0 z-40">
  <nav className="px-4 sm:px-6 h-full">
    <div className="flex items-center justify-between h-full gap-4">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Logo />
        <Breadcrumb />
      </div>

      {/* Right: Search + Theme + User menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <SearchButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  </nav>
</header>
```

### Navbar Heights

| Component | Height | Note |
|-----------|--------|------|
| **Navbar** | 56px (h-14) | Standard |
| **Logo/Text** | 24-32px | Centered vertically |
| **Icon buttons** | 44px (h-11 w-11) | Touch target |

---

## Modal/Dialog Layout

### Dialog Structure

```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>

  <DialogContent className="max-w-md">
    {/* Modal max-width: 448px (md) */}
    <DialogHeader className="space-y-2">
      {/* 8px gap between title + description */}
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description text</DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Content with 16px gaps */}
    </div>

    <DialogFooter className="space-x-2">
      {/* Buttons with 8px gap */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dialog Sizes

| Size | Max-Width | Use |
|------|-----------|-----|
| **sm** | 384px | Confirmations |
| **md** | 448px | Standard dialogs |
| **lg** | 512px | Forms |
| **xl** | 640px | Large forms |

```jsx
// Small confirmation
<DialogContent className="max-w-sm">
  Are you sure?
</DialogContent>

// Large form
<DialogContent className="max-w-xl">
  <form className="space-y-4">
    {/* Form fields */}
  </form>
</DialogContent>
```

---

## Form Layout

### Form Structure

```jsx
<form className="space-y-4 max-w-lg">
  {/* 16px gap between form rows */}

  <fieldset className="space-y-2">
    {/* 8px gap between label and input */}
    <label htmlFor="email" className="text-sm font-medium">
      Email Address
    </label>
    <input
      id="email"
      type="email"
      className="h-9 px-3 py-2 w-full"
      placeholder="you@example.com"
    />
    <span className="text-xs text-muted-foreground">
      We'll never share your email.
    </span>
  </fieldset>

  <div className="flex gap-2 justify-end">
    {/* Buttons right-aligned with 8px gap */}
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </div>
</form>
```

### Form Row (Two Columns)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Mobile: 1 col, Desktop: 2 cols */}
  <fieldset className="space-y-2">
    <label>First Name</label>
    <input placeholder="John" />
  </fieldset>

  <fieldset className="space-y-2">
    <label>Last Name</label>
    <input placeholder="Doe" />
  </fieldset>
</div>
```

---

## Responsive Design Patterns

### Hide/Show by Breakpoint

```jsx
// Show on mobile only
<div className="block sm:hidden">
  Mobile menu
</div>

// Show on desktop only
<div className="hidden md:block">
  Desktop nav
</div>

// Show on tablet+ only
<div className="hidden sm:block">
  Sidebar
</div>
```

### Responsive Text

```jsx
// Text scales on different screens
<h1 className="text-2xl sm:text-3xl md:text-4xl">
  Page Title
</h1>
```

### Responsive Padding

```jsx
// Tighter padding on mobile
<div className="p-2 sm:p-4 md:p-6">
  Content
</div>
```

### Responsive Grid

```jsx
// 1 col mobile → 2 cols tablet → 3 cols desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items}
</div>
```

---

## Overflow Handling

### Text Overflow

```jsx
// Single-line truncation
<h3 className="truncate">
  Very long title that will be cut off
</h3>

// Multi-line clamp (CSS)
<p className="line-clamp-3">
  Long description showing max 3 lines
</p>
```

### Content Overflow

```jsx
// Scrollable container
<div className="h-96 overflow-y-auto">
  {/* Vertical scroll if content exceeds 384px */}
</div>

// Horizontal scroll (table)
<div className="overflow-x-auto">
  <table>{/* ... */}</table>
</div>
```

### Auto Sizing

```jsx
// Expand to fill available space
<main className="flex-1 overflow-auto">
  {/* Takes remaining space */}
</main>

// Shrink to content size
<aside className="flex-shrink-0 w-64">
  {/* Fixed width, won't shrink */}
</aside>
```

---

## Sticky Positioning

### Sticky Header

```jsx
<header className="sticky top-0 z-40 h-14 border-b bg-background">
  {/* Stays at top when scrolling */}
</header>
```

### Sticky Sidebar

```jsx
<aside className="sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
  {/* Stays in view, below navbar (top-14 = navbar height) */}
</aside>
```

### Z-Index for Sticky

- Navbar: `z-40`
- Sticky sidebar: `z-30` (below navbar)
- Sticky table header: `z-10`

---

## Accessibility in Layout

### Landmark Regions

```jsx
// Use semantic HTML
<header role="banner">
  {/* Main navigation */}
</header>

<nav role="navigation">
  {/* Sidebar navigation */}
</nav>

<main role="main">
  {/* Primary content */}
</main>

<aside role="complementary">
  {/* Secondary content */}
</aside>

<footer role="contentinfo">
  {/* Footer */}
</footer>
```

### Focus Management

```jsx
// Focus trap in modal
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus automatically moves into dialog */}
    {/* Escape key closes it */}
    {/* Focus returns to trigger on close */}
  </DialogContent>
</Dialog>
```

### Skip Links

```jsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  {/* Can be focused via skip link */}
</main>
```

---

## Layout Checklist

- [ ] Mobile breakpoint: xs (375px minimum)
- [ ] Responsive grid: 1 col mobile → 3 cols desktop
- [ ] Sidebar: Hidden on mobile (`hidden md:flex`)
- [ ] Navbar: Sticky (`sticky top-0 z-40`)
- [ ] Container max-width: Applied on lg+
- [ ] Touch targets: ≥44×44px
- [ ] Padding responsive: `p-2 sm:p-4 md:p-6`
- [ ] Overflow handled: `overflow-auto` for long content
- [ ] Focus management: Modals trap, nav skippable
- [ ] Semantic HTML: `<header>`, `<nav>`, `<main>`, `<aside>`

---

## Summary Table

| Pattern | Mobile | Tablet | Desktop | Classes |
|---------|--------|--------|---------|---------|
| **Single col** | Full | Full | Full | `grid-cols-1` |
| **Two col** | Stack | 2 cols | 2 cols | `grid-cols-1 md:grid-cols-2` |
| **Three col** | Stack | 2 cols | 3 cols | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| **Sidebar main** | Collapse | Show | Show | `hidden md:flex w-64` |
| **Navbar** | h-14 | h-14 | h-14 | `h-14 sticky top-0` |

