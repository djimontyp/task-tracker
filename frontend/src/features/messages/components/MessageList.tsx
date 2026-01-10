import React, { useEffect, useRef } from 'react'
import { Message } from '@/shared/types'
import { MessageListItem } from './MessageListItem'
import { ScrollContainer } from '@/shared/ui/scroll-container'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle, ArrowUp } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useInView } from 'react-intersection-observer'
import { useGroupedMessages } from '../hooks'

interface MessageListProps {
    messages: Message[]
    isLoading: boolean
    selectedId: string | null
    selectedIds: Record<string, boolean>
    onSelect: (id: string, shiftKey: boolean) => void
    onToggleSelect: (id: string, checked: boolean) => void
    onCreateAtom?: (id: string) => void
    onDismiss?: (id: string) => void
    onPrefetch?: (id: string) => void
    isError?: boolean
    error?: Error | null
    onRetry?: () => void
    hasMore?: boolean
    onLoadMore?: () => void
    isFetchingNextPage?: boolean
    total?: number
    /** Callback when visible date group changes (for external sticky header) */
    onVisibleDateChange?: (dateLabel: string | null) => void
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    selectedId,
    selectedIds,
    onSelect,
    onToggleSelect,
    onCreateAtom,
    onDismiss,
    onPrefetch,
    isError,
    error,
    onRetry,
    hasMore,
    onLoadMore,
    isFetchingNextPage,
    total,
    onVisibleDateChange
}) => {
    const { t } = useTranslation('messages')

    // Group messages by date with localized labels
    const groupedMessages = useGroupedMessages(messages)

    // Ref to scroll container (native div, not Radix ScrollArea - fixes Firefox backdrop-filter)
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)

    // scrollViewport is now the container itself
    const scrollViewport = scrollContainerRef.current

    // Bottom infinite scroll trigger - aggressive prefetch to prevent skeleton flicker
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        rootMargin: '1500px', // Preload 1500px before hitting bottom for seamless infinite scroll
        root: scrollViewport ?? undefined,
        initialInView: false,
    })

    // Top sentinel for "Scroll to Top" button visibility
    const { ref: topRef, inView: isAtTop } = useInView({
        threshold: 0,
        rootMargin: '100px 0px 0px 0px',
        root: scrollViewport,
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

    // Track visible date groups for external sticky header
    const dateGroupRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const visibleDatesRef = useRef<Set<string>>(new Set())

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

    // Track visible date for external sticky header
    useEffect(() => {
        if (!scrollContainerRef.current || !onVisibleDateChange) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const dateLabel = entry.target.getAttribute('data-date-label')
                    if (!dateLabel) return

                    if (entry.isIntersecting) {
                        visibleDatesRef.current.add(dateLabel)
                    } else {
                        visibleDatesRef.current.delete(dateLabel)
                    }
                })

                // Get first visible date (topmost)
                const dateLabels = groupedMessages.map(g => g.label)
                const firstVisible = dateLabels.find(label => visibleDatesRef.current.has(label))
                onVisibleDateChange(firstVisible || null)
            },
            {
                root: scrollContainerRef.current,
                rootMargin: '0px 0px -90% 0px', // Trigger when group header near top
                threshold: 0
            }
        )

        dateGroupRefs.current.forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, [groupedMessages, onVisibleDateChange])

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
        <ScrollContainer variant="native" className="relative" ref={scrollContainerRef}>
            <div className="flex flex-col min-h-full pb-24">
                {/* Top Sentinel */}
                <div ref={setTopRef} className="h-px w-full" />

                {groupedMessages.map((group) => (
                    <div
                        key={group.label}
                        data-date-label={group.label}
                        ref={(el) => { if (el) dateGroupRefs.current.set(group.label, el) }}
                    >
                        <div className="divide-y divide-border/40">
                            {group.messages.map((message) => (
                                <div
                                    key={message.id}
                                    ref={(el) => { if (el) itemRefs.current.set(String(message.id), el) }}
                                >
                                    <MessageListItem
                                        message={message}
                                        isSelected={!!selectedIds[String(message.id)]}
                                        isActive={String(message.id) === selectedId}
                                        onClick={() => onSelect(String(message.id), false)}
                                        onSelect={(checked, shiftKey) => handleToggleSelect(String(message.id), checked, shiftKey)}
                                        onCreateAtom={() => onCreateAtom?.(String(message.id))}
                                        onDismiss={() => onDismiss?.(String(message.id))}
                                        onMouseEnter={() => onPrefetch?.(String(message.id))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Infinite scroll trigger / Loader */}
                <div ref={loadMoreRef} className="py-6 flex flex-col items-center justify-center min-h-[60px] gap-2">
                    {/* Progress counter */}
                    {total !== undefined && total > 0 && (
                        <span className="text-xs text-muted-foreground/60 tabular-nums">
                            {messages.length} / {total}
                        </span>
                    )}

                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-muted-foreground/50 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t('infiniteScroll.loadingMore')}</span>
                        </div>
                    ) : hasMore ? (
                        <span className="text-[10px] text-muted-foreground/30 uppercase tracking-widest font-medium">{t('infiniteScroll.scrollForMore')}</span>
                    ) : (
                        <div className="flex flex-col items-center gap-1 opacity-40 py-2">
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{t('infiniteScroll.endOfHistory')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll to Top Button */}
            {!isAtTop && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-sticky animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full shadow-lg opacity-90 hover:opacity-100 flex items-center gap-2 pr-4 pl-3"
                        onClick={scrollToTop}
                    >
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-xs font-medium">{t('actions.scrollToTop')}</span>
                    </Button>
                </div>
            )}
        </ScrollContainer>
    )
}
