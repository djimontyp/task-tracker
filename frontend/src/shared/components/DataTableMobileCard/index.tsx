import { ReactNode } from 'react'
import { Card } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

interface DataTableMobileCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  isSelected?: boolean
}

export function DataTableMobileCard({
  children,
  className,
  onClick,
  isSelected = false,
}: DataTableMobileCardProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent border-primary',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}

interface MobileCardFieldProps {
  label: string
  value: ReactNode
  className?: string
}

export function MobileCardField({ label, value, className }: MobileCardFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="text-sm">{value}</div>
    </div>
  )
}
