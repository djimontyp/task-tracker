# UX/UI Patterns & Principles (Pulse Radar)

## 1. Interaction Philosophy: "Investigator" Mode
The "Messages" and "Atoms" interfaces act as an investigative tool, not just a passive list. 
- **Drill-Down Navigation:** Users start with high-level signals (Topics/Atoms) and drill down into raw data (Messages) only when necessary.
- **Split View Consitency:** 
    - **Desktop:** Fixed Sidebar (List) + Fluid Detail Panel.
    - **Mobile:** Stacked View (List -> Detail overlay or stack).

## 2. Layout Patterns
### The "Horizontal Split" (Message Detail)
To accommodate long-form reading and rich analysis simultaneously:
- **Top Section (Reader Mode):** 
    - Dedicated to the human content (Message).
    - Full width, comfortable typography (Serif/Sans mix), minimal noise.
    - Header contains only vital human context: Avatar, Name, Time, Impact Score.
- **Bottom Section (Context Rail):**
    - **Context as Foundation:** Analysis appears *below* the content, supporting it.
    - **Grid Layout:** "AI Reasoning" and "Connected Knowledge" (Atoms) sit side-by-side or stacked.
    - **Right Rail (Desktop):** Can float to the right on large screens for data density.

## 3. Visual Hierarchy
- **Status Indicators:**
    - **Vertical Bars:** Used in lists to indicate status (Signal/Noise) without occupying horizontal space.
    - **Tooltips:** Essential for decoding abstract indicators (colors/bars).
- **Actions:**
    - **Hover-Reveal:** Secondary actions (Dismiss, Create Atom) appear only on hover to reduce cognitive load.
    - **Background Protection:** Floating actions must have backgrounds/shadows to prevent text bleed-through.

## 4. List Navigation
- **Keyboard First:** `J`/`K` navigation is primary for power users.
- **Auto-Scroll:** Active items must automatically scroll into view.
- **Infinite Flow:** Pagination breaks the "investigation flow". Infinite scroll or "Load More" is preferred for chronological data.
