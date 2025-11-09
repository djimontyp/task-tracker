import React, { useCallback } from 'react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib'

type MetricStatus = 'critical' | 'warning' | 'optimal'

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  loading?: boolean
  emptyMessage?: string
  status?: MetricStatus
}

const getStatusBadgeVariant = (
  status: MetricStatus
): 'default' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'critical':
      return 'destructive'
    case 'warning':
      return 'secondary'
    case 'optimal':
      return 'default'
  }
}

const getStatusBadgeLabel = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Warning'
    case 'optimal':
      return 'Good'
  }
}

const getStatusBadgeColor = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950'
    case 'warning':
      return 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'optimal':
      return 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950'
  }
}

const getCardBorderColor = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'border-red-500'
    case 'warning':
      return 'border-yellow-500'
    case 'optimal':
      return 'border-green-500/30'
  }
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, subtitle, trend, icon: Icon, iconColor, className, onClick, loading = false, emptyMessage, status, ...props }, ref) => {
    const getTrendIcon = () => {
      if (!trend) return null
      switch (trend.direction) {
        case 'up':
          return <ArrowUpIcon className="w-4 h-4" aria-hidden="true" />
        case 'down':
          return <ArrowDownIcon className="w-4 h-4" aria-hidden="true" />
        default:
          return <MinusIcon className="w-4 h-4" aria-hidden="true" />
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
          // Create a synthetic mouse event from keyboard event
          const syntheticEvent = new MouseEvent('click', {
            bubbles: e.bubbles,
            cancelable: e.cancelable,
          })
          onClick(syntheticEvent as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }
    }, [onClick])

    if (loading) {
      return (
        <Card ref={ref} className={cn('min-h-[7rem] sm:min-h-[8rem] animate-pulse', className)} {...props}>
          <CardContent className="p-4 sm:p-6">
            <div className="h-24 bg-muted/30 rounded" />
          </CardContent>
        </Card>
      )
    }

    const isZeroValue = value === 0 || value === '0'
    const displaySubtitle = isZeroValue && emptyMessage ? emptyMessage : subtitle
    const shouldShowTrend = trend && !isZeroValue

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-300 min-h-[7rem] sm:min-h-[8rem] relative',
          onClick && 'ripple-container click-feedback cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          status && getCardBorderColor(status),
          status === 'critical' && 'animate-pulse',
          className
        )}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={`${title}: ${value}`}
        {...props}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon && <Icon className={cn('w-4 h-4', iconColor || 'text-muted-foreground')} />}
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
              </div>
              {status && (
                <Badge
                  variant={getStatusBadgeVariant(status)}
                  className={cn('text-xs', getStatusBadgeColor(status))}
                >
                  {getStatusBadgeLabel(status)}
                </Badge>
              )}
            </div>

            <p className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl 3xl:text-5xl font-bold text-foreground">{value}</p>

            {shouldShowTrend && (
              <div
                className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}
                aria-label={`${trend.direction === 'up' ? 'Increased' : trend.direction === 'down' ? 'Decreased' : 'No change'} by ${Math.abs(trend.value)} percent`}
              >
                {getTrendIcon()}
                <span aria-hidden="true">{Math.abs(trend.value)}%</span>
              </div>
            )}

            {displaySubtitle && (
              <p className={cn('text-sm', isZeroValue && emptyMessage ? 'text-muted-foreground/80 italic' : 'text-muted-foreground')}>
                {displaySubtitle}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export default MetricCard
