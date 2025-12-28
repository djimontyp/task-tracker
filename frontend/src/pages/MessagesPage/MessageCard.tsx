import React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Checkbox, Button } from '@/shared/ui'
import { Message } from '@/shared/types'
import { getMessageAnalysisBadge, getImportanceBadge, getNoiseClassificationBadge } from '@/shared/utils/statusBadges'
import { formatFullDate } from '@/shared/utils/date'
import { useScoringConfig } from '@/shared/api/scoringConfig'
import { User, Mail, Lightbulb, X } from 'lucide-react'

interface MessageCardProps {
  message: Message
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onClick: () => void
  onCreateAtom?: () => void
  onDismiss?: () => void
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isSelected,
  onSelect,
  onClick,
  onCreateAtom,
  onDismiss
}) => {
  const { t } = useTranslation('messages')
  const { data: scoringConfig } = useScoringConfig()

  const statusBadge = getMessageAnalysisBadge(message.analyzed || false)
  const importanceBadge = message.importance_score !== null && message.importance_score !== undefined
    ? getImportanceBadge(message.importance_score, scoringConfig)
    : null
  const classificationBadge = message.noise_classification
    ? getNoiseClassificationBadge(message.noise_classification)
    : null

  const content = message.content || ''
  const isEmpty = !content || content.trim() === ''

  // Use dynamic threshold from config for high importance glow effect
  const signalThreshold = scoringConfig?.signal_threshold ?? 0.65
  const isHighImportance = message.importance_score !== null && message.importance_score !== undefined && message.importance_score >= signalThreshold
  const glowClass = isHighImportance ? 'shadow-glow-sm' : ''

  return (
    <div
      className={`
        group border rounded-lg p-4 sm:p-4 space-y-4 cursor-pointer transition-all duration-300 w-full min-w-0
        ${isSelected ? 'border-primary bg-accent/5' : 'hover:bg-accent/10'}
        ${glowClass}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {message.avatar_url ? (
              <img
                src={message.avatar_url}
                alt={message.author_name || message.author}
                className="h-8 w-8 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <span className="font-medium truncate">
              {message.author_name || message.author}
            </span>
          </div>
        </div>
        <Badge variant={statusBadge.variant} className={`${statusBadge.className} flex-shrink-0`}>
          {statusBadge.label}
        </Badge>
      </div>

      <div className="w-full min-w-0">
        {isEmpty ? (
          <div className="flex items-center gap-2 text-muted-foreground/50 italic text-sm">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">(Empty message)</span>
          </div>
        ) : (
          <p className="text-sm line-clamp-3 break-words">{content}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full max-w-full min-w-0">
        {importanceBadge && (
          <Badge variant={importanceBadge.variant} className={`${importanceBadge.className} flex-shrink-0 truncate max-w-[120px]`}>
            {importanceBadge.label}
          </Badge>
        )}
        {classificationBadge && (
          <Badge variant={classificationBadge.variant} className={`${classificationBadge.className} flex-shrink-0 truncate max-w-[120px]`}>
            {classificationBadge.label}
          </Badge>
        )}
        {message.topic_name && (
          <Badge variant="outline" className="truncate max-w-[150px] flex-shrink-0">{message.topic_name}</Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 whitespace-nowrap">
          {message.sent_at ? formatFullDate(message.sent_at) : '-'}
        </span>
      </div>

      {/* Action buttons - appear on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 pt-2 border-t border-border/50">
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={(e) => {
            e.stopPropagation()
            onCreateAtom?.()
          }}
        >
          <Lightbulb className="mr-1 h-4 w-4" />
          {t('card.actions.createAtom')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss?.()
          }}
        >
          <X className="mr-1 h-4 w-4" />
          {t('card.actions.dismiss')}
        </Button>
      </div>
    </div>
  )
}
