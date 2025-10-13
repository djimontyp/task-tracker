import React from 'react'
import { Switch, Label } from '@/shared/ui'

interface AutoSaveToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export const AutoSaveToggle: React.FC<AutoSaveToggleProps> = ({
  enabled,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 pl-4 border-l border-border ${className}`}>
      <Label htmlFor="auto-save-toggle" className="text-sm text-muted-foreground cursor-pointer">
        Auto-save
      </Label>
      <Switch id="auto-save-toggle" checked={enabled} onCheckedChange={onToggle} />
    </div>
  )
}
