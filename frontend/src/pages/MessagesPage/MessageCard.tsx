import React from 'react'
import { Badge, Checkbox } from '@/shared/ui'
import { Message } from '@/shared/types'
import { getMessageAnalysisBadge, getImportanceBadge, getNoiseClassificationBadge } from '@/shared/utils/statusBadges'
import { formatFullDate } from '@/shared/utils/date'
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface MessageCardProps {
  message: Message
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onClick: () => void
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isSelected,
  onSelect,
  onClick
}) => {
  const statusBadge = getMessageAnalysisBadge(message.analyzed || false)
  const importanceBadge = message.importance_score !== null && message.importance_score !== undefined
    ? getImportanceBadge(message.importance_score)
    : null
  const classificationBadge = message.noise_classification
    ? getNoiseClassificationBadge(message.noise_classification)
    : null

  const content = message.content || ''
  const isEmpty = !content || content.trim() === ''

  return (
    <div
      className={`
        border rounded-lg p-3 sm:p-4 space-y-3 cursor-pointer transition-colors w-full min-w-0
        ${isSelected ? 'border-primary bg-accent/5' : 'hover:bg-accent/10'}
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
                className="h-8 w-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
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
            <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
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
    </div>
  )
}
