import { test, expect, Page } from '@playwright/test';

/**
 * Sidebar Logo-Nav Alignment Tests
 *
 * Problem: Logo (32px) and nav icons (40px) were misaligned in collapsed mode
 * Solution: Both unified to 36px (size-9) for perfect vertical alignment
 *
 * Collapsed sidebar = 56px (3.5rem)
 * - 36px element → (56-36)/2 = 10px padding on each side
 */

// Helper: ensure desktop viewport and close any modals
async function setupDesktopView(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  // Close any open dialogs/sheets by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
}

// Helper: collapse sidebar
async function collapseSidebar(page: Page) {
  const trigger = page.locator('[data-sidebar="trigger"]');
  await trigger.click();
  await page.waitForTimeout(400); // wait for animation
}

test.describe('Sidebar Logo-Nav Alignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await setupDesktopView(page);
    await page.waitForSelector('[data-sidebar="sidebar"]');
  });

  test('logo container has correct size (size-9 = 36px)', async ({ page }) => {
    // Get logo container
    const logoContainer = page.locator('[data-testid="logo-container"]');
    await expect(logoContainer).toBeVisible();

    // Check computed styles
    const box = await logoContainer.boundingBox();
    expect(box?.width, 'Logo width should be ~36px').toBeGreaterThanOrEqual(34);
    expect(box?.width, 'Logo width should be ~36px').toBeLessThanOrEqual(38);
    expect(box?.height, 'Logo height should be ~36px').toBeGreaterThanOrEqual(34);
    expect(box?.height, 'Logo height should be ~36px').toBeLessThanOrEqual(38);
  });

  test('logo text is visible in expanded mode', async ({ page }) => {
    const logoText = page.locator('[data-testid="logo-text"]');
    await expect(logoText).toBeVisible();
    await expect(logoText).toContainText(/Pulse Radar/i);
  });

  test('logo text is hidden in collapsed mode', async ({ page }) => {
    await collapseSidebar(page);

    // Logo text should not be visible (opacity: 0, width: 0)
    const logoText = page.locator('[data-testid="logo-text"]');
    // In collapsed mode, text has opacity-0 and max-w-0, so it's effectively hidden
    const opacity = await logoText.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).toBe('0');
  });

  test('logo and nav icons are aligned in collapsed mode', async ({ page }) => {
    await collapseSidebar(page);

    // Get logo container position
    const logoContainer = page.locator('[data-testid="logo-container"]');
    const logoBox = await logoContainer.boundingBox();

    // Get first nav link icon (inside SidebarMenuButton)
    // The nav icons are inside links within the sidebar menu
    const firstNavIcon = page.locator('[data-sidebar="menu-button"] svg').first();
    const navIconBox = await firstNavIcon.boundingBox();

    if (logoBox && navIconBox) {
      // Calculate center X positions
      const logoCenterX = logoBox.x + logoBox.width / 2;
      const navCenterX = navIconBox.x + navIconBox.width / 2;

      // They should be roughly aligned (within 5px tolerance)
      expect(
        Math.abs(logoCenterX - navCenterX),
        `Logo center (${logoCenterX.toFixed(1)}) and nav center (${navCenterX.toFixed(1)}) should align`
      ).toBeLessThan(5);
    }
  });

  test('sidebar toggle works correctly', async ({ page }) => {
    const trigger = page.locator('[data-sidebar="trigger"]');
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    // Initial state - expanded
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');

    // Collapse
    await trigger.click();
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed');

    // Expand again
    await trigger.click();
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });
});
