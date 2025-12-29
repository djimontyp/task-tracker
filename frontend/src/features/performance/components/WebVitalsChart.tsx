import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import type { PerformanceHistoryEntry } from '../types';
import { TrendingUp } from 'lucide-react';

interface WebVitalsChartProps {
  data: PerformanceHistoryEntry[];
}

const chartConfig: ChartConfig = {
  LCP: { label: 'LCP (ms)', color: 'hsl(var(--chart-1))' },
  FCP: { label: 'FCP (ms)', color: 'hsl(var(--chart-2))' },
  TTFB: { label: 'TTFB (ms)', color: 'hsl(var(--chart-3))' },
};

export const WebVitalsChart = ({ data }: WebVitalsChartProps) => {
  const formattedData = useMemo(
    () =>
      data.map((entry) => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    [data]
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Web Vitals History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          No performance data collected yet. Navigate through the app to generate metrics.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          Web Vitals Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={formattedData} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="LCP"
              stroke="var(--color-LCP)"
              fill="var(--color-LCP)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="FCP"
              stroke="var(--color-FCP)"
              fill="var(--color-FCP)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="TTFB"
              stroke="var(--color-TTFB)"
              fill="var(--color-TTFB)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
