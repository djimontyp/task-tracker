import { Badge } from '@/shared/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib';
import type { MetricRating } from '../types';

interface VitalsStatusBadgeProps {
  rating: MetricRating;
  label?: string;
}

const ratingConfig = {
  good: {
    icon: CheckCircle,
    text: 'Good',
    className: 'border-semantic-success text-semantic-success bg-semantic-success/10',
  },
  'needs-improvement': {
    icon: AlertTriangle,
    text: 'Needs Work',
    className: 'border-semantic-warning text-semantic-warning bg-semantic-warning/10',
  },
  poor: {
    icon: XCircle,
    text: 'Poor',
    className: 'border-semantic-error text-semantic-error bg-semantic-error/10',
  },
} as const;

export const VitalsStatusBadge = ({ rating, label }: VitalsStatusBadgeProps) => {
  const config = ratingConfig[rating];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-2', config.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label || config.text}
    </Badge>
  );
};
