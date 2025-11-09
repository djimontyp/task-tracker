import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
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
        "border-t border-gray-200 bg-amber-50",
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
          "hover:bg-amber-100 focus:outline-none focus:ring-2",
          "focus:ring-amber-500 focus:ring-offset-2"
        )}
        aria-expanded={isExpanded}
        aria-controls="admin-panel-content"
      >
        <span className="flex items-center gap-2">
          <span className="text-amber-700">Admin Panel</span>
          <AdminFeatureBadge variant="inline" size="sm" className="ml-0" />
          <span className="text-xs text-gray-500">(Cmd+Shift+A to toggle)</span>
        </span>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div
          id="admin-panel-content"
          className="px-4 py-3 animate-in slide-in-from-top-2"
          role="region"
        >
          {children}
        </div>
      )}
    </div>
  )
}
