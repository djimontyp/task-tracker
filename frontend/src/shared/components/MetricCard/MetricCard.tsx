import React, { useCallback } from 'react'
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
  ({ title, value, subtitle, trend, icon: Icon, iconColor, className, onClick, ...props }, ref) => {
    const getTrendIcon = () => {
      if (!trend) return null
      switch (trend.direction) {
        case 'up':
          return <ArrowUp className="w-4 h-4" aria-hidden="true" />
        case 'down':
          return <ArrowDown className="w-4 h-4" aria-hidden="true" />
        default:
          return <Minus className="w-4 h-4" aria-hidden="true" />
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

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      // Create ripple effect
      const card = e.currentTarget
      const ripple = document.createElement('span')
      const rect = card.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.classList.add('ripple')

      card.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 600)

      // Call original onClick
      if (onClick) {
        onClick(e)
      }
    }, [onClick])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      // Trigger click on Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (onClick) {
          onClick(e as any)
        }
      }
    }, [onClick])

    return (
      <Card
        ref={ref}
        className={cn(
          'ripple-container click-feedback cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[7rem] sm:min-h-[8rem]',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${title}: ${value}`}
        {...props}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>

            <p className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl 2k:text-5xl font-bold text-foreground">{value}</p>

            {trend && (
              <div
                className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}
                aria-label={`${trend.direction === 'up' ? 'Increased' : trend.direction === 'down' ? 'Decreased' : 'No change'} by ${Math.abs(trend.value)} percent`}
              >
                {getTrendIcon()}
                <span aria-hidden="true">{Math.abs(trend.value)}%</span>
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
