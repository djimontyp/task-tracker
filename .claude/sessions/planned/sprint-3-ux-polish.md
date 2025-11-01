# Session: Sprint 3 - UX Polish

**Status**: 📅 Planned
**Created**: 2025-10-31
**Last Updated**: 2025-10-31
**Estimated**: 7h
**Priority**: 🟢 Low

## Context

| What | State |
|------|-------|
| Goal | Refinements, consistency, cognitive load reduction |
| Approach | Polish details after major UX work complete |
| Progress | 0/4 tasks |
| Next | Standardize icon set |
| Blocker | Depends on Sprint 1 + 2 completion |

## Tasks

### Consistency & Standards (2.5h)
- [ ] Standardize icon set - 1.5h
  - **Problem**: Mixed icon styles, some meanings unclear
  - **Solution**: Audit @heroicons/react usage, ensure consistent stroke width, document icon meanings
  - **Files**: Icon imports, icon component, design documentation
  - **Note**: Currently using @heroicons/react 2.2.0 (already installed)

- [ ] Color picker discoverability - 1h
  - **Problem**: Color picker dots not obviously clickable
  - **Solution**: Add label or icon hint, make picker more prominent
  - **Files**: Topic card component, color picker component

### Views & Navigation (2.5h)
- [ ] Topics list view - 1.5h
  - **Problem**: Card grid hard to scan with 24 cards per page
  - **Solution**: Add list/card toggle, improve search/filter, group by category
  - **Files**: Topics page, card/list view toggle, topic card component

- [ ] Sidebar active state - 1h
  - **Problem**: Parent sections don't expand when child is active
  - **Solution**: Auto-expand, highlight parent section
  - **Files**: AppSidebar.tsx, navigation state
  - **Note**: May already be fixed by `c777c9e` commit, verify

### Accessibility (2h)
- [ ] Touch targets - 2h
  - **Problem**: Buttons, checkboxes, pagination too small for touch (need 44x44px min)
  - **Solution**: Increase button sizes, add padding to expand hit areas
  - **Files**: Button components, table row components, touch target styles

## Next Actions

1. **Icon standardization** (1.5h)
   - Audit @heroicons/react usage consistency
   - Ensure consistent stroke width (24/outline style)
   - Document icon meanings in design system

2. **Topics list view** (1.5h)
   - Add toggle button to Topics page header
   - Implement list view layout
   - Persist user preference

3. **Touch targets** (2h)
   - Audit all interactive elements
   - Increase to 44x44px minimum
   - Test on touch devices

## Success Criteria

- ✅ All icons from single library (consistent style)
- ✅ Topics page has list view option
- ✅ All touch targets ≥44x44px
- ✅ Color picker obviously interactive

## Completion Target

**Estimated completion**: 7 hours
**Blocking dependencies**: Sprint 1 + Sprint 2
**Can be parallelized**: Yes (all tasks independent)

---

*Migrated from NEXT_SESSION_TODO.md on 2025-10-31*
