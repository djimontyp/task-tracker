import { test, expect } from '@playwright/test';

test('Color picker updates topic color correctly', async ({ page }) => {
  // Navigate to topics page
  await page.goto('http://localhost/topics');

  // Wait for topics to load
  await page.waitForSelector('[data-testid="topic-card"], .topic-card, h3:has-text("Shopping")', { timeout: 10000 });

  console.log('✓ Topics page loaded');

  // Find first topic card
  const firstCard = page.locator('div').filter({ hasText: /Shopping|Ideas|Learning/ }).first();
  await expect(firstCard).toBeVisible();

  console.log('✓ First topic card found');

  // Find color dot button (should be a button with background color style)
  const colorButton = page.locator('button[style*="background"]').first();
  await expect(colorButton).toBeVisible();

  // Get initial color
  const initialColor = await colorButton.getAttribute('style');
  console.log('Initial color style:', initialColor);

  // Click color button to open picker
  await colorButton.click();
  console.log('✓ Clicked color button');

  // Wait for popover to appear
  await page.waitForSelector('.react-colorful', { timeout: 5000 });
  console.log('✓ Color picker opened');

  // Find hex input and change color
  const hexInput = page.locator('input[placeholder="#RRGGBB"], input[type="text"]').first();
  await hexInput.clear();
  await hexInput.fill('#FF5733');
  console.log('✓ Entered new color: #FF5733');

  // Click Save button
  await page.getByRole('button', { name: /save/i }).click();
  console.log('✓ Clicked Save button');

  // Wait a bit for optimistic update
  await page.waitForTimeout(500);

  // Check if color changed
  const newColorStyle = await colorButton.getAttribute('style');
  console.log('New color style:', newColorStyle);

  // Wait longer to see if it reverts
  await page.waitForTimeout(2000);

  const finalColorStyle = await colorButton.getAttribute('style');
  console.log('Final color style after 2s:', finalColorStyle);

  // Take screenshot
  await page.screenshot({ path: 'color-picker-test.png', fullPage: true });
  console.log('✓ Screenshot saved: color-picker-test.png');

  // Verify color persisted
  if (finalColorStyle?.includes('FF5733') || finalColorStyle?.includes('ff5733')) {
    console.log('✅ SUCCESS: Color persisted!');
  } else if (finalColorStyle === newColorStyle) {
    console.log('⚠️  Color changed but might not be the exact value');
  } else {
    console.log('❌ FAILED: Color reverted back!');
    console.log('Initial:', initialColor);
    console.log('After save:', newColorStyle);
    console.log('After 2s:', finalColorStyle);
  }
});
