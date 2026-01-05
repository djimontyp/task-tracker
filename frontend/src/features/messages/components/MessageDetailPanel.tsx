import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Separator } from '@/shared/ui/separator'
import { AtomsTab } from './AtomsTab'
import { HistoryTab } from './HistoryTab'
import type { MessageInspectModalProps, MessageInspectData } from '@/features/messages/types'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/shared/config/api'
import {
    X,
    ChevronLeft,
    ChevronRight,
    Tag,
    Hash,
    User,
    Lightbulb,
    Info,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { formatFullDate } from '@/shared/utils/date'

export function MessageDetailPanel({ messageId, onClose, onNext, onPrev }: MessageInspectModalProps) {
    const { t } = useTranslation('messages')
    const [isLoading, setIsLoading] = useState(true)
    const [messageData, setMessageData] = useState<MessageInspectData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!messageId) return;

        const fetchMessageDetails = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(API_ENDPOINTS.messageInspect(messageId))

                if (!response.ok) {
                    throw new Error(`Failed to fetch message details: ${response.statusText}`)
                }

                const data: MessageInspectData = await response.json()
                setMessageData(data)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
                setError(errorMessage)
                toast.error(t('inspectModal.toast.loadError'), {
                    description: errorMessage,
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessageDetails()
    }, [messageId, t])

    if (!messageId) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground border-l border-border/50 bg-background/50">
                <p className="text-sm">Select a message to investigate</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background/95 backdrop-blur-sm border-l border-border/50 overflow-hidden relative">
            {/* Loading / Error States */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {error && !messageData && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                    <p className="text-destructive font-medium">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                        {t('inspectModal.error.retry')}
                    </Button>
                </div>
            )}

            {messageData && (
                <>
                    {/* Header: Controls & Meta */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-background z-20 shrink-0">
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} title="Close Panel">
                                <X className="h-5 w-5" />
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-2">Message Analysis</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground mr-2">
                                {messageData.message.id}
                            </span>
                            <div className="flex items-center rounded-md border bg-muted/30">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev} disabled={!onPrev} title="Previous (K)">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Separator orientation="vertical" className="h-4" />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext} disabled={!onNext} title="Next (J)">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col lg:flex-row min-h-full">

                            {/* MAIN CONTENT (Reader Mode) */}
                            <div className="flex-1 p-4 lg:p-6 min-w-0 flex flex-col gap-6">

                                {/* 1. Author & Header Section */}
                                <div className="flex items-start gap-4 pb-6 border-b border-border/40">
                                    {messageData.message.avatar_url ? (
                                        <img src={messageData.message.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full ring-2 ring-border" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-base font-bold text-foreground truncate">{messageData.message.author_name || 'Unknown Author'}</h2>
                                            <span className="text-xs text-muted-foreground">• {formatFullDate(messageData.message.sent_at)}</span>
                                        </div>

                                        {/* Badges Row */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {messageData.message.topic_name && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50">
                                                    <Hash className="w-3 h-3 mr-1 opacity-70" />{messageData.message.topic_name}
                                                </Badge>
                                            )}
                                            {messageData.classification?.importance_score != null && (
                                                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium border
                                                    ${messageData.classification.importance_score >= 80 ? 'border-red-500/30 text-red-500' :
                                                        messageData.classification.importance_score >= 50 ? 'border-yellow-500/30 text-yellow-500' :
                                                            'border-green-500/30 text-green-500'}
                                                `}>
                                                    Score: {messageData.classification.importance_score}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. The Message Content */}
                                <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-foreground/90 font-serif-message">
                                    <p className="whitespace-pre-wrap break-words">
                                        {messageData.message.content}
                                    </p>
                                </div>

                                {/* 3. Connected Atoms (Bottom of Main Column) */}
                                <div className="pt-8 mt-auto">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-3 h-3" /> Connected Knowledge
                                    </h4>
                                    <div className="bg-muted/5 rounded-lg border border-border/50 p-4">
                                        <AtomsTab data={messageData.atoms} />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT RAIL (Context & Analysis) */}
                            <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l bg-card/30 p-6 flex flex-col gap-6">

                                {/* AI Analysis */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Tag className="w-3 h-3" /> AI Analysis
                                    </h3>
                                    <div className="bg-card rounded-lg p-4 border shadow-sm text-sm leading-relaxed text-muted-foreground">
                                        {messageData.classification?.reasoning || "No detailed analysis available."}
                                    </div>
                                </div>

                                {/* Technical Context */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Metadata
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50">
                                            <span className="text-muted-foreground">Noise Type</span>
                                            <span className="font-mono">{messageData.classification?.noise_classification || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50">
                                            <span className="text-muted-foreground">Source</span>
                                            <span className="font-mono">Telegram</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-border/40">
                                    {messageData.history && messageData.history.length > 0 && (
                                        <div className="opacity-60 hover:opacity-100 transition-opacity">
                                            <h4 className="text-[10px] font-medium text-muted-foreground mb-2 uppercase">Processing Log</h4>
                                            <div className="text-[10px] font-mono text-muted-foreground space-y-1">
                                                {messageData.history.slice(0, 3).map((h, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span>{h.action}</span>
                                                        <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
    )
}
