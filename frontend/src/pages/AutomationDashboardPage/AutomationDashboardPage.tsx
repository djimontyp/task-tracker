import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageWrapper } from '@/shared/primitives'
import { AutomationStatsCards } from '@/features/automation/components/AutomationStatsCards'
import { AutomationTrendsChart } from '@/features/automation/components/AutomationTrendsChart'
import { RulePerformanceTable } from '@/features/automation/components/RulePerformanceTable'
import { JobStatusWidget } from '@/features/automation/components/JobStatusWidget'
import { useWebSocket } from '@/shared/hooks'
import { isAutomationEvent, type AutomationEvent } from '@/shared/types/websocket'

export default function AutomationDashboardPage() {
  const { t } = useTranslation('automation')
  const queryClient = useQueryClient()

  const { connectionState } = useWebSocket({
    topics: ['scheduler', 'automation'],
    onMessage: (data: unknown) => {
      if (!isAutomationEvent(data)) return

      const event = data as AutomationEvent

      if (event.event === 'job_completed') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
        toast.success(t('dashboard.jobCompleted'))
      }

      if (event.event === 'rule_triggered') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
      }

      if (event.event === 'approval_processed') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['automation-trends'] })
      }
    },
  })

  return (
    <PageWrapper variant="fullWidth" className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.description')}
          </p>
        </div>
        {connectionState === 'connected' && (
          <div className="flex items-center gap-2 text-xs text-semantic-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success"></span>
            </span>
            {t('dashboard.liveUpdates')}
          </div>
        )}
      </div>

      <AutomationStatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AutomationTrendsChart />
        </div>

        <div className="lg:col-span-1">
          <JobStatusWidget />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.rulePerformance')}</h2>
        <RulePerformanceTable />
      </div>
    </PageWrapper>
  )
}
