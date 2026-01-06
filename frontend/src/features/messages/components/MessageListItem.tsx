import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
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
  isActive?: boolean
  onSelect: (checked: boolean, shiftKey: boolean) => void
  onClick: () => void
  onCreateAtom?: () => void
  onDismiss?: () => void
  onMouseEnter?: () => void
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

export const MessageListItem: React.FC<MessageListItemProps> = ({
  message,
  isSelected,
    isActive,
    onSelect,
    onClick,
    onCreateAtom,
    onDismiss,
    onMouseEnter,
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
    if (isSignal) {
        if ((message.importance_score || 0) >= 80) {
            statusColorClass = 'bg-status-error' // Critical Signal
        } else if ((message.importance_score || 0) >= 50) {
            statusColorClass = 'bg-status-pending' // Medium Signal
        } else {
            statusColorClass = 'bg-status-connected' // General Signal
        }
    } else {
        statusColorClass = 'bg-muted-foreground/15' // Noise (subtler)
    }

    // Content preparation
    const content = message.content || ''
    const isEmpty = !content.trim()
    const authorName = message.author_name || message.author || t('card.unknownAuthor')

    const actionBg = isSelected || isActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.4)'

    return (
        <div
            className={cn(
                "group relative flex items-stretch gap-2 pl-0 pr-4 py-3 border-b border-border/40 transition-all duration-200 cursor-pointer w-full min-w-0 select-none",
                isSelected && "bg-primary/5 border-l-[3px] border-l-primary/50",
                isActive && "bg-primary/10 border-l-[3px] border-l-primary",
                !isSelected && !isActive && "hover:bg-muted/40 border-l-[3px] border-l-transparent"
            )}
            style={{ '--row-action-bg': actionBg } as React.CSSProperties}
      onMouseEnter={onMouseEnter}
      onClick={() => {
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
            <div className={`w-1 ml-1 shrink-0 rounded-full my-1 transition-all duration-300 ${statusColorClass} ${isSignal ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`} />
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
      <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5 select-text">

        {/* Header: Author + Meta + Hover Actions */}
        <div className="relative flex items-center gap-2 min-w-0 w-full h-6">
          {/* Author (left side - truncates) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
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

          {/* Right Meta Area: Responsive timestamp + hover actions */}
          <div className="relative flex items-center shrink-0 min-w-[60px] justify-end">
            {/* Timestamp - hidden when actions are visible to avoid overlap */}
            <span className={cn(
              "text-[10px] text-muted-foreground/50 font-medium tabular-nums whitespace-nowrap transition-opacity duration-200",
              "group-hover:opacity-0",
              (isSelected || isActive) && "opacity-0"
            )}>
              {message.sent_at ? formatMessageDate(message.sent_at) : ''}
            </span>

            {/* Actions - visible on hover or if active/selected */}
            <div className={cn(
              "absolute inset-y-0 right-0 flex items-center gap-0.5",
              "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto",
              (isSelected || isActive) && "opacity-100 pointer-events-auto",
              "transition-opacity duration-200",
              "pl-4 pr-0 py-0.5 rounded-md",
              "bg-gradient-to-l from-[var(--row-action-bg)] via-[var(--row-action-bg)] to-transparent"
            )}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={(e) => { e.stopPropagation(); onCreateAtom?.() }}
                      aria-label={t('card.actions.createAtom')}
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{t('card.actions.createAtom')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
                      aria-label={t('card.actions.dismiss')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{t('card.actions.dismiss')}</TooltipContent>
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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/40 truncate max-w-[150px] transition-colors hover:bg-secondary/70">
              {message.topic_name}
            </span>
          )}
          {importanceBadge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${importanceBadge.className?.replace('bg-', 'text-').replace('text-primary-foreground', 'border-current/30 opacity-80')} bg-transparent`}>
              {importanceBadge.label}
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
