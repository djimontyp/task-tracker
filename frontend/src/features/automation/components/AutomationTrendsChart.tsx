import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAutomationTrends } from '../api/automationService'

export function AutomationTrendsChart() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const { data: trends, isLoading } = useAutomationTrends(period)

  const periodLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Approval Trends</CardTitle>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : trends && trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelFormatter={(value) => {
                  const date = new Date(value as string)
                  return date.toLocaleDateString()
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="approved_count"
                stroke="hsl(var(--chart-1))"
                name="Approved"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="rejected_count"
                stroke="hsl(var(--chart-2))"
                name="Rejected"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="manual_count"
                stroke="hsl(var(--chart-3))"
                name="Manual"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
