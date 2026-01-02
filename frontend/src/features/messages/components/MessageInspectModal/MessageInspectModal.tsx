import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ClassificationTab } from './ClassificationTab'
import { AtomsTab } from './AtomsTab'
import { HistoryTab } from './HistoryTab'
import type { MessageInspectModalProps, MessageInspectData, TabValue } from '@/features/messages/types'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/shared/config/api'

export function MessageInspectModal({ messageId, onClose }: MessageInspectModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('classification')
  const [isLoading, setIsLoading] = useState(true)
  const [messageData, setMessageData] = useState<MessageInspectData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessageDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(API_ENDPOINTS.messageInspect(Number(messageId)))

        if (!response.ok) {
          throw new Error(`Failed to fetch message details: ${response.statusText}`)
        }

        const data: MessageInspectData = await response.json()
        setMessageData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        toast.error('Failed to load message details', {
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessageDetails()
  }, [messageId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveTab((current) => {
          const tabs: TabValue[] = ['classification', 'atoms', 'history']
          const currentIndex = tabs.indexOf(current)
          return tabs[currentIndex === 0 ? tabs.length - 1 : currentIndex - 1]
        })
      } else if (e.key === 'ArrowRight') {
        setActiveTab((current) => {
          const tabs: TabValue[] = ['classification', 'atoms', 'history']
          const currentIndex = tabs.indexOf(current)
          return tabs[(currentIndex + 1) % tabs.length]
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleReassignTopic = () => {
    toast.info('Reassign topic functionality will be implemented in a future task')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return `${content.substring(0, maxLength)}...`
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-4xl lg:max-w-6xl flex flex-col p-0" aria-describedby="message-inspect-description">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold mb-2">
                Message Details
              </DialogTitle>
              {messageData && (
                <div className="space-y-2">
                  <p id="message-inspect-description" className="text-sm text-muted-foreground break-words">
                    {truncateContent(messageData.message.content)}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={messageData.message.source === 'telegram' ? 'default' : 'secondary'}>
                      {messageData.message.source === 'telegram' ? 'Telegram' : 'Manual'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(messageData.message.created_at)}
                    </span>
                    {messageData.message.telegram_message_id && (
                      <span className="text-xs text-muted-foreground">
                        ID: {messageData.message.telegram_message_id}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {error && !messageData && (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-foreground mb-2">Failed to load message</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          )}

          {messageData && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="h-full flex flex-col">
              <TabsList className="mx-6">
                <TabsTrigger value="classification">Classification</TabsTrigger>
                <TabsTrigger value="atoms">Atoms</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="classification" className="m-0 h-full">
                  <ClassificationTab data={messageData.classification} />
                </TabsContent>

                <TabsContent value="atoms" className="m-0 h-full">
                  <AtomsTab data={messageData.atoms} />
                </TabsContent>

                <TabsContent value="history" className="m-0 h-full">
                  <HistoryTab data={messageData.history} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex flex-row justify-between items-center">
          <Button variant="secondary" onClick={handleReassignTopic} disabled={!messageData}>
            Reassign Topic
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
