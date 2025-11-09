# User Guide

**Last Updated:** November 9, 2025
**Audience:** End Users

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration Reference](#configuration-reference)
3. [Troubleshooting](#troubleshooting)
4. [Best Practices](#best-practices)

---

# Getting Started

## What is Automation?

Automation in Task Tracker reduces manual work by automatically processing version approvals based on configurable rules. Instead of reviewing every single version proposal manually, the system learns what makes a good version and handles obvious cases automatically.

Think of it like setting up a filter in your email—you tell the system "emails from my team go to this folder" and it runs automatically. With Task Tracker automation, you tell the system "versions with 80%+ confidence and 70%+ similarity are good" and it approves them automatically.

**Key Benefits:**
- Save 30-60 minutes per day on manual approvals
- Reduce human error in repetitive decisions
- Enable faster knowledge management workflows
- Maintain quality through configurable thresholds

## Setup in 5 Minutes

### Step 1: Access the Onboarding Wizard

Navigate to your Task Tracker dashboard. In the left sidebar, look for **Settings** → **Automation Setup**.

Click **Start Automation Wizard** to begin.

**What you'll see:**
- A welcome screen explaining automation benefits
- A progress indicator showing 3 setup steps ahead
- A "Next" button to continue

### Step 2: Configure Your Schedule

The wizard shows a **Schedule Configuration** screen where you decide how often automation runs.

**Choose one of these options:**

**Presets (Recommended for beginners):**
- **Daily at 9 AM** - Best for teams that review once per day during morning standup
- **Every 6 hours** - Good for teams with continuous content flow
- **Hourly** - For high-volume teams processing 50+ versions daily

**Custom Cron (Advanced):**
If you have specific timing needs, enter a cron expression (e.g., `0 9 * * 1` for Mondays at 9 AM).

**What to pick:** Start with "Daily at 9 AM" unless your team works on a different schedule.

### Step 3: Set Auto-Approval Rules

The wizard presents a **Rule Configuration** screen with visual sliders for setting quality thresholds.

**Three sections appear:**

**Confidence Threshold (Left Slider)**
- Range: 0-100% (LLM certainty in its suggestions)
- Recommended: Start at **80%**
- What it means: Only auto-approve if the AI is 80%+ confident

**Similarity Threshold (Right Slider)**
- Range: 0-100% (how similar new version is to current content)
- Recommended: Start at **70%**
- What it means: Only auto-approve if new content is 70%+ similar to existing

**Action Selector (Dropdown)**
- **Approve** - Automatically apply changes (recommended)
- **Reject** - Automatically discard low-quality proposals (use with caution)
- **Manual** - Send everything to manual review queue (don't use for automation)

**Best practice:** Keep both sliders between 70-85% initially. You can always lower them later if you're not seeing enough automation.

### Step 4: Review and Activate

The wizard shows a **Summary** screen displaying:
- Schedule: "Daily at 9 AM"
- Confidence Threshold: "80%"
- Similarity Threshold: "70%"
- Action: "Approve"

Review the settings (click "Back" to edit if needed), then click **Activate Automation**.

You'll see a success message: "Automation activated! Your first run is scheduled for tomorrow at 9 AM."

## Your First Run

### Where to Check Job Status

After activation, visit **Dashboard** → **Automation Stats** to see:

**Real-Time Stats:**
- Total versions created: 47
- Versions auto-approved: 34 (72%)
- Versions pending review: 8
- Versions auto-rejected: 5

**Next Scheduled Run:**
Shows date and time of next automation cycle (e.g., "Tomorrow at 9:00 AM")

### How to Monitor Approvals

Navigate to **Dashboard** → **Versions** (`/versions` page) to manage pending versions.

**This page shows:**
- Pending versions count badge (e.g., "8 pending")
- Bulk action buttons (Approve All / Reject All)
- List of individual versions waiting for review
- About Versioning section explaining approval workflow

**Actions available:**
- Click version row to see what changed (diff viewer)
- Select multiple versions with checkboxes
- Use "Approve Selected" or "Reject Selected" for batch operations
- Use "Approve All" / "Reject All" for quick bulk actions

**Expected during first week:**
- Day 1: 10-20 pending versions (review them, see what automation approved)
- Day 2: 3-5 pending versions (fewer = rules working well)
- Day 3+: 1-2 pending versions (steady state)

If pending count keeps growing (20+ per day), your thresholds are too strict—lower them in Settings.

### What to Do If Job Fails

**Symptom:** Schedule shows "Last run failed" or "No scheduled job"

**Quick fixes (in order):**

1. **Check if automation is enabled**
   - Go to Settings → Automation
   - Verify the toggle shows "Enabled"

2. **Check scheduler service**
   - Open terminal/command line
   - Run: `docker ps | grep worker`
   - Should see "task-tracker-worker" running
   - If not, ask your admin to restart services

3. **Check logs for errors**
   - Ask your admin to check: `docker logs task-tracker-worker`
   - Look for error messages related to your rules

4. **Test manually**
   - Go to Settings → Automation
   - Click "Run Now" button
   - If that works, the schedule might be misconfigured

5. **Reset and retry**
   - Go to Settings → Automation → Advanced
   - Click "Reset Schedule"
   - Click "Activate" again

**Still broken?** Contact your admin with screenshot of error message.

## Next Steps

### 1. Monitor for One Week

Run automation on default settings (80% confidence, 70% similarity) for 7 days and collect data:
- How many versions per day?
- How many are auto-approved vs. pending?
- Any obvious false positives (bad versions approved)?

### 2. Fine-Tune Rules

After a week, adjust if needed:

**If too conservative** (pending count 15+/day):
- Lower confidence threshold to 75%
- Lower similarity threshold to 60%

**If too aggressive** (false approvals happening):
- Raise confidence threshold to 85%
- Raise similarity threshold to 75%

**To adjust:**
1. Go to Settings → Automation
2. Move sliders to new values
3. Click "Preview" to see impact
4. Click "Save Changes"
5. New versions automatically use updated rules

---

# Configuration Reference

## Schedule Configuration

The scheduler determines **when** versions are evaluated and processed. Task Tracker supports both preset schedules and custom cron expressions.

### Preset Schedules

**Recommended for most users.** Choose the option matching your team's workflow:

#### Daily Schedule (9 AM)

```
Time: Every day at 9:00 AM (server timezone)
Cron: 0 9 * * *
Best for: Teams with 1-2 review sessions per day
Volume: 10-50 versions per day
```

**When to use:**
- Morning team standups where you review versions together
- Batching approval work into one time block
- Teams in single timezone

**Example:** Version created at 8:45 AM waits until 9:00 AM to be processed.

#### Every 6 Hours

```
Time: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM
Cron: 0 */6 * * *
Best for: Continuous processing throughout day
Volume: 30-100 versions per day
```

**When to use:**
- Multiple teams across timezones
- Continuous Telegram ingestion
- Rapid knowledge base updates needed
- Real-time responsiveness important

#### Hourly Schedule

```
Time: Every hour at XX:00
Cron: 0 * * * *
Best for: High-volume production systems
Volume: 100+ versions per day
```

**When to use:**
- Large teams processing thousands of messages daily
- Every-minute ingestion from multiple Telegram channels
- Sub-hour turnaround required for approvals
- Enterprise deployments

### Custom Cron Expressions

**For advanced users** needing specific timing not covered by presets.

#### Cron Syntax Explained

```
┌─────────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌─────────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌─────── day of week (0-7, where 0 and 7 = Sunday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

#### Cron Symbols

| Symbol | Meaning | Example |
|--------|---------|---------|
| `*` | Any value | `*` = every minute |
| `,` | List of values | `0,30` = at :00 and :30 |
| `-` | Range of values | `9-17` = 9 AM through 5 PM |
| `/` | Step values | `*/6` = every 6 hours |

#### Common Cron Examples

**Business Hours Only (Monday-Friday, 9 AM-5 PM)**

```cron
0 9,12,15 * * 1-5
```

**Weekly on Monday Morning**

```cron
0 9 * * 1
```

**Twice Daily at Specific Times**

```cron
0 9 * * *  # 9 AM
0 17 * * * # 5 PM
```

**Every 4 Hours**

```cron
0 */4 * * *
```

### Cron Validation

**Valid examples:**
```
0 9 * * *      # Daily at 9 AM
0 */6 * * *    # Every 6 hours
0 9 * * 1-5    # Weekdays at 9 AM
```

**Invalid examples:**
```
60 * * * *     # Minute out of range (max 59)
* 25 * * *     # Hour out of range (max 23)
0 9 32 * *     # Day 32 doesn't exist
```

## Auto-Approval Rules

Rules define **what** gets approved and **how**. A rule is a set of conditions that trigger automatic actions.

### Rule Structure

Every rule has three components:

```
Conditions (IF)
   ↓
   Evaluation Logic (AND/OR)
   ↓
   Action (THEN)
```

**Example Rule:**
```
IF confidence >= 80 AND similarity >= 70
THEN approve
```

### Evaluating Versions

When a new version is created, Task Tracker extracts these fields:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `confidence` | Number | 0-100 | LLM confidence in suggested changes (%) |
| `similarity` | Number | 0-100 | Vector similarity to existing content (%) |
| `topic_count` | Integer | 0-1000 | Related topics identified in text |
| `topic.name` | String | N/A | Topic name (for text matching) |
| `source` | String | N/A | Source channel (e.g., "telegram") |
| `message_count` | Integer | 0-1000 | Messages supporting this version |

### Condition Operators

#### For Numbers (confidence, similarity, topic_count)

| Operator | Symbol | Meaning | Example |
|----------|--------|---------|---------|
| Greater than or equal | `>=` | At least this value | `confidence >= 80` |
| Less than or equal | `<=` | At most this value | `similarity <= 70` |
| Equals | `==` | Exactly this value | `topic_count == 5` |
| Not equals | `!=` | Any value except this | `topic_count != 0` |

#### For Text (topic.name, source)

| Operator | Symbol | Meaning | Example |
|----------|--------|---------|---------|
| Contains | `contains` | Text appears anywhere | `topic.name contains "urgent"` |
| Equals | `equals` | Exact match | `source equals "telegram"` |
| Starts with | `starts_with` | Text at beginning | `topic.name starts_with "Bug"` |
| Does not contain | `not_contains` | Text not present | `topic.name not_contains "archived"` |

### Logic Operators

#### AND Logic (More Strict)

```
IF confidence >= 90 AND similarity >= 80
THEN approve
```

**Result:** Both conditions must be true. Version needs high confidence **and** high similarity.

**Use when:** You want high-quality approvals, willing to skip some good versions.

#### OR Logic (More Lenient)

```
IF confidence >= 95 OR similarity >= 90
THEN approve
```

**Result:** Either condition can be true. Version needs very high confidence **or** very high similarity.

**Use when:** You want to catch more versions, willing to accept occasional errors.

### Actions

**Approve Action:**
- Version changes applied to main entity (Topic/Atom)
- Version marked as approved
- Entry added to audit log
- WebSocket broadcast to update pending count

**Reject Action:**
- Version marked as reviewed but not applied
- Original entity unchanged
- Entry added to audit log
- Useful for filtering low-quality proposals

**Manual Action:**
- Version remains pending
- User sees notification badge
- Requires human decision
- Version stays in database for future reference

### Rule Templates

#### Template 1: High Confidence Auto-Approve

**Best for:** Conservative teams, quality-focused

```json
{
  "name": "High Confidence Auto-Approve",
  "conditions": [
    {"field": "confidence", "operator": ">=", "value": 90},
    {"field": "similarity", "operator": ">=", "value": 85}
  ],
  "logic": "AND",
  "action": "approve",
  "enabled": true
}
```

**Metrics:**
- Approval rate: ~60-70% of versions
- False positive rate: <5% (very safe)
- Manual review needed: 30-40% of versions

#### Template 2: Balanced Auto-Approve

**Best for:** Growing teams, moderate volume

```json
{
  "name": "Balanced Auto-Approve",
  "conditions": [
    {"field": "confidence", "operator": ">=", "value": 80},
    {"field": "similarity", "operator": ">=", "value": 70}
  ],
  "logic": "AND",
  "action": "approve",
  "enabled": true
}
```

**Metrics:**
- Approval rate: ~75-85% of versions
- False positive rate: 5-10% (acceptable)
- Manual review needed: 15-25% of versions

#### Template 3: Auto-Reject Low Quality

**Best for:** Filtering obvious bad versions

```json
{
  "name": "Auto-Reject Low Quality",
  "conditions": [
    {"field": "confidence", "operator": "<", "value": 50}
  ],
  "logic": "OR",
  "action": "reject",
  "enabled": true
}
```

**Effect:** Versions with <50% confidence automatically discarded

**Metrics:**
- Rejection rate: ~15-20% of versions
- Prevents low-quality versions from pending
- Reduces manual review workload

---

# Troubleshooting

## Common Issues & Solutions

### Issue 1: Job Not Running

**Symptoms:**
- Next run time passes without execution
- Dashboard shows "Last run: Never"
- Status stays "Idle"
- No new versions being auto-approved

**Root Causes:**
1. Job is disabled
2. Scheduler service offline
3. Invalid cron expression
4. Database connection error
5. Worker queue not processing

#### Solution Step-by-Step

**Step 1: Check if Automation is Enabled**

1. Go to **Settings → Automation**
2. Look for toggle switch labeled "Enable Automation" or "Automation Status"
3. If toggle is OFF, click to turn ON
4. Check "Next run" field updates to show next scheduled time

**Step 2: Verify Scheduler Service Running**

Open terminal/command line and check:

```bash
docker ps | grep worker
```

**Expected output:**
```
abc1234def56 task-tracker-worker ... Up 2 days
```

**If not running:**
- Ask admin to restart: `docker compose restart worker`
- Check logs: `docker logs task-tracker-worker`

**Step 3: Validate Cron Expression**

If using custom cron, verify syntax:

1. Go to **Settings → Automation**
2. Copy cron expression (e.g., `0 9 * * *`)
3. Use online validator: https://crontab.guru
4. Should show human-readable description
5. If error appears, correct the syntax

**Step 4: Test Manual Trigger**

1. Go to **Settings → Automation**
2. Look for "Run Now" button (or similar)
3. Click it
4. Check for success message or error

**If it works:**
- The schedule might be wrong (recheck cron expression)
- System needs full restart

**If it fails:**
- Note the error message
- Check logs (see below)

#### How to Check Logs

**Backend logs:**
```bash
docker logs task-tracker-worker | tail -50
```

**Look for:**
- `ERROR` or `Exception` messages
- Task processing details
- Connection error messages

---

### Issue 2: Auto-Approval Not Working

**Symptoms:**
- Versions created but not auto-approved
- All pending count increases, none approved
- Manual review required for all versions
- Rule seems enabled but not triggering

**Root Causes:**
1. Rule conditions too strict
2. Rule disabled or inactive
3. Version data missing confidence/similarity scores
4. Database not storing rule configuration

#### Solution Step-by-Step

**Step 1: Check Rule is Active**

1. Go to **Settings → Automation → Rules**
2. Find your rule (e.g., "High Confidence Auto-Approve")
3. Check toggle shows "Enabled" or similar
4. If disabled, click to enable

**Step 2: Review Rule Conditions**

1. Click rule name to edit
2. Check current thresholds
3. Compare with pending versions:
   - Go to **Dashboard → Pending Versions**
   - Click a version to see its confidence/similarity scores
   - Does it meet rule conditions?

**Example:**
- Rule requires: confidence >= 90 AND similarity >= 85
- Pending version shows: confidence 75, similarity 80
- **Result:** Version doesn't meet conditions → stays pending (correct behavior)

**Step 3: Use Preview Feature**

1. Go to **Settings → Automation → Rules**
2. Click "Preview" button (if available)
3. Shows: "This rule would affect X versions"
4. If preview shows 0, conditions are too strict

**Action:** Lower thresholds and retry preview
- From 90/85 → try 85/80 or 80/70

---

### Issue 3: High False Positive Rate

**Symptoms:**
- Many auto-approved versions are incorrect
- Wrong names, descriptions, or metadata changes
- Manual review finds 20%+ are bad
- Quality degrading over time

**Root Causes:**
1. Thresholds too low
2. Rules too broad or conditions missing
3. Incorrect confidence/similarity scoring
4. Rule logic wrong (OR instead of AND)

#### Solution Step-by-Step

**Step 1: Measure False Positive Rate**

1. Go to **Dashboard → Automation Stats**
2. Note "Auto-approved" count for today (e.g., 34)
3. Go to **Versions → History** or **Audit Log**
4. Manually check 20-30 approved versions
5. Count how many are actually wrong
6. Calculate: (wrong count / total checked) × 100

**Example:**
- Checked 30 versions
- Found 5 wrong
- False positive rate = 5/30 = 17%

**Acceptable:** <10% false positive rate

**Step 2: Change Thresholds**

1. Go to **Settings → Automation → Rules**
2. Click your rule to edit
3. Increase both confidence and similarity by 5-10%
4. Click "Preview" to see impact
5. If preview shows fewer approved versions, save

**Example transition:**
```
Current: confidence 75, similarity 60 → 8 false positives
Increase to: confidence 85, similarity 75 → 2 false positives
Increase to: confidence 90, similarity 85 → 0 false positives
```

---

### Issue 4: Pending Count Stuck or Not Updating

**Symptoms:**
- Badge shows 23 pending, never changes
- Manual approval reduces it, then it goes back up
- WebSocket not updating count
- Refresh page, count different

**Root Causes:**
1. WebSocket connection lost
2. Badge cache not invalidating
3. Race condition in database
4. Stale data in browser

#### Solution Step-by-Step

**Step 1: Refresh Page**

Sometimes the browser cache is stale:

1. Press **F5** or **Cmd+R** to refresh
2. Wait 5 seconds for page to fully load
3. Check if count updates

**Step 2: Hard Refresh (Clear Cache)**

Stale JavaScript/CSS can cause outdated counts. Force reload:

1. **Chrome/Firefox/Edge:**
   - Hold **Ctrl + Shift + R** (Windows/Linux)
   - Hold **Cmd + Shift + R** (Mac)

2. **Or use DevTools:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty cache and hard reload"

**Expected:** Count matches latest database state after hard refresh.

---

### Issue 5: 404 Errors or "Not Found" Responses

**Symptoms:**
- API requests fail with 404 status
- Browser console shows "GET /api/v1/... 404"
- Features not loading or showing errors
- After recent deployment or update

**Root Causes:**
1. API route path changed
2. Stale JavaScript cached in browser
3. Frontend/backend version mismatch
4. Nginx routing misconfigured

#### Solution Step-by-Step

**Step 1: Hard Refresh Browser**

Most 404s after updates are caused by cached JavaScript calling old endpoints:

1. **Hard refresh:**
   - **Ctrl + Shift + R** (Windows/Linux)
   - **Cmd + Shift + R** (Mac)

2. **Or clear cache manually:**
   - F12 → Application tab → Clear storage → Clear site data
   - Close and reopen browser

**Expected:** After hard refresh, all API calls should return 200 or appropriate status.

---

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid cron expression" | Syntax error in cron | Use https://crontab.guru to validate |
| "Job not found" | Scheduler doesn't have job record | Restart worker service |
| "Rule evaluation failed" | Error in rule conditions | Check rule syntax, remove problematic conditions |
| "Database connection refused" | PostgreSQL offline | Ask admin to restart postgres |
| "WebSocket disconnected" | Network issue or server down | Refresh page, check internet connection |
| "Version not found" | Version deleted after creation | Might be race condition, try again |
| "404 Not Found" | Stale cache or changed API routes | Hard refresh browser (Ctrl+Shift+R) |

---

# Best Practices

## Rule Design Patterns

### Pattern 1: Conservative Start Strategy

**Best for:** New implementations, high-quality requirements

**Approach:**
Start with high thresholds, gradually lower based on real data.

**Initial Configuration:**
```json
{
  "confidence_threshold": 90,
  "similarity_threshold": 85,
  "auto_action": "approve"
}
```

**Why conservative?**
- <5% false positive rate (very safe)
- Lets manual reviewers assess data quality
- Reduces risk of bulk approving bad versions
- Builds team confidence in automation

**Weekly Review Process:**
```
Week 1: Monitor with 90/85
├─ Track false positive rate
├─ Note which versions should have auto-approved
└─ Collect 7 days of data

Week 2: Adjust if needed
├─ If 30%+ pending: lower to 85/80
├─ If 2%+ false positives: keep at 90/85
└─ Run another week at new settings

Week 3: Second adjustment
├─ If still 20%+ pending: lower to 80/70
├─ Otherwise: maintain current thresholds
└─ Monitor for 2 more weeks

Week 4+: Steady state
├─ Thresholds stable (auto-approves 70-80%)
├─ False positive rate acceptable (<10%)
└─ Team confident in automation
```

### Pattern 2: Multi-Tier Rule Architecture

**Best for:** Sophisticated quality control, large teams

**Tier 1: High Quality Auto-Approve**
```json
{
  "priority": 1,
  "name": "Premium Auto-Approve",
  "conditions": {
    "confidence": { "operator": ">=", "value": 95 },
    "similarity": { "operator": ">=", "value": 90 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Result:** ~40-50% of versions auto-approved
**Quality:** 98%+ accuracy (safest tier)

**Tier 2: Auto-Reject Obvious Garbage**
```json
{
  "priority": 2,
  "name": "Auto-Reject Low Quality",
  "conditions": {
    "confidence": { "operator": "<", "value": 50 }
  },
  "logic": "OR",
  "action": "reject"
}
```

**Result:** ~15-20% of versions auto-rejected

**Overall Effect:**
- 65-85% auto-handled (approve + reject)
- 15-35% careful manual review
- <10% false positive rate

### Pattern 3: Topic-Specific Rules

**Best for:** Heterogeneous data quality by topic

**Setup:**
Different Telegram channels have different quality levels. Create rules reflecting reality.

**Rule 1: Verified Channels (High Quality)**
```json
{
  "priority": 1,
  "conditions": {
    "source": { "operator": "equals", "value": "telegram_official" },
    "confidence": { "operator": ">=", "value": 75 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Note:** Lower threshold (75 vs. 80) because source is trusted

**Rule 2: General Channels (Standard Quality)**
```json
{
  "priority": 2,
  "conditions": {
    "source": { "operator": "equals", "value": "telegram_general" },
    "confidence": { "operator": ">=", "value": 85 },
    "similarity": { "operator": ">=", "value": 80 }
  },
  "logic": "AND",
  "action": "approve"
}
```

## Schedule Optimization

### Recommended Schedules by Volume

#### Small Teams (10-50 versions/day)

```
Schedule: Daily at 9 AM
Cron: 0 9 * * *

Why: Single review session aligns with standup
Execution time: <30 seconds
Manual review load: 5-15 versions
```

**Workflow:**
1. 9 AM: Automation runs
2. 9:05 AM: Team reviews pending versions (8 pending)
3. 9:15 AM: Team bulk-approves/reviews together

#### Medium Teams (50-200 versions/day)

```
Schedule: Every 6 hours (4 times/day)
Cron: 0 */6 * * *

Why: Continuous processing, reasonable execution time
Execution time: 2-5 seconds per run
Manual review load: 10-50 versions before next run
```

**Workflow:**
```
6 AM: First run (night's accumulation)
12 PM: Second run (morning's versions)
6 PM: Third run (afternoon's versions)
12 AM: Fourth run (evening's versions)
```

Team reviews pending versions twice daily (9 AM + 5 PM).

#### Large Teams (200+ versions/day)

```
Schedule: Hourly
Cron: 0 * * * *

Why: Sub-hour turnaround, handles high volume
Execution time: 1-2 seconds per run
Manual review load: 10-20 per hour (review as you go)
```

**Workflow:**
```
Every hour: Automation runs (top of hour)
As-needed: Team reviews pending badge
Real-time: No batch accumulation
```

### Frequency Impact on Manual Load

| Schedule | Versions per Run | Pending Between Runs | Manual Review Frequency |
|----------|-----------------|----------------------|------------------------|
| Daily | 30-100 | 30-100 | Once per day |
| 6-hourly | 10-50 | 10-50 | Twice daily |
| Hourly | 5-15 | 5-15 | Throughout day |

**Rule:** More frequent automation = smaller batch sizes = more responsive, less overwhelming

## Monitoring & Maintenance

### Weekly Review Process

**Every Monday morning (30 minutes):**

**1. Check Automation Stats (5 minutes)**
- Go to **Dashboard → Automation Stats**
- Note: approval rate, rejection rate, pending backlog
- Compare to previous week

**Expected metrics:**
```
Target approval rate: 70-85%
Target rejection rate: 10-20%
Target pending backlog: <20 versions
Target false positive rate: <10%
```

**2. Review Audit Logs (10 minutes)**
- Go to **Settings → Automation → Audit Logs**
- Filter by last 7 days
- Check which rules triggered most
- Look for patterns of failures

**3. Sample Manual Review (10 minutes)**
- Go to **Versions → History**
- Randomly check 10 auto-approved versions
- Check 5 rejected versions
- Assess: correct decisions?

**Action if issues found:**
- 1-2 bad approvals → adjust thresholds (raise by 5%)
- 3-4 bad approvals → check rule conditions
- 5+ bad approvals → disable rule, investigate

**4. Check Pending Backlog (5 minutes)**
- Go to **Dashboard → Pending Badge**
- Note current pending count
- If >20: consider lowering thresholds
- If trend increasing: might need more rules

### Monthly Deep Dive

**Monthly review (1 hour):**

**1. Full-Month Analytics**
- Total versions processed: _
- Auto-approval rate: _%
- Auto-rejection rate: _%
- False positive rate: _%
- Manual review required: _%

**2. Cost Calculation (ROI)**
```
Versions auto-processed: 1,200
Manual review time saved: 30 min/version × 1,200 = 600 hours
Team capacity freed: 600 hours × $50/hr = $30,000 value
```

**3. Quality Metrics**
- Audit all false positives (bad approvals)
- Rate them: critical, major, minor
- Plan fixes for next month

## Example Workflows

### Workflow A: Startup (Low Volume, High Quality)

**Team:** 2-3 people
**Volume:** 20-50 versions/day
**Goal:** No quality issues, minimal overhead

**Configuration:**
```
Schedule: Daily 9 AM
Confidence threshold: 90%
Similarity threshold: 85%
Action: Approve
Rules: 1 (conservative)
```

**Workflow:**
1. 9 AM: Automation runs (auto-approves ~80%, ~8 pending)
2. 9:15 AM: Team reviews pending versions (takes 10 min)
3. 9:30 AM: Done, team continues development
4. Next day: Repeat

**Metrics:**
- False positive rate: <5%
- Manual review: 8 versions/day (20 minutes total)
- Accuracy: 100% (team verifies everything)

### Workflow B: Growing Team (Medium Volume, Balanced)

**Team:** 5-10 people
**Volume:** 100-200 versions/day
**Goal:** 70-80% automation, acceptable 10% error rate

**Configuration:**
```
Schedule: Every 6 hours
Rules: 3 (premium, standard, garbage)
├─ Premium (90/85): auto-approve ~35%
├─ Garbage (<50): auto-reject ~15%
└─ Standard (80/70): auto-approve ~35%
```

**Workflow:**
1. 6 AM, 12 PM, 6 PM, 12 AM: Automation runs (every 6 hours)
2. 9 AM & 5 PM: Team reviews pending batch (30 min each)
3. Weekly review: adjust rules as needed

**Metrics:**
- False positive rate: 8-12%
- Manual review: 30-50 versions/day (total 1 hour)
- Automation handles: 70% of decisions

### Workflow C: Enterprise (High Volume, Sophisticated)

**Team:** 20+ people
**Volume:** 1000+ versions/day
**Goal:** 80%+ automation, <5% error rate, real-time processing

**Configuration:**
```
Schedule: Hourly
Rules: 5+ (multi-tier, source-specific, topic-specific)
├─ Premium sources (75% threshold): auto-approve
├─ Verified channels (80/70): auto-approve
├─ Low confidence (<40): auto-reject
├─ Urgent topics: escalate to manual
└─ Default: distribute to review queue
```

**Workflow:**
1. Every hour: Automation runs (handles 85% of versions)
2. Real-time: Team reviews pending as they arrive
3. Daily: Review automation metrics
4. Weekly: Adjust rules based on performance

**Metrics:**
- False positive rate: <5%
- Manual review: 5-10 per hour (as-you-go)
- Automation handles: 85% of decisions
- Real-time approval: <5 minutes from creation

## Common Mistakes to Avoid

### Mistake 1: Starting Too Aggressive

**What happens:**
- Set thresholds too low (70/60)
- 20%+ false positive rate
- Team loses confidence
- Eventually disable automation

**Fix:**
- Start conservative (90/85)
- Lower gradually as data shows safety
- Monitor false positive rate weekly

### Mistake 2: Ignoring False Positives

**What happens:**
- Automation running fine on stats
- Users quietly noticing bad approvals
- Trust erodes, people manually review anyway
- Automation becomes useless

**Fix:**
- Weekly spot-check 10 approved versions
- Track false positive rate explicitly
- Raise thresholds if rate >10%

### Mistake 3: Never Adjusting Rules

**What happens:**
- Initial rules don't reflect real data
- Pending backlog constantly grows
- Automation ignores obvious patterns
- Rules become stale

**Fix:**
- Review audit logs monthly
- Adjust thresholds quarterly
- Add new rules as data patterns emerge

### Mistake 4: Over-Complicating Rules

**What happens:**
- 10+ rules with overlapping conditions
- No one understands when each triggers
- Impossible to debug
- Next person to modify gives up

**Fix:**
- Keep 3-5 rules maximum
- Clear naming (what does this rule do?)
- Document decision logic

## Success Checklist

**Before deploying to production:**

- [ ] Started with conservative thresholds (90/85)
- [ ] Ran 1 week with thresholds, monitored false positive rate
- [ ] False positive rate <10%
- [ ] Team trained on automation features
- [ ] Scheduled weekly review process
- [ ] Rollback plan if issues arise (disable automation)
- [ ] Admin knows how to check logs/restart services

**After 1 month:**

- [ ] Documented current thresholds and why
- [ ] Calculated ROI (time saved)
- [ ] Identified patterns in pending versions
- [ ] Planned Q1 improvements
- [ ] Team confident in automation
