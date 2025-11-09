# Topics Search, Pagination & Sorting Guide

**Last Updated:** October 27, 2025
**Status:** Production Ready
**Audience:** End Users

## Overview

The Topics page now includes powerful search, sorting, and pagination features that make managing large collections of topics fast and efficient. Whether you have 10 or 10,000 topics, you can find what you need in seconds.

**Key Benefits:**

- Find topics 7.5x faster with real-time search
- Browse large collections with smooth pagination (24 topics per page)
- Organize topics with 5 flexible sorting options
- Full UTF-8/Cyrillic support for international content

---

## Search Topics

### Using the Search Bar

The search bar appears at the top of the Topics page. It searches both topic names and descriptions simultaneously.

**To search:**

1. Click the search input field
2. Type your query (results appear automatically)
3. Results update after 300ms of typing (debounced for performance)

**Search features:**

- **Case-insensitive**: "api" finds "API", "Api", and "api"
- **UTF-8/Cyrillic support**: Search in Ukrainian, Russian, or any language
- **Partial matching**: "auth" finds "Authentication", "OAuth", "Authorize"
- **Multi-word search**: "api design" finds topics containing both words

### Clear Search Results

Click the **×** button inside the search field to instantly clear your search and return to all topics.

### Search Results Counter

Below the search bar, you'll see: **"Found X topics"**

This shows how many topics match your current search query.

---

## Sort Topics

### Available Sort Options

Click the **Sort** dropdown to choose how topics are organized:

| Sort Option | Description | Use Case |
|-------------|-------------|----------|
| **Newest First** | Recently created topics at top | Default view, see what's new |
| **Oldest First** | Original topics first | Historical review, audit trail |
| **Name A-Z** | Alphabetical ascending | Find topics by name quickly |
| **Name Z-A** | Alphabetical descending | Reverse alphabetical order |
| **Recently Updated** | Last modified topics first | See active discussions |

### Default Sorting

By default, topics are sorted by **Newest First** (recently created). This shows your most recent topics at the top.

### How to Change Sorting

1. Click the **Sort** dropdown (next to search bar)
2. Select your preferred option
3. Topics reorder instantly (no page reload needed)

!!! tip "Combine Search + Sort"
    Search and sort work together! Try searching "design" and sorting by "Recently Updated" to find active design discussions.

---

## Navigate Pages

### Pagination Controls

When you have more than 24 topics, pagination controls appear at the bottom of the page.

**Controls available:**

- **Previous** button (◄) - Go to previous page
- **Page numbers** - Jump to specific page (1, 2, 3, ...)
- **Next** button (►) - Go to next page
- **Items counter** - Shows "Showing 1-24 of 156 topics"

### Smart Page Numbers

For large collections, page numbers use smart ellipsis:

```
◄ 1 ... 5 6 [7] 8 9 ... 20 ►
```

This keeps the interface clean while allowing quick navigation.

### Items Per Page

The page shows **24 topics** at a time (optimized for grid layout: 2 rows × 12 columns on desktop).

### Automatic Page Reset

When you search or change sorting, the page automatically resets to page 1. This ensures you see the most relevant results immediately.

---

## Common Workflows

### Find a Specific Topic

**Scenario:** You remember the topic is about "authentication" but don't remember the exact name.

**Steps:**

1. Type "auth" in the search bar
2. Results narrow to topics containing "auth"
3. Click the topic you need

**Time saved:** <2 seconds vs. 15+ seconds scrolling manually

---

### Browse All Topics Alphabetically

**Scenario:** You want to review all topics in alphabetical order.

**Steps:**

1. Clear any active search (click × button)
2. Select **Sort** → **Name A-Z**
3. Use pagination to browse page by page

---

### Find Recently Updated Topics

**Scenario:** You want to see which topics have been recently modified.

**Steps:**

1. Select **Sort** → **Recently Updated**
2. The most recently changed topics appear first
3. Use pagination to review older updates

