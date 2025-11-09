# Keyboard Navigation Guide

!!! success "Fully Accessible"
    All interactive elements in Task Tracker are fully accessible via keyboard. You can navigate the entire application without using a mouse.

## Overview

Task Tracker is designed with keyboard accessibility in mind. Whether you prefer keyboard navigation for efficiency or require it for accessibility, all features are available through keyboard controls.

## Global Navigation

### Primary Navigation

| Key | Action |
|-----|--------|
| ++tab++ | Move to next interactive element |
| ++shift+tab++ | Move to previous interactive element |
| ++enter++ or ++space++ | Activate buttons, links, and controls |
| ++escape++ | Close dialogs, menus, and modals |

### Skip Links

Press ++tab++ on any page to reveal the "Skip to main content" link, allowing you to bypass navigation and jump directly to the main content area.

## Data Tables

Data tables (used in Messages, Topics, Analysis Runs, and other pages) support full keyboard navigation.

### Row Selection

<div class="grid cards" markdown>

- :material-checkbox-multiple-marked: **Select Rows**

    Press ++tab++ to focus on checkboxes, then ++space++ to toggle selection

- :material-select-all: **Select All**

    Navigate to the header checkbox and press ++space++ to select/deselect all rows

</div>

### Column Sorting

1. Press ++tab++ to navigate to column header buttons
2. Press ++enter++ or ++space++ to sort by that column
3. Press again to reverse sort order

### Actions Menu

Each row has an actions menu (three dots icon):

1. Press ++tab++ to navigate to the actions button
2. Press ++enter++ or ++space++ to open the menu
3. Use ++arrow-up++ and ++arrow-down++ to navigate menu items
4. Press ++enter++ to select an item
5. Press ++escape++ to close the menu without selecting

### Pagination

Navigate through data pages using keyboard:

1. Press ++tab++ to reach pagination controls
2. Press ++enter++ or ++space++ on:
    - "Next page" button
    - "Previous page" button
    - "First page" button
    - "Last page" button

## Forms and Inputs

### Text Fields

| Key | Action |
|-----|--------|
| ++tab++ | Move to next field |
| ++shift+tab++ | Move to previous field |
| ++ctrl+a++ | Select all text |
| ++ctrl+c++ | Copy selected text |
| ++ctrl+v++ | Paste text |

### Dropdowns and Select Menus

1. Press ++tab++ to focus on dropdown
2. Press ++enter++ or ++space++ to open options
3. Use ++arrow-up++ and ++arrow-down++ to navigate options
4. Press ++enter++ to select
5. Press ++escape++ to close without selecting

### Checkboxes and Switches

1. Press ++tab++ to focus
2. Press ++space++ to toggle on/off

### Radio Buttons

1. Press ++tab++ to enter radio group
2. Use ++arrow-up++ and ++arrow-down++ to select options
3. Press ++tab++ to exit radio group

## Filters and Search

### Filter Buttons

Topic, Status, Classification, and other filter buttons:

1. Press ++tab++ to focus on filter button
2. Press ++enter++ or ++space++ to open filter menu
3. Use ++arrow-up++ and ++arrow-down++ to navigate options
4. Press ++space++ to toggle filter checkboxes
5. Press ++escape++ to close and apply filters

### Search Fields

1. Press ++tab++ to focus on search input
2. Type your search query
3. Press ++enter++ to trigger search (if needed)
4. Press ++escape++ to clear search (in some contexts)

## Dialogs and Modals

When a dialog opens:

- Focus automatically moves to the dialog
- ++tab++ cycles through interactive elements within the dialog
- ++escape++ closes the dialog
- Focus returns to the triggering element when closed

## Tooltips

Tooltips appear automatically when keyboard focus is on an element with additional information. They disappear when focus moves away.

## Accessibility Features

### Focus Indicators

All interactive elements show a visible focus ring when navigated via keyboard:

- **Primary color ring**: Indicates current keyboard focus
- **High contrast**: Easily visible in both light and dark themes

### Screen Reader Support

All interactive elements include proper ARIA labels:

- Buttons describe their action
- Checkboxes include row identification
- Tables have proper column headers
- Form fields have associated labels

### No Keyboard Traps

You can always navigate away from any element using ++tab++, ++shift+tab++, or ++escape++. No element will trap your keyboard focus.

## Page-Specific Navigation

### Messages Page

Navigate the message feed efficiently:

1. Use filters to narrow down messages
2. Press ++tab++ to move through checkboxes for batch selection
3. Access actions menu for individual message operations
4. Use column sorting to organize by date, author, or importance

### Topics Page

Browse and manage topics:

1. Navigate through topic cards using ++tab++
2. Press ++enter++ on a card to view topic details
3. Use filters to find specific topics
4. Sort by various criteria using column headers

### Analysis Runs Page

Monitor and manage analysis runs:

1. Navigate through run status cards
2. Access run details and controls
3. Filter by status, time period, or agent
4. Manage proposals via keyboard

## Tips for Efficient Keyboard Navigation

!!! tip "Keyboard Shortcuts"
    - ++ctrl+k++ - Open search (if implemented)
    - ++alt+t++ - Focus notifications
    - ++slash++ - Focus search field (common pattern)

!!! note "Custom Shortcuts"
    Some pages may have additional keyboard shortcuts. Look for keyboard icons or hints in the interface.

## Browser Keyboard Shortcuts

Standard browser shortcuts work throughout the application:

| Shortcut | Action |
|----------|--------|
| ++ctrl+f++ (++cmd+f++ on Mac) | Find in page |
| ++f5++ or ++ctrl+r++ | Refresh page |
| ++ctrl+plus++ | Zoom in |
| ++ctrl+minus++ | Zoom out |
| ++ctrl+0++ | Reset zoom |

## Reporting Accessibility Issues

If you encounter any element that cannot be accessed via keyboard, please report it as an accessibility bug. All features should be fully keyboard accessible.

## Technical Implementation

!!! info "Built with Accessibility"
    Task Tracker uses industry-standard accessible components:

    - **Radix UI primitives** for checkboxes, dropdowns, and dialogs
    - **TanStack Table** for data grid keyboard support
    - **ARIA attributes** for screen reader compatibility
    - **Focus management** following WAI-ARIA best practices

---

*Last updated: October 2025*
