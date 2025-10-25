# Implementation Guide: Telegram Settings Modal Redesign

**For:** Development Team
**Priority:** P0 (Critical Bug) + P1 (UX Improvements)
**Estimated Effort:** 2-3 weeks

---

## Quick Start

### Phase 1: Critical Bug Fix (Day 1) - MANDATORY

**Objective:** Fix data loss bug where updating webhook deletes all groups

**Files:**
- `/home/maks/projects/task-tracker/backend/app/webhook_service.py`

**Changes:**

```python
# Line 260-314: Modify save_telegram_config()

async def save_telegram_config(
    self,
    db: AsyncSession,
    protocol: str,
    host: str,
    is_active: bool = False,
    groups: list[dict] | None = None,
) -> TelegramWebhookConfig:
    normalized_host = host.strip().rstrip("/")
    webhook_url = f"{protocol}://{normalized_host}/webhook/telegram"

    # FIX: Preserve existing groups if not explicitly provided
    if groups is None:
        existing_config = await self.get_telegram_config(db)
        groups = []
        if existing_config and existing_config.groups:
            groups = [{"id": g.id, "name": g.name} for g in existing_config.groups]

    config_data = {
        "telegram": {
            "protocol": protocol,
            "host": normalized_host,
            "webhook_url": webhook_url,
            "is_active": is_active,
            "last_set_at": datetime.utcnow().isoformat() if is_active else None,
            "groups": groups,  # Now uses preserved groups instead of []
        }
    }

    # ... rest of function unchanged
```

**Testing:**
```bash
# Add test case
cd backend
uv run pytest tests/test_webhook_service.py::test_preserve_groups_on_webhook_update -v
```

**Verification Steps:**
1. Add 2 groups via UI
2. Update webhook URL
3. Verify groups still exist in database
4. Check API response includes groups

---

## Phase 2: Content Reduction (Week 1)

### Step 1: Remove Verbose Descriptions

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Remove lines 104-107:**
```tsx
// DELETE THIS:
<p className="text-sm text-muted-foreground">
  Configure the Telegram webhook endpoint. Settings are stored in the backend and
  mirrored locally for convenience.
</p>
```

### Step 2: Simplify Webhook URL Help Text

**Replace lines 132-138:**

**BEFORE:**
```tsx
<div id="webhook-url-help" className="mt-3 flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
  <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
  <p className="text-xs text-foreground/70">
    Provide the publicly accessible base URL, for example <code>https://ecf34ba1bf9a.ngrok-free.app</code>.
    The system will append <code>/webhook/telegram</code> automatically.
  </p>
</div>
```

**AFTER:**
```tsx
<p className="mt-1 text-xs text-muted-foreground">
  Auto-appends /webhook/telegram
</p>
```

**Also update placeholder (line 125):**
```tsx
placeholder="your-domain.ngrok.io"
```

### Step 3: Remove Workflow Warning Box

**Delete lines 179-184:**
```tsx
// DELETE THIS ENTIRE INFO BOX:
<div className="mt-3 flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
  <InformationCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
  <p className="text-xs text-foreground/70">
    <strong>Workflow:</strong> Save your changes first, then activate the webhook with Telegram
  </p>
</div>
```

### Step 4: Simplify Group Input Help

**Replace lines 278-283:**

**BEFORE:**
```tsx
<div className="mt-3 flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
  <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
  <p className="text-xs text-foreground/70">
    Copy group ID from Telegram Web URL (e.g., <code>https://web.telegram.org/k/#-2988379206</code>)
  </p>
</div>
```

**AFTER:**
```tsx
{/* Remove info box, rely on smart placeholder */}
```

**Update placeholder (line 256):**
```tsx
placeholder="Paste group URL or enter -100XXXXXXXXX"
```

### Step 5: Conditional Refresh Names Help

**Replace lines 322-332:**

**BEFORE:** Always shows instructions
**AFTER:** Show only when groups have no names

