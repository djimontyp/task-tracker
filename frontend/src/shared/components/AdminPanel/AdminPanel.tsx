import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { AdminFeatureBadge } from '@/shared/components/AdminFeatureBadge'

export interface AdminPanelProps {
  visible: boolean
  children: React.ReactNode
  onToggle?: () => void
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  visible,
  children,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!visible) return null

  const handleToggle = () => {
    setIsExpanded(prev => !prev)
    onToggle?.()
  }

  return (
    <div
      className={cn(
        "border-t border-border bg-semantic-warning/10",
        "transition-all duration-300 ease-in-out"
      )}
      role="region"
      aria-label="Admin Panel"
    >
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-2 text-sm font-medium",
          "hover:bg-semantic-warning/20 focus:outline-none focus:ring-2",
          "focus:ring-ring focus:ring-offset-2"
        )}
        aria-expanded={isExpanded}
        aria-controls="admin-panel-content"
      >
        <span className="flex items-center gap-2">
          <span className="text-semantic-warning">Admin Panel</span>
          <AdminFeatureBadge variant="inline" size="sm" className="ml-0" />
          <span className="text-xs text-muted-foreground">(Cmd+Shift+A to toggle)</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div
          id="admin-panel-content"
          className="px-4 py-4 animate-in slide-in-from-top-2"
          role="region"
        >
          {children}
        </div>
      )}
    </div>
  )
}
