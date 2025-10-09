import { Card, CardContent } from './card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  percentage?: number
  trend?: 'up' | 'down'
  icon?: React.ReactNode
}

export const MetricCard = ({
  title,
  value,
  percentage,
  trend,
  icon,
  className,
  ...props
}: MetricCardProps) => {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)} {...props}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">{value}</h2>
              {percentage !== undefined && (
                <div
                  className={cn(
                    'flex items-center text-sm font-medium',
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend === 'up' ? (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                  )}
                  <span>{Math.abs(percentage)}%</span>
                </div>
              )}
            </div>
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export default MetricCard
