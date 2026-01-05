import React, { useEffect, useRef, useMemo } from 'react'
import { Message } from '@/shared/types'
import { MessageListItem } from './MessageListItem'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle, Calendar, ArrowUp } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useInView } from 'react-intersection-observer'
import { format, isToday, isYesterday } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

interface MessageListProps {
    messages: Message[]
    isLoading: boolean
    selectedId: string | null
    onSelect: (id: string, shiftKey: boolean) => void
    onToggleSelect: (id: string, checked: boolean) => void
    onCreateAtom?: (id: string) => void
    onDismiss?: (id: string) => void
    isError?: boolean
    error?: Error | null
    onRetry?: () => void
    hasMore?: boolean
    onLoadMore?: () => void
    isFetchingNextPage?: boolean
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    selectedId,
    onSelect,
    onToggleSelect,
    onCreateAtom,
    onDismiss,
    isError,
    error,
    onRetry,
    hasMore,
    onLoadMore,
    isFetchingNextPage
}) => {
    const { t, i18n } = useTranslation('messages')

    // Bottom infinite scroll trigger
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: '200px', // Preload before hitting bottom
    })

    // Top sentinel for "Scroll to Top" button visibility
    const { ref: topRef, inView: isAtTop } = useInView({
        threshold: 0,
        rootMargin: '100px 0px 0px 0px', // slightly generous
    })

    // Auto-scroll ref map
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const topElementRef = useRef<HTMLDivElement | null>(null)

    // Merge refs for top element (sentinel + actual DOM ref for scrolling)
    const setTopRef = (node: HTMLDivElement) => {
        topRef(node)
        topElementRef.current = node
    }

    // Trigger load more when in view
    useEffect(() => {
        if (inView && hasMore && !isFetchingNextPage) {
            onLoadMore?.()
        }
    }, [inView, hasMore, isFetchingNextPage, onLoadMore])

    // Auto-scroll to selected item
    useEffect(() => {
        if (selectedId) {
            const el = itemRefs.current.get(selectedId)
            if (el) {
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [selectedId])

    const scrollToTop = () => {
        topElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Range selection anchor
    const lastSelectedIdRef = useRef<string | null>(null)

    const handleToggleSelect = (id: string, checked: boolean, shiftKey: boolean) => {
        if (shiftKey && lastSelectedIdRef.current) {
            const lastIdx = messages.findIndex(m => String(m.id) === lastSelectedIdRef.current)
            const currentIdx = messages.findIndex(m => String(m.id) === id)

            if (lastIdx !== -1 && currentIdx !== -1) {
                const start = Math.min(lastIdx, currentIdx)
                const end = Math.max(lastIdx, currentIdx)
                const range = messages.slice(start, end + 1)

                // Batch update preferred but loop works for now
                range.forEach(msg => {
                    onToggleSelect(String(msg.id), checked)
                })
                return
            }
        }

        // Single select
        onToggleSelect(id, checked)
        lastSelectedIdRef.current = id
    }

    // Group messages by date
    const groupedMessages = useMemo(() => {
        const groups: Record<string, Message[]> = {}
        const locale = i18n.language === 'uk' ? uk : enUS

        messages.forEach(msg => {
            if (!msg.sent_at) return
            const date = new Date(msg.sent_at)

            // Human readable keys for sorting/display logic could be separate, 
            // but for simplicity we'll format the display title here
            let displayTitle = ''
            if (isToday(date)) {
                displayTitle = i18n.language === 'uk' ? 'Сьогодні' : 'Today'
            } else if (isYesterday(date)) {
                displayTitle = i18n.language === 'uk' ? 'Вчора' : 'Yesterday'
            } else {
                displayTitle = format(date, 'MMMM d, yyyy', { locale })
            }

            // Actually, let's use the display title as the key to group simple list
            // Note: This relies on inputs being sorted by date desc usually.
            // If strict sorting needed, we'd map keys to array and sort.
            // Assuming messages come sorted.

            // To ensure uniqueness properly across years, we should probably stick to ISO key for grouping
            // and derive title later, but for this quick Pass:
            if (!groups[displayTitle]) {
                groups[displayTitle] = []
            }
            groups[displayTitle].push(msg)
        })
        return groups
    }, [messages, i18n.language])

    if (isError) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive font-medium mb-2">{error?.message || t('list.error')}</p>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        {t('actions.retry')}
                    </Button>
                )}
            </div>
        )
    }

    if (isLoading && messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <p>{t('list.empty')}</p>
                <p className="text-sm opacity-70 mt-1">{t('list.emptyDescription')}</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full relative">
            <div className="flex flex-col min-h-full pb-4">
                {/* Top Sentinel */}
                <div ref={setTopRef} className="h-px w-full" />

                {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                    <div key={dateLabel}>
                        {/* Sticky Date Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 px-4 border-b border-border/40 text-xs font-semibold text-muted-foreground flex items-center gap-2 shadow-sm">
                            <Calendar className="w-3 h-3" />
                            {dateLabel}
                        </div>

                        <div className="divide-y divide-border/40">
                            {msgs.map((message) => (
                                <div
                                    key={message.id}
                                    ref={(el) => { if (el) itemRefs.current.set(String(message.id), el) }}
                                >
                                    <MessageListItem
                                        message={message}
                                        isSelected={String(message.id) === selectedId}
                                        onClick={() => onSelect(String(message.id), false)}
                                        onSelect={(checked, shiftKey) => handleToggleSelect(String(message.id), checked, shiftKey)}
                                        onCreateAtom={() => onCreateAtom?.(String(message.id))}
                                        onDismiss={() => onDismiss?.(String(message.id))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Infinite scroll trigger / Loader */}
                <div ref={loadMoreRef} className="py-4 flex justify-center min-h-[50px] items-center">
                    {isFetchingNextPage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
                    ) : hasMore ? (
                        <span className="text-xs text-muted-foreground/40">Load more...</span>
                    ) : (
                        <span className="text-xs text-muted-foreground/40">No more messages</span>
                    )}
                </div>
            </div>

            {/* Scroll to Top Button */}
            {!isAtTop && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full shadow-lg opacity-90 hover:opacity-100 flex items-center gap-2 pr-4 pl-3"
                        onClick={scrollToTop}
                    >
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-xs font-medium">{t('actions.scrollToTop', 'Вгору')}</span>
                    </Button>
                </div>
            )}
        </ScrollArea>
    )
}
