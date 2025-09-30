import React from 'react'
import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/shared/lib'

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  iconColor?: string
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, subtitle, trend, icon: Icon, iconColor, className, ...props }, ref) => {
    const getTrendIcon = () => {
      if (!trend) return null
      switch (trend.direction) {
        case 'up':
          return <ArrowUp className="w-4 h-4" />
        case 'down':
          return <ArrowDown className="w-4 h-4" />
        default:
          return <Minus className="w-4 h-4" />
      }
    }

    const getTrendColor = () => {
      if (!trend) return ''
      switch (trend.direction) {
        case 'up':
          return 'text-green-600'
        case 'down':
          return 'text-red-600'
        default:
          return 'text-muted-foreground'
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
          className
        )}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>

            <p className="text-3xl md:text-4xl font-bold text-foreground">{value}</p>

            {trend && (
              <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}

            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export default MetricCard
