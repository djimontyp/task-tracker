import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { UserIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline'
import type { ConsumerMessageModalProps, ConsumerMessageData } from './types'
import { toast } from 'sonner'
import { formatFullDate } from '@/shared/utils/date'

export function ConsumerMessageModal({ messageId, onClose }: ConsumerMessageModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [messageData, setMessageData] = useState<ConsumerMessageData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessageDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/v1/messages/${messageId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch message details: ${response.statusText}`)
        }

        const data = await response.json()

        setMessageData({
          message: {
            id: data.id,
            content: data.content || '',
            author: data.author || 'Unknown',
            author_name: data.author_name,
            avatar_url: data.avatar_url,
            created_at: data.created_at,
            sent_at: data.sent_at,
            topic_name: data.topic_name,
            topic_id: data.topic_id,
          },
          relatedMessages: [],
        })
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
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleArchive = () => {
    toast.info('Archive functionality will be implemented in a future task')
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-3xl md:w-[80vw] sm:w-[95vw] max-h-[90vh] flex flex-col p-0" aria-describedby="consumer-message-description">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Message Details</DialogTitle>
          <p id="consumer-message-description" className="sr-only">View and read message content with author details and related messages</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="Loading">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {error && !messageData && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load message</h3>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          )}

          {messageData && (
            <div className="space-y-6">
              <Card className="p-4">
                <div className="flex items-start gap-4 mb-4">
                  {messageData.message.avatar_url ? (
                    <img
                      src={messageData.message.avatar_url}
                      alt={messageData.message.author_name || messageData.message.author}
                      className="h-12 w-12 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {messageData.message.author_name || messageData.message.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {formatFullDate(messageData.message.sent_at || messageData.message.created_at)}
                      </span>
                    </div>
                  </div>
                  {messageData.message.topic_name && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      {messageData.message.topic_name}
                    </Badge>
                  )}
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap break-words text-base">
                    {messageData.message.content || '(Empty message)'}
                  </p>
                </div>
              </Card>

              {messageData.relatedMessages && messageData.relatedMessages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Related Messages</h3>
                  <div className="space-y-2">
                    {messageData.relatedMessages.map((relatedMsg) => (
                      <Card key={relatedMsg.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {relatedMsg.author_name || relatedMsg.author}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFullDate(relatedMsg.sent_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {relatedMsg.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex flex-row justify-between items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleArchive}
            disabled={!messageData}
            className="hidden sm:flex"
          >
            Archive
          </Button>
          <Button variant="outline" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
