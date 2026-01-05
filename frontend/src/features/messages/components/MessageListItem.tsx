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
import { formatMessageDate } from '@/shared/utils/date'
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

  // Status Color Line (refined implementation)
  let statusColorClass = 'bg-muted'
  let shadowClass = ''
  if (isSignal) {
    if ((message.importance_score || 0) >= 80) {
      statusColorClass = 'bg-red-500' // Critical Signal
      shadowClass = 'shadow-[0_0_8px_rgba(239,68,68,0.3)]'
    } else if ((message.importance_score || 0) >= 50) {
      statusColorClass = 'bg-yellow-500' // Medium Signal
      shadowClass = 'shadow-[0_0_6px_rgba(234,179,8,0.25)]'
    } else {
      statusColorClass = 'bg-green-500' // General Signal
      shadowClass = 'shadow-[0_0_4px_rgba(34,197,94,0.2)]'
    }
  } else {
    statusColorClass = 'bg-muted-foreground/15' // Noise (subtler)
  }

  // Content preparation
  const content = message.content || ''
  const isEmpty = !content.trim()
  const authorName = message.author_name || message.author || t('card.unknownAuthor')

  return (
    <div
      className={`
        group relative flex items-stretch gap-3 pl-0 pr-4 py-3 border-b border-border/40 transition-all duration-200 cursor-pointer w-full min-w-0 select-none
        ${isSelected
          ? 'bg-primary/10 border-l-[3px] border-l-primary shadow-[inset_0_0_12px_-6px_rgba(0,0,0,0.1)]'
          : 'hover:bg-muted/40 border-l-[3px] border-l-transparent'}
      `}
      onClick={(e) => {
        // Prevent navigation if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          return;
        }
        onClick();
      }}
    >
      {/* Vertical Status Bar (Left) with Tooltip - Now thinner and elegant */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className={`w-1 ml-1 shrink-0 rounded-full my-1 transition-all duration-300 ${statusColorClass} ${isSignal ? `opacity-100 ${shadowClass}` : 'opacity-40 hover:opacity-70'}`} />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p className="font-semibold">{isSignal ? t('status.signal') : t('status.noise')}</p>
            <p className="opacity-80">Score: {message.importance_score ?? 'N/A'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Checkbox (Visible on hover or selected) - Improved placement */}
      <div className="flex pt-1 shrink-0 px-1 items-start" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(!!checked, false)}
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault()
              onSelect(!isSelected, true)
            }
          }}
          className={`mt-0.5 h-4 w-4 transition-all duration-200 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        />
      </div>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5 select-text">

        {/* Header: Author + Meta + Hover Actions (Swap) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {/* Avatar (Tiny) */}
            {message.avatar_url ? (
              <img src={message.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover bg-muted ring-1 ring-border/50 shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border/50 shrink-0">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className={`text-sm truncate ${isHighImportance ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
              {authorName}
            </span>
          </div>

          {/* Right Meta Area: Swaps between Date and Actions */}
          <div className="flex items-center justify-end shrink-0 pl-2 h-6">
            {/* Timestamp (Visible by default, hidden on hover) */}
            <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums whitespace-nowrap group-hover:hidden transition-all duration-200">
              {message.sent_at ? formatMessageDate(message.sent_at) : ''}
            </span>

            {/* Actions (Hidden by default, visible on hover) */}
            <div className="hidden group-hover:flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={(e) => { e.stopPropagation(); onCreateAtom?.() }}
                      title={t('actions.createAtom')}
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('actions.createAtom')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
                      title={t('actions.dismiss')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('actions.dismiss')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Snippet */}
        <div className={`text-sm leading-relaxed line-clamp-2 break-words ${isSignal ? 'text-foreground/90' : 'text-muted-foreground/80'}`}>
          {isEmpty ? <span className="italic opacity-50 text-xs">{t('card.emptyMessage')}</span> : content}
        </div>

        {/* Footer Badges - More compact */}
        <div className="flex items-center gap-2 pt-1">
          {message.topic_name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/40 truncate max-w-[150px] transition-colors hover:bg-secondary/70">
              {message.topic_name}
            </span>
          )}
          {importanceBadge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${importanceBadge.className?.replace('bg-', 'text-').replace('text-primary-foreground', 'border-current/30 opacity-80')} bg-transparent`}>
              {importanceBadge.label}
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