---

### Search with Cyrillic Characters

**Scenario:** You have topics in Ukrainian and want to search them.

**Steps:**

1. Type Ukrainian/Russian text directly in search bar: "проект"
2. Results show matching Cyrillic topics
3. Search works identically to Latin characters

**Example searches:**

- "задач" → finds topics about tasks (задачі)
- "API" → finds topics mixing English/Cyrillic
- "дизайн інтерфейсу" → finds UI design topics

---

## Performance Tips

### Fast Search

Search uses **300ms debouncing**, meaning:

- Type naturally without waiting
- API calls only happen after you pause typing
- Reduces server load and improves responsiveness

### Caching

The system caches search results automatically:

- Switching between pages doesn't refetch data
- Going back to previous search is instant
- Cache updates when you create/edit topics

### Optimal Page Size

24 topics per page balances:

- **Visibility**: See enough topics without scrolling too much
- **Performance**: Load time stays under 500ms
- **Layout**: Fits perfectly in grid view (2 rows × 12 on desktop)

---

## Troubleshooting

### Search Not Working

**Symptom:** Typing in search bar doesn't filter topics

**Solutions:**

1. **Check for typos** - Try different spellings
2. **Clear browser cache** - Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
3. **Verify network** - Open browser DevTools → Network tab
4. **Check API status** - Contact admin if API is down

---

### Pagination Not Appearing

**Symptom:** No pagination controls visible

**Reason:** You have 24 or fewer topics (pagination only appears when needed)

**Verification:** Check the counter—if it says "Showing 1-X of X topics" where X ≤ 24, pagination is disabled by design.

---

### Search Results Wrong

**Symptom:** Search shows unexpected topics

**Explanation:** Search matches both **name** and **description** fields. A topic might not have your keyword in the name but contains it in the description.

**Example:**

- Search: "oauth"
- Result: Topic "User Authentication" (description mentions OAuth2 implementation)

This is intentional to ensure comprehensive search results.

---

### Sort Order Not Changing

**Symptom:** Dropdown changes but topics stay in same order

**Solutions:**

1. **Refresh the page** - Sometimes cached data needs a reload
2. **Clear search** - Active search might override sorting
3. **Check browser console** - Look for JavaScript errors (F12)

---

## Technical Specifications

### Search

- **Algorithm:** PostgreSQL ILIKE (case-insensitive pattern matching)
- **Fields searched:** Topic name + description
- **Character support:** UTF-8 (all Unicode characters including Cyrillic, Chinese, emoji)
- **Debounce delay:** 300ms
- **Performance:** <500ms response time for 10,000+ topics

### Pagination

- **Page size:** 24 topics per page (configurable by admin)
- **Max page size:** 1000 topics (API limit)
- **Offset calculation:** `(page - 1) × page_size`
- **Performance:** <1s load time for any page

### Sorting

- **Database-level:** Sorting happens on PostgreSQL server (efficient for large datasets)
- **Supported fields:** name, created_at, updated_at
- **Default:** created_at DESC (newest first)

---

## Next Steps

### Explore Advanced Features

- **Bulk operations**: Select multiple topics for batch actions (future feature)
- **Filtering**: Combine search with metadata filters (future feature)
- **Export**: Download search results as CSV/JSON (future feature)

### Learn More

- [Context Spaces (Topics)](/topics) - Full Topics feature guide
- [API Reference](/api/topics) - Developer documentation
- [Architecture](/architecture/overview) - System design details

---

## Getting Help

**For feature questions:**

- Check the [Topics User Guide](/topics)
- Review [API documentation](/api/topics)

**For bugs or issues:**

- Contact your system administrator
- Provide screenshots and steps to reproduce
- Check browser console for error messages (F12 → Console tab)

---

!!! success "Quick Wins"
    - Use search to find topics in <2 seconds
    - Sort by "Recently Updated" to see active discussions
    - Combine search + sort for powerful filtering
