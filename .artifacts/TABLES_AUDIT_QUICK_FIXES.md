# Tables UX/UI Audit — Quick Fixes Reference

**Status:** Complete Audit
**Date:** 2025-12-04
**Coverage:** 7 core + 5 feature table components

---

## CRITICAL ISSUES - LINE REFERENCES

### 1. Touch Targets < 44px (8 instances)

#### Issue: Pagination Buttons

**File:** `frontend/src/shared/components/DataTablePagination/index.tsx`

```
Line 86-93: ❌ h-8 w-8 (32px) — BELOW WCAG 2.5.5
Line 96-103: ❌ h-8 w-8 (32px) — BELOW WCAG 2.5.5

CHANGE TO: h-11 w-11 (44px)
```

#### Issue: Action Buttons

**File:** `frontend/src/features/automation/components/JobsTable.tsx`

```
Line 136: ❌ Button variant="ghost" size="icon" (defaults to 32px)
         <Button variant="ghost" size="icon">
           <EllipsisVerticalIcon className="h-4 w-4" />
         </Button>

CHANGE TO:
         <Button variant="ghost" size="icon" className="h-11 w-11">
           <EllipsisVerticalIcon className="h-4 w-4" />
         </Button>
```

**File:** `frontend/src/features/automation/components/RulePerformanceTable.tsx`

```
Line 109: ❌ Same issue as above
         <Button variant="ghost" size="icon">

CHANGE TO: Add className="h-11 w-11"
```

**File:** `frontend/src/features/monitoring/components/TaskHistoryTable.tsx`

```
Line 181-183: ❌ Button variant="outline" size="sm" — Check actual height
Line 190-192: ❌ Same issue
         <Button
           variant="outline"
           size="sm"
           ...
         >

CHANGE TO: Verify h-10+ minimum (should be ok, but verify)
```

**File:** `frontend/src/pages/MessagesPage/columns.tsx`

```
Line 310: ❌ Button variant="ghost" className="h-8 w-8 p-0"
         <Button variant="ghost" className="h-8 w-8 p-0" aria-label={...}>

CHANGE TO:
         <Button variant="ghost" className="h-11 w-11 p-0" aria-label={...}>
```

**File:** `frontend/src/pages/TopicsPage/columns.tsx`

```
Line 121: ❌ Button variant="ghost" className="h-8 w-8 p-0"
         <Button variant="ghost" className="h-8 w-8 p-0">

CHANGE TO:
         <Button variant="ghost" className="h-11 w-11 p-0">
```

---

### 2. Dialog Accessibility Errors

**Files to Audit:**
```
frontend/src/features/messages/components/MessageInspectModal.tsx — ERROR
frontend/src/features/messages/components/ConsumerMessageModal.tsx — ERROR
frontend/src/pages/MessagesPage/IngestionModal.tsx — ERROR
```

**Error Pattern:**
```
ERROR: `DialogContent` requires a `DialogTitle`
WARNING: Missing `Description` or `aria-describedby`
```

**Fix Pattern:**
```tsx
// WRONG (current):
<Dialog>
  <DialogContent>
    {/* content directly */}
  </DialogContent>
</Dialog>

// CORRECT (required):
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Clear, descriptive title</DialogTitle>
      <DialogDescription>
        Optional: Additional context about the dialog
      </DialogDescription>
    </DialogHeader>
    {/* content here */}
  </DialogContent>
</Dialog>
```

---

### 3. Padding Inconsistency

**File:** `frontend/src/shared/ui/table.tsx`

```
Line 76: TableHead padding
    className={cn(
      "h-10 px-2 text-left align-middle font-medium ...",
      //    ↑ Only horizontal padding, no vertical!

Line 91: TableCell padding
    className={cn(
      "p-2 align-middle ...",
      // ↑ Vertical + horizontal, but misaligned with header!
```

**Change to (4px grid):**
```tsx
// TableHead (line 75-78):
    className={cn(
      "h-12 px-4 py-3 text-left align-middle font-semibold ...",
      className
    )}

// TableCell (line 90-93):
    className={cn(
      "px-4 py-3 align-middle ...",
      className
    )}
```

---

## HIGH PRIORITY ISSUES

### 4. Font Size Too Small

**File:** `frontend/src/features/automation/components/JobsTable.tsx`

```
Line 86: ❌ text-xs (12px) — BELOW 14px minimum
    <code className="text-xs bg-muted px-2 py-1 rounded">
      {row.original.schedule_cron}
    </code>

CHANGE TO:
    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
      {row.original.schedule_cron}
    </code>
```

---

### 5. Missing Focus Ring on Rows

**File:** `frontend/src/shared/components/DataTable/index.tsx`

```
Line 77-91: TableRow without keyboard support
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      onClick={() => onRowClick?.(row.original)}
      className={onRowClick ? 'cursor-pointer' : undefined}
      // ← NO tabIndex, NO focus ring, NOT keyboard accessible!
    >

CHANGE TO:
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      onClick={() => onRowClick?.(row.original)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
          e.preventDefault()
          onRowClick(row.original)
        }
      }}
      tabIndex={onRowClick ? 0 : -1}
      className={cn(
        onRowClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded'
      )}
      role={onRowClick ? 'button' : undefined}
      aria-selected={row.getIsSelected()}
    >
```

---

## MEDIUM PRIORITY ISSUES

### 6. Column Labels Not User-Friendly

**File:** `frontend/src/shared/components/DataTableToolbar/index.tsx`

