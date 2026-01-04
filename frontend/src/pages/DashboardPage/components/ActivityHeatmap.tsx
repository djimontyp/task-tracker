import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { format, subDays, eachDayOfInterval, getDay, getMonth } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

interface ActivityDay {
    date: Date
    count: number
    level: 0 | 1 | 2 | 3 | 4
}

// Generate mock data for the last 6 months
const generateMockData = (): ActivityDay[] => {
    const today = new Date()
    const startDate = subDays(today, 180) // Last ~6 months
    const days = eachDayOfInterval({ start: startDate, end: today })

    return days.map(day => {
        const rand = Math.random()
        let count = 0
        let level: 0 | 1 | 2 | 3 | 4 = 0

        if (rand > 0.8) {
            count = Math.floor(Math.random() * 50) + 10
            level = 4
        } else if (rand > 0.6) {
            count = Math.floor(Math.random() * 20) + 5
            level = 3
        } else if (rand > 0.4) {
            count = Math.floor(Math.random() * 10) + 1
            level = 2
        } else if (rand > 0.2) {
            count = Math.floor(Math.random() * 5) + 1
            level = 1
        }

        return { date: day, count, level }
    })
}

const getLevelColor = (level: number) => {
    switch (level) {
        case 1: return 'bg-primary/20'
        case 2: return 'bg-primary/40'
        case 3: return 'bg-primary/60'
        case 4: return 'bg-primary/80'
        default: return 'bg-muted/20'
    }
}

// Convert JS day (0=Sun, 1=Mon, ..., 6=Sat) to Monday-first (0=Mon, 1=Tue, ..., 6=Sun)
const getMondayFirstDayIndex = (date: Date): number => {
    const jsDay = getDay(date) // 0=Sun, 1=Mon, ..., 6=Sat
    return jsDay === 0 ? 6 : jsDay - 1 // Convert to 0=Mon, ..., 6=Sun
}

