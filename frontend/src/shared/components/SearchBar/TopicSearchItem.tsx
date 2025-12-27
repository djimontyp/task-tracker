import { Folder } from 'lucide-react'
import { CommandItem } from '@/shared/ui/command'
import { HighlightedText } from './utils/highlightRenderer'
import type { FTSTopicResult } from './types/fts'

interface TopicSearchItemProps {
  topic: FTSTopicResult
  onSelect?: () => void
}

export function TopicSearchItem({ topic, onSelect }: TopicSearchItemProps) {
  return (
    <CommandItem
      value={`topic-${topic.id}`}
      onSelect={onSelect}
      className="flex items-start gap-2 px-2 py-2 cursor-pointer"
    >
      <Folder className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-2">
        <span className="font-medium text-sm">{topic.name}</span>
        {topic.description && (
          <HighlightedText
            html={topic.match_snippet}
            className="text-xs text-muted-foreground line-clamp-1 [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
          />
        )}
      </div>
    </CommandItem>
  )
}
