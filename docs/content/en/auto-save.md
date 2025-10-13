# Auto-Save Feature

!!! tip "Quick Overview"
    Auto-save keeps your work safe by automatically saving changes as you type. No more lost work from forgotten save buttons!

---

## What is Auto-Save?

**Auto-save** is an intelligent feature that automatically saves your changes to the server without requiring manual save buttons. It works seamlessly in the background while you edit content like topics, tasks, or project details.

!!! success "Key Benefits"
    - ✓ **Never lose work** - Changes saved automatically
    - ✓ **Fast and responsive** - Saves happen in the background
    - ✓ **User control** - Toggle on/off anytime
    - ✓ **Visual feedback** - Always know your save status

---

## How It Works

### The Auto-Save Process

When you make changes to any editable content:

1. **You type** - System detects the change
2. **Wait 500ms** - Debounce delay to batch rapid changes
3. **Auto-save** - Changes sent to server automatically
4. **Confirmation** - Status indicator shows success

!!! info "Debouncing Explained"
    Auto-save waits 500 milliseconds after you stop typing before saving. This prevents excessive server requests while you're actively editing.

### Visual Status Indicators

The system shows your save status at all times:

| Status | Icon | Description |
|--------|------|-------------|
| **Saved** | 🟢 Green checkmark | All changes saved successfully |
| **Saving...** | 🔵 Blue cloud (pulsing) | Currently saving to server |
| **Unsaved changes** | 🟡 Amber dot (pulsing) | Changes pending when auto-save is off |
| **Save failed** | 🔴 Red warning | Error occurred, retry needed |

---

## User Interface

### Auto-Save Toggle

Located in the top-right header next to the save status indicator:

```
[Save Status]  |  Auto-save [Toggle Switch]
```

!!! tip "Quick Toggle"
    Click the toggle switch to turn auto-save on or off instantly. Your preference is remembered for the next session.

### Manual Save Mode

When auto-save is **disabled** and you have unsaved changes:

- **Discard** button - Revert changes to last saved version
- **Save Changes** button - Manually save your edits

!!! warning "Unsaved Changes Warning"
    With auto-save off, you're responsible for clicking Save. The system will show an amber "Unsaved changes" indicator.

---

## Where Auto-Save Works

Auto-save is available on detail pages for:

### ✓ Topic Details
- Topic name
- Topic description
- Topic color

### ✓ Coming Soon
- Task details
- Project details
- Agent configurations

---

## Behavior Details

### Smart Initial Load

When you open a detail page:

!!! success "No False Alarms"
    The system recognizes that loaded data is already saved. You won't see "Unsaved changes" on first load.

### Navigation Safety

When navigating between pages:

- **Auto-save ON**: Changes saved automatically before leaving
- **Auto-save OFF**: You must click Save or your changes are lost

!!! danger "Manual Mode Warning"
    If you turn off auto-save, remember to click **Save Changes** before navigating away!

### Error Handling

If a save fails:

1. **Status shows error** - Red warning icon appears
2. **Toast notification** - Error message displayed
3. **Retry available** - Click manual save or wait for auto-retry
4. **Changes preserved** - Your edits remain in the form

---

## Best Practices

### ✓ Do's

!!! tip "Keep Auto-Save On"
    Leave auto-save enabled for the best experience. It's designed to be fast and reliable.

!!! tip "Check Status Before Leaving"
    Glance at the status indicator before closing a tab - make sure you see "Saved" with a green checkmark.

!!! tip "Trust the System"
    Auto-save is smart. It won't create duplicate requests or waste bandwidth.

### ✗ Don'ts

!!! warning "Don't Disable Without Reason"
    Auto-save is on by default for your protection. Only turn it off if you need manual control.

!!! warning "Don't Ignore Error Indicators"
    If you see a red error icon, investigate immediately. Your changes might not be saved.

---

## Technical Details

??? note "For Developers: How It's Built"
    ### Architecture

    Auto-save uses the `useAutoSave` hook with:

    - **Debouncing** - 500ms delay using `useDebounce` hook
    - **Optimistic updates** - UI updates immediately, server syncs in background
    - **State management** - Tracks save status, unsaved changes, timestamps
    - **Error recovery** - Automatic retries with exponential backoff

    ### Key Components

    - `useAutoSave<T>` - Reusable generic hook for any entity type
    - `SaveStatusIndicator` - Visual status display component
    - `AutoSaveToggle` - User control switch component

    ### API Integration

    Uses TanStack Query (React Query) for:
    - Optimistic updates
    - Cache invalidation
    - Request deduplication
    - Error handling

    ### Performance

    - Batches rapid changes with debouncing
    - Cancels pending saves on unmount
    - Prevents duplicate requests with ref tracking
    - Minimal re-renders using React refs

---

## Frequently Asked Questions

??? question "What happens if I lose internet connection?"
    The save will fail and you'll see an error indicator. Your changes remain in the form. When connection returns, you can manually save or the system will auto-retry.

??? question "Can I change the auto-save delay?"
    Currently, the 500ms delay is fixed. This provides the best balance between responsiveness and server efficiency.

??? question "Does auto-save work on mobile?"
    Yes! Auto-save works identically on all devices - desktop, tablet, and mobile.

??? question "Will auto-save slow down my editing?"
    No. Auto-save happens asynchronously in the background and won't block your typing or interactions.

??? question "What if two people edit the same thing?"
    The system uses optimistic updates with server validation. The last save wins. Future updates will add conflict detection.

---

## Future Enhancements

Planned improvements for auto-save:

- 🔄 **Conflict detection** - Warn when multiple users edit simultaneously
- 💾 **Offline mode** - Queue saves when offline, sync when online
- ⚙️ **Configurable delay** - User preference for debounce timing
- 📝 **Edit history** - Track all auto-saves for undo/redo
- 🔔 **Save analytics** - Show save frequency and patterns

---

!!! success "Work Confidently"
    With auto-save enabled, focus on your work without worrying about losing changes. The system has your back!
