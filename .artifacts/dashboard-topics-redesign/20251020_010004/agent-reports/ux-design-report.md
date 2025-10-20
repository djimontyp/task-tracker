# Dashboard Topics Redesign - UX Design Report

**Date**: 2025-10-20
**Designer**: UX Design Expert
**Status**: Design Complete

## Summary

Redesigned dashboard to replace "Recent Tasks" with knowledge-centric layout: "Recent Topics" (2/3 width) and "Recent Messages" (1/3 width). Added time-based filtering with tab navigation. Design maintains visual consistency with existing MetricCard patterns, ensures WCAG AA compliance, and follows the established techno-neon design system.

## Design Decisions

### 1. Layout Structure: 2/3 + 1/3 Split
**Rationale**: Topics are the primary knowledge discovery mechanism. 2/3 width gives topics visual priority while keeping messages contextually available. This follows the F-pattern reading flow (left-to-right importance).

### 2. Time Filter Tabs
**Options**: Today (default), Yesterday, Week, Month, Custom
**Rationale**: Progressive disclosure - most users care about recent activity. Default to "Today" reduces cognitive load. Custom calendar picker for power users only when needed.

### 3. Topic Card Design
**Key Elements**:
- Topic color indicator (left border accent, 4px)
- Icon + Name as clickable heading
- Message count badge (shows activity level)
- Last activity timestamp (relative time)
- Hover state with elevation change

**Rationale**: Visual hierarchy guides eye to topic name first. Color + icon provide quick recognition. Message count indicates importance.

### 4. Visual Consistency
**Reused Patterns**:
- Card component structure (border, padding, shadow)
- Badge styling (semantic colors from index.css)
- Hover interactions (scale transform, shadow elevation)
- Typography scale (existing heading/body sizes)
- Spacing system (4px grid)

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Metric Cards (6-column grid - existing)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────┬──────────────────────────┐
│ Recent Topics (2/3 width)        │ Recent Messages (1/3)    │
│ ┌──────────────────────────────┐ │ (existing component)     │
│ │ [Tabs: Today|Yesterday|...]  │ │                          │
│ └──────────────────────────────┘ │                          │
│ ┌──────────────────────────────┐ │                          │
│ │ Topic Card 1                 │ │                          │
│ │ [Color] Icon | Name → Link   │ │                          │
│ │ 12 messages · 5 min ago      │ │                          │
│ └──────────────────────────────┘ │                          │
│ ┌──────────────────────────────┐ │                          │
│ │ Topic Card 2                 │ │                          │
│ └──────────────────────────────┘ │                          │
└──────────────────────────────────┴──────────────────────────┘
```

## Component Specifications

### TimeFilterTabs
**Type**: Radix UI Tabs (existing `<Tabs>` component)
**States**: today | yesterday | week | month | custom

```tsx
<Tabs defaultValue="today">
  <TabsList>
    <TabsTrigger value="today">Today</TabsTrigger>
    <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
    <TabsTrigger value="week">Week</TabsTrigger>
    <TabsTrigger value="month">Month</TabsTrigger>
    <TabsTrigger value="custom">Custom</TabsTrigger>
  </TabsList>
</Tabs>
```

### TopicCard
**Size**: Full width, min-height 80px
**Interaction**: Clickable → navigates to `/topics/{id}`

**Visual Hierarchy**:
1. Color indicator (4px left border using topic.color)
2. Icon (20px) + Topic Name (font-semibold, text-base)
3. Message count badge (text-xs, muted)
4. Timestamp (text-xs, muted-foreground, right-aligned)

**Hover State**:
- Shadow: hover:shadow-lg
- Transform: hover:scale-[1.02]
- Transition: 200ms ease-out

**Accessibility**:
- Touch target: minimum 44px height
- Focus ring: ring-2 ring-ring ring-offset-2
- Keyboard: Enter/Space triggers navigation
- ARIA: role="button", aria-label="View {topic.name} topic"

### Color Indicator
**Implementation**: Border-left approach (performance > pseudo-elements)
**Width**: 4px
**Color**: Dynamic from `topic.color` (hex value from API)

### Mobile Responsive Breakpoints

**Desktop (≥768px)**: 2/3 + 1/3 grid
```css
grid-template-columns: 2fr 1fr;
```

**Mobile (<768px)**: Stack vertically
```css
grid-template-columns: 1fr;
/* Recent Messages appears below Recent Topics */
```

## Accessibility Checklist

- ✅ Contrast: All text ≥4.5:1 (using muted-foreground colors)
- ✅ Touch targets: Cards ≥44px height
- ✅ Keyboard navigation: Full tab support + focus indicators
- ✅ Screen readers: Proper ARIA labels, semantic HTML
- ✅ Color-blind safe: Information not conveyed by color alone (icon + text labels)

## Performance Considerations

- Use TanStack Query caching for topics data
- Lazy load topic icons (if using custom images)
- Debounce custom date picker changes (300ms)
- Limit to 5-8 topics per view (pagination if needed)

## Next Steps

1. **Backend Integration**: Verify `/api/v1/topics/recent` endpoint supports time filtering
2. **Component Development**: Build `TopicCard` and `TimeFilterTabs` components
3. **State Management**: Add time filter state to DashboardPage
4. **Testing**: User testing with 5+ users to validate 2/3 split effectiveness
5. **Analytics**: Track topic click-through rate to measure engagement