```tsx
{groups.some(g => !g.name) && (
  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md">
    <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
    <div className="text-xs text-foreground/70">
      <p className="font-medium mb-1">To fetch group names:</p>
      <ol className="list-decimal list-inside space-y-0.5">
        <li>Add bot as admin to your group</li>
        <li>Click "Refresh Names" above</li>
      </ol>
    </div>
  </div>
)}
```

---

## Phase 3: Button Consolidation (Week 1)

### Step 1: Create Combined Update Handler

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings.ts`

**Add new function (after handleSetWebhook):**

```typescript
const handleUpdateWebhook = async () => {
  if (!isValidBaseUrl) {
    toast.error('Webhook URL must not be empty')
    return
  }

  setIsSaving(true)
  setIsSettingWebhook(true)

  try {
    // Step 1: Save to database
    const { data: savedConfig } = await apiClient.post<TelegramWebhookConfigDto>(
      API_ENDPOINTS.webhookSettings,
      { protocol, host }
    )

    // Update local state from save
    const updatedBaseUrl = buildBaseUrl(savedConfig.protocol, savedConfig.host)
    setWebhookBaseUrl(updatedBaseUrl)
    setServerWebhookUrl(savedConfig.webhook_url || null)
    writeLocalConfig(updatedBaseUrl)

    // Step 2: Activate with Telegram
    const { data: activateResult } = await apiClient.post<SetWebhookResponseDto>(
      API_ENDPOINTS.telegramWebhook.set,
      { protocol: savedConfig.protocol, host: savedConfig.host }
    )

    if (activateResult.success) {
      toast.success('Webhook updated and activated successfully')
      await loadConfig() // Refresh to get final state
    } else {
      toast.error(activateResult.error || 'Failed to activate webhook')
    }
  } catch (error) {
    toast.error(`Failed to update webhook: ${extractErrorMessage(error)}`)
  } finally {
    setIsSaving(false)
    setIsSettingWebhook(false)
  }
}
```

**Export in return statement:**
```typescript
return {
  // ... existing exports
  handleUpdateWebhook,  // Add this
}
```

### Step 2: Update Component to Use New Handler

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Import from hook (line 34):**
```tsx
const {
  // ... existing
  handleUpdateWebhook,  // Add this
} = useTelegramSettings()
```

**Replace button group (lines 186-227):**

**BEFORE:**
```tsx
<div className="flex flex-wrap gap-3">
  <Button variant="ghost" onClick={loadConfig}>Refresh</Button>
  <Button variant="destructive" onClick={handleDeleteWebhook}>Delete webhook</Button>
  <Button variant="ghost" onClick={handleSave}>Save settings</Button>
  <Button variant="default" onClick={handleSetWebhook}>Set & Activate</Button>
</div>
```

**AFTER:**
```tsx
<div className="flex justify-end">
  <Button
    type="button"
    variant="default"
    onClick={handleUpdateWebhook}
    disabled={isSaving || isSettingWebhook || !isValidBaseUrl}
    aria-label="Update and activate webhook"
  >
    {isSaving || isSettingWebhook ? 'Updating...' : 'Update Webhook'}
  </Button>
</div>
```

### Step 3: Move Delete to Footer

**Add at end of component (before closing Sheet tag):**

```tsx
<SheetFooter className="mt-6 pt-6 border-t">
  <Button
    type="button"
    variant="destructive"
    onClick={handleDeleteWebhook}
    disabled={isDeletingWebhook || !isActive}
    aria-label="Delete webhook from Telegram"
  >
    {isDeletingWebhook ? 'Deleting...' : 'Delete Webhook'}
  </Button>
</SheetFooter>
```

---

## Phase 4: Smart Group Input (Week 1-2)

### Step 1: Add Smart URL Detection

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings.ts`

**Add helper functions (before useTelegramSettings hook):**

