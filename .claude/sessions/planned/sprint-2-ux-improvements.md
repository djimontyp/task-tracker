# Session: Sprint 2 - UX Improvements

**Status**: 📅 Planned
**Created**: 2025-10-31
**Last Updated**: 2025-10-31
**Estimated**: 18h
**Priority**: 🟡 Medium

## Context

| What | State |
|------|-------|
| Goal | Data table optimization, mobile experience |
| Approach | 3 categories: Tables, Mobile, User Flows |
| Progress | 0/7 tasks |
| Next | Messages Table column optimization |
| Blocker | None (depends on Sprint 1 completion) |

## Tasks

### Data Tables & Content (5h)
- [ ] Messages Table column widths - 2h
  - **Problem**: Content column too narrow, ID/Author take too much space
  - **Solution**: Make Content flex-grow, shorten ID to number only, add column visibility controls
  - **Files**: Data table column configuration, column visibility toggle

- [ ] Empty content fallback - 1h
  - **Problem**: Some rows show completely empty content with no indication
  - **Solution**: Show "(Empty message)" placeholder, add icon, allow hiding
  - **Files**: Message table row renderer, empty state handling

- [ ] Reduce information density - 1h
  - **Problem**: 10 columns too dense, hard to scan for information
  - **Solution**: Hide ID/timestamp by default, add column visibility toggle, consider card view
  - **Files**: Messages table configuration, view toggle

- [ ] Pagination improvements - 0.5h
  - **Problem**: Disabled buttons shown greyed out, no quick page jump
  - **Solution**: Hide disabled buttons, add page number input field
  - **Files**: Pagination component

- [ ] Dashboard information overload - 1.5h
  - **Problem**: 6 stat cards + widgets all visible, overwhelming for new users
  - **Solution**: Progressive disclosure, collapse empty widgets, visual hierarchy
  - **Files**: Dashboard layout, widget components

### Mobile & Responsive (7h)
- [ ] Mobile sidebar - 4h
  - **Problem**: Sidebar not usable on mobile devices
  - **Solution**: Slide-out menu with hamburger, icon-only view, bottom nav alternative
  - **Files**: Sidebar component, mobile layout, responsive breakpoints

- [ ] Mobile tables - 3h
  - **Problem**: Data tables unusable on mobile (10+ columns, small text)
  - **Solution**: Card view for mobile, show 2-3 key columns, swipe gestures for actions
  - **Files**: Table component, mobile card view, responsive utilities

### User Flows & Actions (4h)
- [ ] Undo for approve/reject - 2h
  - **Problem**: No confirmation or undo for critical actions
  - **Solution**: Toast with "Undo" button (5s window), confirmation for high-priority items
  - **Files**: Proposal action handlers, undo manager, toast notifications

- [ ] Import flow clarification - 2h
  - **Problem**: "Ingest Messages" doesn't explain sources, format, or process
  - **Solution**: Create wizard with source selection, preview, import steps, documentation links
  - **Files**: Ingestion modal, onboarding flow, help documentation

### Design System (2h) *(bonus tasks)*
- [ ] Button hierarchy - 1h
  - **Problem**: Inconsistent button styles across app
  - **Solution**: Primary (orange), Secondary (outlined), Tertiary (text), Destructive (red)
  - **Files**: Button component library, component documentation

- [ ] Spacing consistency - 1h
  - **Problem**: Spacing varies across pages and components
  - **Solution**: Use 4px grid (4, 8, 16, 24, 32, 48, 64), create layout wrappers
  - **Files**: Layout components, spacing utilities, CSS variables

## Next Actions

1. **Start with Messages Table** (2h)
   - Adjust column widths (Content should flex-grow)
   - Hide ID column by default
   - Add column visibility toggle

2. **Mobile Sidebar** (4h)
   - Design mobile navigation pattern
   - Implement hamburger menu
   - Test on 375px width

3. **Undo functionality** (2h)
   - Add undo manager service
   - Integrate with proposal actions
   - Show toast with "Undo" button

## Success Criteria

- ✅ Tables usable on mobile (card view works at 375px)
- ✅ Sidebar works on mobile (hamburger menu functional)
- ✅ Critical actions have undo (5s toast window)
- ✅ Information density reduced (column visibility toggles)

## Completion Target

**Estimated completion**: 18 hours
**Blocking dependencies**: Sprint 1 (accessibility + empty states)
**Can be parallelized**: Yes (mobile work independent from table work)

---

*Migrated from NEXT_SESSION_TODO.md on 2025-10-31*
