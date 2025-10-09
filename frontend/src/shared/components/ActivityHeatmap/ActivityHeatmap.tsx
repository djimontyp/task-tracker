import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger, Checkbox, Label } from '@/shared/ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/lib/api/client'

// Types
export interface ActivityDataPoint {
  timestamp: string
  source: 'telegram' | 'slack' | 'email'
  count?: number
}

export interface ActivityHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  period?: 'week' | 'month'
  enabledSources?: ('telegram' | 'slack' | 'email')[]
  onTitleChange?: (title: string) => void
}

// Helper types
interface HeatmapCell {
  day: number
  hour: number
  count: number
  source: 'telegram' | 'slack' | 'email'
  date: Date
}

interface ProcessedData {
  [key: string]: {
    count: number
    source: 'telegram' | 'slack' | 'email'
  }
}

// Source colors
const SOURCE_COLORS = {
  telegram: {
    light: 'hsl(200, 80%, 50%)',
    dark: 'hsl(200, 80%, 60%)',
  },
  slack: {
    light: 'hsl(280, 70%, 50%)',
    dark: 'hsl(280, 70%, 60%)',
  },
  email: {
    light: 'hsl(140, 70%, 45%)',
    dark: 'hsl(140, 70%, 55%)',
  },
} as const

// Days of week labels
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Hours array (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const ActivityHeatmap = React.forwardRef<HTMLDivElement, ActivityHeatmapProps>(
  (
    {
      title = 'Message Activity Heatmap',
      period = 'week',
      enabledSources = ['telegram'],
      onTitleChange,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(period)
    const [selectedSources, setSelectedSources] = useState<
      Record<'telegram' | 'slack' | 'email', boolean>
    >({
      telegram: enabledSources.includes('telegram'),
      slack: enabledSources.includes('slack'),
      email: enabledSources.includes('email'),
    })
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState(title)

    // Fetch activity data
    const { data: activityResponse } = useQuery<{ data: ActivityDataPoint[] }>({
      queryKey: ['activity', selectedPeriod, selectedMonth, selectedYear],
      queryFn: async () => {
        const params = new URLSearchParams({ period: selectedPeriod })
        if (selectedPeriod === 'month') {
          params.append('month', selectedMonth.toString())
          params.append('year', selectedYear.toString())
        }
        const response = await apiClient.get(`/api/activity?${params}`)
        return response.data
      },
    })

    // Get active sources - memoize separately as it's used in rendering
    const activeSources = useMemo(
      () =>
        Object.entries(selectedSources)
          .filter(([_, enabled]) => enabled)
          .map(([source]) => source),
      [selectedSources]
    )

    // Process data into heatmap format
    const processedData = useMemo(() => {
      const data = activityResponse?.data || []
      const dataMap: ProcessedData = {}

      data.forEach((point) => {
        if (!activeSources.includes(point.source)) return

        const date = new Date(point.timestamp)

        if (selectedPeriod === 'month') {
          // For month view, filter by selected month/year
          if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) {
            return
          }
        }

        const hour = date.getHours()

        let key: string
        if (selectedPeriod === 'week') {
          const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
          // Convert Sunday (0) to end of week (6)
          const dayIndex = day === 0 ? 6 : day - 1
          key = `${dayIndex}-${hour}`
        } else {
          // Month view: use day of month (1-31)
          const dayOfMonth = date.getDate()
          key = `${dayOfMonth - 1}-${hour}` // 0-indexed for consistency
        }

        if (!dataMap[key]) {
          dataMap[key] = { count: 0, source: point.source }
        }
        dataMap[key].count += point.count || 1
      })

      return dataMap
    }, [activityResponse?.data, activeSources, selectedPeriod, selectedMonth, selectedYear])

    // Get number of days in selected month
    const daysInMonth = useMemo(() => {
      return new Date(selectedYear, selectedMonth + 1, 0).getDate()
    }, [selectedMonth, selectedYear])

    // Generate cells for the grid
    // Note: cells variable is prepared for future use (e.g., exporting, filtering)
    // Currently rendering is done inline, but keeping this for extensibility
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _cells = useMemo(() => {
      const result: HeatmapCell[] = []
      const daysToShow = selectedPeriod === 'week' ? 7 : daysInMonth

      for (let hour = 0; hour < 24; hour++) {
        for (let day = 0; day < daysToShow; day++) {
          const key = `${day}-${hour}`
          const cellData = processedData[key]

          result.push({
            day,
            hour,
            count: cellData?.count || 0,
            source: cellData?.source || 'telegram',
            date: new Date(), // Placeholder
          })
        }
      }

      return result
    }, [processedData, selectedPeriod, daysInMonth])

    // Get color for cell based on count and source
    const getCellColor = (count: number, source: 'telegram' | 'slack' | 'email') => {
      if (count === 0) return 'hsl(var(--muted))'

      const colors = SOURCE_COLORS[source]
      const baseColor = colors.light

      // Intensity based on count (darker = more messages)
      const maxCount = Math.max(...Object.values(processedData).map((d) => d.count), 1)
      const intensity = Math.min(count / maxCount, 1)
      const opacity = 0.2 + intensity * 0.8

      return baseColor.replace(')', `, ${opacity})`)
    }

    // Handle title save
    const handleTitleSave = () => {
      setIsEditingTitle(false)
      onTitleChange?.(editedTitle)
    }

    return (
      <Card ref={ref} className={cn('w-full', className)} {...props}>
        <CardHeader className="space-y-4 pb-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-xl font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <CardTitle
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {editedTitle}
              </CardTitle>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Toggle (Week/Month) */}
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Month/Year selectors (shown only for month view) */}
            {selectedPeriod === 'month' && (
              <>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                      (month, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {month}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {/* Source Checkboxes */}
            <div className="flex items-center gap-4 border-l pl-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="telegram"
                  checked={selectedSources.telegram}
                  onCheckedChange={(checked) =>
                    setSelectedSources((prev) => ({ ...prev, telegram: !!checked }))
                  }
                />
                <Label htmlFor="telegram" className="text-sm cursor-pointer">
                  Telegram
                </Label>
              </div>

              <div className="flex items-center gap-2 opacity-50">
                <Checkbox id="slack" checked={selectedSources.slack} disabled />
                <Label htmlFor="slack" className="text-sm cursor-not-allowed">
                  Slack
                </Label>
              </div>

              <div className="flex items-center gap-2 opacity-50">
                <Checkbox id="email" checked={selectedSources.email} disabled />
                <Label htmlFor="email" className="text-sm cursor-not-allowed">
                  Email
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto">
              {/* Heatmap Grid */}
              <div className="inline-block min-w-full">
                {/* Days header */}
                <div className="flex mb-2">
                  <div className="w-12 flex-shrink-0" /> {/* Hour label space */}
                  {selectedPeriod === 'week'
                    ? DAYS_SHORT.map((day, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center text-xs font-medium text-muted-foreground px-1 min-w-[40px]"
                        >
                          {day}
                        </div>
                      ))
                    : Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                        <div
                          key={day}
                          className="flex-1 text-center text-xs font-medium text-muted-foreground px-1 min-w-[30px]"
                        >
                          {day}
                        </div>
                      ))}
                </div>

                {/* Hour rows */}
                {HOURS.map((hour) => {
                  const numDays = selectedPeriod === 'week' ? 7 : daysInMonth

                  return (
                    <div key={hour} className="flex items-center mb-1">
                      {/* Hour label */}
                      <div className="w-12 flex-shrink-0 text-xs text-right pr-2 text-muted-foreground">
                        {hour.toString().padStart(2, '0')}:00
                      </div>

                      {/* Day cells */}
                      {Array.from({ length: numDays }, (_, dayIndex) => {
                        const key = `${dayIndex}-${hour}`
                        const cellData = processedData[key]
                        const count = cellData?.count || 0

                        const dayLabel =
                          selectedPeriod === 'week'
                            ? DAYS_FULL[dayIndex]
                            : `${selectedMonth + 1}/${dayIndex + 1}/${selectedYear}`

                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'flex-1 h-6 mx-0.5 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer',
                                  selectedPeriod === 'week' ? 'min-w-[40px]' : 'min-w-[30px]'
                                )}
                                style={{
                                  backgroundColor: getCellColor(count, cellData?.source || 'telegram'),
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-semibold">{dayLabel}</div>
                                <div>
                                  {hour.toString().padStart(2, '0')}:00 -{' '}
                                  {(hour + 1).toString().padStart(2, '0')}:00
                                </div>
                                <div className="mt-1">
                                  Messages: <span className="font-semibold">{count}</span>
                                </div>
                                {cellData && (
                                  <div className="capitalize">
                                    Source: <span className="font-semibold">{cellData.source}</span>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor:
                            intensity === 0
                              ? 'hsl(var(--muted))'
                              : SOURCE_COLORS.telegram.light.replace(')', `, ${0.2 + intensity * 0.8})`),
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {activeSources.map((source) => (
                    <div key={source} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: SOURCE_COLORS[source as 'telegram' | 'slack' | 'email'].light,
                        }}
                      />
                      <span className="capitalize text-muted-foreground">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    )
  }
)

ActivityHeatmap.displayName = 'ActivityHeatmap'

export default ActivityHeatmap
