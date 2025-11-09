# Developer Handoff Guide: Pulse Radar Dashboard Redesign

**Project**: Task Tracker - AI Task Classification System
**Design Phase**: UX Audit → Design System → Redesign
**Date**: 2025-10-19
**Status**: Ready for Implementation

---

## 📋 Executive Summary

This document provides implementation guidance for the Pulse Radar Dashboard redesign based on comprehensive UX audit findings. The redesign focuses on:

1. **Improved Onboarding** - Guided wizard for new users
2. **Clear Information Architecture** - Renamed sections, logical grouping
3. **Enhanced Visual Hierarchy** - Obvious primary actions, better contrast
4. **Accessibility Compliance** - WCAG 2.1 AA standards
5. **Better Empty States** - Actionable guidance instead of blank screens

---

## 🎨 Design System Implementation

### Color Variables (CSS Custom Properties)

**Update `/frontend/src/theme.css` and `/frontend/src/index.css`:**

```css
:root {
  /* Existing variables - keep as is */
  --brand-orange: #ff6b35;
  --brand-peach: #ff9b71;

  /* Enhanced semantic colors for better contrast */
  --text-primary: hsl(var(--foreground));
  --text-secondary: color-mix(in srgb, hsl(var(--foreground)) 75%, hsl(var(--background)) 25%); /* Increased from 70% */
  --text-tertiary: color-mix(in srgb, hsl(var(--foreground)) 60%, hsl(var(--background)) 40%); /* Increased from 55% */
  --text-muted: color-mix(in srgb, hsl(var(--foreground)) 45%, hsl(var(--background)) 55%); /* Increased from 40% */

  /* Touch target minimum */
  --touch-target-min: 44px;

  /* Focus ring */
  --focus-ring-width: 2px;
  --focus-ring-offset: 4px;
  --focus-ring-color: hsl(var(--ring));
}

[data-theme='dark'] {
  /* Enhanced dark mode contrast */
  --text-secondary: color-mix(in srgb, hsl(var(--foreground)) 78%, hsl(var(--background)) 22%); /* Increased from 72% */
  --text-tertiary: color-mix(in srgb, hsl(var(--foreground)) 62%, hsl(var(--background)) 38%); /* Increased from 55% */
  --text-muted: color-mix(in srgb, hsl(var(--foreground)) 48%, hsl(var(--background)) 52%); /* Increased from 38% */
}

/* Focus visible utility */
.focus-visible-ring:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--radius-sm);
}

/* Minimum touch target */
.touch-target {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}
```

### Typography Updates

**Add to `/frontend/src/theme.css`:**

```css
/* Button text styles */
.typography-button-lg {
  font-size: 1rem; /* 16px */
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
  letter-spacing: var(--letter-spacing-normal);
}

.typography-button-md {
  font-size: 0.875rem; /* 14px */
  font-weight: var(--font-weight-semibold);
  line-height: 1.43;
  letter-spacing: var(--letter-spacing-normal);
}

.typography-button-sm {
  font-size: 0.75rem; /* 12px */
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  letter-spacing: var(--letter-spacing-normal);
}
```

---

## 🧩 Component Updates

### 1. Button Component Enhancement

**File**: `/frontend/src/shared/components/Button.tsx` (or extend shadcn Button)

```typescript
// Add new button variants to shadcn config
// File: /frontend/src/components/ui/button.tsx

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-90 active:brightness-80 shadow-sm hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-90 active:brightness-80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-110",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2", // 40px height
        sm: "h-9 rounded-md px-3", // 36px height
        lg: "h-11 rounded-md px-8", // 44px height - meets touch target
        icon: "h-10 w-10", // 40px square
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Usage example with loading state:
<Button variant="default" size="lg" disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Primary Action'}
</Button>
```

**Key Implementation Notes:**
- Primary buttons: Use `variant="default" size="lg"`
- Secondary: Use `variant="outline"` or `variant="secondary"`
- Ghost/tertiary: Use `variant="ghost"`
- Always include `focus-visible:ring-2` for keyboard users
- Loading state: Show spinner + change text

