import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

// Mock Data Generator
const generateTrendData = (locale: typeof uk | typeof enUS) => {
    const data = []
    const points = 30 // Last 30 days
    for (let i = points - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        // Signal logic: somewhat smooth sine wave + random
        const baseSignal = Math.sin(i / 5) * 10 + 20
        const signal = Math.floor(baseSignal + Math.random() * 10)

        // Noise logic: always higher or around signal, erratic
        const noise = Math.floor(signal + Math.random() * 20 + 5)

        data.push({
            date: date.toISOString(),
            displayDate: format(date, 'd MMM', { locale }),
            signal: signal,
            noise: noise,
        })
    }
    return data
}

// Custom dot for the last point
const LastPointDot = (props: {
    cx?: number
    cy?: number
    index?: number
    dataLength?: number
}) => {
    const { cx, cy, index, dataLength } = props
    if (index !== (dataLength ?? 0) - 1) return null
    if (cx === undefined || cy === undefined) return null

    return (
        <g>
            <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" fillOpacity={0.5} />
            <circle cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2} />
        </g>
    )
}

interface TrendChartProps {
    /** Compact mode - hides header, reduces height */
    compact?: boolean
    /** Embedded mode - removes Card wrapper for integration in other containers */
    embedded?: boolean
}

export const TrendChart: React.FC<TrendChartProps> = ({ compact = false, embedded = false }) => {
    const { t, i18n } = useTranslation('dashboard')
    const dateLocale = i18n.language === 'uk' ? uk : enUS
    const data = useMemo(() => generateTrendData(dateLocale), [dateLocale])

    const Wrapper = embedded ? 'div' : Card
    const wrapperClasses = embedded ? 'h-full flex flex-col overflow-hidden !cursor-pointer' : 'h-full flex flex-col overflow-hidden'

    return (
        <Wrapper className={wrapperClasses}>
            {!compact && (
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{t('trendChart.title')}</CardTitle>
                            <CardDescription>{t('trendChart.description')}</CardDescription>
                        </div>
                        {/* Legend for context */}
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-muted-foreground">{t('trendChart.signal', 'Signal')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                <span className="text-muted-foreground">{t('trendChart.noise', 'Noise')}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent className={`flex-1 ${compact ? 'px-3 pb-2 pt-6 relative overflow-hidden' : 'p-6'}`}>
                {/* Compact Background Label */}
                {compact && (
                    <div className="absolute top-2 left-3 z-10 pointer-events-none max-w-[calc(100%-1.5rem)]">
                        <div className="text-[9px] font-semibold text-muted-foreground tracking-wider opacity-60 truncate">
                            {t('trendChart.title')}
                        </div>
                    </div>
                )}

                <div className={`w-full h-full ${compact ? 'min-h-[70px]' : 'min-h-[60px]'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: compact ? 0 : 10, // Content is pushed by padding now, so 0 top margin
                                right: 10,
                                left: 10,
                                bottom: 5,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorSignalGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorNoiseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            {!compact && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="hsl(var(--border))"
                                    opacity={0.3}
                                />
                            )}

                            {!compact && (
                                <XAxis
                                    dataKey="displayDate"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={40}
                                    dy={10}
                                />
                            )}
                            {/* Use modest domain padding to prevent clipping without wasting space */}
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />

                            {!compact && (
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                        fontSize: '12px',
                                        padding: '8px'
                                    }}
                                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    formatter={(value: number, name: string) => [
                                        value,
                                        name === 'noise' ? t('trendChart.noise', 'Noise') : t('trendChart.signal', 'Signal')
                                    ]}
                                />
                            )}

                            {/* Noise Area - Background, subtle, monotonous */}
                            <Area
                                type="basis" // Smoother curve
                                dataKey="noise"
                                stroke="hsl(var(--muted-foreground))"
                                strokeOpacity={0.2}
                                strokeWidth={1}
                                fill="url(#colorNoiseGradient)"
                                animationDuration={1000}
                                activeDot={false}
                            />

                            {/* Signal Area - Foreground, vibrant, detailed */}
                            <Area
                                type="monotone"
                                dataKey="signal"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#colorSignalGradient)"
                                animationDuration={compact ? 0 : 1500}
                                isAnimationActive={!compact}
                                activeDot={!compact && {
                                    r: 4,
                                    stroke: 'hsl(var(--card))',
                                    strokeWidth: 2,
                                    fill: 'hsl(var(--primary))'
                                }}
                            />

                            {/* Last point dot for signal */}
                            <Area
                                type="monotone"
                                dataKey="signal"
                                stroke="transparent"
                                fill="transparent"
                                dot={(props) => <LastPointDot {...props} dataLength={data.length} />}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Wrapper>
    )
}
