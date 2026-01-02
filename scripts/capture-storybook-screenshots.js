/**
 * Capture Storybook screenshots for visual regression baseline
 *
 * Usage:
 *   node scripts/capture-storybook-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'storybook-baseline');
const STORYBOOK_URL = 'http://localhost:6006';

// Components to capture with their story paths
const COMPONENTS = [
  // Primitives - Buttons
  { id: 'primitives-button--default', name: 'button-default' },
  { id: 'primitives-button--secondary', name: 'button-secondary' },
  { id: 'primitives-button--destructive', name: 'button-destructive' },
  { id: 'primitives-button--outline', name: 'button-outline' },
  { id: 'primitives-button--ghost', name: 'button-ghost' },

  // Primitives - Badges
  { id: 'primitives-badge--default', name: 'badge-default' },
  { id: 'primitives-badge--secondary', name: 'badge-secondary' },
  { id: 'primitives-badge--destructive', name: 'badge-destructive' },
  { id: 'primitives-badge--outline', name: 'badge-outline' },

  // Primitives - Cards
  { id: 'primitives-card--default', name: 'card-default' },

  // Primitives - Progress
  { id: 'primitives-progress--default', name: 'progress-default' },

  // Primitives - Switch
  { id: 'primitives-switch--default', name: 'switch-default' },

  // Patterns - Logo
  { id: 'patterns-logo--default', name: 'logo-default' },

  // Patterns - MetricCard
  { id: 'patterns-metriccard--default', name: 'metriccard-default' },

  // Patterns - CardWithStatus
  { id: 'patterns-cardwithstatus--default', name: 'cardwithstatus-default' },

  // Patterns - FormField
  { id: 'patterns-formfield--default', name: 'formfield-default' },
  { id: 'patterns-formfield--with-error', name: 'formfield-error' },

  // Patterns - EmptyState
  { id: 'patterns-emptystate--default', name: 'emptystate-default' },

  // Components - SaveStatusIndicator
  { id: 'patterns-savestatusindicator--saved', name: 'savestatusindicator-saved' },
  { id: 'patterns-savestatusindicator--saving', name: 'savestatusindicator-saving' },
  { id: 'patterns-savestatusindicator--unsaved', name: 'savestatusindicator-unsaved' },

  // Features - Atoms
  { id: 'features-atoms--atom-card-problem', name: 'atomcard-problem' },
  { id: 'features-atoms--atom-card-solution', name: 'atomcard-solution' },
  { id: 'features-atoms--atom-card-decision', name: 'atomcard-decision' },

  // Features - Providers (ValidationStatus)
  { id: 'features-providers--validation-status-connected', name: 'validationstatus-connected' },
  { id: 'features-providers--validation-status-error', name: 'validationstatus-error' },
  { id: 'features-providers--validation-status-pending', name: 'validationstatus-pending' },

  // Layout - ServiceStatusIndicator
  { id: 'shared-layout-servicestatusindicator--connected', name: 'servicestatusindicator-connected' },
  { id: 'shared-layout-servicestatusindicator--disconnected', name: 'servicestatusindicator-disconnected' },

  // Pages - Dashboard
  { id: 'pages-dashboard--default', name: 'dashboard-page' },
];

async function captureScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  console.log(`📸 Capturing ${COMPONENTS.length} components in light and dark themes...`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  let capturedCount = 0;
  const themes = ['light', 'dark'];

  for (const theme of themes) {
    console.log(`\n🎨 Switching to ${theme} theme...`);

    const page = await context.newPage();

    // Navigate to Storybook
    await page.goto(STORYBOOK_URL);
    await page.waitForLoadState('networkidle');

    // Switch theme
    if (theme === 'dark') {
      // Click theme switcher (adjust selector if needed)
      try {
        await page.click('[title="Change theme"]');
        await page.waitForTimeout(500);
      } catch (e) {
        console.warn('⚠️  Could not switch theme, using default');
      }
    }

    for (const component of COMPONENTS) {
      const storyUrl = `${STORYBOOK_URL}/iframe.html?id=${component.id}&viewMode=story`;
      const filename = `${component.name}-${theme}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      try {
        await page.goto(storyUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Wait for animations

        // Take screenshot of story root
        const storyRoot = await page.locator('#storybook-root');
        await storyRoot.screenshot({ path: filepath });

        console.log(`✅ ${filename}`);
        capturedCount++;
      } catch (error) {
        console.error(`❌ Failed to capture ${component.id}: ${error.message}`);
      }
    }

    await page.close();
  }

  await browser.close();

  console.log(`\n✅ Captured ${capturedCount} screenshots`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

captureScreenshots().catch(console.error);
