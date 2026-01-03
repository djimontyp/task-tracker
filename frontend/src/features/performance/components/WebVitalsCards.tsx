import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { VitalsStatusBadge } from './VitalsStatusBadge';
import { VITALS_THRESHOLDS, formatValue } from '../utils/thresholds';
import type { WebVitalsState, MetricName } from '../types';
import { Activity, Clock, Layers, Zap, Server } from 'lucide-react';

interface WebVitalsCardsProps {
  vitals: WebVitalsState;
}

const METRIC_ICONS: Record<MetricName, React.ElementType> = {
  LCP: Layers,
  INP: Activity,
  CLS: Zap,
  FCP: Clock,
  TTFB: Server,
};

const METRICS: MetricName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

export const WebVitalsCards = ({ vitals }: WebVitalsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {METRICS.map((name) => {
        const metric = vitals[name];
        const threshold = VITALS_THRESHOLDS[name];
        const Icon = METRIC_ICONS[name];

        return (
          <Card key={name} className="card-interactive">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="text-sm font-medium">{name}</CardTitle>
                </div>
                {metric && <VitalsStatusBadge rating={metric.rating} />}
              </div>
              <p className="text-xs text-muted-foreground">{threshold.label}</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric ? formatValue(name, metric.value) : '--'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Good: {'<'}
                {threshold.good}
                {threshold.unit}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
