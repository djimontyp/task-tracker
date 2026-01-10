import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Separator } from '@/shared/ui/separator'
import { AtomsTab } from './AtomsTab'
import type { MessageInspectModalProps, MessageInspectData } from '@/features/messages/types'
import { toast } from 'sonner'
import { messageService } from '../api/messageService'
import {
    X,
    ChevronLeft,
    ChevronRight,
    Hash,
    User,
    Lightbulb,
    Info,
    AlertCircle,
    Clock,

} from 'lucide-react'
import { formatFullDate } from '@/shared/utils/date'
import { Skeleton } from '@/shared/ui/skeleton'
import { MessageAnalysisSection } from './MessageAnalysisSection'

export function MessageDetailPanel({ messageId, onClose, onNext, onPrev }: MessageInspectModalProps) {
    const { t } = useTranslation('messages')

    const {
        data: messageData,
        isLoading,
        error,
        refetch
    } = useQuery<MessageInspectData, Error>({
        queryKey: ['messageInspect', messageId],
        queryFn: () => messageService.getMessageInspect(messageId!),
        enabled: !!messageId,
        staleTime: 30_000, // 30 seconds - message details don't change often
        // Keep previous data during navigation to prevent skeleton flicker
        placeholderData: (previousData) => previousData,
    })

    // Show error toast when query fails
    useEffect(() => {
        if (error) {
            toast.error(t('inspectModal.toast.loadError'), {
                description: error.message,
            })
        }
    }, [error, t])

    if (!messageId) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground border-l border-border/50 bg-background/50">
                <p className="text-sm">{t('detailPanel.selectMessage')}</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col bg-background/95 backdrop-blur-sm border-l border-border/50 overflow-hidden relative">

            {/* Sticky Header: Navigation & Close - ALWAYS VISIBLE */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur z-sticky shrink-0 h-[60px]">
                <div className="flex items-center gap-4">
                    <Button size="icon" variant="ghost" className="-ml-2" onClick={onClose} aria-label={t('detailPanel.aria.closePanel')}>
                        <X className="h-5 w-5" />
                    </Button>

                    {/* Navigation */}
                    <div className="flex items-center rounded-md border bg-muted/30">
                        <Button variant="ghost" size="icon" className="rounded-none rounded-l-md" onClick={onPrev} disabled={!onPrev} aria-label={t('detailPanel.aria.previousMessage')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-11" />
                        <Button variant="ghost" size="icon" className="rounded-none rounded-r-md" onClick={onNext} disabled={!onNext} aria-label={t('detailPanel.aria.nextMessage')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground mr-2">{t('detailPanel.headerTitle')}</span>
                    {messageData && (
                        <span className="text-[10px] font-mono text-muted-foreground opacity-50 hidden sm:inline-block bg-muted px-2 py-1 rounded">
                            {messageData.message.id.slice(-8)}
                        </span>
                    )}
                </div>
            </div>

            {/* ERROR STATE */}
            {error && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                    <p className="text-destructive font-medium">{error.message}</p>
                    <Button onClick={() => refetch()} variant="outline" className="mt-4">
                        {t('inspectModal.error.retry')}
                    </Button>
                </div>
            )}

            {/* LOADING STATE - Skeleton only on first load (no cached/placeholder data) */}
            {isLoading && !messageData && !error && (
                <MessageDetailSkeleton />
            )}

            {/* DATA STATE - Show data even while refetching (prevents flicker) */}
            {messageData && (
                <ScrollArea className="flex-1 w-full animate-in fade-in duration-300">
                    <div className="flex flex-col xl:flex-row min-h-full">

                        {/* MAIN COLUMN (Content) - Grows */}
                        <div className="flex-1 p-6 lg:p-8 min-w-0 flex flex-col gap-6">
                            {/* 1. Author & Header Section */}
                            <div className="flex items-start gap-4 pb-6 border-b border-border/40">
                                {messageData.message.avatar_url ? (
                                    <img src={messageData.message.avatar_url} alt={t('detailPanel.aria.avatar')} className="w-12 h-12 rounded-full ring-2 ring-border shadow-sm object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-border shadow-sm">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="text-xl font-bold text-foreground truncate leading-tight">
                                            {messageData.message.author_name || t('detailPanel.unknownSource')}
                                        </h2>
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                            {formatFullDate(messageData.message.sent_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Badges (Context) */}
                            <div className="flex flex-wrap items-center gap-2">
                                {messageData.message.topic_name && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 font-normal bg-secondary/50 text-secondary-foreground hover:bg-secondary/60">
                                        <Hash className="w-3 h-3 mr-1 opacity-70" />{messageData.message.topic_name}
                                    </Badge>
                                )}

                                {messageData.classification?.importance_score != null && (
                                    <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium border
                                        ${messageData.classification.importance_score >= 80 ? 'border-status-error/30 text-status-error bg-status-error/5' :
                                            messageData.classification.importance_score >= 50 ? 'border-status-pending/30 text-status-pending bg-status-pending/5' :
                                                'border-status-connected/30 text-status-connected bg-status-connected/5'}
                                    `}>
                                        {t('detailPanel.score', { value: messageData.classification.importance_score })}
                                    </Badge>
                                )}

                                {messageData.classification?.noise_classification && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal bg-muted/20 text-muted-foreground border-transparent">
                                        {t('detailPanel.type', { value: messageData.classification.noise_classification })}
                                    </Badge>
                                )}
                            </div>

                            {/* Content Body */}
                            <div className="text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap break-words font-sans max-w-4xl">
                                {messageData.message.content || <span className="text-muted-foreground italic">{t('detailPanel.noContent')}</span>}
                            </div>
                        </div>

                        {/* SIDE COLUMN (Analysis & Context) - Fixed Width on Large Screens */}
                        <div className="w-full xl:w-[400px] 2xl:w-[420px] shrink-0 border-t xl:border-t-0 xl:border-l bg-card/5 p-6 lg:p-8 flex flex-col gap-8">

                            {/* AI Analysis (Interactive) */}
                            <MessageAnalysisSection
                                message={messageData.message}
                                hasAnalysis={!!messageData.classification}
                                reasoning={messageData.classification?.reasoning}
                            />

                            {/* Connected Knowledge */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                    <Lightbulb className="w-3.5 h-3.5" /> {t('detailPanel.connectedKnowledge')}
                                </h4>
                                <div className="bg-background/50 rounded-lg border border-border/40 p-1">
                                    <AtomsTab data={messageData.atoms} />
                                </div>
                            </div>

                            {/* Detailed Metadata */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" /> {t('detailPanel.technicalDetails')}
                                </h3>
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex justify-between items-center bg-background/50 p-2 rounded border border-border/40">
                                        <span className="text-muted-foreground">{t('detailPanel.idLabel')}</span>
                                        <span className="font-mono text-[10px] opacity-70">{messageData.message.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Logs Footer */}
                            <div className="mt-auto pt-6 border-t border-border/20">
                                <details className="group">
                                    <summary className="text-[10px] font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground list-none flex items-center gap-2 transition-colors">
                                        <Clock className="w-3 h-3" /> {t('detailPanel.processingLog')}
                                    </summary>
                                    <div className="mt-3 text-[10px] font-mono text-muted-foreground/80 space-y-2 pl-4 border-l border-border/30 ml-1">
                                        {messageData.history?.map((h, i) => (
                                            <div key={i} className="flex justify-between gap-4">
                                                <span className="truncate">{h.action}</span>
                                                <span className="whitespace-nowrap opacity-70">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            )}
        </div>
    )
}

function MessageDetailSkeleton() {
    return (
        <ScrollArea className="flex-1 w-full">
            <div className="flex flex-col xl:flex-row min-h-full">
                {/* Main Skeleton */}
                <div className="flex-1 p-6 lg:p-8 min-w-0 flex flex-col gap-6">
                    <div className="flex items-start gap-4 pb-6 border-b border-border/40">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2 pt-1">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="space-y-4 pt-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="w-full xl:w-[400px] 2xl:w-[420px] shrink-0 border-t xl:border-t-0 xl:border-l bg-card/5 p-6 lg:p-8 flex flex-col gap-8">
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </div>
            </div>
        </ScrollArea>
    )
}
