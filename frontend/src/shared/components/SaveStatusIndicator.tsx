import React from 'react'
import { CheckCircle, CloudUpload, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SaveStatus } from '@/shared/hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  hasUnsavedChanges: boolean
  lastSavedAt: Date | null
  className?: string
}

const useFormatTimeAgo = () => {
  const { t } = useTranslation('common')

  return (date: Date | null): string => {
    if (!date) return ''
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return t('saveStatus.timeAgo.justNow')
    if (seconds < 60) return t('saveStatus.timeAgo.secondsAgo', { seconds })
    if (seconds < 3600) return t('saveStatus.timeAgo.minutesAgo', { minutes: Math.floor(seconds / 60) })
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  hasUnsavedChanges,
  lastSavedAt,
  className = '',
}) => {
  const { t } = useTranslation('common')
  const formatTimeAgo = useFormatTimeAgo()

  const renderStatus = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-semantic-info animate-pulse">
            <CloudUpload className="h-5 w-5" />
            <span className="text-sm font-medium">{t('saveStatus.saving')}</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-semantic-success animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{t('saveStatus.saved')} {formatTimeAgo(lastSavedAt)}</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-semantic-error">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{t('saveStatus.saveFailed')}</span>
          </div>
        )
      default:
        return hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-semantic-warning">
            <div className="h-2 w-2 rounded-full bg-semantic-warning animate-pulse" />
            <span className="text-sm font-medium">{t('saveStatus.unsavedChanges')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{t('saveStatus.allChangesSaved')}</span>
          </div>
        )
    }
  }

  return <div className={className}>{renderStatus()}</div>
}
