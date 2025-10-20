import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Skeleton } from '@/shared/ui/skeleton'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { apiClient } from '@/shared/lib/api/client'
import { TopicListResponse, TimePeriod } from '@/shared/types'
import { TopicCard } from './TopicCard'

const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return { start: today, end: now }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: yesterday, end: today }
    }

    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { start: weekAgo, end: now }
    }

    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { start: monthAgo, end: now }
    }

    default:
      return { start: today, end: now }
  }
}

export const RecentTopics = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today')
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({})

  const { data, isLoading } = useQuery<TopicListResponse>({
    queryKey: ['topics', 'recent', timePeriod, customDateRange],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 100 }

      if (timePeriod === 'custom' && customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(customDateRange.end)
        endDate.setHours(23, 59, 59, 999)

        params.start_date = startDate.toISOString()
        params.end_date = endDate.toISOString()
      } else if (timePeriod !== 'custom') {
        params.period = timePeriod
      }

      const response = await apiClient.get('/api/v1/topics/recent', { params })
      return response.data
    },
  })

  const filteredTopics = useMemo(() => {
    return data?.items || []
  }, [data])

  const handleApplyCustomRange = () => {
    if (customDateRange.start && customDateRange.end) {
      setTimePeriod('custom')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
          <TabsList className="grid w-full grid-cols-5 mb-4" role="tablist" aria-label="Time period filter">
            <TabsTrigger value="today" aria-label="Show topics from today">Today</TabsTrigger>
            <TabsTrigger value="yesterday" aria-label="Show topics from yesterday">Yesterday</TabsTrigger>
            <TabsTrigger value="week" aria-label="Show topics from this week">Week</TabsTrigger>
            <TabsTrigger value="month" aria-label="Show topics from this month">Month</TabsTrigger>
            <TabsTrigger value="custom" aria-label="Select custom date range">Custom</TabsTrigger>
          </TabsList>

          {timePeriod === 'custom' && (
            <div className="mb-4 p-4 border rounded-lg bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    className="w-full"
                    max={customDateRange.end ? new Date(customDateRange.end).toISOString().split('T')[0] : undefined}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setCustomDateRange(prev => ({ ...prev, start: date }))
                    }}
                    aria-label="Select start date for custom range"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    className="w-full"
                    min={customDateRange.start ? new Date(customDateRange.start).toISOString().split('T')[0] : undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setCustomDateRange(prev => ({ ...prev, end: date }))
                    }}
                    aria-label="Select end date for custom range"
                  />
                </div>
              </div>
              <Button
                onClick={handleApplyCustomRange}
                disabled={!customDateRange.start || !customDateRange.end}
                className="w-full"
                aria-label="Apply custom date range filter"
              >
                Apply Custom Range
              </Button>
            </div>
          )}

          <TabsContent value={timePeriod} className="mt-0">
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2" role="feed" aria-label="Recent topics" aria-busy={isLoading}>
              {isLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="min-h-[80px]">
                      <CardContent className="pt-4 pb-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full mb-3" />
                        <div className="flex gap-3">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-20 ml-auto" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : filteredTopics.length > 0 ? (
                filteredTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No topics for this period</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
