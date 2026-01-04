import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger, Checkbox, Label } from '@/shared/ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib'

export interface ActivityDataPoint {
  timestamp: string
  source: 'telegram' | 'slack' | 'email'
  count?: number
}

export interface ActivityHeatmapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Activity data points to display */
  data?: ActivityDataPoint[]
  /** Loading state - shows skeleton when true */
  isLoading?: boolean
  /** Heatmap title (editable on click) */
  title?: string
  /** Time period to display */
  period?: 'week' | 'month'
  /** Array of enabled message sources */
  enabledSources?: ('telegram' | 'slack' | 'email')[]
  /** Callback when title is edited */
  onTitleChange?: (title: string) => void
}

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

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const ActivityHeatmap = React.forwardRef<HTMLDivElement, ActivityHeatmapProps>(
  (
    {
      data = [],
      isLoading = false,
      title = 'Message Activity Heatmap',
      period = 'week',
      enabledSources = ['telegram'],
      onTitleChange,
      className,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation('common')
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(period)

    // Localized days - reversed so newer days are on left
    const DAYS_SHORT = useMemo(() => [
      t('activityHeatmap.days.sun'),
      t('activityHeatmap.days.sat'),
      t('activityHeatmap.days.fri'),
      t('activityHeatmap.days.thu'),
      t('activityHeatmap.days.wed'),
      t('activityHeatmap.days.tue'),
      t('activityHeatmap.days.mon'),
    ], [t])

    const DAYS_FULL = useMemo(() => [
      t('activityHeatmap.days.sun'),
      t('activityHeatmap.days.sat'),
      t('activityHeatmap.days.fri'),
      t('activityHeatmap.days.thu'),
      t('activityHeatmap.days.wed'),
      t('activityHeatmap.days.tue'),
      t('activityHeatmap.days.mon'),
    ], [t])
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

    // Get active sources - memoize separately as it's used in rendering
    const activeSources = useMemo(
      () =>
        Object.entries(selectedSources)
          .filter(([_, enabled]) => enabled)
          .map(([source]) => source),
      [selectedSources]
    )

    const daysInMonth = useMemo(() => {
      return new Date(selectedYear, selectedMonth + 1, 0).getDate()
    }, [selectedMonth, selectedYear])

    const processedData = useMemo(() => {
      const dataMap: ProcessedData = {}

      data.forEach((point) => {
        if (!activeSources.includes(point.source)) return

        const date = new Date(point.timestamp)

        if (selectedPeriod === 'month') {
          if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) {
            return
          }
        }

        const hour = date.getHours()

        let key: string
        if (selectedPeriod === 'week') {
          const day = date.getDay()
          // Reversed: Sunday (0) = 0, Monday (1) = 6, Tuesday (2) = 5, etc.
          const dayIndex = day === 0 ? 0 : 7 - day
          key = `${dayIndex}-${hour}`
        } else {
          const dayOfMonth = date.getDate()
          // Reverse: day 1 should be at the end (right), last day at the beginning (left)
          const reversedDayIndex = daysInMonth - dayOfMonth
          key = `${reversedDayIndex}-${hour}`
        }

        if (!dataMap[key]) {
          dataMap[key] = { count: 0, source: point.source }
        }
        dataMap[key].count += point.count || 1
      })

      return dataMap
    }, [data, activeSources, selectedPeriod, selectedMonth, selectedYear, daysInMonth])

    useMemo(() => {
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
            date: new Date(),
          })
        }
      }

      return result
    }, [processedData, selectedPeriod, daysInMonth])

    const getCellColor = (count: number, source: 'telegram' | 'slack' | 'email') => {
      if (count === 0) return 'hsl(var(--muted))'

      const maxCount = Math.max(...Object.values(processedData).map((d) => d.count), 1)
      const intensity = Math.min(count / maxCount, 1)
      const opacity = 0.2 + intensity * 0.8

      return `hsl(var(--heatmap-${source}) / ${opacity})`
    }

    // Handle title save
    const handleTitleSave = () => {
      setIsEditingTitle(false)
      onTitleChange?.(editedTitle)
    }

    // Loading skeleton
    if (isLoading) {
      return (
        <Card ref={ref} className={cn('w-full', className)} {...props}>
          <CardHeader className="space-y-4 pb-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-0.5">
                  <Skeleton className="h-4 w-12" />
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('w-full', className)} {...props}>
        <CardHeader className="space-y-4 pb-4">
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

          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'week' | 'month')}>
              <TabsList variant="pill">
                <TabsTrigger variant="pill" value="week">{t('activityHeatmap.tabs.week')}</TabsTrigger>
                <TabsTrigger variant="pill" value="month">{t('activityHeatmap.tabs.month')}</TabsTrigger>
              </TabsList>
            </Tabs>

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
                    {[
                      t('activityHeatmap.months.jan'),
                      t('activityHeatmap.months.feb'),
                      t('activityHeatmap.months.mar'),
                      t('activityHeatmap.months.apr'),
                      t('activityHeatmap.months.may'),
                      t('activityHeatmap.months.jun'),
                      t('activityHeatmap.months.jul'),
                      t('activityHeatmap.months.aug'),
                      t('activityHeatmap.months.sep'),
                      t('activityHeatmap.months.oct'),
                      t('activityHeatmap.months.nov'),
                      t('activityHeatmap.months.dec'),
                    ].map((month, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {month}
                      </SelectItem>
                    ))}
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
                  {t('activityHeatmap.sources.telegram')}
                </Label>
              </div>

              <div className="flex items-center gap-2 opacity-50">
                <Checkbox id="slack" checked={selectedSources.slack} disabled />
                <Label htmlFor="slack" className="text-sm cursor-not-allowed">
                  {t('activityHeatmap.sources.slack')}
                </Label>
              </div>

              <div className="flex items-center gap-2 opacity-50">
                <Checkbox id="email" checked={selectedSources.email} disabled />
                <Label htmlFor="email" className="text-sm cursor-not-allowed">
                  {t('activityHeatmap.sources.email')}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex mb-2">
                  <div className="w-12 flex-shrink-0" />
                  {selectedPeriod === 'week'
                    ? DAYS_SHORT.map((day, i) => (
                        <div
                          key={i}
                          className="flex-1 text-center text-xs font-medium text-muted-foreground px-2 min-w-[28px] sm:min-w-[36px] md:min-w-[40px]"
                        >
                          {day}
                        </div>
                      ))
                    : Array.from({ length: daysInMonth }, (_, i) => daysInMonth - i).map((day) => (
                        <div
                          key={day}
                          className="flex-1 text-center text-xs font-medium text-muted-foreground px-2 min-w-[20px] sm:min-w-[26px] md:min-w-[30px]"
                        >
                          {day}
                        </div>
                      ))}
                </div>

                {HOURS.map((hour) => {
                  const numDays = selectedPeriod === 'week' ? 7 : daysInMonth

                  return (
                    <div key={hour} className="flex items-center mb-2">
                      <div className="w-12 flex-shrink-0 text-xs text-right pr-2 text-muted-foreground">
                        {hour.toString().padStart(2, '0')}{t('format.hourSuffix')}
                      </div>

                      {Array.from({ length: numDays }, (_, dayIndex) => {
                        const key = `${dayIndex}-${hour}`
                        const cellData = processedData[key]
                        const count = cellData?.count || 0

                        const dayLabel =
                          selectedPeriod === 'week'
                            ? DAYS_FULL[dayIndex]
                            : `${selectedMonth + 1}/${daysInMonth - dayIndex}/${selectedYear}`

                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'flex-1 h-6 mx-0.5 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer',
                                  selectedPeriod === 'week'
                                    ? 'min-w-[28px] sm:min-w-[36px] md:min-w-[40px]'
                                    : 'min-w-[20px] sm:min-w-[26px] md:min-w-[30px]'
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
                                  {hour.toString().padStart(2, '0')}{t('format.hourSuffix')} -{' '}
                                  {(hour + 1).toString().padStart(2, '0')}{t('format.hourSuffix')}
                                </div>
                                <div className="mt-2">
                                  {t('activityHeatmap.tooltip.messages')}: <span className="font-semibold">{count}</span>
                                </div>
                                {cellData && (
                                  <div>
                                    {t('activityHeatmap.tooltip.source')}: <span className="font-semibold">{t(`activityHeatmap.sources.${cellData.source}`)}</span>
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

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t('activityHeatmap.legend.less')}</span>
                  <div className="flex gap-2">
                    {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor:
                            intensity === 0
                              ? 'hsl(var(--muted))'
                              : `hsl(var(--heatmap-telegram) / ${0.2 + intensity * 0.8})`,
                        }}
                      />
                    ))}
                  </div>
                  <span>{t('activityHeatmap.legend.more')}</span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {activeSources.map((source) => (
                    <div key={source} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: `hsl(var(--heatmap-${source}))`,
                        }}
                      />
                      <span className="text-muted-foreground">{t(`activityHeatmap.sources.${source}`)}</span>
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

export { ActivityHeatmap }