### 2. Stat Card Component

**Create**: `/frontend/src/shared/components/StatCard.tsx`

```typescript
import { ReactNode } from 'react';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle: string;
  onClick?: () => void;
  loading?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  subtitle,
  onClick,
  loading = false
}: StatCardProps) {
  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = trend?.direction === 'up'
    ? 'text-green-600 dark:text-green-400'
    : trend?.direction === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all duration-250",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>

        {/* Value */}
        <p className="text-3xl font-light tracking-tight">{value}</p>

        {/* Trend */}
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// Usage:
<StatCard
  icon={<LayoutDashboard className="h-6 w-6" />}
  label="Total Tasks"
  value={totalTasks || 0}
  trend={totalTasks > 0 ? { value: 12, direction: 'up' } : undefined}
  subtitle={totalTasks > 0 ? "vs last week" : "Import messages to start tracking"}
  onClick={() => navigate('/tasks')}
/>
```

### 3. Empty State Component

**Create**: `/frontend/src/shared/components/EmptyState.tsx`

```typescript
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-lg mx-auto">
      {/* Icon */}
      <div className="mb-6 text-muted-foreground">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-medium mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <Button size="lg" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" asChild>
            <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
              {secondaryAction.label}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// Usage:
<EmptyState
  icon={<MessageSquare className="h-16 w-16" />}
  title="No messages yet"
  description="Import messages from Telegram to start tracking and analyzing your communications."
  primaryAction={{
    label: "Import Messages",
    onClick: () => setIngestModalOpen(true)
  }}
  secondaryAction={{
    label: "Learn more",
    href: "https://docs.example.com/import-messages"
  }}
/>
```

### 4. Data Table with Bulk Actions

**Enhance**: `/frontend/src/shared/components/DataTable.tsx`

```typescript
// Add bulk action toolbar
import { TrashIcon, CheckIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

// In DataTable component, add selection state
const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

// Add bulk action toolbar (show when selectedRows.size > 0)
{selectedRows.size > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-xl p-4 flex items-center gap-4 animate-slide-in">
    <p className="text-sm font-medium">
      {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
    </p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleBulkDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      <Button variant="outline" size="sm" onClick={handleBulkClassify}>
        <Filter className="h-4 w-4 mr-2" />
        Classify
      </Button>
      <Button variant="default" size="sm" onClick={handleBulkApprove}>
        <Check className="h-4 w-4 mr-2" />
        Approve
      </Button>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setSelectedRows(new Set())}
    >
      Clear
    </Button>
  </div>
)}
```

---

## 📱 Responsive Implementation

### Breakpoint Strategy

```typescript
// /frontend/src/shared/hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1440) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Usage:
const breakpoint = useBreakpoint();

return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Stat cards adapt to screen size */}
  </div>
);
```

### Mobile Data Table

```typescript
// Convert table to card view on mobile
{breakpoint === 'mobile' ? (
  <div className="space-y-4">
    {data.map((row) => (
      <Card key={row.id}>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-sm text-muted-foreground">{row.author}</p>
            </div>
            <Badge>{row.status}</Badge>
          </div>
          <p className="text-sm line-clamp-2">{row.content}</p>
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <DataTable columns={columns} data={data} />
)}
```

---

## ♿ Accessibility Implementation

### 1. Keyboard Navigation

```typescript
// Add keyboard shortcuts hook
// /frontend/src/shared/hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Open command palette
      }

      // Theme toggle: Cmd/Ctrl + Shift + T
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
        e.preventDefault();
        // Toggle theme
      }

      // Escape: Close modals/dialogs
      if (e.key === 'Escape') {
        // Close topmost modal
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 2. Focus Management

```typescript
// Ensure focus is trapped in modals
// Use Radix UI Dialog which handles this automatically
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Import Messages</DialogTitle>
    {/* Focus automatically trapped inside */}
    <form onSubmit={handleSubmit}>
      <input autoFocus /> {/* First input gets focus */}
    </form>
  </DialogContent>
