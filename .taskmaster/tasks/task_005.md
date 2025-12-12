# Task ID: 5

**Title:** Day 5: Documentation + Chromatic Setup + Final Verification

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** Update MDX documentation, configure Chromatic for visual regression testing, run final verification and create PR.

**Details:**

## Goals
- Update MDX docs with new structure references
- Configure Chromatic visual regression
- Run full verification
- Create PR

## Documentation Updates
- Update Introduction.mdx with new category structure
- Update any navigation references in docs
- Add Storybook structure documentation to CLAUDE.md

## Chromatic Setup
1. Create Chromatic project: `npx chromatic --project-token=<token>`
2. Add GitHub Action `.github/workflows/chromatic.yml`:
```yaml
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
      - run: npm ci
        working-directory: frontend
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          workingDir: frontend
```
3. Configure preview.tsx:
```tsx
chromatic: {
  viewports: [375, 768, 1280],
  modes: { light: {}, dark: {} }
}
```
4. Run initial baseline: `npx chromatic`

## Final Verification Checklist
- [ ] All stories load without errors
- [ ] Sidebar has exactly 5 categories
- [ ] Autodocs generate correctly
- [ ] Theme switching works
- [ ] Controls panel functional
- [ ] `npm run build-storybook` succeeds
- [ ] Chromatic baseline captured

## Expected Result
- ~350-400 stories (down from 603)
- 1 naming convention (down from 10+)
- 5 top-level categories (down from 13+)
- Chromatic visual regression active

**Test Strategy:**

1) `npm run build-storybook` must succeed 2) `npx chromatic` must capture baseline 3) PR review with before/after story count

## Subtasks

### 5.1. Update MDX documentation with new Storybook structure

**Status:** pending  
**Dependencies:** None  

Update Introduction.mdx to reflect the new 5-category structure (Primitives, Patterns, Layout, Features, Design System) and add Storybook structure documentation to CLAUDE.md.

**Details:**

1. Update `/frontend/src/docs/Introduction.mdx`:
   - Change navigation section from old categories (UI, Components, Shared) to new structure
   - Update sidebar navigation description: 'Primitives', 'Patterns', 'Layout', 'Features', 'Design System'
   - Add examples of where to find specific components in new structure
   - Update Quick Start section if needed

2. Update `/CLAUDE.md` Storybook section (line 708+):
   - Add new section '### Storybook Structure (Post-Refactor)'
   - Document 5 top-level categories with descriptions:
     * Primitives/ — shadcn/ui base components (Button, Badge, Card, Input, etc.)
     * Patterns/ — Composite components (DataTable, CardWithStatus, EmptyState, etc.)
     * Layout/ — Layout primitives (Box, Stack, PageWrapper, MainLayout, etc.)
     * Features/ — Domain-specific components organized by feature (Messages/, Atoms/, Topics/, etc.)
     * Design System/ — Documentation pages (Introduction, Colors, Spacing, Tokens, etc.)
   - Add naming convention rules
   - Update story count expectation (~350-400 stories)

3. Verify all cross-references in CLAUDE.md still accurate

Files to modify:
- `/frontend/src/docs/Introduction.mdx`
- `/CLAUDE.md` (Storybook section)

### 5.2. Configure Chromatic project and obtain project token

**Status:** pending  
**Dependencies:** 5.1  

Sign up for Chromatic account, create new project for Pulse Radar Storybook, and obtain project token for visual regression testing.

**Details:**

1. Visit https://www.chromatic.com and sign up/login
   - Use GitHub OAuth for authentication
   - Link to task-tracker repository

2. Create new Chromatic project:
   - Project name: 'Pulse Radar Design System'
   - Select repository: task-tracker
   - Choose plan: Free tier (5000 snapshots/month)

3. Obtain project token:
   - Copy project token from Chromatic dashboard
   - Store as GitHub secret: `CHROMATIC_PROJECT_TOKEN`
   - Document token location in project notes

4. Test connection (manual first run):
   ```bash
   cd frontend
   npx chromatic --project-token=<token>
   ```
   - This will build Storybook and upload to Chromatic
   - Verify baseline snapshots are created
   - Check Chromatic dashboard for initial build

5. Document Chromatic configuration in CLAUDE.md:
   - Add URL: https://www.chromatic.com/builds?appId=<app-id>
   - Add section on visual regression testing workflow

Expected output:
- Chromatic project created
- Project token stored in GitHub secrets
- Initial baseline snapshots captured (~350-400 stories)
- Chromatic dashboard accessible

### 5.3. Create GitHub Action workflow for Chromatic visual regression

**Status:** pending  
**Dependencies:** 5.2  

Add GitHub Actions workflow file that runs Chromatic visual regression tests on every push to track visual changes automatically.

**Details:**

1. Create workflow file: `/.github/workflows/chromatic.yml`

Content:
```yaml
name: Chromatic Visual Regression

on:
  push:
    branches: [main, refactor/storybook-restructure]
    paths:
      - 'frontend/src/**/*.tsx'
      - 'frontend/src/**/*.stories.tsx'
      - 'frontend/.storybook/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/src/**/*.tsx'
      - 'frontend/src/**/*.stories.tsx'
      - 'frontend/.storybook/**'
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  WORKING_DIR: ./frontend

jobs:
  chromatic:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for Chromatic

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ${{ env.WORKING_DIR }}
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          workingDir: frontend
          buildScriptName: build-storybook
          exitZeroOnChanges: true  # Don't fail PR on visual changes
          exitOnceUploaded: true   # Speed up CI
          onlyChanged: true        # Only test changed stories
```

