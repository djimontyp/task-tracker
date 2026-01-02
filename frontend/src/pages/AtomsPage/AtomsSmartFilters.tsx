import { CheckCircle, Inbox, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import type { AtomStatusFilter } from './useAtomFilterParams';

export interface AtomCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface AtomsSmartFiltersProps {
  counts: AtomCounts;
  activeFilter: AtomStatusFilter;
  onFilterChange: (filter: AtomStatusFilter) => void;
}

/**
 * Smart Filters component for AtomsPage.
 * Provides tab-based filtering for All/Pending/Approved/Rejected atom statuses.
 * Uses Radix Tabs with semantic tokens and 44px touch targets.
 */
export function AtomsSmartFilters({
  counts,
  activeFilter,
  onFilterChange,
}: AtomsSmartFiltersProps) {
  const { t } = useTranslation('atoms');

  return (
    <Tabs
      value={activeFilter}
      onValueChange={(value) => onFilterChange(value as AtomStatusFilter)}
    >
      <TabsList
        variant="pill"
        aria-label={t('smartFilters.ariaLabel', 'Filter atoms by status')}
      >
        {/* All atoms tab */}
        <TabsTrigger
          variant="pill"
          value="all"
          aria-label={t('smartFilters.allAriaLabel', {
            count: counts.all,
            defaultValue: '{{count}} atoms total',
          })}
          className="h-11 gap-2 px-4"
        >
          {t('smartFilters.all', 'All')}
          <Badge variant="secondary" className="ml-2">
            {counts.all}
          </Badge>
        </TabsTrigger>

        {/* Pending tab */}
        <TabsTrigger
          variant="pill"
          value="pending"
          aria-label={t('smartFilters.pendingAriaLabel', {
            count: counts.pending,
            defaultValue: '{{count}} pending atoms',
          })}
          className="h-11 gap-2 px-4"
        >
          <Inbox className="h-4 w-4" />
          {t('smartFilters.pending', 'Pending')}
          <Badge
            variant="outline"
            className="ml-2 gap-0.5 border-semantic-warning bg-semantic-warning/10 text-semantic-warning"
          >
            {counts.pending}
          </Badge>
        </TabsTrigger>

        {/* Approved tab */}
        <TabsTrigger
          variant="pill"
          value="approved"
          aria-label={t('smartFilters.approvedAriaLabel', {
            count: counts.approved,
            defaultValue: '{{count}} approved atoms',
          })}
          className="h-11 gap-2 px-4"
        >
          <CheckCircle className="h-4 w-4" />
          {t('smartFilters.approved', 'Approved')}
          <Badge
            variant="outline"
            className="ml-2 gap-0.5 border-status-connected bg-status-connected/10 text-status-connected"
          >
            {counts.approved}
          </Badge>
        </TabsTrigger>

        {/* Rejected tab */}
        <TabsTrigger
          variant="pill"
          value="rejected"
          aria-label={t('smartFilters.rejectedAriaLabel', {
            count: counts.rejected,
            defaultValue: '{{count}} rejected atoms',
          })}
          className="h-11 gap-2 px-4"
        >
          <XCircle className="h-4 w-4" />
          {t('smartFilters.rejected', 'Rejected')}
          <Badge
            variant="outline"
            className="ml-2 gap-0.5 border-destructive bg-destructive/10 text-destructive"
          >
            {counts.rejected}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