</Dialog>
```

### 3. ARIA Labels

```typescript
// Icon-only buttons need aria-label
<Button variant="ghost" size="icon" aria-label="Toggle theme">
  <Sun className="h-5 w-5" />
</Button>

// Loading states need aria-live
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>

// Table with screen reader support
<table role="table" aria-label="Messages table">
  <thead>
    <tr>
      <th scope="col">Author</th>
      <th scope="col">Content</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{author}</td>
      <td>{content}</td>
    </tr>
  </tbody>
</table>
```

### 4. Color Contrast Testing

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react

# In development mode, add to App.tsx:
import { useEffect } from 'react';

if (process.env.NODE_ENV === 'development') {
  const axe = require('@axe-core/react');
  useEffect(() => {
    axe(React, ReactDOM, 1000);
  }, []);
}
```

**Manual testing:**
1. Chrome DevTools → Lighthouse → Accessibility audit
2. Use Stark plugin in Figma to verify designs
3. Test with actual screen readers (VoiceOver, NVDA)

---

## 🔄 Navigation & Information Architecture

### Sidebar Section Renaming

**Update**: `/frontend/src/shared/components/AppSidebar.tsx`

```typescript
const navigationGroups = [
  {
    title: "Data Management", // Changed from "Workspace"
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "Messages", icon: MessageSquare, href: "/messages", badge: messageCount },
      { label: "Topics", icon: Tag, href: "/topics" },
      { label: "Tasks", icon: CheckSquare, href: "/tasks" }
    ]
  },
  {
    title: "AI Operations", // Changed from "AI Analysis"
    items: [
      { label: "Analysis Runs", icon: Activity, href: "/analysis" },
      { label: "Proposals", icon: FileText, href: "/proposals", badge: proposalCount },
      { label: "Noise Filtering", icon: Filter, href: "/noise-filtering" }
    ]
  },
  {
    title: "AI Setup", // Changed from "AI Configuration"
    items: [
      { label: "Agents", icon: Bot, href: "/agents" },
      { label: "Task Templates", icon: ListChecks, href: "/agent-tasks" }, // Renamed from "Agent Tasks"
      { label: "Providers", icon: Plug, href: "/providers" },
      { label: "Projects", icon: FolderKanban, href: "/projects" }
    ]
  },
  {
    title: "Analytics & Reports", // Changed from "Insights"
    items: [
      { label: "Analytics", icon: BarChart3, href: "/analytics" }
    ]
  }
];

// Add section descriptions on hover
<div className="relative group">
  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
    {group.title}
  </h4>
  {group.description && (
    <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-popover border border-border rounded-md p-2 text-xs text-muted-foreground max-w-xs z-50 shadow-lg">
      {group.description}
    </div>
  )}
</div>
```

### Remove Breadcrumbs from Single-Level Pages

```typescript
// /frontend/src/shared/components/Breadcrumbs.tsx

// Only show breadcrumbs when depth > 1
{pathSegments.length > 1 && (
  <nav aria-label="breadcrumb">
    <ol className="flex items-center gap-2 text-sm">
      {pathSegments.map((segment, index) => (
        <li key={segment.path} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {index === pathSegments.length - 1 ? (
            <span className="text-foreground">{segment.label}</span>
          ) : (
            <Link to={segment.path} className="text-muted-foreground hover:text-foreground">
              {segment.label}
            </Link>
          )}
        </li>
      ))}
    </ol>
  </nav>
)}

// For single-level pages, just show title
{pathSegments.length === 1 && (
  <h1 className="text-2xl font-normal">{pathSegments[0].label}</h1>
)}
```

---

## 🚀 Onboarding Wizard

### Implementation

