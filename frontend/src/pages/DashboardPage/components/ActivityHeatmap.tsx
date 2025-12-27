import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { uk } from 'date-fns/locale'

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
        // Random activity level with higher probability of low/zero activity for realism
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
        case 1: return 'bg-heatmap-level-1'
        case 2: return 'bg-heatmap-level-2'
        case 3: return 'bg-heatmap-level-3'
        case 4: return 'bg-heatmap-level-4'
        default: return 'bg-heatmap-level-0'
    }
}

export const ActivityHeatmap: React.FC = () => {
    const data = useMemo(() => generateMockData(), [])

    // Calculate weeks for the grid
    const weeks = useMemo(() => {
        const weeksArray: ActivityDay[][] = []
        let currentWeek: ActivityDay[] = []

        data.forEach((day, index) => {
            currentWeek.push(day)
            if (currentWeek.length === 7 || index === data.length - 1) {
                weeksArray.push(currentWeek)
                currentWeek = []
            }
        })
        return weeksArray
    }, [data])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Пульс Активності</CardTitle>
                <CardDescription>Інтенсивність повідомлень за останні 6 місяців</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-0.5 overflow-x-auto pb-2 items-end justify-center sm:justify-start">
                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-0.5">
                                {week.map((day, dIndex) => (
                                    <TooltipProvider key={dIndex}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div
                                                    className={`w-3 h-3 rounded-[2px] transition-colors ${getLevelColor(day.level)}`}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">
                                                    {format(day.date, 'd MMMM, yyyy', { locale: uk })}: <span className="font-bold">{day.count}</span> повідомлень
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end mt-2">
                        <span>Менше</span>
                        <div className={`w-3 h-3 rounded-[2px] ${getLevelColor(0)}`} />
                        <div className={`w-3 h-3 rounded-[2px] ${getLevelColor(1)}`} />
                        <div className={`w-3 h-3 rounded-[2px] ${getLevelColor(2)}`} />
                        <div className={`w-3 h-3 rounded-[2px] ${getLevelColor(3)}`} />
                        <div className={`w-3 h-3 rounded-[2px] ${getLevelColor(4)}`} />
                        <span>Більше</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
