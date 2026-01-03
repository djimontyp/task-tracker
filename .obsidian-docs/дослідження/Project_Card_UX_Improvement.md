# Project Card UX Improvement Spec

**Status:** Draft
**Related Audit:** [[UX_Humanization_Audit]]

## 1. Problem Statement
The current `ProjectCard` implementation suffers from **Vertical Sprawl**.
*   **Too Tall:** Cards take up 600px+ height on desktop because they display *all* keywords, *all* components, *all* glossary terms, and *all* priority rules at once.
*   **Information Overload:** Users are bombarded with raw data (JSON-like structures) rather than key insights.
*   **Scalability:** As a project grows (more glossary terms, more components), the card becomes unusable.

## 2. Proposed Solution
Transform the `ProjectCard` into a **Layered Information** component.
1.  **Header (Always Visible):** Name, Status, Description (truncated), PM, Version.
2.  **Summary Row:** Top 3-5 Keywords + "Show X more".
3.  **Content Area (Tabbed/Collapsible):**
    *   **Details** (Components, Glossary) - Hidden by default or inside a "Details" tab.
    *   **Rules** (Priority) - Hidden by default.

### 2.1 Visual Structure

```
+-------------------------------------------------------------+
|  [Active]  FeodalMe                                  v1.2   |
|  Project Manager: #12                                       |
|  ---------------------------------------------------------  |
|  Comprehensive analytics platform for land market...        |
|                                                             |
|  [Land] [Agro] [Market] (+12 more)                          |
|                                                             |
|  > View Details (Components, Glossary, Rules)     [v]       |
|                                                             |
|  [Edit] [Delete]                                            |
+-------------------------------------------------------------+
```

### 2.2 Component State
*   `isOpen`: boolean (toggles the details section)
*   Keywords: `.slice(0, 5)` for the preview.

## 3. Implementation Plan

### Step 1: Component Refactor
Modify `frontend/src/features/projects/components/ProjectCard.tsx`

```tsx
// Imports
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

// Inside Component
const [isOpen, setIsOpen] = useState(false)

// Keywords Section
<div className="flex flex-wrap gap-2">
  {project.keywords.slice(0, 5).map(k => <Badge>{k}</Badge>)}
  {project.keywords.length > 5 && (
     <Badge variant="outline">+{project.keywords.length - 5}</Badge>
  )}
</div>

// Collapsible Area
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm" className="w-full justify-between">
       View Project Details
       {isOpen ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
     {/* Existing Components, Glossary, Rules loops here */}
  </CollapsibleContent>
</Collapsible>
```

## 4. Expected Outcome
*   **Height Reduction:** approx 50-70% reduction in default state.
*   **Scannability:** Users can see 4-6 projects per screen instead of 1-2.
*   **Performance:** Less DOM nodes rendered initially (if using `forceMount={false}`).

## 5. Mobile Considerations
The `CompactCard` (mobile view) is already quite compact. This refactor primarily targets the Desktop view (`hidden sm:block`) where the "Full Card" is shown.