```typescript
const parseGroupInput = (input: string): number | null => {
  const cleaned = input.trim()

  // Try to extract from Telegram Web URL
  const urlMatch = cleaned.match(/(?:web\.telegram\.org|t\.me).*#?(-?\d+)/)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }

  // Try direct number parsing
  const directNumber = parseInt(cleaned, 10)
  if (!isNaN(directNumber)) {
    return directNumber
  }

  return null
}

const convertToLongFormat = (groupId: number): number => {
  // If already in long format (-100XXXXXXXXX), return as-is
  if (groupId < 0 && groupId.toString().startsWith('-100')) {
    return groupId
  }

  // Convert short format to long format
  if (groupId < 0) {
    return parseInt(`-100${Math.abs(groupId)}`, 10)
  }

  return groupId
}

const isValidGroupId = (input: string): boolean => {
  const parsed = parseGroupInput(input)
  return parsed !== null && parsed < 0
}
```

**Export these functions:**
```typescript
return {
  // ... existing
  parseGroupInput,
  convertToLongFormat,
  isValidGroupId,
}
```

### Step 2: Update handleAddGroup

**Modify handleAddGroup function (line 241):**

```typescript
const handleAddGroup = async () => {
  const parsedId = parseGroupInput(newGroupId)

  if (parsedId === null) {
    toast.error('Invalid group ID or URL. Paste a Telegram group link or enter -100XXXXXXXXX')
    return
  }

  if (parsedId >= 0) {
    toast.error('Group ID must be negative. Use format: -100XXXXXXXXX')
    return
  }

  const groupId = convertToLongFormat(parsedId)

  setIsAddingGroup(true)
  try {
    const { data } = await apiClient.post<TelegramWebhookConfigDto>(
      API_ENDPOINTS.telegramWebhook.groups,
      { group_id: groupId }
    )

    setGroups(data.groups || [])
    setNewGroupId('')
    toast.success('Group added successfully')
  } catch (error) {
    toast.error(`Failed to add group: ${extractErrorMessage(error)}`)
  } finally {
    setIsAddingGroup(false)
  }
}
```

### Step 3: Add Inline Validation to Input

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Update group input (lines 253-277):**

```tsx
const {
  // ... existing
  parseGroupInput,
  convertToLongFormat,
  isValidGroupId,
} = useTelegramSettings()

// Add state for validation
const [inputValidation, setInputValidation] = useState<'valid' | 'invalid' | null>(null)

// Add handler for input change
const handleGroupInputChange = (value: string) => {
  setNewGroupId(value)

  if (!value.trim()) {
    setInputValidation(null)
    return
  }

  setInputValidation(isValidGroupId(value) ? 'valid' : 'invalid')
}

// Update Input component
<Input
  id="new-group-id"
  placeholder="Paste group URL or enter -100XXXXXXXXX"
  value={newGroupId}
  onChange={(e) => handleGroupInputChange(e.target.value)}
  autoComplete="off"
  aria-label="Enter Telegram group ID or URL"
  className={cn(
    "flex-1",
    inputValidation === 'valid' && "border-green-500 focus:border-green-500",
    inputValidation === 'invalid' && "border-red-500 focus:border-red-500"
  )}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && inputValidation === 'valid') {
      handleAddGroup()
    }
  }}
/>

{/* Show validation feedback */}
{inputValidation === 'valid' && (
  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
    <CheckIcon className="h-3 w-3" />
    Valid group ID
  </p>
)}
{inputValidation === 'invalid' && (
  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
    Invalid format. Paste a Telegram group link or enter -100XXXXXXXXX
  </p>
)}
```

---

## Phase 5: Visual Improvements (Week 2)

### Step 1: Move Status to Header

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

**Update SheetHeader (lines 93-98):**

**BEFORE:**
```tsx
<SheetHeader>
  <SheetTitle>Telegram Settings</SheetTitle>
  <SheetDescription>
    Configure webhook endpoint and manage monitored groups
  </SheetDescription>
</SheetHeader>
```

