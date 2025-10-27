# Automation Quickstart Guide

**Last Updated:** October 27, 2025
**Status:** Ready for Production
**Audience:** End Users (Non-technical)

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
- A progress indicator showing 4 setup steps ahead
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

### Step 4: Enable Notifications

The wizard shows a **Notification Preferences** screen with toggles for alert channels.

**Available Options:**

**Email Notifications**
- Toggle: ON/OFF
- When: Daily digest of pending approvals and automation stats
- Enter your email address if not already set

**Telegram Notifications**
- Toggle: ON/OFF
- When: Instant alert when something needs manual review
- Requires Telegram bot token (setup link provided in wizard)

**In-App Notifications**
- Always ON
- Shows notification badge in dashboard sidebar
- Click badge to see pending versions

**Recommendation:** Enable email digest for daily summary, skip Telegram for now (you can add it later).

### Step 5: Review and Activate

The wizard shows a **Summary** screen displaying:
- Schedule: "Daily at 9 AM"
- Confidence Threshold: "80%"
- Similarity Threshold: "70%"
- Action: "Approve"
- Notifications: "Email + In-App"

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

### 3. Explore Advanced Features

Ready for more control? See **Configuration Reference** guide for:
- Advanced rule conditions (filter by topic, confidence ranges)
- Multiple rules for different scenarios
- Audit logs showing which rules triggered
- Performance metrics

### 4. Setup Team Notifications

Invite team members to dashboard and configure:
- Shared email for digest notifications
- Telegram bot for instant alerts to team chat
- Set notification thresholds (alert when 20+ pending)

See **Best Practices** guide for recommended team workflows.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Notification badge doesn't update | Refresh page or wait 30 seconds |
| "Job not found" error | Admin needs to restart worker service |
| Too many versions still pending | Lower thresholds 5-10% and retry |
| Wrong versions being approved | Raise thresholds 5-10%, review preview |

## Getting Help

- **For configuration questions:** See [Configuration Reference](automation-configuration.md)
- **For specific errors:** See [Troubleshooting Guide](automation-troubleshooting.md)
- **For advanced setups:** See [Best Practices Guide](automation-best-practices.md)
- **For API integration:** See [API Reference](/api/automation.md)

---

**🎉 Congratulations!** You've set up automation. You should see your first batch of auto-approved versions within 24 hours.
