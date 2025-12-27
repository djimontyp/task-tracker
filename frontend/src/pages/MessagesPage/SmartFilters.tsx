import { Signal, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

type FilterMode = 'all' | 'signals' | 'noise';

interface SmartFiltersProps {
  counts: {
    all: number;
    signals: number;
    noise: number;
  };
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
}

/**
 * Smart Filters component for MessagesPage.
 * Provides tab-based filtering for All/Signals/Noise message categories.
 * Uses Radix Tabs with semantic tokens and 44px touch targets.
 */
export function SmartFilters({
  counts,
  activeFilter,
  onFilterChange,
}: SmartFiltersProps) {
  const { t } = useTranslation('messages');

  return (
    <Tabs
      value={activeFilter}
      onValueChange={(value) => onFilterChange(value as FilterMode)}
    >
      <TabsList
        aria-label={t('smartFilters.ariaLabel')}
        className="h-auto gap-0.5 bg-muted p-0.5"
      >
        {/* All messages tab */}
        <TabsTrigger
          value="all"
          aria-label={t('smartFilters.allAriaLabel', { count: counts.all })}
          className="h-11 gap-2 px-4"
        >
          {t('smartFilters.all')}
          <Badge variant="secondary" className="ml-2">
            {counts.all}
          </Badge>
        </TabsTrigger>

        {/* Signals tab */}
        <TabsTrigger
          value="signals"
          aria-label={t('smartFilters.signalsAriaLabel', { count: counts.signals })}
          className="h-11 gap-2 px-4"
        >
          <Signal className="h-4 w-4" />
          {t('smartFilters.signals')}
          <Badge
            variant="outline"
            className="ml-2 gap-0.5 border-status-connected bg-status-connected/10 text-status-connected"
          >
            {counts.signals}
          </Badge>
        </TabsTrigger>

        {/* Noise tab */}
        <TabsTrigger
          value="noise"
          aria-label={t('smartFilters.noiseAriaLabel', { count: counts.noise })}
          className="h-11 gap-2 px-4"
        >
          <Volume2 className="h-4 w-4" />
          {t('smartFilters.noise')}
          <Badge variant="outline" className="ml-2 text-muted-foreground">
            {counts.noise}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
