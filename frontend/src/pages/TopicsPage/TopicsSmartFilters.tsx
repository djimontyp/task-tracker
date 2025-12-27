import { Archive, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import type { TopicFilterMode } from './useTopicFilterParams';

interface TopicsSmartFiltersProps {
  counts: {
    all: number;
    active: number;
    archived: number;
  };
  activeFilter: TopicFilterMode;
  onFilterChange: (filter: TopicFilterMode) => void;
}

/**
 * Smart Filters component for TopicsPage.
 * Provides tab-based filtering for All/Active/Archived topic categories.
 * Uses Radix Tabs with semantic tokens and 44px touch targets.
 */
export function TopicsSmartFilters({
  counts,
  activeFilter,
  onFilterChange,
}: TopicsSmartFiltersProps) {
  const { t } = useTranslation('topics');

  return (
    <Tabs
      value={activeFilter}
      onValueChange={(value) => onFilterChange(value as TopicFilterMode)}
    >
      <TabsList
        aria-label={t('smartFilters.ariaLabel', 'Topic filters')}
        className="h-auto gap-0.5 bg-muted p-0.5"
      >
        {/* All topics tab */}
        <TabsTrigger
          value="all"
          aria-label={t('smartFilters.allAriaLabel', 'All topics: {{count}}', { count: counts.all })}
          className="h-11 gap-2 px-4"
        >
          {t('filters.all')}
          <Badge variant="secondary" className="ml-2">
            {counts.all}
          </Badge>
        </TabsTrigger>

        {/* Active topics tab */}
        <TabsTrigger
          value="active"
          aria-label={t('smartFilters.activeAriaLabel', 'Active topics: {{count}}', { count: counts.active })}
          className="h-11 gap-2 px-4"
        >
          <FolderOpen className="h-4 w-4" />
          {t('filters.active')}
          <Badge
            variant="outline"
            className="ml-2 gap-0.5 border-status-connected bg-status-connected/10 text-status-connected"
          >
            {counts.active}
          </Badge>
        </TabsTrigger>

        {/* Archived topics tab */}
        <TabsTrigger
          value="archived"
          aria-label={t('smartFilters.archivedAriaLabel', 'Archived topics: {{count}}', { count: counts.archived })}
          className="h-11 gap-2 px-4"
        >
          <Archive className="h-4 w-4" />
          {t('filters.archived')}
          <Badge variant="outline" className="ml-2 text-muted-foreground">
            {counts.archived}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
