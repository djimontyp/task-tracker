# Automation Video Tutorial Script

**Last Updated:** October 26, 2025
**Duration:** ~8 minutes
**Format:** Screen recording with voiceover
**Language:** English (with auto-captions available)

---

## Section 1: Introduction (0:00 - 1:00)

**[SCREEN: Show Task Tracker dashboard with notification badge showing "23 pending versions"]**

**VOICEOVER:**

"Welcome to Task Tracker Automation! In this tutorial, you'll learn how to set up and manage automated version approvals, saving your team hours of manual review work every day.

By the end of this video, you'll understand how to:
- Configure your first automation rule in just 5 minutes
- Monitor automation results in real-time
- Troubleshoot common issues

Let's get started!"

**[SCREEN: Fade to settings menu]**

---

## Section 2: Onboarding Wizard (1:00 - 3:30)

**[SCREEN: Navigate to Settings → Automation Setup]**

**VOICEOVER:**

"The fastest way to get started is using the Automation Wizard. Click 'Start Automation Wizard' from the Automation Settings page."

**[SCREEN: Show wizard Step 1 - Welcome screen]**

**VOICEOVER:**

"Step 1 is a quick introduction. You can see at the bottom that this wizard has 4 steps to complete."

**[CLICK: Next button]**

**[SCREEN: Show Step 2 - Schedule Configuration]**

**VOICEOVER:**

"Step 2 is Schedule Configuration. This controls when your automation runs. You can choose from preset schedules—Daily at 9 AM is perfect for teams with one review session per day. If you need something custom, you can enter a cron expression. For example, 0 asterisk asterisk asterisk asterisk runs every hour. We recommend starting with Daily for most teams."

**[SCREEN: Select "Daily 9 AM"]**

**[CLICK: Next button]**

**[SCREEN: Show Step 3 - Auto-Approval Rules with sliders]**

**VOICEOVER:**

"Step 3 is the heart of automation: setting your approval thresholds. You have two sliders:

The Confidence slider on the left represents how certain the AI is about its suggestions. Eighty percent confidence means 'only auto-approve if the system is at least 80 percent sure.'

The Similarity slider on the right measures how closely the new version matches your existing content. Seventy percent similarity means 'only if the new content is at least 70 percent similar to what's already there.'

We recommend starting conservative with 80 percent confidence and 70 percent similarity. You can always lower these values later after monitoring results. There's also a preview button—click it to see how many of your pending versions would be affected by these settings."

**[SCREEN: Click Preview button, show result: "This rule would affect 34 versions"]**

**[CLICK: Next button]**

**[SCREEN: Show Step 4 - Notification Preferences]**

**VOICEOVER:**

"Step 4 lets you choose how to stay informed. Email notifications send you a daily summary of what automation handled. Telegram gives you instant notifications if the pending backlog grows too large. And in-app notifications show a badge on your dashboard. For your first setup, email is perfect—you'll get a daily digest at 9 AM with a summary of approvals and any issues."

**[SCREEN: Toggle Email ON]**

**[CLICK: Next button]**

**[SCREEN: Show Step 5 - Summary review]**

**VOICEOVER:**

"Step 5 is your review page. Double-check everything looks good. You can go back to edit any settings if needed. This summary shows:
- Daily schedule at 9 AM
- 80% confidence, 70% similarity thresholds
- Email digests enabled
- Action set to Approve

Everything looks good! Let's activate it."

**[CLICK: Activate button]**

**[SCREEN: Show success message: "Automation activated! Your first run is scheduled for tomorrow at 9 AM"]**

**VOICEOVER:**

"Perfect! Automation is now active. Your first automatic run is scheduled for tomorrow at 9 AM."

---

## Section 3: Creating Custom Rules (3:30 - 5:30)

**[SCREEN: Navigate to Settings → Automation → Rules]**

**VOICEOVER:**

"After your first week running with the default rule, you might want to create custom rules for different scenarios. Let's create a second rule that auto-rejects low-quality versions."

**[CLICK: Add Rule button]**

**[SCREEN: Show new rule form]**

**VOICEOVER:**

"Here's the rule creation form. At the top, give it a name—'Auto-Reject Garbage' is descriptive.

Then set up conditions. For this rule, we only care about confidence. We'll say: if confidence is less than 50, auto-reject it."

**[SCREEN: Show dropdown for operator selection, select "<" (less than)]**

**[SCREEN: Enter value "50"]**

**VOICEOVER:**

"We're saying 'if confidence is less than 50 percent, this version is probably wrong, so automatically reject it.' This removes obvious trash from your pending queue without human review."

**[SCREEN: Select action dropdown → "Reject"]**

**[SCREEN: Set priority to 2]**

**VOICEOVER:**

"Priority determines the order rules are evaluated. This rule has priority 2, so it runs after your approval rule. That's correct—we want to try to approve good versions first, then reject bad ones."

**[CLICK: Save rule]**

**[SCREEN: Show preview results: "This rule would reject 15 versions"]**

**VOICEOVER:**