**Create**: `/frontend/src/features/onboarding/OnboardingWizard.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckIcon } from '@heroicons/react/24/outline';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Pulse Radar',
    description: 'Let\'s set up your AI task tracker in 4 quick steps',
    action: null
  },
  {
    id: 'telegram',
    title: 'Connect Telegram',
    description: 'Link your Telegram bot to import messages',
    action: 'telegram-setup'
  },
  {
    id: 'agent',
    title: 'Configure AI Agent',
    description: 'Set up your first AI agent for task analysis',
    action: 'agent-setup'
  },
  {
    id: 'import',
    title: 'Import Messages',
    description: 'Import your first batch of messages to analyze',
    action: 'import-messages'
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'You\'re ready to start analyzing tasks',
    action: null
  }
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const step = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Skip for now
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <div className="py-6 text-center">
          {currentStep === ONBOARDING_STEPS.length - 1 && (
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          {/* Step-specific content */}
          {step.action === 'telegram-setup' && <TelegramSetup />}
          {step.action === 'agent-setup' && <AgentSetup />}
          {step.action === 'import-messages' && <ImportMessages />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (currentStep === ONBOARDING_STEPS.length - 1) {
                setIsOpen(false);
              } else {
                setCurrentStep(prev => prev + 1);
              }
            }}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Show wizard on first visit
// In App.tsx or Dashboard component:
const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');

useEffect(() => {
  if (!hasCompletedOnboarding && totalTasks === 0 && totalMessages === 0) {
    setShowOnboarding(true);
  }
}, []);
```

---

## 📊 Heatmap Enhancements

**Update**: `/frontend/src/features/dashboard/MessageHeatmap.tsx`

```typescript
// Add time range selector
const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

// Add aggregation for better readability
const aggregateByTimeOfDay = (hourlyData: HeatmapData[]) => {
  // Group into 6-hour blocks instead of 24 hours
  // Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
  return groupBy(hourlyData, (item) => {
    const hour = new Date(item.timestamp).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 || hour < 0) return 'evening';
    return 'night';
  });
};

// Add tooltip on hover
<div
  onMouseEnter={(e) => {
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      content: `${count} messages\n${dayLabel} ${hourLabel}`
    });
  }}
/>

// Show legend with actual values
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <span>Less</span>
  <div className="flex gap-1">
    {[0, 1, 2, 3, 4].map(level => (
      <div
        key={level}
        className="w-3 h-3 rounded-sm"
        style={{
          backgroundColor: getHeatmapColor(level),
          opacity: level === 0 ? 0.2 : 0.4 + (level * 0.15)
        }}
      />
    ))}
  </div>
  <span>More</span>
  <span className="ml-2">• {sourceLabel}</span>
</div>
```

---

## 🧪 Testing Checklist

### Unit Tests

```typescript
// Test components with React Testing Library
// Example: StatCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(
      <StatCard
        icon={<div>Icon</div>}
        label="Total Tasks"
        value={42}
        subtitle="active tasks"
      />
    );

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('active tasks')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <StatCard
        icon={<div>Icon</div>}
        label="Test"
        value={10}
        subtitle="test"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading skeleton', () => {
    const { container } = render(
      <StatCard
        icon={<div>Icon</div>}
        label="Test"
        value={0}
        subtitle="test"
        loading
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
```

### Accessibility Tests

```typescript
// Install jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Dashboard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display onboarding wizard for new users', async ({ page }) => {
    await page.goto('http://localhost/');

    // Check if wizard appears
    await expect(page.getByText('Welcome to Pulse Radar')).toBeVisible();

    // Complete wizard steps
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Connect Telegram')).toBeVisible();
  });

  test('should navigate with keyboard', async ({ page }) => {
    await page.goto('http://localhost/');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus indicator is visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('http://localhost/');

    // Click theme toggle
    await page.getByRole('button', { name: 'Toggle theme' }).click();

    // Check dark class applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});
```

---

