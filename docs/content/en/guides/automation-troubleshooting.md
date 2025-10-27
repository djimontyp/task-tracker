# Troubleshooting Guide

**Last Updated:** October 27, 2025
**Status:** Complete
**Audience:** Users experiencing automation issues

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

**Expected:** Toggle shows ON, next run time shows "Tomorrow 9:00 AM" (or appropriate time)

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

**Common mistakes:**
- `60 * * * *` - Invalid (hour out of range)
- `0 25 * * *` - Invalid (minute out of range)
- `0 9 32 * *` - Invalid (day 32 doesn't exist)

**Step 4: Check Database Connection**

Run this command:

```bash
docker exec task-tracker-api psql -U postgres -d tasktracker -c "SELECT COUNT(*) FROM approval_rules;"
```

Should return a number (count of rules).

**If error appears:**
- Database might be down
- Ask admin to check: `docker compose ps postgres`
- If down, restart: `docker compose restart postgres`

**Step 5: Test Manual Trigger**

1. Go to **Settings → Automation**
2. Look for "Run Now" button (or similar)
3. Click it
4. Check for success message or error

**If it works:**
- The schedule might be wrong (recheck cron expression)
- System needs full restart

**If it fails:**
- Note the error message
- Proceed to "How to Check Logs" below

#### How to Check Logs

**Backend logs:**
```bash
docker logs task-tracker-worker | tail -50
```

**Look for:**
- `ERROR` or `Exception` messages
- Task processing details
- Connection error messages

**Frontend logs:**
```
Open browser Dev Tools (F12)
Click "Console" tab
Look for red error messages
```

**Common error patterns:**
```
psycopg2.OperationalError: could not connect
  → Database offline, ask admin

APScheduler error: Job failed
  → Check syntax, verify rule conditions

WebSocket connection failed
  → Network issue, refresh page
```

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

**Step 4: Test Rule Manually**

1. Create test version (if possible)
2. Set confidence = 95, similarity = 95
3. Wait for next scheduled run
4. Check if it gets approved

**If it approves:**
- Rule works, previous versions don't match conditions
- Lower thresholds to catch more versions

**If still pending:**
- Rule might be disabled or not evaluating
- Check logs: `docker logs task-tracker-worker`

**Step 5: Check Audit Logs**

If rule triggered, it should appear in audit logs:

1. Go to **Settings → Automation → Audit Logs** (if available)
2. Filter by date today
3. Look for entries with your rule name
4. Count of entries = how many times rule triggered

**If no entries:**
- Rule never evaluated
- Check if rule is truly enabled
- Verify database has rule saved

#### Troubleshooting Decision Tree

```
Auto-approval not working?
│
├─ Rule enabled? YES → Rule has conditions? YES → Conditions too strict?
│  │                   │
│  NO → Enable it!     NO → Add conditions     YES → Lower thresholds
│                                               NO → Check logs for errors
│
└─ NO → Ask admin to check database
```

---

### Issue 3: Notifications Not Received

**Symptoms:**
- No emails arriving
- No Telegram messages
- Badge updates in app (so automation works)
- No alerts for pending versions

**Root Causes:**
1. Email/Telegram channel disabled
2. Invalid email address or Telegram chat ID
3. Notification threshold not met
4. SMTP or bot misconfiguration

#### Solution Step-by-Step

**Step 1: Check Notification Preferences**

1. Go to **Settings → Automation → Notifications**
2. Check email section:
   - Toggle shows "Enabled"
   - Email address is correct
3. Check Telegram section:
   - Toggle shows "Enabled"
   - Bot token appears valid

**If disabled, enable it** and test again.

**Step 2: Test Email Notification**

1. Go to **Settings → Automation → Notifications**
2. Find email section
3. Click "Send Test Email" (or "Test" button)
4. Check inbox for test email

**Expected:** Email arrives within 30 seconds

**If no email:**
- Check spam folder
- Email address wrong (try again)
- SMTP misconfigured (ask admin)

**Step 3: Test Telegram Notification**

1. Go to **Settings → Automation → Notifications**
2. Find Telegram section
3. Click "Send Test Message" (or similar)
4. Check Telegram for message

**Expected:** Telegram message appears within 10 seconds

**If no message:**
- Bot token incorrect (ask admin to verify)
- Chat ID wrong (check Telegram settings)
- Bot not running (ask admin to check)

**Step 4: Check Notification Thresholds**

Notifications only trigger when conditions met:

1. Go to **Settings → Automation → Notifications**
2. Look for "Alert Thresholds" section
3. Check settings like:
   - "Alert when pending >= 20"
   - "Alert on job failure"

**Example:**
- Threshold set to: "Alert when 30+ pending"
- Current pending: 8
- **Result:** No alert (correct behavior)
- **Action:** Lower threshold or create more versions

**Step 5: Check Logs for Notification Errors**

Run:
```bash
docker logs task-tracker-worker | grep -i "notification\|email\|telegram"
```

**Look for:**
- `SMTP error` → Email setup broken
- `Telegram API error` → Bot problem
- `Failed to send` → Network issue

**If errors found:**
- Ask admin to fix SMTP/bot configuration
- Check that email/chat address is valid

---

### Issue 4: High False Positive Rate

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

**Step 2: Compare with Thresholds**

1. Go to **Settings → Automation → Rules**
2. Note current thresholds (e.g., confidence 75%, similarity 65%)
3. Check: Are they lower than recommended?

**Recommended starting points:**
- Conservative: 90/85 (for high quality)
- Balanced: 80/70 (default)
- Aggressive: 70/60 (for rapid processing)

**Action:**
- If currently at 70/60, raise to 80/70 or 90/85
- If at 80/70, raise to 85/75 or 90/85

**Step 3: Change Thresholds**

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

**Step 4: Review Rule Logic**

Check if rule uses AND or OR:

```
GOOD (AND):
IF confidence >= 80 AND similarity >= 70
→ Both must be true = safer

BAD (OR):
IF confidence >= 80 OR similarity >= 70
→ Only one needs to be true = risky
```

**Action:** If using OR, consider changing to AND

**Step 5: Add More Specific Conditions**

Instead of just confidence/similarity, add:

```
IF confidence >= 85
AND similarity >= 75
AND message_count >= 2    ← New: at least 2 supporting messages
AND topic.name not_contains "test"  ← New: exclude test topics
THEN approve
```

More conditions = fewer false approvals

---

### Issue 5: Pending Count Stuck or Not Updating

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

**Step 2: Check WebSocket Connection**

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Filter by "WS" (WebSocket)
4. Should see connection to `ws://localhost/...`
5. Status should show "101 Web Socket Protocol Handshake"

**If connection shows ERROR or CLOSED:**
- Close and reopen dashboard
- Check if network is working (try browsing other site)
- Ask admin to check WebSocket service

**Step 3: Verify Database Has Latest Data**

Check if database has current pending count:

```bash
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT COUNT(*) as pending FROM versions WHERE approved = false;"
```

**Action:**
- If count matches badge → database is correct
- If count is different → badge might be cached

**Step 4: Hard Refresh (Clear Cache)**

Stale JavaScript/CSS can cause outdated counts. Force reload:

1. **Chrome/Firefox/Edge:**
   - Hold **Ctrl + Shift + R** (Windows/Linux)
   - Hold **Cmd + Shift + R** (Mac)

2. **Or use DevTools:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty cache and hard reload"

3. **Verify:**
   - Wait for page to fully load (spinner disappears)
   - Check if badge count updated
   - Check browser console for errors (F12 → Console tab)

**Expected:** Count matches latest database state after hard refresh.

**Step 5: Manual Refresh Trigger**

If still stuck:
1. Go to **Settings → Automation**
2. Click "Refresh Stats" button (if available)
3. Wait 5 seconds
4. Check badge count

---

### Issue 6: 404 Errors or "Not Found" Responses

**Symptoms:**
- API requests fail with 404 status
- Browser console shows "GET /api/v1/... 404"
- Features not loading or showing errors
- After recent deployment or update

**Root Causes:**
1. API route path changed (e.g., `/topics/{id}/versions` → `/versions/topics/{id}/versions`)
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

3. **Verify:**
   - Check Network tab (F12 → Network)
   - Look for 200 OK responses instead of 404

**Expected:** After hard refresh, all API calls should return 200 or appropriate status.

**Step 2: Check API Version**

Verify frontend is calling correct API endpoints:

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by "Fetch/XHR"
4. Look for API calls (e.g., `/api/v1/automation/stats`)
5. Check request URL matches current backend routes

**Common path changes in Phase 2:**
- ~~`/topics/{id}/versions`~~ → `/versions/topics/{id}/versions`
- ~~`/atoms/{id}/versions`~~ → `/versions/atoms/{id}/versions`
- New: `/versions/pending-count`
- New: `/versions/bulk-approve`

**Step 3: Verify Backend Routes**

Check backend is running latest code:

```bash
docker logs task-tracker-api | grep "Application startup complete"
```

**Expected output:**
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

**If old routes appear in logs:**
- Backend needs rebuild: `docker compose build api`
- Restart service: `docker compose restart api`

**Step 4: Check Nginx Configuration**

If API is reachable directly but not through Nginx:

```bash
docker logs task-tracker-nginx | grep -i error
```

**Look for:**
- `upstream not found` → Nginx can't reach API
- `no live upstreams` → API container down

**Fix:**
- Restart Nginx: `docker compose restart nginx`
- Rebuild if needed: `docker compose build nginx`

---

## Debugging Steps (Systematic Approach)

Use this checklist when troubleshooting automation:

**Phase 1: Basic Checks (2 minutes)**
- [ ] Automation enabled? (Settings → Automation)
- [ ] Next run time is in future? (not in past)
- [ ] Current time matches timezone? (server time vs. local)
- [ ] Page refreshed recently? (F5)

**Phase 2: Service Health (3 minutes)**
- [ ] Worker service running? (`docker ps | grep worker`)
- [ ] Database running? (`docker ps | grep postgres`)
- [ ] API running? (`docker ps | grep api`)
- [ ] No service showing "Exited"?

**Phase 3: Configuration Review (5 minutes)**
- [ ] Rule is enabled?
- [ ] Rule conditions match pending versions?
- [ ] Cron expression is valid? (check crontab.guru)
- [ ] Notifications enabled? (if expecting alerts)

**Phase 4: Testing (3 minutes)**
- [ ] Run automation now? (click "Run Now" button)
- [ ] Test email? (click "Send Test Email")
- [ ] Test Telegram? (click "Send Test Message")
- [ ] Check result?

**Phase 5: Logs Investigation (5 minutes)**
- [ ] Check worker logs? (`docker logs task-tracker-worker`)
- [ ] Look for ERROR or Exception?
- [ ] Check database logs? (if applicable)
- [ ] Any relevant error messages?

## Error Messages Reference

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid cron expression" | Syntax error in cron | Use https://crontab.guru to validate |
| "Job not found" | Scheduler doesn't have job record | Restart worker service |
| "SMTP authentication failed" | Email setup wrong | Ask admin to check SMTP credentials |
| "Telegram bot not found" | Invalid bot token | Verify token in settings |
| "Rule evaluation failed" | Error in rule conditions | Check rule syntax, remove problematic conditions |
| "Database connection refused" | PostgreSQL offline | Ask admin to restart postgres |
| "WebSocket disconnected" | Network issue or server down | Refresh page, check internet connection |
| "Version not found" | Version deleted after creation | Might be race condition, try again |
| "404 Not Found" | Stale cache or changed API routes | Hard refresh browser (Ctrl+Shift+R) |

## Getting Help

**Self-service:**
- Check this troubleshooting guide for your symptom
- Review configuration with [Configuration Reference](automation-configuration.md)
- Read [Best Practices](automation-best-practices.md) for recommended setups

**Ask your admin:**
- "Job not running" → Check scheduler service
- "Database connection error" → Check postgres service
- "SMTP/Telegram not working" → Verify credentials in environment

**Report an issue:**
- Include: Error message screenshot + steps to reproduce
- Include: Exact time issue occurred
- Include: Current automation settings (threshold values, rules enabled)
- Include: How many versions pending at time of issue

---

**Still having problems?** See [Best Practices Guide](automation-best-practices.md) for recommended configurations that minimize issues.
