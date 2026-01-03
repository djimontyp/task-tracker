# Drill-Down Interaction Specification

**Status:** Draft
**Related Audit:** [[UX_Humanization_Audit]]

## 1. Concept
"Drill Down" interactions allow users to move from high-level aggregated data (Dashboard) to granular records (Messages/Atoms) by clicking directly on visual elements.

## 2. Target Components

### 2.1 Trend Chart (Area Chart)
**Current State:** Static visualization of Signal vs Noise.
**Proposed Interaction:**
*   **Trigger:** Click on a specific day/point in the Area Chart.
*   **Action:** Navigate to `MessagesPage`.
*   **Parameters:** `?from={date_start}&to={date_end}&filter=all` (or pre-filter by signal/noise if clicking specific area).
*   **Visual Feedback:** Cursor pointer, highlighted vertical line on hover.

**Implementation Spec:**
```tsx
// TrendChart.tsx
import { useNavigate } from 'react-router-dom'

const TrendChart = ({ onDateSelect }) => {
  // ...
  <AreaChart onClick={(data) => {
     if (data && data.activePayload) {
        const date = data.activePayload[0].payload.date
        onDateSelect(date)
     }
  }}>
     {/* ...cursors... */}
  </AreaChart>
}
```

### 2.2 Activity Heatmap
**Current State:** 6-month grid of activity intensity. Tooltip only.
**Proposed Interaction:**
*   **Trigger:** Click on a specific grid square (day).
*   **Action:** Navigate to `MessagesPage`.
*   **Parameters:** `?date={YYYY-MM-DD}`.
*   **Visual Feedback:** Scale effect on hover (`hover:scale-125`), pointer cursor.

**Implementation Spec:**
```tsx
// ActivityHeatmap.tsx
// Add onClick handler to the div inside the map
<div
  onClick={() => navigate(`/messages?date=${format(day.date, 'yyyy-MM-dd')}`)}
  className="... cursor-pointer hover:ring-2 ring-primary"
/>
```

### 2.3 Today's Focus
**Current State:** Links to individual atom details.
**Proposed Interaction:**
*   **Trigger:** Click on "See all 5 pending items" (footer).
*   **Action:** Navigate to `AtomsPage`.
*   **Parameters:** `?status=PENDING_REVIEW`.

## 3. URL Parameter Handling (MessagesPage)
The `MessagesPage` needs to support date filtering params.

**Current:** Supports `page`, `sort`, `search`.
**Required:** Add `date` or `date_range` support to `useFilterParams` hook.

```typescript
// useFilterParams.ts update
interface FilterParams {
  date?: string // YYYY-MM-DD
  // ...
}
```

## 4. Hierarchy & Navigation Flow
```mermaid
graph TD
    A[Dashboard] -->|Click Chart Day| B[Messages List (Date Filtered)]
    A -->|Click Heatmap Cell| B
    B -->|Click Message| C[Message Details Modal]
    C -->|Create Atom| D[Atom Edit]
```

## 5. Mobile Considerations
*   **Heatmap:** Touch targets are small (w-3 h-3).
    *   *Solution:* On mobile, show a simplified "Last 7 Days" bar chart or ensure zoom is enabled. Touch press should show tooltip first, second press navigates (or use long-press).
*   **Trend Chart:** Tooltip interactions can be tricky on touch.
    *   *Solution:* Use Recharts `activeDot` params to make touch easier.
