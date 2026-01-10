import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { ClassificationTab } from '../ClassificationTab'
import { AtomsTab } from '../AtomsTab'
import { HistoryTab } from '../HistoryTab'
import type { MessageInspectModalProps, MessageInspectData } from '@/features/messages/types'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/shared/config/api'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function MessageInspectModal({ messageId, onClose, onNext, onPrev }: MessageInspectModalProps) {
    const { t, i18n } = useTranslation('messages')
    const [isLoading, setIsLoading] = useState(true)
    const [messageData, setMessageData] = useState<MessageInspectData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
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

    const handleApproveAndNext = useCallback(() => {
        // TODO: Implement actual approval logic here when API is ready
        toast.success(t('inspectModal.toast.approved'), {
            description: t('inspectModal.toast.autoNext')
        })
        if (onNext) onNext()
    }, [t, onNext])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+Enter or Ctrl+Enter to Approve and go to Next
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleApproveAndNext()
            }
            // Navigation
            else if (e.key === 'ArrowRight' || e.key === 'j') {
                if (onNext) onNext()
            }
            else if (e.key === 'ArrowLeft' || e.key === 'k') {
                if (onPrev) onPrev()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onNext, onPrev, handleApproveAndNext])

    const handleReassignTopic = () => {
        toast.info(t('inspectModal.toast.reassignNotImplemented'))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] h-[90vh] max-w-none flex flex-col p-0 gap-0" aria-describedby="message-inspect-description">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0 bg-background/95 backdrop-blur sticky top-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                            {t('inspectModal.title')}
                        </DialogTitle>
                        {messageData && (
                            <div className="flex items-center gap-3 text-sm">
                                <Badge variant={messageData.message.source === 'telegram' ? 'default' : 'secondary'}>
                                    {messageData.message.source === 'telegram' ? t('inspectModal.source.telegram') : t('inspectModal.source.manual')}
                                </Badge>
                                <span className="text-muted-foreground border-l pl-3">
                                    {formatDate(messageData.message.created_at)}
                                </span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Main Content Area - Split View */}
                <div className="flex-1 overflow-hidden relative">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" />
                        </div>
                    )}

                    {error && !messageData && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
                            <p className="text-destructive font-medium">{error}</p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                {t('inspectModal.error.retry')}
                            </Button>
                        </div>
                    )}

                    {messageData && (
                        <div className="grid grid-cols-2 h-full divide-x">
                            {/* LEFT PANEL - Raw Data */}
                            <div className="h-full overflow-hidden bg-muted/5 flex flex-col border-r">
                                <div className="px-6 py-3 border-b flex justify-between items-center bg-background/50 backdrop-blur-sm sticky top-0">
                                    <span className="text-xs font-semibold text-muted-foreground">{t('inspectModal.panels.rawData')}</span>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1 font-mono text-muted-foreground/70">RO</Badge>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-6">
                                        <div className="rounded-md border bg-card/50 p-4 shadow-sm">
                                            <pre className="font-mono-message whitespace-pre-wrap break-words text-sm text-foreground/80 leading-relaxed">
                                                {messageData.message.content}
                                            </pre>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* RIGHT PANEL - Analysis Tools */}
                            <div className="h-full overflow-y-auto bg-background flex flex-col">
                                <div className="px-6 py-3 border-b flex items-center bg-background/95 backdrop-blur-sm sticky top-0">
                                    <span className="text-xs font-semibold text-muted-foreground">{t('inspectModal.panels.analysis')}</span>
                                </div>
                                <div className="p-6 space-y-8">
                                    {/* Classification */}
                                    <section>
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            {t('inspectModal.tabs.classification')}
                                            <span className="text-xs font-normal text-muted-foreground bg-muted px-1 py-0.5 rounded">{t('inspectLabels.auto')}</span>
                                        </h3>
                                        <ClassificationTab data={messageData.classification} />
                                    </section>

                                    {/* Atoms */}
                                    <section>
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            {t('inspectModal.tabs.atoms')}
                                            <span className="text-xs font-normal text-muted-foreground bg-muted px-1 py-0.5 rounded">{t('inspectLabels.editable')}</span>
                                        </h3>
                                        <div className="bg-card rounded-lg border shadow-sm">
                                            <AtomsTab data={messageData.atoms} />
                                        </div>
                                    </section>

                                    {/* History */}
                                    <section className="pt-4 border-t">
                                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                                            {t('inspectModal.tabs.history')}
                                        </h3>
                                        <HistoryTab data={messageData.history} />
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Actions Bar */}
                <DialogFooter className="px-6 py-3 border-t bg-muted/10 flex flex-row justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReassignTopic}
                            disabled={!messageData}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            {t('inspectModal.reassignTopic')}
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Navigation Hints */}
                        <div className="flex items-center gap-3 mr-4 text-[10px] text-muted-foreground/60 select-none">
                            <span className="flex items-center gap-1">
                                <kbd className="bg-background border rounded px-1 min-w-[1.2em] text-center">⌘</kbd>
                                <kbd className="bg-background border rounded px-1 min-w-[1.2em] text-center">Enter</kbd>
                                <span>{t('inspectLabels.approve')}</span>
                            </span>
                            <span className="w-px h-3 bg-border/50"></span>
                            <span className="flex items-center gap-1">
                                <kbd className="bg-background border rounded px-1 min-w-[1.2em] text-center">J</kbd>
                                <kbd className="bg-background border rounded px-1 min-w-[1.2em] text-center">K</kbd>
                                <span>{t('inspectLabels.nav')}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-1 bg-background rounded-md border shadow-sm p-0.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onPrev}
                                disabled={!onPrev}
                                aria-label={t('inspectModal.aria.previousMessage')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onNext}
                                disabled={!onNext}
                                aria-label={t('inspectModal.aria.nextMessage')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button variant="outline" onClick={onClose}>
                            {t('inspectModal.close')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