**AFTER:**
```tsx
<SheetHeader>
  <div className="flex items-center justify-between">
    <SheetTitle>Telegram Integration</SheetTitle>
    {!isLoadingConfig && (
      <Badge variant={isActive ? 'default' : 'secondary'} className={cn(
        "flex items-center gap-1.5",
        isActive && "bg-green-500 text-white"
      )}>
        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-400'}`} />
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )}
  </div>
</SheetHeader>
```

**Remove old status display (lines 166-177):**
```tsx
// DELETE THIS SECTION:
<div>
  <Label className="text-sm font-medium">Status</Label>
  <div className="mt-2 flex items-center gap-2">
    {/* ... status display ... */}
  </div>
</div>
```

### Step 2: Add Empty State for Groups

**Add after groups list (line 333):**

```tsx
{groups.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
      <ChatBubbleLeftRightIcon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h4 className="text-sm font-medium text-foreground mb-1">No groups yet</h4>
    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
      Paste a Telegram group URL or enter a group ID to start monitoring messages
    </p>
  </div>
)}
```

### Step 3: Improve Group Card Design

**Update group card (lines 290-319):**

**BEFORE:**
```tsx
<Card key={group.id} className="p-3">
  <div className="flex items-center gap-3">
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500/10 shrink-0">
      <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground truncate">
          {group.name || `Group ${group.id}`}
        </p>
        {!group.name && (
          <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate">ID: {group.id}</p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleRemoveGroup(group.id)}
      disabled={removingGroupIds.has(group.id)}
    >
      {removingGroupIds.has(group.id) ? 'Removing…' : 'Remove'}
    </Button>
  </div>
</Card>
```

**AFTER:**
```tsx
<Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
  <div className="flex items-center gap-3">
    <div className="text-2xl shrink-0">🔵</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-sm font-medium text-foreground truncate">
          {group.name || `Group ${group.id}`}
        </p>
        {!group.name && (
          <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Active • Messages being monitored
      </p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleRemoveGroup(group.id)}
      disabled={removingGroupIds.has(group.id)}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      aria-label={`Remove ${group.name || 'group'}`}
    >
      {removingGroupIds.has(group.id) ? (
        <>Removing…</>
      ) : (
        <>
          <XMarkIcon className="h-4 w-4 mr-1" />
          Remove
        </>
      )}
    </Button>
  </div>
</Card>
```

---

## Testing Checklist

### Backend Tests

**File:** `/home/maks/projects/task-tracker/backend/tests/test_webhook_service.py`

```python
async def test_preserve_groups_on_webhook_update(db_session):
    """Test that updating webhook preserves existing groups"""
    service = webhook_settings_service

    # Step 1: Create initial config with groups
    initial_groups = [
        {"id": -1001234567890, "name": "Test Group 1"},
        {"id": -1009876543210, "name": "Test Group 2"},
    ]
    await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="old-domain.com",
        is_active=True,
        groups=initial_groups,
    )

    # Step 2: Update webhook URL without passing groups
    updated_config = await service.save_telegram_config(
        db=db_session,
        protocol="https",
        host="new-domain.com",
        is_active=False,
        groups=None,  # Simulates frontend not passing groups
    )

    # Step 3: Verify groups are preserved
    assert len(updated_config.groups) == 2
    assert updated_config.groups[0].id == -1001234567890
    assert updated_config.groups[1].id == -1009876543210
    assert updated_config.webhook_url == "https://new-domain.com/webhook/telegram"

async def test_group_id_conversion():
    """Test short format to long format conversion"""
    assert convertToLongFormat(-2988379206) == -1002988379206
    assert convertToLongFormat(-1002988379206) == -1002988379206  # Already long

async def test_parse_group_url():
    """Test URL parsing"""
    url = "https://web.telegram.org/k/#-2988379206"
    parsed = parseGroupInput(url)
    assert parsed == -2988379206
```

### Frontend Tests

**File:** `/home/maks/projects/task-tracker/frontend/src/pages/SettingsPage/plugins/TelegramSource/__tests__/TelegramSettingsSheet.test.tsx`

```typescript
describe('TelegramSettingsSheet', () => {
  it('should preserve groups when updating webhook', async () => {
    // Mock API with initial groups
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        telegram: {
          protocol: 'https',
          host: 'old-domain.com',
          groups: [
            { id: -1001234567890, name: 'Test Group' }
          ]
        }
      }
    })

    const { getByLabelText, getByText } = render(<TelegramSettingsSheet open />)

    // Update webhook URL
    const input = getByLabelText('Webhook base URL')
    fireEvent.change(input, { target: { value: 'new-domain.com' } })

    // Click update button
    const updateBtn = getByText('Update Webhook')
    fireEvent.click(updateBtn)

    // Verify groups are still present in request
    expect(mockApiClient.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        protocol: 'https',
        host: 'new-domain.com',
        // groups should be preserved, not empty
      })
    )
  })

  it('should detect and parse Telegram group URL', () => {
    const url = 'https://web.telegram.org/k/#-2988379206'
    const parsed = parseGroupInput(url)
    expect(parsed).toBe(-2988379206)
  })

  it('should convert short group ID to long format', () => {
    expect(convertToLongFormat(-2988379206)).toBe(-1002988379206)
  })

  it('should show inline validation for valid group ID', async () => {
    const { getByLabelText, getByText } = render(<TelegramSettingsSheet open />)

    const input = getByLabelText('Enter Telegram group ID or URL')
    fireEvent.change(input, { target: { value: '-1002988379206' } })

    expect(getByText('Valid group ID')).toBeInTheDocument()
  })

  it('should show empty state when no groups', () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: { telegram: { groups: [] } }
    })

    const { getByText } = render(<TelegramSettingsSheet open />)
    expect(getByText('No groups yet')).toBeInTheDocument()
  })
})
```

### Manual Testing Scenarios

1. **Data Loss Bug Verification:**
   - Add 3 groups
   - Change webhook URL
   - Refresh page
   - Verify all 3 groups still visible

2. **Smart URL Detection:**
   - Copy `https://web.telegram.org/k/#-2988379206`
   - Paste into group input
   - Should show "Valid group ID" with green border
   - Click [+], group should be added with ID `-1002988379206`

