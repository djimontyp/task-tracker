import { useQuery } from '@tanstack/react-query'
import { Card, Spinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
import { PageHeader } from '@/shared/components/PageHeader'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { TaskStats } from '@/shared/types'
import { ClassificationExperimentsPanel } from '@/features/experiments'

const AnalyticsPage = () => {
  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.stats)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  const total = stats?.total_tasks || 0
  const completed = stats?.by_status.completed || 0
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Insights and trends from task classification system performance, user engagement, and knowledge extraction patterns"
      />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">Classification Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            <Card className="animate-slide-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
              <h2 className="text-xl 3xl:text-2xl font-semibold mb-4 text-foreground">Task Statistics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                    <span className="text-sm font-medium text-foreground">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2" role="progressbar" aria-valuenow={parseFloat(completionRate)} aria-valuemin={0} aria-valuemax={100} aria-label="Task completion rate">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{stats?.total_tasks || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary-400">{stats?.by_status.open || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Open</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/30">
                    <div className="text-2xl font-bold text-secondary-foreground">{stats?.by_status.in_progress || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">In Progress</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/30">
                    <div className="text-2xl font-bold text-accent">{stats?.by_status.completed || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Completed</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="animate-slide-in-right" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
              <h2 className="text-xl 3xl:text-2xl font-semibold mb-4 text-foreground">Status Distribution</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Open</span>
                    <span className="text-sm font-medium text-foreground">{stats?.by_status.open || 0}</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Open tasks: ${stats?.by_status.open || 0} out of ${stats?.total_tasks || 0}`}
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: stats && stats.total_tasks > 0
                          ? `${(stats.by_status.open / stats.total_tasks) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="text-sm font-medium text-foreground">{stats?.by_status.in_progress || 0}</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`In progress tasks: ${stats?.by_status.in_progress || 0} out of ${stats?.total_tasks || 0}`}
                  >
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: stats && stats.total_tasks > 0
                          ? `${(stats.by_status.in_progress / stats.total_tasks) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium text-foreground">{stats?.by_status.completed || 0}</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Completed tasks: ${stats?.by_status.completed || 0} out of ${stats?.total_tasks || 0}`}
                  >
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{
                        width: stats && stats.total_tasks > 0
                          ? `${(stats.by_status.completed / stats.total_tasks) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Closed</span>
                    <span className="text-sm font-medium text-foreground">{stats?.by_status.closed || 0}</span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-label={`Closed tasks: ${stats?.by_status.closed || 0} out of ${stats?.total_tasks || 0}`}
                  >
                    <div
                      className="bg-destructive h-2 rounded-full transition-all duration-300"
                      style={{
                        width: stats && stats.total_tasks > 0
                          ? `${(stats.by_status.closed / stats.total_tasks) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="mt-6">
          <ClassificationExperimentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage
