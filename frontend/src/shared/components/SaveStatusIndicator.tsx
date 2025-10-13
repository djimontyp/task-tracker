import React from 'react'
import { CheckCircleIcon, CloudArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import type { SaveStatus } from '@/shared/hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  hasUnsavedChanges: boolean
  lastSavedAt: Date | null
  className?: string
}

const formatTimeAgo = (date: Date | null): string => {
  if (!date) return ''
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  hasUnsavedChanges,
  lastSavedAt,
  className = '',
}) => {
  const renderStatus = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-pulse">
            <CloudArrowUpIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1 duration-300">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Saved {formatTimeAgo(lastSavedAt)}</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Save failed</span>
          </div>
        )
      default:
        return hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm">All changes saved</span>
          </div>
        )
    }
  }

  return <div className={className}>{renderStatus()}</div>
}
