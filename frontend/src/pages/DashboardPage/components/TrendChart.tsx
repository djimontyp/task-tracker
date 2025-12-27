import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { uk } from 'date-fns/locale'

// Mock Data Generator
const generateTrendData = () => {
    const data = []
    for (let i = 14; i >= 0; i--) {
        const date = subDays(new Date(), i)
        data.push({
            date: date.toISOString(),
            displayDate: format(date, 'd MMM', { locale: uk }),
            signal: Math.floor(Math.random() * 15) + 5, // 5-20 signals
            noise: Math.floor(Math.random() * 30) + 10,  // 10-40 noise
        })
    }
    return data
}

export const TrendChart: React.FC = () => {
    const data = useMemo(() => generateTrendData(), [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Динаміка Повідомлень</CardTitle>
                <CardDescription>Співвідношення корисних сигналів до шуму (14 днів)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 0,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorNoise" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="noise"
                                stackId="1"
                                stroke="#64748b"
                                fill="url(#colorNoise)"
                                name="Шум"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="signal"
                                stackId="1"
                                stroke="#10b981"
                                fill="url(#colorSignal)"
                                name="Сигнал"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
