import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-4 pb-4 md:pb-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="mt-2 text-ellipsis overflow-hidden whitespace-nowrap text-sm text-muted-foreground cursor-help">
                  {description}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-md">
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {actions && <div className="flex-shrink-0 w-full md:w-auto">{actions}</div>}
    </div>
  )
}
