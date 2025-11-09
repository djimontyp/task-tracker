# Automation UX Figma Design Specifications
**Comprehensive Design System for Version Management Automation**

## Table of Contents
1. [Design System Foundation](#design-system-foundation)
2. [Component Library](#component-library)
3. [Screen Designs](#screen-designs)
4. [Interaction Flows](#interaction-flows)
5. [Responsive Behavior](#responsive-behavior)
6. [Implementation Notes](#implementation-notes)

---

## Figma File Structure

**Recommended Figma Organization:**
```
📁 Automation Version Management Design System
├── 📄 00 - Design Tokens (Colors, Typography, Spacing)
├── 📄 01 - Atoms (Buttons, Inputs, Badges, Icons)
├── 📄 02 - Molecules (Cards, Form Fields, Dropdowns)
├── 📄 03 - Organisms (Rule Builder, Dashboard Cards, Tables)
├── 📄 04 - Templates (Page Layouts)
├── 📄 05 - Screens - Onboarding Wizard
├── 📄 06 - Screens - Rule Builder
├── 📄 07 - Screens - Dashboard
├── 📄 08 - Screens - Scheduler Management
├── 📄 09 - Screens - Notification Settings
└── 📄 10 - Interactive Prototype (All flows connected)
```

---

## Design System Foundation

### Color System

#### Primary Colors
```
Primary Blue:
- blue-50:  #eff6ff (backgrounds, hover states)
- blue-100: #dbeafe (light backgrounds)
- blue-500: #3b82f6 (primary actions)
- blue-600: #2563eb (primary hover, focus rings)
- blue-700: #1d4ed8 (active states)
- blue-900: #1e3a8a (text on light backgrounds)

Contrast Ratios:
- blue-600 on white: 7.5:1 ✅ AAA
- blue-700 on white: 10.2:1 ✅ AAA
```

#### Semantic Colors
```
Success (Green):
- green-50:  #f0fdf4
- green-100: #dcfce7
- green-500: #22c55e
- green-600: #16a34a (4.8:1 on white ✅ AA)
- green-700: #15803d (6.2:1 on white ✅ AA)

Error (Red):
- red-50:  #fef2f2
- red-100: #fee2e2
- red-500: #ef4444
- red-600: #dc2626 (5.9:1 on white ✅ AA)
- red-700: #b91c1c (7.5:1 on white ✅ AAA)

Warning (Yellow):
- yellow-50:  #fefce8
- yellow-100: #fef9c3
- yellow-500: #eab308 (1.9:1 - use for backgrounds only)
- yellow-600: #ca8a04
- yellow-700: #a16207 (4.6:1 on white ✅ AA)

Info (Blue):
- Same as Primary Blue

Neutral (Gray):
- gray-50:  #f9fafb
- gray-100: #f3f4f6
- gray-200: #e5e7eb
- gray-300: #d1d5db
- gray-400: #9ca3af (2.9:1 - use for disabled text)
- gray-500: #6b7280 (4.7:1 on white ✅ AA)
- gray-600: #4b5563 (8.6:1 on white ✅ AAA)
- gray-700: #374151 (11.4:1 on white ✅ AAA)
- gray-800: #1f2937 (14.8:1 on white ✅ AAA)
- gray-900: #111827 (18.6:1 on white ✅ AAA)
```

#### Background Colors
```
Light Mode:
- Page Background: white (#ffffff)
- Card Background: white (#ffffff)
- Secondary Background: gray-50 (#f9fafb)
- Border: gray-200 (#e5e7eb)

Dark Mode:
- Page Background: gray-900 (#111827)
- Card Background: gray-800 (#1f2937)
- Secondary Background: gray-800 (#1f2937)
- Border: gray-700 (#374151)
```

---

### Typography

**Font Family:** Inter (Google Fonts)
```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

**Type Scale:**
```
Display (Page Titles):
- Font: Inter Bold (700)
- Size: 30px (1.875rem)
- Line Height: 36px (1.2)
- Letter Spacing: -0.02em
- Use: Main page headings

Heading 1 (Section Titles):
- Font: Inter Semibold (600)
- Size: 24px (1.5rem)
- Line Height: 32px (1.33)
- Letter Spacing: -0.01em
- Use: Major section headings

Heading 2 (Subsection Titles):
- Font: Inter Semibold (600)
- Size: 20px (1.25rem)
- Line Height: 28px (1.4)
- Letter Spacing: -0.01em
- Use: Subsection headings, card titles

Heading 3 (Component Titles):
- Font: Inter Medium (500)
- Size: 18px (1.125rem)
- Line Height: 24px (1.33)
- Letter Spacing: 0
- Use: Component titles, dialog titles

Body Large:
- Font: Inter Regular (400)
- Size: 16px (1rem)
- Line Height: 24px (1.5)
- Letter Spacing: 0
- Use: Main body text, form labels

Body (Default):
- Font: Inter Regular (400)
- Size: 14px (0.875rem)
- Line Height: 20px (1.43)
- Letter Spacing: 0
- Use: Most UI text, button text

Body Small:
- Font: Inter Regular (400)
- Size: 12px (0.75rem)
- Line Height: 16px (1.33)
- Letter Spacing: 0
- Use: Helper text, captions, metadata

Code:
- Font: JetBrains Mono (monospace)
- Size: 14px (0.875rem)
- Line Height: 20px (1.43)
- Use: Cron expressions, technical values
```

---

### Spacing System

**4px Grid System:**
```
0:   0px      (no space)
1:   4px      (0.25rem) - Tight spacing, icon padding
2:   8px      (0.5rem)  - Default gap, small padding
3:   12px     (0.75rem) - Form field spacing
4:   16px     (1rem)    - Card padding, default margin
5:   20px     (1.25rem) - Section spacing
6:   24px     (1.5rem)  - Large card padding
8:   32px     (2rem)    - Section separation
10:  40px     (2.5rem)  - Major section gaps
12:  48px     (3rem)    - Page margins
16:  64px     (4rem)    - Hero spacing
20:  80px     (5rem)    - Extra large gaps
```

**Component Internal Spacing:**
```
Button:
- Padding: 12px 16px (vertical horizontal)
- Gap between icon and text: 8px

Card:
- Padding: 24px
- Gap between elements: 16px

Form Field:
- Gap between label and input: 8px
- Gap between fields: 16px

Table:
- Cell padding: 12px 16px
- Row gap: 0 (border-separated)
```

---

### Elevation (Shadows)

```
Level 0 (No shadow):
- Use: Flat buttons, inline elements

Level 1 (Subtle):
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
- Use: Cards, dropdowns, inputs

Level 2 (Default):
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
- Use: Elevated cards, popovers

Level 3 (High):
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
- Use: Modals, floating panels

Level 4 (Highest):
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
- Use: Dialogs, notifications
```

---

### Border Radius

```
None:   0px    - Tables, alerts
Small:  4px    - Buttons, inputs, badges
Medium: 6px    - Cards, dropdowns
Large:  8px    - Modals, large cards
XL:     12px   - Hero sections
Full:   9999px - Pills, avatars, status dots
```

---

## Component Library

### 1. Button Component

**Variants:**
- Type: primary | secondary | outline | ghost | danger
- Size: small | medium | large
- State: default | hover | active | disabled | loading
- Icon: none | left | right | only

**Specifications:**

**Primary Button:**
```
Size Medium (Default):
- Height: 40px
- Padding: 12px 16px
- Font: Inter Medium (500), 14px
- Border Radius: 6px
- Background: blue-600 (#2563eb)
- Text: white (#ffffff)
- Border: none
- Shadow: Level 1

Hover:
- Background: blue-700 (#1d4ed8)
- Shadow: Level 2
- Transition: all 150ms ease

Active:
- Background: blue-800
- Shadow: Level 0 (inset)

Disabled:
- Background: gray-300 (#d1d5db)
- Text: gray-500 (#6b7280)
- Cursor: not-allowed
- Opacity: 0.6

Focus:
- Outline: 2px solid blue-600
- Outline Offset: 2px

Loading:
- Spinner icon (left side)
- Text: "Processing..." or maintain original text
- Disabled state styles
```

**Secondary Button:**
```
- Background: gray-100 (#f3f4f6)
- Text: gray-900 (#111827)
- Border: 1px solid gray-200 (#e5e7eb)

Hover:
- Background: gray-200
- Border: gray-300
```

**Outline Button:**
```
- Background: transparent
- Text: blue-600
- Border: 1px solid blue-600

Hover:
- Background: blue-50
- Border: blue-700
- Text: blue-700
```

**Ghost Button:**
```
- Background: transparent
- Text: gray-700
- Border: none

Hover:
- Background: gray-100
```

**Danger Button:**
```
- Background: red-600
- Text: white
- (Same states as primary, using red palette)
```

**Size Variants:**
```
Small:
- Height: 32px
- Padding: 8px 12px
- Font: 12px

Medium (Default):
- Height: 40px
- Padding: 12px 16px
- Font: 14px

Large:
- Height: 48px
- Padding: 16px 24px
- Font: 16px
```

**Icon Configurations:**
```
Icon Left:
- Icon size: 16px (small), 20px (medium), 24px (large)
- Gap: 8px
- Example: [Icon] Create Rule

Icon Right:
- Same as left, icon on right
- Example: Next Step [Icon]

Icon Only:
- Square button (width = height)
- Icon centered
- Padding: 8px (small), 12px (medium), 16px (large)
- Min width: 40px for touch target
```

---

### 2. Input Component

**Variants:**
- Type: text | number | email | password | search | textarea
- State: default | focus | error | disabled | success
- Size: small | medium | large

**Text Input Specifications:**

**Medium (Default):**
```
- Height: 40px
- Padding: 10px 12px
- Font: Inter Regular, 14px
- Border: 1px solid gray-300 (#d1d5db)
- Border Radius: 6px
- Background: white (#ffffff)
- Text: gray-900 (#111827)

Focus:
- Border: 1px solid blue-600
- Box Shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)
- Outline: none (using box-shadow instead)

Error:
- Border: 1px solid red-600
- Box Shadow: 0 0 0 3px rgba(220, 38, 38, 0.1)

Disabled:
- Background: gray-50
- Border: gray-200
- Text: gray-400
- Cursor: not-allowed

Success:
- Border: 1px solid green-600
- Box Shadow: 0 0 0 3px rgba(22, 163, 74, 0.1)
```

**With Icon:**
```
Icon Left:
- Padding Left: 40px
- Icon positioned at 12px from left
- Icon size: 20px
- Icon color: gray-400

Icon Right (e.g., clear button):
- Padding Right: 40px
- Icon positioned at 12px from right
```

**Input with Label:**
```
Layout (Vertical):
┌─────────────────────────────────────┐
│ Label Text *                         │ ← Label (14px, medium, gray-700)
│ ┌─────────────────────────────────┐ │
│ │ Input value                     │ │ ← Input (40px height)
│ └─────────────────────────────────┘ │
│ Helper text or error message        │ ← Helper (12px, gray-500 or red-600)
└─────────────────────────────────────┘

Spacing:
- Label to Input: 8px
- Input to Helper: 4px
- Between Fields: 16px
```

---

### 3. Select/Dropdown Component

**Specifications:**
```
Trigger Button:
- Height: 40px
- Padding: 10px 12px
- Border: 1px solid gray-300
- Border Radius: 6px
- Background: white
- Display: flex, justify-between, align-center
- Text: gray-900 (selected) or gray-400 (placeholder)
- Icon: ChevronDown (right side, 20px)

Hover:
- Border: gray-400
- Background: gray-50

Focus:
- Border: blue-600
- Box Shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)

Dropdown Menu:
- Background: white
- Border: 1px solid gray-200
- Border Radius: 6px
- Shadow: Level 3
- Max Height: 300px (scrollable)
- Padding: 4px
- Z-index: 50

Menu Item:
- Height: 36px
- Padding: 8px 12px
- Border Radius: 4px
- Font: 14px, regular
- Cursor: pointer

Menu Item Hover:
- Background: gray-100

Menu Item Selected:
- Background: blue-50
- Text: blue-700
- Icon: CheckIcon (right side)

Menu Item Focused (keyboard):
- Background: blue-100
- Outline: 2px solid blue-600 (inside)
```

---

### 4. Badge Component

**Variants:**
- Type: default | success | error | warning | info
- Size: small | medium | large

**Specifications:**

**Default Badge (Gray):**
```
Size Medium:
- Height: 24px
- Padding: 4px 10px
- Font: Inter Medium, 12px
- Border Radius: 12px (pill)
- Background: gray-100
- Text: gray-700
- Border: 1px solid gray-200

Size Small:
- Height: 20px
- Padding: 2px 8px
- Font: 11px

Size Large:
- Height: 28px
- Padding: 6px 12px
- Font: 13px
```

**Status Badges:**
```
Success (Enabled):
- Background: green-100
- Text: green-700
- Border: green-200

Error (Failed):
- Background: red-100
- Text: red-700
- Border: red-200

Warning (Degraded):
- Background: yellow-100
- Text: yellow-700
- Border: yellow-200

Info (Running):
- Background: blue-100
- Text: blue-700
- Border: blue-200
```

**With Icon:**
```
Icon Left:
- Icon size: 14px
- Gap: 4px
- Example: [✓] Enabled
```

**Dot Indicator (Status):**
```
- Dot size: 6px diameter
- Gap: 6px
- Example: ● Enabled
```

---

### 5. Card Component

**Specifications:**

**Default Card:**
```
- Background: white
- Border: 1px solid gray-200
- Border Radius: 8px
- Padding: 24px
- Shadow: Level 1

Hover (if clickable):
- Shadow: Level 2
- Border: gray-300
- Transition: all 200ms ease

Focus (if interactive):
- Outline: 2px solid blue-600
- Outline Offset: 2px
```

**Card Header:**
```
- Margin Bottom: 16px
- Display: flex, justify-between, align-center

Title:
- Font: Inter Semibold, 18px
- Color: gray-900

Subtitle:
- Font: Inter Regular, 14px
- Color: gray-500
- Margin Top: 4px
```

**Card Footer:**
```
- Margin Top: 16px
- Padding Top: 16px
- Border Top: 1px solid gray-200
- Display: flex, justify-between, align-center
```

---

### 6. Switch/Toggle Component

**Specifications:**

**Switch (Boolean):**
```
Container:
- Width: 44px
- Height: 24px
- Border Radius: 12px (full pill)
- Background: gray-200 (off), blue-600 (on)
- Padding: 2px
- Cursor: pointer
- Transition: background 200ms ease

Thumb (Circle):
- Width: 20px
- Height: 20px
- Border Radius: 50%
- Background: white
- Shadow: Level 1
- Position: Absolute
  - Left: 2px (off)
  - Right: 2px (on)
- Transition: transform 200ms ease

Disabled:
- Background: gray-100 (off), blue-200 (on)
- Cursor: not-allowed

Focus:
- Outline: 2px solid blue-600
- Outline Offset: 2px
```

**Usage with Label:**
```
Layout:
┌─────────────────────────────────┐
│ [Toggle] Enable Automation      │ ← Inline
└─────────────────────────────────┘

or

┌─────────────────────────────────┐
│ Enable Automation     [Toggle]  │ ← Label left, toggle right
│ Automatically approve high      │ ← Description below
│ confidence versions             │
└─────────────────────────────────┘
```

---

### 7. Slider Component

**Specifications:**

**Threshold Slider (0.0 - 1.0):**
```
Track:
- Height: 4px
- Border Radius: 2px
- Background: gray-200
- Width: 100%

Filled Track:
- Background: blue-600
- Width: percentage (e.g., 85%)

Thumb:
- Width: 20px
- Height: 20px
- Border Radius: 50%
- Background: white
- Border: 2px solid blue-600
- Shadow: Level 2
- Cursor: grab
- Active Cursor: grabbing

Hover:
- Thumb scale: 1.1
- Thumb shadow: Level 3

Focus:
- Outline: 2px solid blue-600
- Outline Offset: 2px

Value Display:
- Position: above thumb
- Font: Inter Medium, 12px
- Background: gray-900
- Text: white
- Padding: 4px 8px
- Border Radius: 4px
- Pointer Events: none
```

**With Labels:**
```
┌─────────────────────────────────────────┐
│ Confidence Threshold                    │ ← Label
│ ┌───────────────●─────────────────────┐ │ ← Slider
│ 0.0                               1.0  │ ← Min/Max labels
│ Current: 0.85                           │ ← Value display
└─────────────────────────────────────────┘
```

---

### 8. Table Component

**Specifications:**

**Table Container:**
```
- Background: white
- Border: 1px solid gray-200
- Border Radius: 8px
- Overflow: auto (horizontal scroll if needed)
```

**Table Header:**
```
- Background: gray-50
- Border Bottom: 1px solid gray-200
- Font: Inter Medium, 12px, uppercase
- Letter Spacing: 0.05em
- Color: gray-600
- Padding: 12px 16px

Sortable Header:
- Cursor: pointer
- Hover: gray-100
- Icon: ChevronUp/Down (right side)
```

**Table Row:**
```
- Border Bottom: 1px solid gray-100
- Padding: 12px 16px
- Font: Inter Regular, 14px
- Color: gray-900

Hover:
- Background: gray-50

Selected:
- Background: blue-50
- Border: 1px solid blue-200
```

**Table Cell:**
```
Text Alignment:
- Text: left
- Numbers: right
- Actions: center

Padding:
- Default: 12px 16px
- Compact: 8px 12px
```

**Empty State:**
```
- Center aligned
- Icon: 48px (gray-300)
- Title: Inter Medium, 16px, gray-900
- Description: Inter Regular, 14px, gray-500
- Action Button (optional)
- Padding: 64px vertical
```

---

### 9. Progress Stepper Component

**Specifications:**

**Horizontal Stepper (Wizard):**
```
Step Container:
- Display: flex
- Justify: space-between
- Align: center
- Gap: 16px

Step Item:
┌────────────────────────┐
│   ┌─────┐              │
│   │  1  │  Step Name   │ ← Number + Label
│   └─────┘              │
│     │                  │
│   ──────               │ ← Connector line
└────────────────────────┘

Step Number Circle:
- Width: 40px
- Height: 40px
- Border Radius: 50%
- Font: Inter Semibold, 16px
- Display: flex, center aligned

States:
Completed:
- Background: blue-600
- Text: white
- Icon: CheckIcon (instead of number)

Current:
- Background: blue-100
- Text: blue-700
- Border: 2px solid blue-600

Upcoming:
- Background: gray-100
- Text: gray-500
- Border: 1px solid gray-300

Connector Line:
- Width: 100% (flex-grow)
- Height: 2px
- Background: gray-200 (upcoming), blue-600 (completed)
```

---

### 10. Modal/Dialog Component

**Specifications:**

**Overlay:**
```
- Background: rgba(0, 0, 0, 0.5)
- Backdrop Filter: blur(4px)
- Z-index: 40
- Full viewport (fixed position)
```

**Modal Container:**
```
- Background: white
- Border Radius: 12px
- Shadow: Level 4
- Max Width: 600px (default), 800px (large), 400px (small)
- Max Height: 90vh
- Overflow: auto
- Z-index: 50
- Position: centered in viewport
```

**Modal Header:**
```
- Padding: 24px 24px 16px 24px
- Border Bottom: 1px solid gray-200

Title:
- Font: Inter Semibold, 20px
- Color: gray-900

Close Button:
- Position: absolute, top-right (16px, 16px)
- Size: 32px × 32px
- Icon: X (20px)
- Hover: background gray-100
- Focus: outline blue-600
```

**Modal Body:**
```
- Padding: 24px
- Overflow: auto
- Max Height: calc(90vh - 140px)
```

**Modal Footer:**
```
- Padding: 16px 24px 24px 24px
- Border Top: 1px solid gray-200
- Display: flex
- Justify: flex-end
- Gap: 12px

Button Order:
- Cancel/Secondary (left)
- Confirm/Primary (right)
```

---

### 11. Toast Notification Component

**Specifications:**

**Container:**
```
- Position: fixed, top-right (24px, 24px)
- Width: 400px
- Background: white
- Border: 1px solid gray-200
- Border Radius: 8px
- Shadow: Level 3
- Padding: 16px
- Z-index: 100
- Animation: slide-in-right 300ms ease
```

**Layout:**
```
┌────────────────────────────────────┐
│ [Icon] Title              [Close] │
│        Description text            │
│        [Action Button]             │
└────────────────────────────────────┘

Icon: 24px (left side, color-coded)
Title: Inter Medium, 14px, gray-900
Description: Inter Regular, 14px, gray-600
Close: 20px icon (top-right)
Action Button: Optional ghost button
```

**Variants:**
```
Success:
- Icon: CheckCircleIcon (green-600)
- Left Border: 4px solid green-600

Error:
- Icon: XCircleIcon (red-600)
- Left Border: 4px solid red-600

Warning:
- Icon: AlertTriangleIcon (yellow-600)
- Left Border: 4px solid yellow-600

Info:
- Icon: InfoIcon (blue-600)
- Left Border: 4px solid blue-600
```

**Auto-Dismiss:**
```
Progress Bar (Bottom):
- Height: 4px
- Background: gray-200
- Filled: color-coded (matches variant)
- Animation: width 100% to 0% over duration
- Optional: User can disable for critical messages
```

---

## Screen Designs

### Screen 1: Onboarding Wizard

**Purpose:** Guide users through initial automation setup (5 steps)

**Step 1: Welcome**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                 Setup Automation          Skip → │
│                                                            │
│  ━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Step 1 of 5                                               │
│                                                            │
│         🤖                                                 │
│                                                            │
│   Welcome to Automation Setup                             │
│                                                            │
│   Automate your version management workflow to:           │
│                                                            │
│   ✓ Save 70% of manual review time                        │
│   ✓ Ensure consistent approval criteria                   │
│   ✓ Never miss pending versions                           │
│   ✓ Get notified on critical issues                       │
│                                                            │
│   This setup takes ~3 minutes.                            │
│                                                            │
│                          [Get Started]                     │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Progress Bar: 20% (Step 1/5)
- Emoji/Icon: Centered, 64px
- Title: Display font, 30px, centered
- Benefits: Body Large, 16px, left-aligned with checkmarks
- CTA Button: Primary, Large, centered
- Spacing: 48px between sections
```

**Step 2: Schedule Configuration**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                 Setup Automation          Skip → │
│                                                            │
│  ━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Step 2 of 5                                               │
│                                                            │
│  ⏱️ Configure Schedule                                     │
│                                                            │
│  How often should automation run?                         │
│                                                            │
│  ┌────────────┬────────────┬────────────┐                │
│  │   Hourly   │   Daily    │   Weekly   │  ← Radio tabs  │
│  │     ●      │            │            │                 │
│  └────────────┴────────────┴────────────┘                │
│                                                            │
│  Run every:  [1 ▼] hour(s)                                │
│                                                            │
│  ─────────────────────── or ───────────────────────       │
│                                                            │
│  [⚙️ Custom cron expression]                              │
│                                                            │
│  ┌──────────────────────────────────────────────┐        │
│  │ 💡 Recommendation                             │        │
│  │ Based on your activity, we suggest running   │        │
│  │ automation every 4 hours for optimal balance.│        │
│  └──────────────────────────────────────────────┘        │
│                                                            │
│  Next run: Today at 2:00 PM                               │
│                                                            │
│              [Previous]         [Continue]                │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Progress Bar: 40% (Step 2/5)
- Radio Tabs: Segmented control, 3 options
- Dropdown: Number selector with unit
- Recommendation Card: Info background (blue-50)
- Footer Buttons: Secondary (left), Primary (right)
```

**Step 3: Auto-Approval Rules**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                 Setup Automation          Skip → │
│                                                            │
│  ━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Step 3 of 5                                               │
│                                                            │
│  ✓ Set Approval Rules                                     │
│                                                            │
│  Automatically approve versions when:                     │
│                                                            │
│  Confidence Score                                         │
│  ┌──────────────────────●──────────────────┐             │
│  0.0                   0.85              1.0              │
│  Approve if confidence ≥ 85%                              │
│                                                            │
│  Similarity Score                                         │
│  ┌──────────────────────────●────────────┐               │
│  0.0                   0.90              1.0              │
│  Escalate if similarity ≥ 90% (potential duplicate)       │
│                                                            │
│  ┌──────────────────────────────────────────────┐        │
│  │ 📊 Impact Preview                             │        │
│  │                                                │        │
│  │ These rules would affect 23 pending versions: │        │
│  │ • 18 auto-approved ✅                          │        │
│  │ • 5 escalated for review ⚠️                    │        │
│  │                                                │        │
│  │ Estimated time savings: 1.2 hours/week        │        │
│  └──────────────────────────────────────────────┘        │
│                                                            │
│  [📚 Use Template Instead]                                │
│                                                            │
│              [Previous]         [Continue]                │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Progress Bar: 60% (Step 3/5)
- Sliders: Dual sliders with live value display
- Preview Card: Dynamic update on slider change
- Template Link: Ghost button, opens template modal
- Real-time Impact: Fetch from API on slider change (debounced 500ms)
```

**Step 4: Notification Settings**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                 Setup Automation          Skip → │
│                                                            │
│  ━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Step 4 of 5                                               │
│                                                            │
│  🔔 Notification Preferences                               │
│                                                            │
│  Stay informed about automation activity:                 │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │ Email Notifications         [Toggle ON]    │          │
│  │ me@example.com              [Edit]         │          │
│  └────────────────────────────────────────────┘          │
│                                                            │
│  Notify me when:                                          │
│  ☑ Automation errors occur                                │
│  ☑ Pending queue exceeds 50 versions                      │
│  ☐ Every automation run (not recommended)                 │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │ Telegram Notifications      [Toggle OFF]   │          │
│  │ [Connect Bot]                              │          │
│  └────────────────────────────────────────────┘          │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │ 💡 Tip                                      │          │
│  │ Enable Telegram for instant mobile alerts  │          │
│  │ when critical issues occur.                │          │
│  └────────────────────────────────────────────┘          │
│                                                            │
│              [Previous]         [Continue]                │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Progress Bar: 80% (Step 4/5)
- Toggle Switches: Standard 44x24px
- Checkboxes: Standard with labels
- Telegram Connect: Disabled until toggled on
- Tip Card: Info style (blue-50 background)
```

**Step 5: Review & Activate**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back                 Setup Automation                  │
│                                                            │
│  ━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━              │
│  Step 5 of 5                                               │
│                                                            │
│  ✓ Review & Activate                                      │
│                                                            │
│  You're all set! Here's your automation summary:          │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │ 📅 Schedule                                │          │
│  │ Every 1 hour                                │          │
│  │ Next run: Today at 2:00 PM                 │          │
│  │                                   [Edit]   │          │
│  ├────────────────────────────────────────────┤          │
│  │ ✓ Approval Rules                           │          │
│  │ • Auto-approve if confidence ≥ 85%         │          │
│  │ • Escalate if similarity ≥ 90%             │          │
│  │ Impact: ~18 versions auto-approved         │          │
│  │                                   [Edit]   │          │
│  ├────────────────────────────────────────────┤          │
│  │ 🔔 Notifications                           │          │
│  │ • Email: me@example.com                    │          │
│  │ • Telegram: Not connected                  │          │
│  │ Alerts: Errors, Queue threshold            │          │
│  │                                   [Edit]   │          │
│  └────────────────────────────────────────────┘          │
│                                                            │
│  ☑ I understand automation will process versions          │
│     based on these rules                                  │
│                                                            │
│              [Previous]    [Activate Automation]          │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Progress Bar: 100% (Step 5/5)
- Summary Cards: Grouped sections with edit links
- Checkbox: Confirmation required to enable submit
- Activate Button: Primary, disabled until checkbox checked
- Edit Links: Navigate back to specific step
```

---

### Screen 2: Visual Rule Builder

**Purpose:** Create and edit automation rules with visual interface

**Main Rule Builder:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Automation         Create Rule              [Save]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Rule Name *                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ High Confidence Auto-Approval                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Description                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Automatically approve versions with high ML confidence     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ 📘 Rule Template Library                  [Browse →]   │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ──────────────────────────────────────────────────────────      │
│                                                                    │
│  ⚡ TRIGGER                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ When should this rule run?                                 │  │
│  │                                                             │  │
│  │ ○ Schedule     ● Manual     ○ Event                        │  │
│  │                                                             │  │
│  │ Frequency: [Every day ▼]  at  [14:00 ▼]  (UTC-5 Eastern)  │  │
│  │                                                             │  │
│  │ Next run: Tomorrow at 2:00 PM                              │  │
│  │ [⚙️ Advanced: Custom cron]                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ──────────────────────────────────────────────────────────      │
│                                                                    │
│  ✓ CONDITIONS (All must be true)                [Match ANY ▼]    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Field               Operator      Value                    │  │
│  │ [Confidence Score▼] [≥        ▼]  [0.85] 🎚️               │  │
│  │                                                          ╳  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Field               Operator      Value                    │  │
│  │ [Version Count   ▼] [<        ▼]  [10  ]                  │  │
│  │                                                          ╳  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [+ Add Condition]  [+ Add OR Group]                             │
│                                                                    │
│  ──────────────────────────────────────────────────────────      │
│                                                                    │
│  → ACTIONS                                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. [Approve versions        ▼]                          ╳ │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 2. [Send notification       ▼]                          ╳ │  │
│  │    Channel: [Email ▼]                                     │  │
│  │    Recipients: [me@example.com                          ] │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [+ Add Action]                                                   │
│                                                                    │
│  ──────────────────────────────────────────────────────────      │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ 📊 Impact Preview                                       │     │
│  │                                                          │     │
│  │ This rule would affect 23 pending versions:             │     │
│  │ • 18 would be auto-approved ✅                           │     │
│  │ • 5 would be escalated ⚠️                                │     │
│  │                                                          │     │
│  │ Last 7 days simulation:                                 │     │
│  │ • Would have processed 142 versions                     │     │
│  │ • Est. time saved: 3.2 hours                            │     │
│  │ • Est. accuracy: 96.5%                                  │     │
│  │                                                          │     │
│  │ [Test Rule]                                             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
│  [Cancel]                     [Save Draft]  [Save & Activate]    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

Specifications:
- Page Max Width: 900px, centered
- Section Spacing: 32px
- Section Headers: H2 with emoji/icon prefix
- Trigger/Condition/Action: Collapsible cards (shadow level 1)
- Add Buttons: Ghost style
- Remove Icons: Gray, hover red
- Preview Panel: Sticky (follows scroll), updates live
- Footer Buttons: Fixed at bottom when scrolling
```

**Template Modal (When clicking Browse Templates):**
```
┌──────────────────────────────────────────────────────────┐
│  Rule Template Library                          [Close]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  [Search templates...]                       [Filter ▼]   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ High Confidence Auto-Approval             Popular   │   │
│  │ Automatically approve versions with ≥90%            │   │
│  │ confidence score                                    │   │
│  │                                                     │   │
│  │ 1,234 uses                            [Use Template]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Similar Version Detection                           │   │
│  │ Escalate versions with ≥85% similarity to           │   │
│  │ existing topics (potential duplicates)              │   │
│  │                                                     │   │
│  │ 856 uses                              [Use Template]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Daily Cleanup                                       │   │
│  │ Process pending queue every day at 2 AM             │   │
│  │                                                     │   │
│  │ 723 uses                              [Use Template]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Weekly Digest                                       │   │
│  │ Send summary notification every Monday at 9 AM      │   │
│  │                                                     │   │
│  │ 612 uses                              [Use Template]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Safety Net                                          │   │
│  │ Escalate all production topic versions for         │   │
│  │ manual review (extra caution)                       │   │
│  │                                                     │   │
│  │ 489 uses                              [Use Template]│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│                                            [Create Custom] │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Modal: 600px width, max-height 80vh
- Template Cards: Hover effect (shadow level 2)
- Search: Real-time filter
- Popular Badge: Blue badge component
- Use Template: Primary button, imports template to builder
```

---

### Screen 3: Monitoring Dashboard

**Purpose:** Overview of automation health and performance

**Dashboard Layout:**
```
┌────────────────────────────────────────────────────────────────────┐
│  Automation Dashboard                    [⚙️ Settings]  [+ New Rule]│
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┬────────────────────┬────────────────────┐  │
│  │ Auto-Approval Rate │ Pending Queue      │ Active Rules       │  │
│  │                    │                    │                    │  │
│  │      87.3%         │     14 versions    │     5 rules        │  │
│  │    ↑ 2.1%          │     ↓ 6 today      │   [View All →]    │  │
│  │                    │                    │                    │  │
│  │  🟢 Healthy        │  🟡 High Load      │   🟢 All Running  │  │
│  └────────────────────┴────────────────────┴────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Scheduler Health                              🟢 Healthy │   │
│  │ All jobs running normally                                   │   │
│  │ Next scheduled run: Daily Cleanup in 3 hours                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📈 Auto-Approval Trend (Last 7 Days)                        │   │
│  │                                                              │   │
│  │   100%                                                       │   │
│  │    90%              ●───●                                    │   │
│  │    80%        ●───●       ●───●───●                          │   │
│  │    70%   ●───●                                               │   │
│  │    60%                                                       │   │
│  │     0%                                                       │   │
│  │       Nov20 Nov21 Nov22 Nov23 Nov24 Nov25 Nov26             │   │
│  │                                                              │   │
│  │  [7 Days]  [30 Days]  [90 Days]                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🎯 Rule Performance                         [View Details →] │   │
│  │                                                              │   │
│  │ ┌──────────────────────────────────────────────────────┐   │   │
│  │ │ Rule Name          Triggered  Success Rate  Status   │   │   │
│  │ ├──────────────────────────────────────────────────────┤   │   │
│  │ │ High Confidence       142      98.6%     🟢 Enabled │   │   │
│  │ │ Similar Version        23      95.7%     🟢 Enabled │   │   │
│  │ │ Daily Cleanup           7     100.0%     🟢 Enabled │   │   │
│  │ │ Weekly Digest           1     100.0%     🟢 Enabled │   │   │
│  │ │ Safety Net             45      91.1%     🟢 Enabled │   │   │
│  │ └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📋 Recent Execution Log                     [View All →]    │   │
│  │                                                              │   │
│  │ ┌──────────────────────────────────────────────────────┐   │   │
│  │ │ Time      Rule              Matched  Status          │   │   │
│  │ ├──────────────────────────────────────────────────────┤   │   │
│  │ │ 1:00 PM   High Confidence   18       ✅ Success      │   │   │
│  │ │ 12:00 PM  High Confidence   23       ✅ Success      │   │   │
│  │ │ 11:00 AM  Similar Version    5       ✅ Success      │   │   │
│  │ │ 10:00 AM  High Confidence   19       ⚠️ Partial     │   │   │
│  │ │ 9:00 AM   High Confidence   21       ✅ Success      │   │   │
│  │ └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

Specifications:
- Page Max Width: 1200px, centered
- Metric Cards: 3-column grid (equal width)
- Card Height: 160px
- Status Indicator: Colored dot + text
- Trend Chart: Recharts LineChart component
- Time Period Toggle: Segmented control
- Table: Sortable columns, hover rows
- Status Icons: Color-coded (green/red/yellow)
- Section Spacing: 32px vertical
```

**Metric Card Component Specs:**
```
Card:
- Width: 100% (flex: 1)
- Height: 160px
- Padding: 24px
- Background: white
- Border: 1px solid gray-200
- Border Radius: 8px
- Shadow: Level 1

Layout:
┌─────────────────────┐
│ Metric Title        │ ← H3, 14px, gray-600
│                     │
│ 87.3%               │ ← Display, 36px, gray-900
│ ↑ 2.1%              │ ← Body Small, 12px, green-600 (positive) / red-600 (negative)
│                     │
│ 🟢 Healthy          │ ← Badge at bottom
└─────────────────────┘

States:
Healthy: Green dot + text
Warning: Yellow dot + text
Error: Red dot + text
```

---

### Screen 4: Scheduler Management

**Purpose:** Manage scheduled automation jobs

**Scheduler List:**
```
┌────────────────────────────────────────────────────────────────────┐
│  Scheduler Management                                [+ Create Job] │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Search jobs...]                                       [Filter ▼]  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Job Name         Schedule      Last Run    Next Run   Status │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Daily Cleanup    Daily 2:00 AM 1 hour ago  in 23 hrs  🟢●── │  │
│  │                  "0 2 * * *"                                  │  │
│  │                  [⚙️]  [▶️]  [⏸️]  [🗑️]                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Hourly Process   Every hour    5 min ago   in 55 min  🟢●── │  │
│  │                  "0 * * * *"                                  │  │
│  │                  [⚙️]  [▶️]  [⏸️]  [🗑️]                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Weekly Digest    Mon 9:00 AM   2 days ago  in 5 days  🟢●── │  │
│  │                  "0 9 * * 1"                                  │  │
│  │                  [⚙️]  [▶️]  [⏸️]  [🗑️]                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ Backup Process   Daily 3:00 AM Error (1hr) in 22 hrs  🔴●── │  │
│  │                  "0 3 * * *"                                  │  │
│  │                  [⚙️]  [▶️]  [⏸️]  [🗑️]                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

Specifications:
- Table: Full width, striped rows (hover gray-50)
- Job Name: Bold, 14px
- Schedule: Body Small (12px), gray-600
- Cron Expression: Monospace font, gray-500, below schedule
- Status Indicator: Dot + toggle switch
- Action Icons: Icon buttons (ghost), 32px × 32px
  - ⚙️ Edit
  - ▶️ Run Now
  - ⏸️ Pause/Resume (toggle)
  - 🗑️ Delete
```

**Create/Edit Job Dialog:**
```
┌──────────────────────────────────────────────────────────┐
│  Create Scheduled Job                           [Close]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Job Name *                                                │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Daily Cleanup                                      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Description                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Process pending queue every day at 2 AM            │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────── Simple Schedule ─────────────┐            │
│  │                                            │            │
│  │  Frequency: [Daily ▼]                     │            │
│  │  Time: [02:00]  Timezone: [UTC-5 ▼]      │            │
│  │                                            │            │
│  │  Next run: Tomorrow at 2:00 AM            │            │
│  │                                            │            │
│  │  [⚙️ Advanced: Custom cron expression]    │            │
│  └────────────────────────────────────────────┘            │
│                                                            │
│  Linked Rule *                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [High Confidence Auto-Approval          ▼]        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ☑ Enabled (job will run automatically)                   │
│                                                            │
│  [Cancel]                              [Create Job]       │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Modal: 600px width
- Form Fields: Standard spacing (16px between)
- Simple Schedule: Card component (gray-50 background)
- Advanced Cron: Expandable (click to reveal custom input)
- Checkbox: Enabled by default
- Create Button: Disabled until required fields filled
```

**Advanced Cron Picker (Expanded):**
```
┌──────────── Advanced Schedule ──────────────┐
│                                              │
│  Cron Expression *                           │
│  ┌──────────────────────────────────────┐   │
│  │ 0 2 * * *                            │   │  ← Monospace font
│  └──────────────────────────────────────┘   │
│  Format: minute hour day month weekday       │
│                                              │
│  Human readable:                             │
│  "Every day at 2:00 AM"                      │
│                                              │
│  Next 5 runs:                                │
│  • Tomorrow at 2:00 AM                       │
│  • Dec 1 at 2:00 AM                          │
│  • Dec 2 at 2:00 AM                          │
│  • Dec 3 at 2:00 AM                          │
│  • Dec 4 at 2:00 AM                          │
│                                              │
│  [✓ Validate]  [📖 Cron Syntax Help]        │
│                                              │
│  [🔙 Use Simple Schedule]                    │
└──────────────────────────────────────────────┘

Specifications:
- Cron Input: Monospace font, instant validation
- Human Readable: Auto-update on input change
- Next 5 Runs: List format, gray-700
- Validate Button: Ghost, triggers validation
- Help Link: Opens documentation modal
- Back Button: Returns to simple schedule mode
```

---

### Screen 5: Notification Settings

**Purpose:** Configure notification channels and preferences

**Settings Page:**
```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back                  Notification Settings              [Save]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📧 Email Notifications                        [Toggle ON ──●]│   │
│  │                                                              │   │
│  │  Recipients                                                  │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ me@example.com, team@example.com                       │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │  Comma-separated email addresses                            │   │
│  │                                                              │   │
│  │  [Send Test Email]                                          │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 💬 Telegram Notifications                     [Toggle OFF ●──]│  │
│  │                                                              │   │
│  │  ⚠️ Not connected                                            │   │
│  │  Connect your Telegram bot to receive instant alerts        │   │
│  │                                                              │   │
│  │  [Connect Bot]                                              │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔔 Alert Preferences                                         │   │
│  │                                                              │   │
│  │  Notify me when:                                             │   │
│  │  ☑ Automation errors occur                                   │   │
│  │  ☑ Pending queue exceeds threshold                           │   │
│  │  ☐ Every automation run (not recommended)                    │   │
│  │  ☑ Daily digest (summary email)                              │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📊 Digest Configuration                                      │   │
│  │                                                              │   │
│  │  Frequency: [Daily ▼]                                        │   │
│  │  Time: [09:00]  Timezone: [UTC-5 Eastern ▼]                 │   │
│  │  Days: ☑ Mon ☑ Tue ☑ Wed ☑ Thu ☑ Fri ☐ Sat ☐ Sun           │   │
│  │                                                              │   │
│  │  Next digest: Tomorrow at 9:00 AM                            │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚙️ Thresholds                                                 │   │
│  │                                                              │   │
│  │  Pending Queue Alert                                         │   │
│  │  ┌──────────────●──────────────────────┐                    │   │
│  │  0                50                 100 versions            │   │
│  │  Notify if pending queue exceeds 50 versions                │   │
│  │                                                              │   │
│  │  Error Rate Alert                                            │   │
│  │  ┌─────────────────────●───────────────┐                    │   │
│  │  0%                   5%              10%                    │   │
│  │  Notify if error rate exceeds 5%                            │   │
│  │                                                              │   │
│  │  Auto-Approval Rate Alert                                    │   │
│  │  ┌─────────●───────────────────────────┐                    │   │
│  │  0%       80%                        100%                    │   │
│  │  Notify if auto-approval rate drops below 80%               │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Cancel]                                                [Save]     │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

Specifications:
- Page Max Width: 800px, centered
- Section Cards: Shadow level 1, 24px padding
- Card Spacing: 24px vertical
- Toggle Switches: In card header (right aligned)
- Test Button: Ghost style
- Connect Button: Primary, opens Telegram connection wizard
- Checkboxes: Standard with labels
- Day Selector: Inline checkboxes (flexbox)
- Sliders: Range sliders with labels
- Footer Buttons: Fixed position on scroll
```

**Telegram Connection Wizard Modal:**
```
┌──────────────────────────────────────────────────────────┐
│  Connect Telegram Bot                           [Close]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Create Bot                                        │
│                                                            │
│  1. Open Telegram and search for @BotFather                │
│  2. Send /newbot command                                   │
│  3. Follow instructions to create your bot                 │
│  4. Copy the bot token                                     │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Bot Token *                                        │   │
│  │ ┌──────────────────────────────────────────────┐  │   │
│  │ │ 123456789:ABCdefGhIJKlmnoPQRstuVWXyz         │  │   │
│  │ └──────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Step 2: Get Chat ID                                       │
│                                                            │
│  1. Send /start to your bot in Telegram                    │
│  2. Click the button below to verify connection            │
│                                                            │
│  [Verify Connection]                                       │
│                                                            │
│  ✅ Connection successful!                                 │
│  Chat ID: 123456789                                        │
│                                                            │
│  [Send Test Message]                                       │
│                                                            │
│  [Cancel]                              [Save & Connect]    │
│                                                            │
└──────────────────────────────────────────────────────────┘

Specifications:
- Modal: 600px width
- Step Numbers: Bold, larger font
- Instructions: Ordered list, clear spacing
- Token Input: Monospace font, password type initially
- Verify Button: Primary, triggers API call
- Success Message: Green checkmark + text
- Test Button: Enabled after verification
- Save Button: Disabled until verification complete
```

---

## Interaction Flows

### Flow 1: Onboarding Wizard (Happy Path)

```
User Action                  System Response                 Next State
──────────────────────────────────────────────────────────────────────
1. User clicks "Get Started" → Show Step 2 (Schedule)    → Progress: 40%
   on Welcome screen

2. User selects "Hourly"     → Update frequency options  → Show "Run every"
   radio button                 Show hour dropdown          dropdown

3. User sets "Every 4 hours" → Calculate next run time   → Display "Next run:
                                 Update preview             Today at 6:00 PM"

4. User clicks "Continue"    → Validate inputs            → Show Step 3
                                 Save progress              (Approval Rules)
                                 Update progress bar        Progress: 60%

5. User drags confidence     → Update slider value        → Preview updates:
   slider to 0.85               Calculate impact            "18 versions matched"
                                 Fetch pending count

6. User drags similarity     → Update slider value        → Preview updates:
   slider to 0.90               Calculate impact            "5 escalated"
                                 Fetch duplicate count

7. User clicks "Continue"    → Validate inputs            → Show Step 4
                                 Save progress              (Notifications)
                                 Update progress bar        Progress: 80%

8. User toggles Email ON     → Enable email fields        → Show email input
                                 Pre-fill user email        Pre-filled

9. User checks                → Enable thresholds         → Update notification
   "Automation errors"          Save preferences            summary

10. User clicks "Continue"   → Validate inputs            → Show Step 5
                                 Save progress              (Review & Activate)
                                 Update progress bar        Progress: 100%

11. User clicks Edit links   → Navigate to specific step → Show step with
    (optional review)            Preserve all data          saved values

12. User checks confirmation → Enable Activate button    → Button enabled
    checkbox

13. User clicks "Activate    → Create automation config  → Show success modal
    Automation"                  Start scheduler            Redirect to dashboard
                                 Send confirmation email    in 3 seconds
```

---

### Flow 2: Creating a Custom Rule

```
User Action                  System Response                 Next State
──────────────────────────────────────────────────────────────────────
1. User clicks "+ New Rule"  → Navigate to Rule Builder   → Show blank form
   from Dashboard               Clear previous draft

2. User enters rule name     → Save to draft              → Enable Save Draft
                                 Validate name unique

3. User selects "Schedule"   → Show frequency picker     → Display schedule
   trigger                       Default: Daily             options

4. User clicks               → Expand cron input         → Show cron validator
   "Advanced: Custom cron"      Hide simple picker

5. User types "0 */4 * * *"  → Validate cron syntax      → Show human readable:
   (every 4 hours)              Calculate next 5 runs      "Every 4 hours"
                                                           List run times

6. User clicks               → Add condition row         → Show field selector
   "+ Add Condition"            Default: first field

7. User selects              → Update operator options   → Show ≥, ≤, =, between
   "Confidence Score"           Load value range           operators

8. User selects "≥"          → Show value input          → Display slider
   operator                     Set default: 0.85          and text input

9. User drags slider to 0.90 → Update value              → Update preview panel:
                                 Debounce 500ms             "12 versions matched"
                                 Fetch matching count

10. User clicks              → Add action row            → Show action selector
    "+ Add Action"              Default: first action

11. User selects             → Update action config      → No additional fields
    "Approve versions"          Validate complete

12. User clicks              → Add notification row     → Show channel selector
    "+ Add Action"

13. User selects             → Show email config        → Display recipient
    "Send notification"         Default channel: Email     input

14. User clicks "Test Rule"  → Fetch matching versions  → Show detailed preview:
                                 Simulate outcomes          - Version list
                                 Calculate metrics          - Actions per version
                                                           - Estimated impact

15. User clicks              → Validate all fields      → Show success toast
    "Save & Activate"           Create rule in DB          Update dashboard
                                 Start scheduler            Close builder
                                 Send confirmation
```

---

### Flow 3: Editing an Existing Rule

```
User Action                  System Response                 Next State
──────────────────────────────────────────────────────────────────────
1. User clicks rule name     → Fetch rule details        → Show Rule Builder
   in Dashboard table           Populate all fields        with existing data

2. User modifies             → Save to draft             → Show "Unsaved changes"
   confidence threshold         Update preview panel       indicator

3. User clicks "Test Rule"   → Run simulation            → Show updated impact:
                                 Compare old vs new          "Old: 18 matched"
                                 Calculate delta             "New: 23 matched (+5)"

4. User clicks "Save"        → Validate changes          → Show confirmation modal:
                                 Check active runs          "Rule is currently
                                                           running. Save anyway?"

5. User confirms             → Update rule in DB         → Show success toast
                                 Restart scheduler          Update dashboard
                                 Log change in audit        Close builder

6. User clicks "Delete"      → Show confirmation dialog → "Delete 'Rule Name'?
   (alternative flow)           Check dependencies         This cannot be undone."

7. User confirms deletion    → Soft delete rule         → Show success toast
                                 Stop scheduler             Remove from dashboard
                                 Archive execution logs     Redirect to list
```

---

### Flow 4: Handling Automation Errors

```
System Event                 System Response                User Notification
──────────────────────────────────────────────────────────────────────
1. Scheduler runs rule       → Execute conditions       → (No notification)
                                 Fetch pending versions

2. Database connection       → Catch error              → Log error
   fails                        Retry 3 times (backoff)   Update job status

3. Retry fails               → Mark job as failed       → Send email:
                                 Update dashboard          "Automation Error"
                                 Create error log          + error details
                                                          + retry time

4. User receives email       → Click "View Details" link→ Navigate to dashboard

5. User views dashboard      → Show error banner:       → Display:
                                 "Backup Process failed"   - Error message
                                 Highlight failed job      - Stack trace
                                                          - Retry button

6. User clicks "Retry"       → Re-run job immediately   → Show spinner
                                 Update status to          "Retrying..."
                                 "Running"

7. Job succeeds              → Update status to Success → Show success toast
                                 Clear error banner        Update dashboard
                                 Send recovery email       metrics
```

---

## Responsive Behavior

### Desktop (≥1024px)
- **Dashboard**: 3-column metric cards, full-width chart
- **Rule Builder**: Sidebar preview (sticky), main form 70% width
- **Tables**: Show all columns, sortable headers
- **Modals**: Max-width 600px, centered

### Tablet (768px - 1023px)
- **Dashboard**: 2-column metric cards, stacked chart below
- **Rule Builder**: No sidebar, preview panel moves to bottom
- **Tables**: Hide less important columns (e.g., Description)
- **Modals**: Max-width 90%, centered

### Mobile (≤767px)
- **Dashboard**: 1-column layout, cards stack vertically
- **Rule Builder**: Single column, all sections stack
- **Tables**: Card-based layout (no table), show key info only
- **Modals**: Full-screen (100% width and height)
- **Touch Targets**: Minimum 44x44px
- **Navigation**: Hamburger menu

**Mobile Table Alternative (Card Layout):**
```
┌────────────────────────────────────┐
│ High Confidence Auto-Approval      │ ← Rule Name (bold)
│ 🟢 Enabled                         │ ← Status badge
│                                    │
│ Triggered: 142 times               │ ← Key metrics
│ Success Rate: 98.6%                │
│                                    │
│ [Edit]  [Pause]  [Delete]         │ ← Action buttons
└────────────────────────────────────┘
```

---

## Implementation Notes

### Technology Stack
- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand or React Query
- **Routing**: React Router v6

### Component Structure
```
src/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Switch.tsx
│   │   └── Slider.tsx
│   ├── molecules/
│   │   ├── FormField.tsx
│   │   ├── Card.tsx
│   │   ├── Dropdown.tsx
│   │   └── Toast.tsx
│   ├── organisms/
│   │   ├── RuleBuilder.tsx
│   │   ├── ConditionBuilder.tsx
│   │   ├── DashboardMetrics.tsx
│   │   ├── ExecutionLogTable.tsx
│   │   └── TemplateModal.tsx
│   ├── templates/
│   │   ├── OnboardingWizard.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── RuleEditorLayout.tsx
│   └── pages/
│       ├── AutomationDashboard.tsx
│       ├── RuleBuilderPage.tsx
│       ├── SchedulerPage.tsx
│       └── NotificationSettingsPage.tsx
```

### Key Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@heroicons/react": "^2.2.0",
    "recharts": "^2.10.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "tailwindcss": "^3.3.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  }
}
```

### Design Tokens (Tailwind Config)
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Use default Tailwind colors (already WCAG compliant)
        // blue, green, red, yellow, gray
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // 4px grid system (already in Tailwind)
      },
      boxShadow: {
        'level-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'level-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'level-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'level-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
```

### API Integration Points
```typescript
// API endpoints needed for UI
interface AutomationAPI {
  // Rules
  getRules(): Promise<Rule[]>;
  getRule(id: string): Promise<Rule>;
  createRule(data: RuleInput): Promise<Rule>;
  updateRule(id: string, data: RuleInput): Promise<Rule>;
  deleteRule(id: string): Promise<void>;
  testRule(id: string): Promise<TestResult>;

  // Templates
  getTemplates(): Promise<Template[]>;
  importTemplate(id: string): Promise<Rule>;

  // Scheduler
  getJobs(): Promise<Job[]>;
  createJob(data: JobInput): Promise<Job>;
  updateJob(id: string, data: JobInput): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  runJob(id: string): Promise<void>;

  // Execution Log
  getExecutions(filters: ExecutionFilters): Promise<Execution[]>;
  getExecution(id: string): Promise<ExecutionDetail>;

  // Metrics
  getMetrics(period: '7d' | '30d' | '90d'): Promise<Metrics>;
  getRulePerformance(): Promise<RulePerformance[]>;

  // Notifications
  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(data: NotificationSettings): Promise<void>;
  testEmail(): Promise<void>;
  connectTelegram(token: string): Promise<{ chatId: string }>;
  testTelegram(): Promise<void>;
}
```

---

## Figma Prototype Instructions

### Interactive Prototype Setup

**Flow 1: Onboarding Wizard**
1. Connect all 5 steps in sequence
2. "Continue" buttons → Next step (with transition: Smart Animate, 300ms)
3. "Previous" buttons → Previous step (Smart Animate, 300ms)
4. "Activate Automation" → Success modal (Instant transition) → Dashboard (after 3s delay)
5. Add hover states to all buttons (change background color)
6. Add focus states (blue outline) to form inputs

**Flow 2: Rule Builder**
1. "+ Add Condition" button → Duplicate condition row (Instant)
2. Remove icon (×) → Delete row with fade-out animation (200ms)
3. Slider drag → Update value label in real-time (no transition)
4. "Test Rule" → Show preview panel with results (Dissolve, 200ms)
5. "+ Add Action" → Duplicate action row (Instant)
6. "Save & Activate" → Success toast (Slide in from top-right, 300ms) → Dashboard

**Flow 3: Dashboard Navigation**
1. Metric cards → Click to detailed view (Push transition, 300ms)
2. "View All" links → Navigate to detailed table (Push, 300ms)
3. Rule name in table → Open Rule Builder (Push, 300ms)
4. Edit icon → Open Rule Builder (Push, 300ms)
5. Time period toggle (7/30/90 days) → Update chart (Dissolve, 200ms)

**Hover States to Add:**
- All buttons (background color change)
- Table rows (background: gray-50)
- Card components (shadow level +1)
- Dropdown items (background: gray-100)
- Icon buttons (background: gray-100)

**Focus States to Add:**
- Form inputs (blue border + shadow)
- Buttons (blue outline)
- Sliders (blue outline on thumb)
- Checkboxes/switches (blue outline)

---

## Figma Deliverables Checklist

✅ **Design System Page**
- Color palette with contrast ratios documented
- Typography scale with specs
- Spacing system (4px grid)
- Shadow levels
- Border radius scale

✅ **Component Library (Atoms)**
- Button (all variants, sizes, states)
- Input (all types, states)
- Select/Dropdown
- Badge (all types)
- Switch/Toggle
- Slider
- Checkbox/Radio
- Icon set (20+ icons from Heroicons)

✅ **Component Library (Molecules)**
- Form Field (label + input + error)
- Card (default, with header/footer)
- Toast Notification (all variants)
- Dropdown Menu
- Modal Dialog

✅ **Component Library (Organisms)**
- Rule Builder
- Condition Builder
- Dashboard Metrics (3-card layout)
- Execution Log Table
- Template Modal
- Progress Stepper

✅ **Screen Designs**
- Onboarding Wizard (5 steps, all states)
- Rule Builder (empty state + filled)
- Dashboard (full data + empty states)
- Scheduler Management
- Notification Settings

✅ **Interactive Prototype**
- Connected flows (onboarding, rule creation, dashboard navigation)
- Hover states on all interactive elements
- Focus states for accessibility
- Transitions (Smart Animate for steps, Dissolve for content updates)

✅ **Responsive Designs**
- Desktop (1440px)
- Tablet (768px)
- Mobile (375px)
- At least 3 key screens in all breakpoints

✅ **Documentation**
- Component specifications (dimensions, spacing, colors)
- Interaction notes (click targets, keyboard nav)
- Animation timings
- Copy/content guidelines

---

*Document prepared by: UX Design Team*
*Date: 2025-10-26*
*Version: 1.0*
*Design System: shadcn/ui + Tailwind CSS*
*Target Platform: Web (React)*