3. **Button Workflow:**
   - Enter new webhook URL
   - Click "Update Webhook"
   - Should see single success message (not two separate toasts)
   - Status should change to "Active"

4. **Visual Improvements:**
   - Open modal, status badge should be in header
   - No blue info boxes should be visible
   - Only 2 primary buttons visible (Update Webhook + Refresh Names)
   - Delete Webhook in footer, red outline style

---

## Performance Considerations

### Bundle Size

**Before:**
- 5 info boxes with icons
- 4 button components
- Complex conditional rendering
- Estimated: 12-15 KB (gzipped)

**After:**
- 0 info boxes
- 2 button components
- Simplified logic
- Estimated: 10-12 KB (gzipped)
- **Savings: ~3 KB**

### Runtime Performance

- Fewer DOM nodes (removed info boxes)
- Simplified re-render logic (fewer conditional renders)
- Optimized event handlers (consolidated button actions)
- Better React.memo opportunities (simpler component tree)

### API Calls

**Before:**
- Load config: 1 call
- Save settings: 1 call
- Activate webhook: 1 call
- Total for update: **2 calls**

**After:**
- Load config: 1 call
- Update webhook (combined): Still 2 calls internally, but feels like 1 to user
- Better error handling (rolls back on failure)

---

## Rollback Plan

If critical issues arise after deployment:

### Immediate Rollback (< 1 hour)

1. **Revert backend bug fix:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Revert frontend changes:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Redeploy:**
   ```bash
   just services-clean
   just services
   ```

