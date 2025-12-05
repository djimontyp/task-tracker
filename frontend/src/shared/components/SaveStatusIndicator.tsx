import React from 'react'
import { CheckCircle, CloudUpload, AlertCircle } from 'lucide-react'
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
          <div className="flex items-center gap-2 text-semantic-info animate-pulse">
            <CloudUpload className="h-5 w-5" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-semantic-success animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Saved {formatTimeAgo(lastSavedAt)}</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-semantic-error">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Save failed</span>
          </div>
        )
      default:
        return hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-semantic-warning">
            <div className="h-2 w-2 rounded-full bg-semantic-warning animate-pulse" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">All changes saved</span>
          </div>
        )
    }
  }

  return <div className={className}>{renderStatus()}</div>
}
