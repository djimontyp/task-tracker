# Screenshots for Automation-First Version Management

This directory contains screenshots referenced in the feature documentation.

## Required Screenshots

### 1. auto-approval-settings.png
**Location:** Auto-Approval Settings Page (`/settings/auto-approval`)

**Capture:**
- Show threshold sliders (Confidence: 80%, Similarity: 70%)
- Action selector set to "Approve"
- Preview button and affected versions badge
- Save Settings button

**Dimensions:** 1280x720 or higher

---

### 2. pending-versions-badge.png
**Location:** Dashboard navigation (sidebar or header)

**Capture:**
- Red notification badge showing count (e.g., "23")
- Badge position in navigation
- Hover tooltip showing breakdown: "15 topics, 8 atoms"

**Dimensions:** 400x300 (focused crop)

---

### 3. bulk-version-selection.png
**Location:** Versions page with multiple selected items

**Capture:**
- 5-10 versions selected via checkboxes
- Sticky action bar at top
- Buttons: "Approve Selected", "Reject Selected", "Clear Selection"
- Selected count: "Selected: 8 versions"

**Dimensions:** 1280x720 or higher

---

### 4. bulk-confirmation-dialog.png
**Location:** Modal dialog after clicking bulk action

**Capture:**
- Dialog title: "Confirm Approval" or "Confirm Rejection"
- Version list preview (first 10 IDs with overflow indicator)
- Description: "You are about to approve 12 versions"
- Buttons: "Cancel" and "Confirm"

**Dimensions:** 600x500 (dialog-focused)

---

### 5. version-diff-viewer.png
**Location:** Version detail view

**Capture:**
- Single version diff showing changes
- Old/new values for fields (name, description)
- Confidence score display
- Change indicators (added/modified/removed)

**Dimensions:** 1280x720 or higher

---

## Capture Instructions

1. Start services: `just services-dev`
2. Seed test data: `just db-topics-seed 10 20 30`
3. Navigate to each page and capture screenshots
4. Save as PNG with exact filenames listed above
5. Optimize images: `optipng -o7 *.png` (optional)

## Image Guidelines

- **Format:** PNG (for UI clarity)
- **Resolution:** Retina-ready (2x scaling acceptable)
- **Theme:** Capture in light mode (default theme)
- **Annotations:** Optional red arrows/highlights for key UI elements
- **Privacy:** No real user data or sensitive information