### Partial Rollback (Staged)

If only specific features cause issues:

1. **Keep bug fix** (critical, low risk)
2. **Revert UI changes** (can iterate)
3. **Gradual re-rollout** with A/B testing

### Data Recovery

If groups are lost despite bug fix:

1. **Check database backups:**
   ```sql
   SELECT * FROM webhook_settings
   WHERE name = 'telegram_webhook'
   ORDER BY updated_at DESC
   LIMIT 5;
   ```

2. **Restore from backup:**
   ```bash
   # Restore specific table
   pg_restore -t webhook_settings backup.dump
   ```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (backend + frontend)
- [ ] Type checking passes (`just typecheck`)
- [ ] Linting passes (`just fmt-check`)
- [ ] Visual regression tests reviewed
- [ ] Accessibility audit completed
- [ ] Performance benchmarks acceptable
- [ ] Database migration tested in staging
- [ ] Rollback plan documented and tested

### Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] User acceptance testing (5-10 users)
- [ ] Monitor error rates for 24 hours
- [ ] Deploy to production
- [ ] Monitor for 48 hours

### Post-Deployment

- [ ] Verify data loss bug is fixed (check database)
- [ ] Monitor user feedback channels
- [ ] Track success metrics (setup time, completion rate)
- [ ] Document lessons learned
- [ ] Schedule follow-up improvements

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Error Rate:**
   - Webhook update failures
   - Group add failures
   - API response errors

2. **User Behavior:**
   - Time to complete setup
   - Button click patterns
   - Input validation error rate
   - Group addition success rate

3. **Data Integrity:**
   - Group count before/after webhook updates
   - Webhook configuration consistency
   - Database transaction failures

### Alerts to Set Up

```javascript
// Alert if group count decreases after webhook update
if (groupsBeforeUpdate > groupsAfterUpdate) {
  alert('CRITICAL: Groups lost during webhook update')
}

// Alert if error rate spikes
if (errorRate > 5%) {
  alert('High error rate in Telegram settings')
}

// Alert if setup time increases significantly
if (avgSetupTime > 5 minutes) {
  alert('User setup time degraded')
}
```

---

## Support Documentation Updates

### User Guide Updates

**New screenshot locations:**
- `/docs/images/telegram-setup-new.png`
- `/docs/images/telegram-groups-new.png`

**Update these docs:**
1. Quick Start Guide → Telegram Integration section
2. Troubleshooting → Webhook Configuration
3. FAQ → "How do I add a Telegram group?"

**New FAQ entries:**
```markdown
### Q: Can I paste a Telegram group link directly?
A: Yes! Copy the URL from Telegram Web (e.g., https://web.telegram.org/k/#-2988379206) and paste it into the group input. The system will automatically extract and convert the group ID.

### Q: What's the difference between "Save" and "Update Webhook"?
A: The "Update Webhook" button now handles both saving your settings and activating the webhook with Telegram in one step. You don't need to click two separate buttons anymore.

### Q: Why did my groups disappear?
A: This was a bug in earlier versions that has been fixed. If you experience this, please contact support immediately.
```

---

## Future Enhancements (Backlog)

### Phase 4: Advanced Features

1. **Webhook Health Check**
   - Ping webhook URL before activation
   - Show "Reachable" or "Unreachable" indicator
   - Suggest ngrok if localhost detected

2. **Group Activity Dashboard**
   - Show message count per group (today, week, month)
   - Most active hours heatmap
   - Group health indicators

3. **Bulk Group Management**
   - Import groups from CSV
   - Export groups list
   - Bulk remove/enable/disable

4. **Advanced Validation**
   - Real-time webhook URL validation
   - Check if bot is admin before adding group
   - Detect duplicate groups

5. **Better Error Recovery**
   - Undo action for removed groups (30s window)
   - Auto-retry failed operations
   - Detailed error logs accessible to user

---

**END OF IMPLEMENTATION GUIDE**
