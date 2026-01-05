import React from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, Button } from '@/shared/ui'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { Message } from '@/shared/types'
import { getImportanceBadge } from '@/shared/utils/statusBadges'
import { formatFullDate } from '@/shared/utils/date'
import { useScoringConfig } from '@/shared/api/scoringConfig'
import { User, Lightbulb, X, AlertCircle } from 'lucide-react'

interface MessageListItemProps {
  message: Message
  isSelected: boolean
  onSelect: (checked: boolean, shiftKey: boolean) => void
  onClick: () => void
  onCreateAtom?: () => void
  onDismiss?: () => void
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

export const MessageListItem: React.FC<MessageListItemProps> = ({
  message,
  isSelected,
  onSelect,
  onClick,
  onCreateAtom,
  onDismiss,
  isError,
  error,
  onRetry,
}) => {
  const { t } = useTranslation('messages')
  const { data: scoringConfig } = useScoringConfig()
  // ... (rest of component until Checkbox)



  if (isError) {
    return (
      <div className="p-4 border-b border-border/50 bg-destructive/5 flex items-center gap-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">{error?.message || t('card.error.title')}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 text-xs hover:bg-destructive/10">
            {t('card.error.retry')}
          </Button>
        )}
      </div>
    )
  }

  // Badges & Status
  const importanceBadge = message.importance_score !== null && message.importance_score !== undefined
    ? getImportanceBadge(message.importance_score, scoringConfig)
    : null

  const isSignal = message.noise_classification === 'signal'
  const isHighImportance = (message.importance_score || 0) >= 80

  // Status Color Line
  let statusColorClass = 'bg-muted'
  if (isSignal) {
    if ((message.importance_score || 0) >= 80) statusColorClass = 'bg-red-500' // Critical Signal
    else if ((message.importance_score || 0) >= 50) statusColorClass = 'bg-yellow-500' // Medium Signal
    else statusColorClass = 'bg-green-500' // General Signal
  } else {
    statusColorClass = 'bg-muted-foreground/20' // Noise
  }

  // Content preparation
  const content = message.content || ''
  const isEmpty = !content.trim()
  const authorName = message.author_name || message.author || t('card.unknownAuthor')

  return (
    <div
      className={`
        group relative flex items-stretch gap-3 pl-0 pr-3 py-3 border-b border-border/40 transition-colors duration-200 cursor-pointer w-full min-w-0
        ${isSelected ? 'bg-accent/10 border-l-4 border-l-primary' : 'hover:bg-accent/5 border-l-4 border-l-transparent'}
      `}
      onClick={onClick}
    >
      {/* Vertical Status Bar (Left) with Tooltip */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className={`w-1.5 ml-1 shrink-0 rounded-md my-1 ${statusColorClass} ${isSignal ? 'opacity-100 shadow-[0_0_8px_rgba(0,0,0,0.2)]' : 'opacity-40'}`} />
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-semibold">{isSignal ? t('status.signal') : t('status.noise')}</p>
            <p className="text-xs opacity-80">Score: {message.importance_score ?? 'N/A'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Checkbox (Visible on hover or selected) */}
      <div className="flex pt-1 shrink-0 px-2 items-start" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(!!checked, false)}
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault()
              onSelect(!isSelected, true)
            }
          }}
          className={`mt-1 h-4 w-4 transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        />
      </div>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-1">

        {/* Header: Author + Meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar (Tiny) */}
            {message.avatar_url ? (
              <img src={message.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover bg-muted" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className={`text-sm truncate ${isHighImportance ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
              {authorName}
            </span>
          </div>

          <span className="text-[10px] text-muted-foreground/60 tabular-nums whitespace-nowrap pr-8 md:pr-0">
            {message.sent_at ? formatFullDate(message.sent_at) : ''}
          </span>
        </div>

        {/* Snippet */}
        <div className="text-xs text-muted-foreground leading-snug line-clamp-2 break-words pr-2">
          {isEmpty ? <span className="italic opacity-50">{t('card.emptyMessage')}</span> : content}
        </div>

        {/* Footer Badges */}
        <div className="flex items-center gap-2 pt-0.5">
          {message.topic_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/50 text-muted-foreground border border-border/50 truncate max-w-[150px]">
              {message.topic_name}
            </span>
          )}
          {importanceBadge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ${importanceBadge.className?.replace('bg-', 'text-').replace('text-primary-foreground', 'border-current opacity-70')} bg-transparent`}>
              {importanceBadge.label}
            </span>
          )}
        </div>

      </div>

      {/* Hover Actions (Absolute Right) */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-row gap-1 bg-card border shadow-sm rounded-md p-0.5 z-10 translate-x-2 group-hover:translate-x-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); onCreateAtom?.() }}
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{t('card.actions.createAtom')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{t('card.actions.dismiss')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
