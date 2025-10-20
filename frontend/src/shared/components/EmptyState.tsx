import { ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon, title, description, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center max-w-lg mx-auto">
      <div className="mb-6 text-muted-foreground opacity-60">{icon}</div>

      <h3 className="text-xl font-medium mb-2">{title}</h3>

      <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">{description}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <Button size="lg" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" asChild>
            <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
              {secondaryAction.label}
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
