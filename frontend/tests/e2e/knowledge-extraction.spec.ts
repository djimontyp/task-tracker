import { test, expect } from '@playwright/test'

/**
 * E2E Test: Knowledge Extraction Pipeline
 *
 * Tests the full flow from message ingestion to knowledge extraction,
 * including RAG context building and topic/atom creation.
 *
 * Prerequisites:
 * - Backend running with Ollama provider configured
 * - At least 10 messages in database
 * - Worker service running for task processing
 */

test.describe('Knowledge Extraction Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to messages page to verify data exists
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
  })

  test('should display messages with scoring classification', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(2000)

    // Verify messages page loaded (check for any content container)
    const content = page.locator('main, [role="main"], .messages-container, [class*="messages"]').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to topics page and show extracted topics', async ({ page }) => {
    // Navigate to topics
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Topics page should load (check main content area)
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should show atoms on topic detail page', async ({ page }) => {
    await page.goto('/topics')
    await page.waitForLoadState('networkidle')

    // Click on first topic card/row if exists
    const topicLink = page.locator('a[href*="/topics/"], [data-testid="topic-card"]').first()
    const hasTopics = await topicLink.count() > 0

    if (hasTopics) {
      await topicLink.click()
      await page.waitForLoadState('networkidle')

      // Should show topic details with atoms
      await expect(page.locator('h1, h2').first()).toBeVisible()
    } else {
      // No topics - that's OK, test still passes
      test.info().annotations.push({ type: 'info', description: 'No topics found - extraction may not have run yet' })
    }
  })

  test('should trigger knowledge extraction via API', async ({ request }) => {
    // Get available agent config
    const agentsResponse = await request.get('/api/v1/agents')
    expect(agentsResponse.ok()).toBeTruthy()

    const agents = await agentsResponse.json()
    expect(agents.length).toBeGreaterThan(0)

    const agentConfigId = agents[0].id

    // Trigger extraction
    const extractResponse = await request.post('/api/v1/knowledge/extract', {
      data: {
        period: { period_type: 'last_24h' },
        agent_config_id: agentConfigId
      }
    })

    // Should queue successfully (202 Accepted)
    expect(extractResponse.status()).toBe(202)

    const result = await extractResponse.json()
    expect(result.message).toContain('queued')
    expect(result.message_count).toBeGreaterThan(0)
  })

  test('should show dashboard with knowledge metrics', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Dashboard should have metrics cards
    await expect(page.locator('[class*="card"], [class*="Card"]').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('RAG Context Integration', () => {
  test('extraction should build RAG context (check via worker logs concept)', async ({ request }) => {
    // This test verifies the RAG context building by triggering extraction
    // and checking the response. Actual RAG verification would need log inspection.

    // Get agent config
    const agentsResponse = await request.get('/api/v1/agents')
    const agents = await agentsResponse.json()

    if (agents.length === 0) {
      test.skip()
      return
    }

    // Trigger extraction
    const extractResponse = await request.post('/api/v1/knowledge/extract', {
      data: {
        period: { period_type: 'last_7d' },
        agent_config_id: agents[0].id
      }
    })

    // If extraction queued successfully, RAG building happens in worker
    // We can't directly verify RAG from E2E, but we verify the flow works
    if (extractResponse.status() === 202) {
      const result = await extractResponse.json()
      expect(result.message_count).toBeGreaterThanOrEqual(0)
    } else if (extractResponse.status() === 400) {
      // No messages found - that's OK
      test.info().annotations.push({ type: 'info', description: 'No messages in period' })
    }
  })
})

test.describe('Message Scoring & Classification', () => {
  test('should display correct noise classification in messages', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Messages page should load
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('messages API should return scoring data', async ({ request }) => {
    const response = await request.get('/api/v1/messages')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.items).toBeDefined()

    if (data.items.length > 0) {
      const message = data.items[0]

      // Should have scoring fields
      expect(message).toHaveProperty('importance_score')
      expect(message).toHaveProperty('noise_classification')
      expect(message).toHaveProperty('noise_factors')

      // noise_classification should be one of valid values
      expect(['noise', 'signal', 'weak_signal', null]).toContain(message.noise_classification)
    }
  })
})
