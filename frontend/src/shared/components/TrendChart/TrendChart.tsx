import React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/shared/ui/chart'
import { cn } from '@/shared/lib'

export interface TrendChartProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  data: Array<Record<string, string | number>>
  dataKey: string
  xAxisKey: string
  config: ChartConfig
  showGrid?: boolean
  showYAxis?: boolean
  reverseData?: boolean
  height?: string | number
}

export const TrendChart = React.forwardRef<HTMLDivElement, TrendChartProps>(
  (
    {
      title,
      data,
      dataKey,
      xAxisKey,
      config,
      showGrid = true,
      showYAxis = false,
      reverseData = false,
      height = 300,
      className,
      ...props
    },
    ref
  ) => {
    const chartData = React.useMemo(() => 
      reverseData ? [...data].reverse() : data, 
      [data, reverseData]
    )
    return (
      <Card ref={ref} className={className} {...props}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(!title && 'pt-6')}>
          <ChartContainer config={config} className={cn('w-full')} style={{ height }}>
            <AreaChart data={chartData} accessibilityLayer>
              {showGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  if (typeof value === 'string') {
                    // Format date if it's a date string
                    const date = new Date(value)
                    if (!isNaN(date.getTime())) {
                      return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })
                    }
                    return value.slice(0, 10)
                  }
                  return String(value)
                }}
              />
              {showYAxis && <YAxis tickLine={false} axisLine={false} />}
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={`var(--color-${dataKey})`}
                fill={`var(--color-${dataKey})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }
)

TrendChart.displayName = 'TrendChart'
