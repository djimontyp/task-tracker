import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAutomationStats } from '../api/automationService'

export function AutomationStatsCards() {
  const { data: stats, isLoading } = useAutomationStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      label: 'Auto-Approval Rate',
      value: `${(stats.auto_approval_rate ?? 0).toFixed(1)}%`,
      change: stats.approval_rate_change ?? 0,
      changeLabel: stats.approval_rate_change
        ? `${stats.approval_rate_change > 0 ? '+' : ''}${stats.approval_rate_change.toFixed(1)}%`
        : 'No change',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Pending Versions',
      value: (stats.pending_versions_count ?? 0).toString(),
      change: 0,
      changeLabel: 'Awaiting review',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Total Rules',
      value: (stats.total_rules_count ?? 0).toString(),
      change: 0,
      changeLabel: 'Configured',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Active Rules',
      value: (stats.active_rules_count ?? 0).toString(),
      change: 0,
      changeLabel: 'Running',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${item.color}`}>{item.value}</span>
                {item.change !== 0 && (
                  <span
                    className={`flex items-center text-xs font-medium ${
                      item.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.change > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {item.changeLabel}
                  </span>
                )}
              </div>
              {item.change === 0 && (
                <p className="text-xs text-muted-foreground">{item.changeLabel}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
