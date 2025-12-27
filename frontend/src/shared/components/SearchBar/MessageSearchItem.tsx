import { MessageSquare, User } from 'lucide-react'
import { CommandItem } from '@/shared/ui/command'
import { HighlightedText } from './utils/highlightRenderer'
import type { FTSMessageResult } from './types/fts'
import { formatDistanceToNow } from 'date-fns'

interface MessageSearchItemProps {
  message: FTSMessageResult
  onSelect?: () => void
}

export function MessageSearchItem({ message, onSelect }: MessageSearchItemProps) {
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })

  return (
    <CommandItem
      value={`message-${message.id}`}
      onSelect={onSelect}
      className="flex items-start gap-2 px-2 py-2 cursor-pointer"
    >
      <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-2">
        <HighlightedText
          html={message.content_snippet}
          className="text-sm line-clamp-2 [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <User className="h-3 w-3" />
            {message.author}
          </span>
          <span>·</span>
          <span>{timeAgo}</span>
          {message.topic && (
            <>
              <span>·</span>
              <span className="truncate max-w-[120px]">{message.topic.name}</span>
            </>
          )}
        </div>
      </div>
    </CommandItem>
  )
}
