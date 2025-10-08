#!/usr/bin/env node

// Enhanced seeding script for creating realistic demo tasks via HTTP API
// Usage:
//   node scripts/seed_tasks.mjs [BASE_URL] [COUNT]
// Example:
//   node scripts/seed_tasks.mjs http://localhost:8000 100

const baseUrl = process.argv[2] || 'http://localhost:8000'
const count = parseInt(process.argv[3] || '50', 10)

const categories = ['bug', 'feature', 'documentation', 'task']
const priorities = ['low', 'medium', 'high', 'urgent', 'critical']
const sources = ['telegram', 'slack', 'email', 'internal']
const statuses = ['open', 'in_progress', 'completed', 'closed', 'pending']

// Realistic task templates
const taskTemplates = [
  // Bugs
  { category: 'bug', title: 'Fix login authentication timeout', description: 'Users are experiencing timeout errors when logging in during peak hours. Need to investigate session management and database connection pooling.' },
  { category: 'bug', title: 'WebSocket connection drops randomly', description: 'Real-time updates stop working after ~5 minutes. Connection closes with code 1006. Investigate server-side connection handling.' },
  { category: 'bug', title: 'Dashboard stats showing incorrect counts', description: 'Task completion rate displays 0% even when tasks are marked as completed. Check aggregation queries.' },
  { category: 'bug', title: 'Memory leak in message processing', description: 'API container memory usage grows continuously. Suspected issue in WebSocket manager or message handlers.' },
  { category: 'bug', title: 'Telegram webhook returns 500 errors', description: 'Webhook endpoint fails intermittently with internal server error. Check error logs and exception handling.' },
  
  // Features
  { category: 'feature', title: 'Add task assignment to team members', description: 'Implement ability to assign tasks to specific users. Include notification system and assignment history.' },
  { category: 'feature', title: 'Export tasks to CSV/Excel', description: 'Add export functionality for tasks with filters. Support multiple formats and custom column selection.' },
  { category: 'feature', title: 'Dark mode for dashboard', description: 'Implement theme switcher with dark/light modes. Persist user preference in localStorage.' },
  { category: 'feature', title: 'Task templates and automation', description: 'Create reusable task templates with pre-filled fields. Add automation rules for recurring tasks.' },
  { category: 'feature', title: 'Advanced search and filtering', description: 'Implement full-text search across tasks. Add multi-criteria filters with saved filter presets.' },
  
  // Documentation
  { category: 'documentation', title: 'API documentation for webhook endpoints', description: 'Document all webhook endpoints with request/response examples. Include authentication and error handling.' },
  { category: 'documentation', title: 'Setup guide for local development', description: 'Create comprehensive guide for setting up development environment. Include Docker, dependencies, and troubleshooting.' },
  { category: 'documentation', title: 'Architecture decision records', description: 'Document key architectural decisions and rationale. Include WebSocket implementation and database schema choices.' },
  { category: 'documentation', title: 'User guide for task management', description: 'Write end-user documentation for creating, updating, and tracking tasks. Include screenshots and examples.' },
  
  // Tasks
  { category: 'task', title: 'Update dependencies to latest versions', description: 'Review and update all npm and Python dependencies. Test for breaking changes and update lockfiles.' },
  { category: 'task', title: 'Database migration for new schema', description: 'Create Alembic migration for agent_task_assignments table. Test migration rollback procedure.' },
  { category: 'task', title: 'Code review for WebSocket implementation', description: 'Review recent WebSocket changes for performance and security. Check connection management and error handling.' },
  { category: 'task', title: 'Performance testing for API endpoints', description: 'Run load tests on critical endpoints. Identify bottlenecks and optimize slow queries.' },
  { category: 'task', title: 'Security audit of authentication flow', description: 'Review authentication and authorization logic. Check for common vulnerabilities and implement fixes.' },
]

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function createTask(i) {
  // Use template or generate generic task
  let title, description, category
  
  if (i <= taskTemplates.length) {
    const template = taskTemplates[i - 1]
    title = template.title
    description = template.description
    category = template.category
  } else {
    title = `Task #${i}: ${rand(['Implement', 'Fix', 'Update', 'Refactor', 'Optimize'])} ${rand(['user interface', 'API endpoint', 'database query', 'error handling', 'test coverage'])}`
    description = `Generated task ${i} for testing dashboard features. ${rand(['High priority item.', 'Needs investigation.', 'Quick fix required.', 'Long-term improvement.'])}`
    category = rand(categories)
  }
  
  const priority = rand(priorities)
  const source = rand(sources)

  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, priority, category, source }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Create failed: ${res.status} ${res.statusText} ${txt}`)
  }

  return res.json()
}

async function updateStatus(id, status) {
  try {
    // API expects query param `status`
    await fetch(`${baseUrl}/api/tasks/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    // Non-critical
    console.error(`Failed to update status for task ${id}:`, e.message)
  }
}

async function main() {
  console.log(`Seeding ${count} tasks into ${baseUrl} ...`)
  for (let i = 1; i <= count; i++) {
    try {
      const task = await createTask(i)
      // Skew distribution: keep some open, mix others
      const pick = Math.random()
      let status = 'open'
      if (pick < 0.20) status = 'completed'
      else if (pick < 0.40) status = 'in_progress'
      else if (pick < 0.50) status = 'closed'
      else if (pick < 0.60) status = 'pending'

      if (status !== 'open') await updateStatus(task.id, status)

      process.stdout.write(i % 20 === 0 ? `\nCreated ${i}\n` : '.')
    } catch (e) {
      console.error(`\nError at #${i}:`, e.message)
    }
  }
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
