import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

export const WebVitalsChart = ({ data }: WebVitalsChartProps) => {
  const { t } = useTranslation('monitoring');

  const chartConfig: ChartConfig = {
    LCP: { label: t('webVitals.chart.metrics.LCP'), color: 'hsl(var(--chart-1))' },
    FCP: { label: t('webVitals.chart.metrics.FCP'), color: 'hsl(var(--chart-2))' },
    TTFB: { label: t('webVitals.chart.metrics.TTFB'), color: 'hsl(var(--chart-3))' },
  };

  const formattedData = useMemo(
    () =>
      [...data].map((entry) => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })).reverse(),
    [data]
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            {t('webVitals.chart.historyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          {t('webVitals.chart.noData')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          {t('webVitals.chart.trendTitle')}
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
