# Configuration Reference Guide

**Last Updated:** October 26, 2025
**Status:** Complete Reference
**Audience:** Users managing automation rules

## Table of Contents

1. [Schedule Configuration](#schedule-configuration)
2. [Auto-Approval Rules](#auto-approval-rules)
3. [Rule Templates](#rule-templates)
4. [Notification Settings](#notification-settings)
5. [Advanced Configuration](#advanced-configuration)

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
| `?` | No specific value | Used in day-of-month/day-of-week |

#### Common Cron Examples

**Business Hours Only (Monday-Friday, 9 AM-5 PM)**

```cron
0 9,12,15 * * 1-5
```
- Minute: 0
- Hour: 9, 12, 15 (9 AM, noon, 3 PM)
- Every day of month: *
- Every month: *
- Monday-Friday: 1-5

**Weekly on Monday Morning**

```cron
0 9 * * 1
```
- Processes every Monday at 9 AM
- Good for weekly batch approvals

**Twice Daily at Specific Times**

```cron
0 9 * * * # 9 AM
0 17 * * * # 5 PM
```
- Run rule at 9 AM and 5 PM every day
- Separate cron entries for multiple times

**Every 4 Hours**

```cron
0 */4 * * *
```
- Processes at 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM
- Works for teams spread across regions

**Avoid Peak Hours (Night Only)**

```cron
0 0,2,4 * * *
```
- Runs at midnight, 2 AM, 4 AM
- Keeps CPU usage low during business hours

### Cron Validation

When entering custom cron expressions, Task Tracker validates:

✅ **Valid**
```
0 9 * * *      # Daily at 9 AM
0 */6 * * *    # Every 6 hours
0 9 * * 1-5    # Weekdays at 9 AM
```

❌ **Invalid**
```
60 * * * *     # Minute out of range (max 59)
* 25 * * *     # Hour out of range (max 23)
0 9 32 * *     # Day 32 doesn't exist
```

**Error message:** "Invalid cron expression" appears if syntax is wrong. Correct before saving.

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

**Usage:**
```
confidence >= 90        # Must be 90 or higher
similarity <= 60        # Must be 60 or lower
topic_count == 1        # Exactly 1 topic
message_count >= 3      # At least 3 supporting messages
```

#### For Text (topic.name, source)

| Operator | Symbol | Meaning | Example |
|----------|--------|---------|---------|
| Contains | `contains` | Text appears anywhere | `topic.name contains "urgent"` |
| Equals | `equals` | Exact match | `source equals "telegram"` |
| Starts with | `starts_with` | Text at beginning | `topic.name starts_with "Bug"` |
| Does not contain | `not_contains` | Text not present | `topic.name not_contains "archived"` |

**Usage:**
```
topic.name contains "API"           # Matches "REST API", "API Design", etc.
source equals "telegram"            # Only Telegram messages
topic.name starts_with "Feature"    # Matches "Feature Request", "Feature Bug", etc.
```

### Logic Operators

Combine conditions using AND/OR:

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

#### Mixed Logic

```
IF (confidence >= 80 AND similarity >= 70) OR topic.name contains "urgent"
THEN approve
```

**Result:** Either (both strict conditions) or (topic is urgent).

### Actions

What happens when conditions are met:

#### Approve Action

```
IF conditions match
THEN apply changes immediately
```

**Effect:**
- Version changes applied to main entity (Topic/Atom)
- Version marked as approved
- Entry added to audit log
- WebSocket broadcast to update pending count

**Use when:** Highly confident in auto-approval quality

#### Reject Action

```
IF conditions match
THEN discard version without applying
```

**Effect:**
- Version marked as reviewed but not applied
- Original entity unchanged
- Entry added to audit log
- Useful for filtering low-quality proposals

**Use when:** Eliminating known bad versions (e.g., confidence < 50%)

#### Manual Action

```
IF conditions match
THEN send to manual review queue
```

**Effect:**
- Version remains pending
- User sees notification badge
- Requires human decision
- Version stays in database for future reference

**Use when:** Conditions are borderline, need human judgment

### Rule Priority

When multiple rules exist, evaluation order matters:

```
Rule 1 (Priority: 1) → Condition matches? → Execute action
                    ↓ No match
Rule 2 (Priority: 2) → Condition matches? → Execute action
                    ↓ No match
Rule 3 (Priority: 3) → Condition matches? → Execute action
                    ↓ No match
Default → Manual review
```

**Example Setup:**

| Priority | Conditions | Action | Purpose |
|----------|-----------|--------|---------|
| 1 | confidence >= 95 AND similarity >= 90 | Approve | High-confidence auto-approve |
| 2 | confidence < 50 | Reject | Auto-reject garbage proposals |
| 3 | topic.name contains "urgent" | Manual | Escalate urgent topics |

**Lower priority number = runs first**

## Rule Templates

Pre-built configurations for common scenarios. Use as starting point, customize as needed.

### Template 1: High Confidence Auto-Approve

**Best for:** Conservative teams, quality-focused

```json
{
  "name": "High Confidence Auto-Approve",
  "conditions": [
    {
      "field": "confidence",
      "operator": ">=",
      "value": 90
    },
    {
      "field": "similarity",
      "operator": ">=",
      "value": 85
    }
  ],
  "logic": "AND",
  "action": "approve",
  "priority": 1,
  "enabled": true
}
```

**Metrics:**
- Approval rate: ~60-70% of versions
- False positive rate: <5% (very safe)
- Manual review needed: 30-40% of versions

**Adjustment:**
- Too conservative (pending 15+/day)? Lower thresholds to 85/80
- Too aggressive (false positives)? Raise to 95/90

### Template 2: Balanced Auto-Approve

**Best for:** Growing teams, moderate volume

```json
{
  "name": "Balanced Auto-Approve",
  "conditions": [
    {
      "field": "confidence",
      "operator": ">=",
      "value": 80
    },
    {
      "field": "similarity",
      "operator": ">=",
      "value": 70
    }
  ],
  "logic": "AND",
  "action": "approve",
  "priority": 1,
  "enabled": true
}
```

**Metrics:**
- Approval rate: ~75-85% of versions
- False positive rate: 5-10% (acceptable)
- Manual review needed: 15-25% of versions

**Adjustment:**
- Too conservative? Lower to 75/65
- Too aggressive? Raise to 85/75

### Template 3: Aggressive Auto-Approve

**Best for:** High-confidence data sources, rapid deployment

```json
{
  "name": "Aggressive Auto-Approve",
  "conditions": [
    {
      "field": "confidence",
      "operator": ">=",
      "value": 70
    },
    {
      "field": "similarity",
      "operator": ">=",
      "value": 60
    }
  ],
  "logic": "AND",
  "action": "approve",
  "priority": 1,
  "enabled": true
}
```

**Metrics:**
- Approval rate: ~90%+ of versions
- False positive rate: 10-15% (monitor required)
- Manual review needed: 5-10% of versions

**Caution:** Monitor error rate closely. Revert if quality drops.

### Template 4: Auto-Reject Low Quality

**Best for:** Filtering obvious bad versions**

```json
{
  "name": "Auto-Reject Low Quality",
  "conditions": [
    {
      "field": "confidence",
      "operator": "<",
      "value": 50
    }
  ],
  "logic": "OR",
  "action": "reject",
  "priority": 2,
  "enabled": true
}
```

**Effect:** Versions with <50% confidence automatically discarded

**Combine with:** Use as secondary rule after approve rule

**Metrics:**
- Rejection rate: ~15-20% of versions
- Prevents low-quality versions from pending
- Reduces manual review workload

### Template 5: Urgent Topic Escalation

**Best for:** Safety-critical topics (security, compliance)

```json
{
  "name": "Urgent Topic Escalation",
  "conditions": [
    {
      "field": "topic.name",
      "operator": "contains",
      "value": "urgent"
    }
  ],
  "logic": "OR",
  "action": "manual",
  "priority": 1,
  "enabled": true
}
```

**Effect:** Topics containing "urgent" skip automation, require human review

**Combine with:** Use as first rule before general rules

**Topics:**
```
"urgent: Security Issue"      ✓ Triggers
"Security Issues (Urgent)"    ✓ Triggers
"General Security Topics"     ✗ No trigger
```

### Template 6: Source-Specific Rules

**Best for:** Different quality levels by Telegram channel

```json
{
  "name": "Telegram Channel: Verified Sources",
  "conditions": [
    {
      "field": "source",
      "operator": "equals",
      "value": "telegram_verified_channel"
    },
    {
      "field": "confidence",
      "operator": ">=",
      "value": 75
    }
  ],
  "logic": "AND",
  "action": "approve",
  "priority": 1,
  "enabled": true
}
```

**Effect:** Verified channels approved at lower threshold (75% vs. 80%)

## Notification Settings

### Email Configuration

#### Setup

1. Go to **Settings → Notifications → Email**
2. Enter your email address
3. Click "Send Test Email" to verify
4. Select digest frequency

#### Digest Options

| Frequency | Delivery | Content |
|-----------|----------|---------|
| Hourly | Every hour at :00 | Last hour's stats |
| Daily | 9 AM (server timezone) | Yesterday's summary |
| Weekly | Monday 9 AM | Last 7 days summary |
| Disabled | None | No emails sent |

**Sample Daily Digest Email:**

```
Subject: Task Tracker Automation Digest - October 26, 2025

Yesterday's automation activity:

Versions processed: 47
├─ Auto-approved: 34 (72%)
├─ Auto-rejected: 5 (11%)
└─ Pending review: 8 (17%)

Top triggered rules:
1. High Confidence Auto-Approve (18 times)
2. Auto-Reject Low Quality (5 times)

False positive rate: 3% (1 out of 34)
Execution time: Avg 2.3s, Max 8.5s

Next scheduled run: Today at 9:00 AM

Action: Click to review pending versions:
http://localhost/dashboard/versions?status=pending
```

### Telegram Configuration

#### Setup

1. Go to **Settings → Notifications → Telegram**
2. Click "Setup Telegram Bot"
3. Follow bot creation wizard
4. Copy bot token to settings
5. Send `/start` to bot to verify

#### Alert Thresholds

Set when Telegram alerts are sent:

| Threshold | Trigger | Use Case |
|-----------|---------|----------|
| Pending >= 20 | Too many waiting | Alert when backlog high |
| Auto-rejection rate > 15% | Quality alert | Monitor false rejections |
| Failed runs | Job failure | Check scheduler errors |

**Sample Telegram Alert:**

```
Action needed: 22 versions pending review

Auto-approved today: 35
Pending manual review: 22

Top pending topics:
1. "API Design" (5 versions)
2. "Feature Request" (4 versions)

Latest error: None

→ Review pending versions
```

### In-App Notifications

Always enabled. Visual badge in dashboard showing pending version count.

**Badge Behavior:**
- Hidden: 0 pending versions
- Red dot: 1-5 pending versions
- Red badge with number: 6+ pending versions

**Click badge** to navigate to pending versions page.

### Notification Thresholds

Customize when you receive alerts:

```yaml
thresholds:
  pending_alert: 20          # Alert when 20+ pending
  false_positive_rate: 10    # Alert when >10% errors
  job_failure: immediate     # Alert on any failure
  digest_frequency: daily    # Daily summary email
```

## Advanced Configuration

### Multiple Rules Strategy

**For sophisticated scenarios**, use rule priority to handle different cases:

#### Three-Tier Strategy

```
Tier 1 (Priority 1): High Confidence Auto-Approve
├─ Condition: confidence >= 90 AND similarity >= 85
└─ Action: approve

Tier 2 (Priority 2): Auto-Reject Low Quality
├─ Condition: confidence < 50
└─ Action: reject

Tier 3 (Priority 3): Everything Else
├─ Condition: (always matches)
└─ Action: manual (send to queue)
```

**Result:**
- Top 60%: Auto-approved (90%+ confidence)
- Bottom 20%: Auto-rejected (< 50% confidence)
- Middle 20%: Manual review (50-90% confidence)

#### Topic-Specific Rules

```
Rule 1: Urgent Topics (Priority 1)
├─ Condition: topic.name contains "urgent"
└─ Action: manual (escalate)

Rule 2: Low Quality (Priority 2)
├─ Condition: confidence < 50
└─ Action: reject

Rule 3: High Quality General (Priority 3)
├─ Condition: confidence >= 85 AND similarity >= 80
└─ Action: approve

Rule 4: Default (Priority 4)
├─ Condition: true
└─ Action: manual
```

### Fallback Behavior

When no rules match (or all disabled):

**Default:** All versions marked as pending (manual review required)

**Logic:**
```python
for rule in active_rules:
    if rule.conditions_match(version):
        return rule.action
# No rule matched
return "manual_review"
```

### Rate Limiting

Prevent automation from processing too fast:

**Configuration:**
```yaml
rate_limiting:
  max_approvals_per_minute: 100
  max_rejections_per_minute: 50
  burst_size: 10
```

**Effect:**
- Prevents database overload
- Spreads WebSocket broadcasts
- Reduces system impact of high-volume changes

### Audit Logging

Every automation decision is logged:

**Query example:**
```sql
SELECT
  created_at,
  rule_id,
  action,
  version_id,
  confidence,
  similarity
FROM automation_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
```

**Columns:**
- `created_at`: When decision made
- `rule_id`: Which rule triggered
- `action`: approve/reject/manual
- `version_id`: Which version processed
- `confidence`: Extracted confidence score
- `similarity`: Extracted similarity score
- `is_success`: Whether action completed

## Best Practices Summary

| Scenario | Thresholds | Logic | Action |
|----------|-----------|-------|--------|
| Conservative | 90/85 | AND | approve |
| Balanced | 80/70 | AND | approve |
| Aggressive | 70/60 | AND | approve |
| Quality Filter | 50 | N/A | reject |
| Escalation | urgent | OR | manual |

**General Rules:**
1. Start conservative, adjust after 1 week data
2. Use AND logic for approval (safer)
3. Use OR logic for rejection (faster cleanup)
4. Test rule with preview before enabling
5. Monitor audit logs for quality metrics

---

**Next:** See [Best Practices Guide](automation-best-practices.md) for workflow recommendations.
