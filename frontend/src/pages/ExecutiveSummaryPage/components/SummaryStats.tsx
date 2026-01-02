/**
 * SummaryStats Component
 *
 * T032: Displays aggregate statistics for executive summary.
 */

import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  AlertTriangle,
  Folder,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import type { ExecutiveSummaryStats as Stats } from '@/features/executive-summary/types';

interface SummaryStatsProps {
  stats: Stats;
  periodLabel: string;
}

export function SummaryStats({ stats, periodLabel }: SummaryStatsProps) {
  const { t } = useTranslation('executiveSummary');

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{periodLabel}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          iconColor="text-primary"
          label={t('stats.decisions')}
          value={stats.decisions_count}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-destructive"
          label={t('stats.blockers')}
          value={stats.blockers_count}
        />
        <StatCard
          icon={Folder}
          iconColor="text-semantic-info"
          label={t('stats.activeTopics')}
          value={stats.active_topics_count}
        />
        <StatCard
          icon={AlertCircle}
          iconColor="text-semantic-warning"
          label={t('stats.staleBlockers')}
          value={stats.stale_blockers_count}
          highlight={stats.stale_blockers_count > 0}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: number;
  highlight?: boolean;
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  highlight = false,
}: StatCardProps) {
  return (
    <Card className={highlight ? 'border-semantic-warning' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{label}</p>
      </CardContent>
    </Card>
  );
}

export default SummaryStats;
