import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Skeleton } from '@/shared/ui/skeleton'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { apiClient } from '@/shared/lib/api/client'
import { TopicListResponse } from '@/shared/types'
import { TopicCard } from './TopicCard'

type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export const RecentTopics = () => {
  const navigate = useNavigate()
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
          <TabsList className="flex w-full mb-4 overflow-x-auto gap-2" role="tablist" aria-label="Time period filter">
            <TabsTrigger value="today" className="flex-shrink-0 min-w-fit" aria-label="Show topics from today">Today</TabsTrigger>
            <TabsTrigger value="yesterday" className="flex-shrink-0 min-w-fit" aria-label="Show topics from yesterday">Yesterday</TabsTrigger>
            <TabsTrigger value="week" className="flex-shrink-0 min-w-fit" aria-label="Show topics from this week">Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-shrink-0 min-w-fit" aria-label="Show topics from this month">Month</TabsTrigger>
            <TabsTrigger value="custom" className="flex-shrink-0 min-w-fit" aria-label="Select custom date range">Custom</TabsTrigger>
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
            <div className="space-y-4 overflow-y-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] pr-2 sm:pr-2" role="feed" aria-label="Recent topics" aria-busy={isLoading}>
              {isLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="min-h-[80px]">
                      <CardContent className="pt-4 pb-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full mb-4" />
                        <div className="flex gap-4">
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
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-6">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">No topics yet</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Topics are AI-extracted themes from your messages. Import messages to automatically generate topics.
                    </p>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => navigate('/messages')}
                    className="mt-4"
                    aria-label="Navigate to Messages page to import messages"
                  >
                    Import Messages
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