2. Verify workflow syntax:
   ```bash
   gh workflow view chromatic.yml
   ```

3. Test workflow:
   - Push to refactor/storybook-restructure branch
   - Check GitHub Actions tab for workflow run
   - Verify Chromatic link appears in PR

Expected result:
- Workflow triggers on story file changes
- Chromatic runs automatically on push/PR
- Visual diff links posted to PR comments

### 5.4. Configure preview.tsx with Chromatic viewports and modes

**Status:** pending  
**Dependencies:** 5.2  

Update Storybook preview.tsx configuration to include Chromatic-specific settings for multi-viewport and theme mode snapshot testing.

**Details:**

1. Update `/frontend/.storybook/preview.tsx`:

Add Chromatic configuration after existing parameters:

```typescript
const preview: Preview = {
  parameters: {
    // ... existing parameters ...
    
    // Chromatic configuration
    chromatic: {
      // Capture snapshots at key breakpoints
      viewports: [375, 768, 1280],
      
      // Test both light and dark themes
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
      },
      
      // Delay to ensure animations complete
      delay: 300,
      
      // Disable animations for consistent snapshots
      disableSnapshot: false,
      
      // Pause animations during capture
      pauseAnimationAtEnd: true,
    },
  },
  
  // ... existing decorators ...
};
```

2. Add Chromatic-specific story parameters example to Introduction.mdx:

```tsx
// Disable Chromatic for non-visual stories
export const DataFetchingExample: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

3. Document in CLAUDE.md:
   - Chromatic captures 3 viewports × 2 themes = 6 snapshots per story
   - Total snapshots: ~350 stories × 6 = ~2,100 snapshots
   - Add guidelines for when to disable snapshots (data-heavy, time-dependent stories)

4. Test configuration:
   ```bash
   cd frontend
   npm run build-storybook
   npx chromatic --dry-run
   ```
   - Verify no configuration errors
   - Check snapshot count estimate

Expected result:
- Chromatic captures responsive + theme variants automatically
- Configuration documented for future reference

### 5.5. Run final verification and create pull request

**Status:** pending  
**Dependencies:** 5.1, 5.3, 5.4  

Execute complete verification checklist including Storybook build, Chromatic baseline capture, and create PR with before/after comparison.

**Details:**

## Final Verification Checklist

1. **Storybook Build Test:**
   ```bash
   cd frontend
   npm run build-storybook
   ```
   - Must complete without errors
   - Check output: `storybook-static/` directory created
   - Verify index.html exists and is valid

2. **Story Count Verification:**
   ```bash
   npm run storybook
   ```
   - Open http://localhost:6006
   - Verify sidebar has exactly 5 top-level categories:
     * Primitives/ (~28 components)
     * Patterns/ (~16 components)
     * Layout/ (~9 components)
     * Features/ (~18 components with subfolders)
     * Design System/ (5 doc pages)
   - Verify no duplicate categories
   - Check all stories load without console errors

3. **Theme & Controls Test:**
   - Toggle light/dark theme - all stories should render correctly
   - Test Controls panel on primitive components
   - Verify autodocs generate for tagged stories

4. **Chromatic Baseline Capture:**
   ```bash
   npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN
   ```
   - Wait for upload to complete
   - Check Chromatic dashboard for build status
   - Verify snapshot count: ~350-400 stories × 6 modes = ~2,100-2,400 snapshots
   - Accept all baselines in Chromatic UI

5. **Create Pull Request:**
   ```bash
   git add -A
   git commit -m "docs: update Storybook documentation and configure Chromatic
   
   - Update Introduction.mdx with new 5-category structure
   - Add Storybook structure docs to CLAUDE.md
   - Configure Chromatic visual regression testing
   - Add GitHub Action workflow for automated Chromatic runs
   - Configure preview.tsx with viewports and theme modes
   
   Story count: ~350-400 (down from 603)
   Categories: 5 (down from 13+)
   Chromatic snapshots: ~2,100-2,400
   
   🤖 Generated with Claude Code"
   
   git push origin refactor/storybook-restructure
   gh pr create --title "feat: Storybook restructure + Chromatic visual regression" \
     --body "## Summary
   
   Complete Storybook restructure with documentation updates and Chromatic integration.
   
   ## Changes
   - 📚 Updated Introduction.mdx with new category structure
   - 📝 Added Storybook structure documentation to CLAUDE.md
   - 🎨 Configured Chromatic for visual regression testing
   - 🤖 Added GitHub Action workflow for automated Chromatic runs
   - ⚙️ Configured preview.tsx with responsive viewports and theme modes
   
   ## Metrics
   - **Before:** 603 stories, 13+ categories, 10+ naming patterns
   - **After:** ~350-400 stories, 5 categories, 1 naming convention
   
   ## Verification
   - [x] All stories load without errors
   - [x] 5 top-level categories only
   - [x] Theme switching works
   - [x] Autodocs generate correctly
   - [x] build-storybook succeeds
   - [x] Chromatic baseline captured
   
   ## Chromatic
   - Snapshots: ~2,100-2,400 (350-400 stories × 6 modes)
   - Viewports: 375px, 768px, 1280px
   - Themes: light, dark
   
   Chromatic Dashboard: [View Build](link-will-be-auto-added)"
   ```

6. **PR Review Checklist:**
   - Verify Chromatic status check appears
   - Review visual changes in Chromatic UI
   - Check all GitHub Action workflows pass
   - Request review from team

Expected PR outcome:
- All CI checks green
- Chromatic visual regression baseline established
- Documentation complete and accurate
- Ready for merge to main