```
Line 56-58: Shows technical column IDs
    {column
      .getAllColumns()
      .filter((c) => c.getCanHide())
      .map((column) => (
        <DropdownMenuCheckboxItem
          key={column.id}
          className="capitalize"
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}  // ← "source_name", "importance_score" — too technical!
        </DropdownMenuCheckboxItem>
      ))}

ADD: Column label mapping
    const columnLabels: Record<string, string> = {
      'source_name': 'Message Source',
      'importance_score': 'Importance Level',
      'noise_classification': 'Classification Type',
      'analyzed': 'Analysis Status',
      'sent_at': 'Sent Date/Time',
      'topic_name': 'Topic',
      'author_name': 'Author',
      'content': 'Message Content',
    }

CHANGE LINE 57 TO:
          {columnLabels[column.id] || column.id}
```

---

### 7. No Empty State CTA

**File:** `frontend/src/features/automation/components/JobsTable.tsx`

```
Line 171-175: No context when table is empty
    if (isLoading) {
      return <div className="text-center py-4">Loading...</div>
    }

    return <DataTable table={table} columns={columns} />
    // ← When jobs=[], shows "No results." but no action available

ADD: emptyMessage prop
    return (
      <DataTable
        table={table}
        columns={columns}
        emptyMessage={
          <div className="text-center py-12 space-y-4 text-muted-foreground">
            <div className="text-lg font-semibold text-foreground">No scheduled jobs</div>
            <p className="text-sm">Create your first automation job to get started</p>
            <Button onClick={onCreateJob} size="sm">Create Job</Button>
          </div>
        }
      />
    )
```

Same issue in: `frontend/src/features/automation/components/RulePerformanceTable.tsx:140`

---

### 8. Pagination Input Too Small

**File:** `frontend/src/shared/components/DataTablePagination/index.tsx`

```
Line 71-80: Input field hard to click on mobile
    <Input
      type="number"
      min={1}
      max={totalPages}
      value={pageInput}
      onChange={handlePageInputChange}
      placeholder={String(currentPage)}
      className="h-8 w-12 sm:w-16 text-center"  // ← 32px height, 12px width on mobile!
      aria-label="Go to page"
    />

CHANGE TO:
    <Input
      type="number"
      min={1}
      max={totalPages}
      value={pageInput}
      onChange={handlePageInputChange}
      placeholder={String(currentPage)}
      className="h-10 w-16 sm:w-20 text-center"  // ← 40px height, better width
      aria-label="Go to page"
    />
```

---

## SUMMARY TABLE

| Issue | File | Lines | Fix | Effort | Impact |
|-------|------|-------|-----|--------|--------|
| Touch targets | DataTablePagination.tsx | 86-103 | Add h-11 w-11 | 2 min | CRITICAL |
| Touch targets | JobsTable.tsx | 136 | Add className | 1 min | CRITICAL |
| Touch targets | RulePerformanceTable.tsx | 109 | Add className | 1 min | CRITICAL |
| Touch targets | MessagesPage/columns.tsx | 310 | Add className | 1 min | CRITICAL |
| Touch targets | TopicsPage/columns.tsx | 121 | Add className | 1 min | CRITICAL |
| Dialog a11y | MessageInspectModal.tsx | TBD | Add DialogTitle | 10 min | CRITICAL |
| Dialog a11y | ConsumerMessageModal.tsx | TBD | Add DialogTitle | 10 min | CRITICAL |
| Dialog a11y | IngestionModal.tsx | TBD | Add DialogTitle | 10 min | CRITICAL |
| Padding | table.tsx | 75-93 | Update px/py values | 5 min | HIGH |
| Font size | JobsTable.tsx | 86 | text-xs → text-sm | 1 min | HIGH |
| Focus ring | DataTable.tsx | 77-91 | Add tabIndex + onKeyDown | 15 min | HIGH |
| Column labels | DataTableToolbar.tsx | 56-58 | Add mapping | 10 min | MEDIUM |
| Empty state | JobsTable.tsx | 171-175 | Add emptyMessage | 10 min | MEDIUM |
| Empty state | RulePerformanceTable.tsx | 140 | Add emptyMessage | 10 min | MEDIUM |
| Input size | DataTablePagination.tsx | 71-80 | Update h-10 w-16 | 2 min | MEDIUM |

**Total Effort:** ~2 hours 30 minutes
**Total Impact:** Accessibility + Visual Harmony = Major Improvement

---

## VERIFICATION COMMANDS

```bash
# 1. Type check after changes
just tc

# 2. Build to catch errors
npm run build

# 3. Test table components (if tests exist)
npm run test -- --grep "table|Table"

# 4. Check accessibility with axe
# Use axe DevTools browser extension:
# - Right click → Scan this page
# - Focus on "Buttons, links" and "Form fields"
# - Should have 0 violations after fixes

# 5. Lighthouse audit (after build)
npm run preview &
# Open http://localhost:4173/messages in Chrome
# DevTools → Lighthouse → Accessibility
# Target: 95+ score
```

---

**Priority:** START WITH CRITICAL (touch targets + dialog a11y) = 1 hour
**Then:** HIGH (padding, focus, font size) = 1 hour
**Then:** MEDIUM (labels, empty states, input) = 30 mins

**Reviewer Checklist:**
- [ ] All touch targets 44px+
- [ ] No dialog a11y console errors
- [ ] Focus ring visible on keyboard nav
- [ ] Lighthouse a11y score ≥95
- [ ] No axe violations
- [ ] Mobile table scrolls smoothly
