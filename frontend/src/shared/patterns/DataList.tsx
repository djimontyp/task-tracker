/**
 * DataList - Semantic key-value pair display
 *
 * Uses proper HTML <dl>, <dt>, <dd> elements for accessibility.
 * Supports multiple columns, density variants, and icons.
 *
 * @example
 * // Basic usage
 * <DataList
 *   items={[
 *     { label: 'Model', value: 'gpt-4o' },
 *     { label: 'Temperature', value: '0.7' },
 *     { label: 'Max Tokens', value: '4096' },
 *   ]}
 * />
 *
 * // With icons and columns
 * <DataList
 *   columns={2}
 *   density="comfortable"
 *   items={[
 *     { label: 'Status', value: <Badge>Active</Badge>, icon: <Activity /> },
 *     { label: 'Created', value: '2024-01-15', icon: <Calendar /> },
 *   ]}
 * />
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { TruncatedText } from '@/shared/ui/truncated-text';

// ===================================================================
// TYPES
// ===================================================================

export interface DataListItem {
  /** Label/key for the data */
  label: string;
  /** Value to display */
  value: React.ReactNode;
  /** Optional icon before label */
  icon?: React.ReactNode;
  /** Optional description below value */
  description?: string;
  /** Truncate value text */
  truncate?: boolean;
  /** Span multiple columns (2 = full width in 2-col layout) */
  colSpan?: 1 | 2 | 3;
  /** Custom className for this item */
  className?: string;
}

export type DataListDensity = 'compact' | 'comfortable' | 'spacious';

export interface DataListProps {
  /** Array of key-value items */
  items: DataListItem[];
  /** Number of columns (responsive) */
  columns?: 1 | 2 | 3;
  /** Spacing density */
  density?: DataListDensity;
  /** Orientation of label relative to value */
  orientation?: 'vertical' | 'horizontal';
  /** Additional CSS class */
  className?: string;
  /** Show dividers between items */
  divided?: boolean;
  /** Visual variant */
  variant?: 'default' | 'muted' | 'card';
}

// ===================================================================
// DENSITY CONFIGURATIONS
// ===================================================================

const densityConfig = {
  compact: {
    gap: 'gap-2',
    labelSize: 'text-xs',
    valueSize: 'text-sm',
    itemPadding: 'py-2',
  },
  comfortable: {
    gap: 'gap-4',
    labelSize: 'text-sm',
    valueSize: 'text-base',
    itemPadding: 'py-4',
  },
  spacious: {
    gap: 'gap-6',
    labelSize: 'text-sm',
    valueSize: 'text-base',
    itemPadding: 'py-6',
  },
} as const;

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
} as const;

const colSpanClasses = {
  1: '',
  2: 'sm:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
} as const;

const variantClasses = {
  default: '',
  muted: 'bg-muted/50 rounded-lg p-4',
  card: 'bg-card border rounded-lg p-4 shadow-sm',
} as const;

// ===================================================================
// COMPONENT
// ===================================================================

export const DataList = React.forwardRef<HTMLDListElement, DataListProps>(
  (
    {
      items,
      columns = 1,
      density = 'comfortable',
      orientation = 'vertical',
      className,
      divided = false,
      variant = 'default',
    },
    ref
  ) => {
    const config = densityConfig[density];

    return (
      <dl
        ref={ref}
        className={cn(
          'grid',
          columnClasses[columns],
          config.gap,
          variantClasses[variant],
          className
        )}
      >
        {items.map((item, index) => (
          <DataListItem
            key={`${item.label}-${index}`}
            item={item}
            density={density}
            orientation={orientation}
            divided={divided && index < items.length - 1}
          />
        ))}
      </dl>
    );
  }
);

DataList.displayName = 'DataList';

// ===================================================================
// DATA LIST ITEM
// ===================================================================

interface DataListItemComponentProps {
  item: DataListItem;
  density: DataListDensity;
  orientation: 'vertical' | 'horizontal';
  divided?: boolean;
}

function DataListItem({
  item,
  density,
  orientation,
  divided,
}: DataListItemComponentProps) {
  const config = densityConfig[density];
  const colSpan = item.colSpan ? colSpanClasses[item.colSpan] : '';

  if (orientation === 'horizontal') {
    return (
      <div
        className={cn(
          'flex items-baseline justify-between',
          config.itemPadding,
          divided && 'border-b border-border',
          colSpan,
          item.className
        )}
      >
        <dt
          className={cn(
            'text-muted-foreground flex items-center gap-2 shrink-0',
            config.labelSize
          )}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          {item.label}
        </dt>
        <dd className={cn('text-right min-w-0', config.valueSize)}>
          {renderValue(item)}
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          )}
        </dd>
      </div>
    );
  }

  // Vertical orientation (default)
  return (
    <div
      className={cn(
        'space-y-1',
        config.itemPadding,
        divided && 'border-b border-border',
        colSpan,
        item.className
      )}
    >
      <dt
        className={cn(
          'text-muted-foreground flex items-center gap-2',
          config.labelSize
        )}
      >
        {item.icon && <span className="shrink-0">{item.icon}</span>}
        {item.label}
      </dt>
      <dd className={cn('min-w-0', config.valueSize)}>
        {renderValue(item)}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {item.description}
          </p>
        )}
      </dd>
    </div>
  );
}

// ===================================================================
// HELPERS
// ===================================================================

function renderValue(item: DataListItem): React.ReactNode {
  if (typeof item.value !== 'string') {
    return item.value;
  }

  if (item.truncate) {
    return <TruncatedText text={item.value} />;
  }

  return item.value;
}

// ===================================================================
// CONVENIENCE COMPONENTS
// ===================================================================

/**
 * InlineDataList - Horizontal layout for single key-value pairs
 *
 * @example
 * <InlineDataList label="Status" value={<Badge>Active</Badge>} />
 */
export interface InlineDataListProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InlineDataList({
  label,
  value,
  icon,
  className,
}: InlineDataListProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/**
 * KeyValueGrid - Simple grid for displaying multiple key-value pairs
 *
 * @example
 * <KeyValueGrid
 *   data={{
 *     'Model': 'gpt-4o',
 *     'Temperature': 0.7,
 *     'Max Tokens': 4096,
 *   }}
 * />
 */
export interface KeyValueGridProps {
  data: Record<string, React.ReactNode>;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function KeyValueGrid({
  data,
  columns = 2,
  className,
}: KeyValueGridProps) {
  const items: DataListItem[] = Object.entries(data).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <DataList items={items} columns={columns} density="compact" className={className} />
  );
}

/**
 * StatGrid - Grid of stats with labels and large values
 *
 * @example
 * <StatGrid
 *   stats={[
 *     { label: 'Total Messages', value: '1,234' },
 *     { label: 'Processed', value: '1,180' },
 *     { label: 'Pending', value: '54' },
 *   ]}
 * />
 */
export interface StatGridStat {
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface StatGridProps {
  stats: StatGridStat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ stats, columns = 3, className }: StatGridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colClasses[columns], className)}>
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="space-y-1">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
          {stat.description && (
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