## 📦 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Update design tokens (colors, typography)
- [ ] Enhance Button component with new variants
- [ ] Create StatCard component
- [ ] Create EmptyState component
- [ ] Update sidebar navigation labels
- [ ] Remove breadcrumbs from single-level pages

### Phase 2: Dashboard (Week 2)
- [ ] Implement enhanced dashboard layout
- [ ] Add stat cards with click interactions
- [ ] Improve empty states (Messages, Topics, Tasks)
- [ ] Add quick actions section
- [ ] Implement onboarding wizard

### Phase 3: Data Tables (Week 3)
- [ ] Add bulk selection toolbar
- [ ] Implement floating action bar
- [ ] Add mobile card view for tables
- [ ] Improve pagination controls
- [ ] Add filter count badges

### Phase 4: Accessibility & Polish (Week 4)
- [ ] Full keyboard navigation audit
- [ ] WCAG AA contrast compliance check
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Touch target verification (mobile)
- [ ] Animation performance optimization
- [ ] Add keyboard shortcuts modal

### Phase 5: Advanced Features (Week 5+)
- [ ] Command palette (Cmd+K)
- [ ] Customizable dashboard widgets
- [ ] Advanced heatmap interactions
- [ ] Saved filters and views
- [ ] Export functionality

---

## 🔍 Quality Assurance Checklist

### Before Merge

**Visual:**
- [ ] Matches Figma designs (desktop, tablet, mobile)
- [ ] All interactive states implemented (hover, active, focus, disabled)
- [ ] Dark mode fully functional
- [ ] Animations smooth (60fps, <350ms duration)
- [ ] No layout shift on load

**Functionality:**
- [ ] All user flows tested end-to-end
- [ ] Error states handled gracefully
- [ ] Loading states present for async operations
- [ ] Empty states helpful and actionable
- [ ] Forms validate correctly

**Accessibility:**
- [ ] Lighthouse accessibility score ≥95
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on icon-only elements
- [ ] Screen reader tested (at least VoiceOver)
- [ ] Color contrast ≥4.5:1 (text), ≥3:1 (UI components)
- [ ] Touch targets ≥44px on mobile

**Performance:**
- [ ] Lighthouse performance score ≥90
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Images optimized and lazy-loaded
- [ ] Code-split by route
- [ ] Bundle size analyzed (avoid bloat)

**Testing:**
- [ ] Unit tests for new components (≥80% coverage)
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile device tested (iOS, Android)

---

## 📚 Resources & References

### Documentation
- **UX Audit**: `/artifacts/ux-audit-pulse-radar-dashboard.md`
- **Figma Spec**: `/artifacts/figma-design-specification.md`
- **This Guide**: `/artifacts/developer-handoff-guide.md`

### Design Tools
- Figma File: "Пульс Радар" (Team: "Тім Пульс")
- Icons: Heroicons (heroicons.com)
- UI Components: shadcn/ui (ui.shadcn.com)

### Code References
- Existing design system: `/frontend/src/theme.css`, `/frontend/src/index.css`
- Component library: `/frontend/src/shared/components/`
- shadcn components: `/frontend/src/components/ui/`

### Testing Tools
- React Testing Library: testing-library.com/react
- jest-axe: github.com/nickcolley/jest-axe
- Playwright: playwright.dev
- Lighthouse: developers.google.com/web/tools/lighthouse

### Accessibility
- WCAG 2.1 Guidelines: w3.org/WAI/WCAG21/quickref
- ARIA Patterns: w3.org/WAI/ARIA/apg
- WebAIM Contrast Checker: webaim.org/resources/contrastchecker

---

## 🤝 Support

**Questions?**
- Design decisions: See UX Audit rationale sections
- Implementation guidance: This document + code comments
- Technical issues: Check existing components in `/frontend/src/`

**Feedback:**
- Report design inconsistencies to design team
- Suggest improvements via pull requests
- Document edge cases discovered during implementation

---

**End of Developer Handoff Guide**
Ready to implement! 🚀
