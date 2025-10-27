# Best Practices Guide

**Last Updated:** October 26, 2025
**Status:** Production-Ready Patterns
**Audience:** Teams optimizing automation workflows

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

**When to stop lowering:**
- False positive rate >10% (too many errors)
- You're manually rejecting many auto-approvals
- Audit logs show pattern of bad approvals

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
**Quality:** Removes known bad versions

**Tier 3: Moderate Quality Auto-Approve**
```json
{
  "priority": 3,
  "name": "Standard Auto-Approve",
  "conditions": {
    "confidence": { "operator": ">=", "value": 80 },
    "similarity": { "operator": ">=", "value": 70 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Result:** ~25-35% of versions auto-approved
**Quality:** 90-95% accuracy (balanced tier)

**Tier 4: Everything Else → Manual**
```json
{
  "priority": 4,
  "name": "Default Manual Review",
  "conditions": { "always": true },
  "action": "manual"
}
```

**Result:** ~10-20% of versions need manual review
**Quality:** Human decision on edge cases

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

**Rule 3: Community Channels (Lower Quality)**
```json
{
  "priority": 3,
  "conditions": {
    "source": { "operator": "equals", "value": "telegram_community" },
    "confidence": { "operator": ">=", "value": 90 },
    "similarity": { "operator": ">=", "value": 85 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Note:** Higher threshold for community (less trusted)

### Pattern 4: Time-Based Automation

**Best for:** Variable quality throughout day

**Rule 1: Business Hours (Careful)**
```json
{
  "priority": 1,
  "name": "Business Hours - Strict",
  "conditions": {
    "hour": { "operator": "in", "value": [9, 17] },
    "confidence": { "operator": ">=", "value": 85 },
    "similarity": { "operator": ">=", "value": 75 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Rule 2: Off-Hours (Relaxed)**
```json
{
  "priority": 2,
  "name": "Off-Hours - Lenient",
  "conditions": {
    "hour": { "operator": "not_in", "value": [9, 17] },
    "confidence": { "operator": ">=", "value": 70 },
    "similarity": { "operator": ">=", "value": 60 }
  },
  "logic": "AND",
  "action": "approve"
}
```

**Rationale:**
- Morning/afternoon: humans reviewing, strict automation
- Night: fewer reviewers, relaxed thresholds acceptable
- Reduces burden on night shift

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
2. 9:05 AM: Team reviews notification badge (8 pending)
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

## Notification Strategy

### Pattern 1: Digest over Individual Alerts

**Recommended:** Use daily digest instead of per-version notifications

**Configuration:**
```yaml
email:
  frequency: "daily"       # Daily 9 AM digest
  threshold: "pending > 0" # If any pending

telegram:
  enabled: false           # Skip individual alerts
```

**Why?**
- Reduces notification fatigue (1 email vs. 50 emails)
- Lets humans batch review pending versions
- Easier to focus on high-value versions

**Sample Digest:**
```
Task Tracker Automation Digest - Today 9 AM

Yesterday's activity:
├─ Versions processed: 47
├─ Auto-approved: 36 (77%)
├─ Auto-rejected: 5 (11%)
└─ Pending review: 6 (13%)

Error rate: 2.8% (good!)
Next run: Today at 3 PM

→ Review pending: 6 versions
```

### Pattern 2: Alert on Threshold + Weekly Digest

**Configuration:**
```yaml
telegram:
  enabled: true
  alert_when: "pending >= 25"    # Alert if 25+ pending
  alert_frequency: "once_per_day"

email:
  frequency: "weekly"             # Weekly summary
  day: "monday"
  time: "9:00 AM"
```

**Effect:**
- Daily Telegram alert if backlog grows (25+)
- Weekly email summary every Monday
- Balance of responsiveness and quiet operation

### Pattern 3: Critical Topics → Instant Alert

**For urgent/security/compliance topics:**

```json
{
  "alert_rule": {
    "topic.name": { "contains": "urgent" },
    "notification": "telegram_instant"
  }
}
```

**Workflow:**
- Any version with "urgent" in topic → instant Telegram alert
- Other versions → digest email
- Team responds immediately to urgent, batch handles routine

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

**Question:** Are the right rules triggering?

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

**4. Rule Performance**
```
Rule 1: High Confidence Auto-Approve
├─ Times triggered: 245
├─ Success rate: 98.5%
└─ Should continue

Rule 2: Standard Auto-Approve
├─ Times triggered: 380
├─ Success rate: 92%
└─ Increase threshold slightly

Rule 3: Low Quality Reject
├─ Times triggered: 98
├─ Success rate: 97%
└─ Working well
```

**5. Plan Q1 Improvements**
- Document lessons learned
- Plan threshold adjustments
- Identify new rules to add
- Schedule next full-month review

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
Notifications: Email digest only
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
Notifications: Telegram threshold alert + email digest
```

**Workflow:**
1. 6 AM, 12 PM, 6 PM, 12 AM: Automation runs (every 6 hours)
2. 9 AM & 5 PM: Team reviews pending batch (30 min each)
3. Telegram alert if pending >30
4. Weekly review: adjust rules as needed

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
Notifications: Telegram instant + email digest
Integration: Slack notifications for urgent
```

**Workflow:**
1. Every hour: Automation runs (handles 85% of versions)
2. Real-time: Team reviews pending as they arrive
3. As-needed: Respond to Telegram/Slack alerts for urgent
4. Daily: Review automation metrics
5. Weekly: Adjust rules based on performance

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

### Mistake 5: Wrong Notification Strategy

**What happens:**
- 100+ emails per day
- Team ignores notifications
- Defeats purpose of alerts

**Fix:**
- Digest over individual notifications
- Alert on thresholds (backlog >=20)
- Critical topics get instant alerts

## Success Checklist

**Before deploying to production:**

- [ ] Started with conservative thresholds (90/85)
- [ ] Ran 1 week with thresholds, monitored false positive rate
- [ ] False positive rate <10%
- [ ] Team trained on automation features
- [ ] Scheduled weekly review process
- [ ] Notifications configured and tested
- [ ] Rollback plan if issues arise (disable automation)
- [ ] Admin knows how to check logs/restart services

**After 1 month:**

- [ ] Documented current thresholds and why
- [ ] Calculated ROI (time saved)
- [ ] Identified patterns in pending versions
- [ ] Planned Q1 improvements
- [ ] Team confident in automation

---

**Next:** See [Configuration Reference](automation-configuration.md) for detailed threshold tuning, or [Best Practices](automation-best-practices.md) for production patterns.