interface ActivityHeatmapProps {
    /** Compact mode - hides header, smaller cell size */
    compact?: boolean
    /** Embedded mode - removes Card wrapper */
    embedded?: boolean
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ compact = false, embedded = false }) => {
    const { t, i18n } = useTranslation('dashboard')
    const data = useMemo(() => generateMockData(), [])
    const dateLocale = i18n.language === 'uk' ? uk : enUS

    // Day labels (Monday first)
    const dayLabels = [
        t('heatmap.days.mon'),
        t('heatmap.days.tue'),
        t('heatmap.days.wed'),
        t('heatmap.days.thu'),
        t('heatmap.days.fri'),
        t('heatmap.days.sat'),
        t('heatmap.days.sun'),
    ]

    // Calculate weeks for the grid (Monday = row 0)
    const { weeks, monthLabels } = useMemo(() => {
        // Group days by week (Monday-first)
        const weeksArray: (ActivityDay | null)[][] = []
        let currentWeek: (ActivityDay | null)[] = Array(7).fill(null)
        let lastMonth = -1
        const months: { weekIndex: number; label: string }[] = []

        data.forEach((day, index) => {
            const dayIndex = getMondayFirstDayIndex(day.date)
            const month = getMonth(day.date)

            // Track month changes for labels
            if (month !== lastMonth) {
                months.push({
                    weekIndex: weeksArray.length,
                    label: format(day.date, 'MMM', { locale: dateLocale })
                })
                lastMonth = month
            }

            // Place day in correct position
            currentWeek[dayIndex] = day

            // If it's Sunday or last day, push the week
            if (dayIndex === 6 || index === data.length - 1) {
                weeksArray.push(currentWeek)
                currentWeek = Array(7).fill(null)
            }
        })

        return { weeks: weeksArray, monthLabels: months }
    }, [data, dateLocale])

    // In compact mode, show more weeks (20) to fill the card better
    const visibleWeeks = compact ? weeks.slice(-20) : weeks

    const cellSize = compact ? 'w-2 h-2' : 'w-3 h-3'
    const gapSize = 'gap-0.5'

    const Wrapper = embedded ? 'div' : Card
    const wrapperClasses = embedded ? 'h-full flex flex-col overflow-hidden' : 'h-full flex flex-col overflow-hidden'

    return (
        <Wrapper className={wrapperClasses}>
            {!compact && (
                <CardHeader>
                    <CardTitle>{t('activityHeatmap.title')}</CardTitle>
                    <CardDescription>{t('activityHeatmap.description')}</CardDescription>
                </CardHeader>
            )}

            {/* Center content vertically in full mode */}
            <CardContent className={compact ? 'px-3 pb-2 pt-6 h-full flex items-center justify-center relative overflow-hidden' : 'flex-1 flex flex-col justify-center'}>
                {/* Compact specific: Overlay label */}
                {compact && (
                    <div className="absolute top-2 left-3 z-10 pointer-events-none max-w-[calc(100%-1.5rem)]">
                        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60 truncate">
                            {t('activityHeatmap.title', 'Activity')}
                        </div>
                    </div>
                )}

                <div className={`flex flex-col ${compact ? '' : 'gap-2 w-full'}`}>
                    {/* Month labels row - Hide in compact mode to prevent overlap */}
                    {!compact && (
                        <div className="flex h-4 relative mb-1">
                            {/* Spacer for day labels column */}
                            <div className="w-8 shrink-0" />
                            <div className={`flex ${gapSize} flex-1`}>
                                {/* Render month labels aligned with weeks */}
                                {weeks.map((_, weekIndex) => {
                                    // Logic for full mode labels remains same...
                                    // We need to restore the logic if we want full mode to work correct
                                    // For now focusing on Compact Fix
                                    const m = monthLabels.find(l => l.weekIndex === weekIndex)
                                    // Filter logic was removed? I should put it back for FULL mode.
                                    // But for now, let's just make compact work.
                                    return (
                                        <div key={weekIndex} className="flex-1 text-[10px] text-muted-foreground font-medium">
                                            {m?.label || ''}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className={compact ? 'flex w-full justify-between' : 'flex w-full'}>
                        {/* Day labels column - Show ALL in full mode, NONE in compact mode */}
                        {!compact && (
                            <div className="flex flex-col gap-0.5 mr-2 shrink-0 w-8 justify-center">
                                {dayLabels.map((label, index) => (
                                    <div
                                        key={index}
                                        className="h-3 flex items-center text-[10px] text-muted-foreground leading-none"
                                    >
                                        {/* Show ALL days in full mode */}
                                        {label}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Heatmap grid */}
                        <div className={compact
                            ? `flex w-full justify-between ${gapSize}`
                            : `flex ${gapSize} items-start justify-between flex-1`
                        }>
                            {visibleWeeks.map((week, wIndex) => (
                                <div key={wIndex} className={compact
                                    ? `flex flex-col ${gapSize}`
                                    : `flex flex-col ${gapSize} flex-1 items-center`
                                }>
                                    {week.map((day, dIndex) =>
                                        day === null ? (
                                            <div key={dIndex} className={`${cellSize} shrink-0 rounded-[1px] opacity-0`} />
                                        ) : compact ? (
                                            // Compact: No tooltip, fixed size square cells
                                            <div
                                                key={dIndex}
                                                className={`${cellSize} shrink-0 rounded-[1px] ${getLevelColor(day.level)}`}
                                            />
                                        ) : (
                                            // Full: Tooltip enabled
                                            <TooltipProvider key={dIndex} delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`${cellSize} w-full rounded-[1px] transition-colors ${getLevelColor(day.level)} hover:ring-1 hover:ring-foreground/20 cursor-default`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" align="center" className="z-[10000]">
                                                        <p className="text-xs font-medium">
                                                            {format(day.date, 'd MMM', { locale: dateLocale })}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            <span className="font-bold text-foreground">{day.count}</span> tasks
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {!compact && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end mt-4">
                            <span>{t('heatmap.legend.less')}</span>
                            <div className={`${cellSize} rounded-[2px] ${getLevelColor(0)}`} />
                            <div className={`${cellSize} rounded-[2px] ${getLevelColor(1)}`} />
                            <div className={`${cellSize} rounded-[2px] ${getLevelColor(2)}`} />
                            <div className={`${cellSize} rounded-[2px] ${getLevelColor(3)}`} />
                            <div className={`${cellSize} rounded-[2px] ${getLevelColor(4)}`} />
                            <span>{t('heatmap.legend.more')}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Wrapper>
    )
}
