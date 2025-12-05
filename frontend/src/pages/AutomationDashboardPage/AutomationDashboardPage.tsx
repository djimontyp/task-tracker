import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AutomationStatsCards } from '@/features/automation/components/AutomationStatsCards'
import { AutomationTrendsChart } from '@/features/automation/components/AutomationTrendsChart'
import { RulePerformanceTable } from '@/features/automation/components/RulePerformanceTable'
import { JobStatusWidget } from '@/features/automation/components/JobStatusWidget'
import { useWebSocket } from '@/features/websocket'

export default function AutomationDashboardPage() {
  const queryClient = useQueryClient()

  const { connectionState } = useWebSocket({
    topics: ['scheduler', 'automation'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage: (data: any) => {
      if (data.event === 'job_completed') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
        toast.success('Scheduler job completed')
      }

      if (data.event === 'rule_triggered') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
      }

      if (data.event === 'approval_processed') {
        queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
        queryClient.invalidateQueries({ queryKey: ['automation-trends'] })
      }
    },
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor automation performance and scheduler status
          </p>
        </div>
        {connectionState === 'connected' && (
          <div className="flex items-center gap-2 text-xs text-semantic-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success"></span>
            </span>
            Live updates active
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
        <h2 className="text-lg font-semibold mb-4">Rule Performance</h2>
        <RulePerformanceTable />
      </div>
    </div>
  )
}
