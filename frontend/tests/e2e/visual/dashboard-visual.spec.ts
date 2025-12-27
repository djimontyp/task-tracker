import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests for Dashboard
 *
 * Captures screenshots of the dashboard in various states to ensure
 * visual consistency across changes.
 *
 * Run with: npx playwright test tests/e2e/visual/dashboard-visual.spec.ts
 * Update snapshots: npx playwright test tests/e2e/visual/dashboard-visual.spec.ts --update-snapshots
 */

// Mock data definitions to ensure deterministic snapshots
const MOCK_METRICS = {
  atoms: {
    by_type: {
      problem: 2,
      insight: 5,
      pattern: 3,
      decision: 6,
      question: 1,
    },
  },
  trends: {
    atoms: {
      current: 17,
      previous: 15,
      change_percent: 13.3,
      direction: "up",
    },
  },
};

const MOCK_TRENDS = {
  items: [
    { id: "1", name: "Performance Optimization", count: 42, growth: 15.5 },
    { id: "2", name: "Database Migration", count: 28, growth: 8.2 },
    { id: "3", name: "User Authentication", count: 25, growth: -2.3 },
    { id: "4", name: "API Rate Limiting", count: 18, growth: 0.0 },
    { id: "5", name: "Frontend Refactor", count: 15, growth: 5.1 },
  ],
};

const MOCK_ATOMS = {
  items: [
    {
      id: "1",
      type: "INSIGHT",
      title: "Cache Invalidation Strategy",
      content: "Using tagged cache keys improves ratio...",
      created_at: "2024-03-10T10:00:00Z",
      confidence: 0.95,
      meta: { topic_context: "Performance" },
    },
    {
      id: "2",
      type: "PROBLEM",
      title: "Database Connection Leak",
      content: "Connections not returning to pool...",
      created_at: "2024-03-10T09:30:00Z",
      confidence: 0.88,
      meta: { topic_context: "Database" },
    },
    {
      id: "3",
      type: "DECISION",
      title: "Switch to PostgreSQL",
      content: "Migrating from MySQL for better JSON support...",
      created_at: "2024-03-09T14:20:00Z",
      confidence: 0.98,
      meta: { topic_context: "Architecture" },
    },
  ],
  total: 3,
};

const MOCK_TOPICS = {
  items: [
    {
      id: "1",
      name: "Productivity",
      icon: "Zap",
      color: "#F59E0B",
      updated_at: "2024-03-10T12:00:00Z",
    },
    {
      id: "2",
      name: "Strategy",
      icon: "Target",
      color: "#3B82F6",
      updated_at: "2024-03-09T16:45:00Z",
    },
    {
      id: "3",
      name: "Development",
      icon: "Code",
      color: "#10B981",
      updated_at: "2024-03-08T09:15:00Z",
    },
    {
      id: "4",
      name: "Marketing",
      icon: "Megaphone",
      color: "#EC4899",
      updated_at: "2024-03-07T11:20:00Z",
    },
    {
      id: "5",
      name: "Research",
      icon: "Search",
      color: "#8B5CF6",
      updated_at: "2024-03-06T14:30:00Z",
    },
  ],
};

test.describe("Dashboard Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route("**/api/v1/dashboard/metrics**", async (route) => {
      await route.fulfill({ json: MOCK_METRICS });
    });

    await page.route("**/api/v1/dashboard/trends**", async (route) => {
      await route.fulfill({ json: MOCK_TRENDS });
    });

    await page.route("**/api/v1/atoms**", async (route) => {
      await route.fulfill({ json: MOCK_ATOMS });
    });

    await page.route("**/api/v1/topics**", async (route) => {
      await route.fulfill({ json: MOCK_TOPICS });
    });

    // Set fixed time for deterministic component rendering (e.g. "2 hours ago")
    // We can't easily mock new Date() inside the browser from here without tailored scripts,
    // but we can ensure the data dates are relatively recent or fixed.
    // Ideally, we'd inject time-freezing scripts, but for now we rely on mocked data timestamps.
  });

  const viewports = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 667 },
  ];

  const themes = ["light", "dark"];

  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`dashboard looks correct in ${theme} mode on ${viewport.name}`, async ({
        page,
      }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Navigate
        await page.goto("/dashboard");

        // Emulate theme
        await page.emulateMedia({
          colorScheme: theme === "dark" ? "dark" : "light",
        });

        // Also toggle class on html element if that's how the app handles themes (Tailwind often uses .dark class)
        if (theme === "dark") {
          await page.evaluate(() =>
            document.documentElement.classList.add("dark"),
          );
        } else {
          await page.evaluate(() =>
            document.documentElement.classList.remove("dark"),
          );
        }

        // Wait for network idle and specific elements to ensure hydration
        await page.waitForLoadState("networkidle");
        await page.getByText("Критичне").waitFor(); // Wait for a specific text from metrics

        // Wait for any animations to likely finish
        await page.waitForTimeout(1000);

        // Take screenshot
        await expect(page).toHaveScreenshot(
          `dashboard-${theme}-${viewport.name}.png`,
          {
            fullPage: true,
            animations: "disabled",
          },
        );
      });
    }
  }

  test("dashboard empty state visual", async ({ page }) => {
    // Force empty metrics
    await page.route("**/api/v1/dashboard/metrics**", async (route) => {
      await route.fulfill({
        json: {
          atoms: { by_type: {} },
          trends: { atoms: {} },
        },
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Stabilize

    await expect(page).toHaveScreenshot("dashboard-empty-state-desktop.png");
  });
});