"The preview shows this rule would reject 15 of your pending versions. That's garbage that won't clutter your review queue anymore."

---

## Section 4: Monitoring Dashboard (5:30 - 7:00)

**[SCREEN: Navigate to Dashboard]**

**VOICEOVER:**

"Now let's look at where you monitor automation results. The most obvious indicator is the pending versions badge in your sidebar. This red badge shows how many versions still need manual review. Click it to go straight to the pending versions page."

**[SCREEN: Click badge, navigate to pending versions list]**

**[SCREEN: Show list of 8 pending versions]**

**VOICEOVER:**

"Here you see the pending versions—these are the edge cases that automation couldn't make a decision on. They need human judgment. You can:

One: Click any version to see the details—what changed, confidence score, similarity score.

Two: Select multiple versions with checkboxes and batch-approve or batch-reject them.

Three: Review them one by one if you want to be extra careful."

**[SCREEN: Select 3 versions, show action bar appears]**

**[VOICEOVER:]**

"When you select versions, an action bar appears at the top. You can bulk approve or reject them all at once. This is much faster than clicking approve 50 times."

**[CLICK: Approve Selected]**

**[SCREEN: Show confirmation dialog]**

**[CLICK: Confirm]**

**[SCREEN: Show success toast: "Successfully approved 3 versions"]**

**[SCREEN: Badge count decreases from 8 to 5]**

**VOICEOVER:**

"Great! Three versions approved. Notice the badge updated automatically from 8 to 5. That's WebSocket synchronization—the system updates in real-time without needing a page refresh."

**[SCREEN: Navigate to Automation Stats page]**

**VOICEOVER:**

"For a high-level view, check the Automation Stats page. This shows:
- How many versions you processed today
- Your approval rate, rejection rate, and pending count
- Your false positive rate—how often automation makes mistakes
- Your next scheduled run

You should review this weekly to ensure everything's working well."

---

## Section 5: Troubleshooting (7:00 - 7:45)

**[SCREEN: Navigate to Settings → Automation]**

**VOICEOVER:**

"If something goes wrong, here's where to look first. Is automation enabled? Yes, the toggle is on. Is the next scheduled run in the future? Yes, it says 'Tomorrow 9 AM.'

If versions aren't being auto-approved:
- Check your rule conditions—are your thresholds too strict? Click preview to see how many versions would match.
- Review the false positive rate—if it's climbing above 10%, raise your thresholds slightly.
- Check the audit logs to see which rules triggered."

**[SCREEN: Show "Run Now" button]**

**VOICEOVER:**

"There's also a 'Run Now' button. Use this if you want to test automation immediately instead of waiting for the scheduled time."

**[SCREEN: Navigate to Troubleshooting Guide link]**

**VOICEOVER:**

"For detailed troubleshooting, check the Troubleshooting Guide linked in the help menu. It covers common issues like 'Job not running,' 'Notifications not working,' and 'Too many false approvals.'"

---

## Section 6: Next Steps (7:45 - 8:00)

**[SCREEN: Show documentation index]**

**VOICEOVER:**

"Congratulations! You're now running automation. Here's what to do next:

One: Run with default settings for one week and monitor the results.

Two: If pending count is high (15+ per day), lower your thresholds by 5%.

Three: If you're seeing errors in your approvals, raise your thresholds instead.

Four: Read the Configuration Reference guide to learn about advanced rule conditions.

Five: Check out the Best Practices guide for recommended workflows by team size.

All these guides are available in the help menu. Good luck!"

**[SCREEN: Fade to Task Tracker logo]**

**[TEXT ON SCREEN: "Task Tracker Automation - Ready to scale!"]**

---

## Recording Checklist

- [ ] Use 1920x1080 resolution
- [ ] Zoom to 125% for readable text
- [ ] Use light theme (better contrast)
- [ ] Record in quiet environment
- [ ] Speak clearly at 100-120 words/minute
- [ ] Pause after each major point (for digestion)
- [ ] Use cursor highlighting for important UI elements
- [ ] Add background music (subtle, non-distracting)
- [ ] Get captions auto-generated and review for accuracy

## Uploads

**Platforms:**
- YouTube (unlisted or public link)
- Vimeo (embeddable in docs)
- Internal video hosting (if available)

**Metadata:**
```
Title: Task Tracker Automation Setup Tutorial
Description: Learn how to set up automated version management in 8 minutes
Tags: task-tracker, automation, tutorial, version-management
Thumbnail: Screenshot of dashboard with "Automation Setup" highlighted
```

## Optional Subtitles/Captions

Recommended for accessibility:

```vtt
WEBVTT

00:00:01.000 --> 00:00:05.000
Welcome to Task Tracker Automation!

00:00:05.000 --> 00:00:10.000
In this tutorial, you'll learn how to set up
and manage automated version approvals.
```

---

**Duration:** 8 minutes 15 seconds (target)
**File Size:** ~200-300 MB (1080p H.264)
**Suggested Edit Tool:** Loom, ScreenFlow, or OBS Studio
